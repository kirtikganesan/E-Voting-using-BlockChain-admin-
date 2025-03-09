const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL user
  password: '', // Replace with your MySQL password
  database: 'e_voting'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Registration endpoint
app.post('/api/register', (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const checkQuery = 'SELECT * FROM registration WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const insertQuery = 'INSERT INTO registration (email, password, has_Voted) VALUES (?, ?, ?)';
    db.query(insertQuery, [email, password, 0], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      return res.json({ message: 'Registration successful' });
    });
  });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM registration WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      return res.json({ message: 'Login successful' });
    } else {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
  });
});

// Endpoint to check voter status
// Use a single unified voter-status endpoint
app.get("/api/voter-status", (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const query = "SELECT is_registered, admin_approved, has_Voted FROM registration WHERE email = ?";

  db.query(query, [email], (err, result) => {
    if (err) {
      console.error("Error fetching voter status:", err);
      return res.status(500).json({ message: "Database error." });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Voter not found." });
    }

    const { is_registered, admin_approved, has_Voted } = result[0];
    
    // Return comprehensive status
    return res.json({ 
      status: has_Voted === 1 ? "already_voted" : 
              (is_registered.trim().toLowerCase() === "no" ? "not_registered" :
              (admin_approved.trim().toLowerCase() === "no" ? "not_approved" : "eligible")),
      hasVoted: has_Voted === 1
    });
  });
});


// Get all candidates
app.get('/api/candidates', (req, res) => {
  const query = 'SELECT * FROM candidates';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching candidates:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Vote for a candidate
app.post('/api/vote', (req, res) => {
  const { email, candidateId, transactionHash } = req.body;

  if (!email || !candidateId) {
    return res.status(400).json({ error: 'Email and candidateId are required' });
  }

  // Check if voter has already voted
  const checkVoterQuery = 'SELECT has_Voted FROM registration WHERE email = ?';
  db.query(checkVoterQuery, [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    if (results[0].has_Voted === 1) {
      return res.status(400).json({ error: 'You have already voted!' });
    }

    // First record the transaction in a transactions table (you'll need to create this table)
    const recordTxQuery = 'INSERT INTO vote_transactions (email, candidate_id, transaction_hash, timestamp) VALUES (?, ?, ?, NOW())';
    db.query(recordTxQuery, [email, candidateId, transactionHash], (txErr) => {
      if (txErr) {
        console.error('Error recording transaction:', txErr);
        // Continue with the vote even if transaction recording fails
      }

      // Cast the vote (increment the vote count for the selected candidate)
      const voteQuery = 'UPDATE candidates SET votes = votes + 1 WHERE id = ?';
      db.query(voteQuery, [candidateId], (err) => {
        if (err) {
          console.error('Error updating vote count:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Mark the user as having voted
        const markVotedQuery = 'UPDATE registration SET has_Voted = 1 WHERE email = ?';
        db.query(markVotedQuery, [email], (err) => {
          if (err) {
            console.error('Error marking user as voted:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ 
            message: 'Vote successfully cast!',
            transactionHash: transactionHash 
          });
        });
      });
    });
  });
});

// Add a new candidate
app.post('/api/candidates', (req, res) => {
  const { name, age, party, qualification } = req.body;

  if (age < 18) {
    return res.status(400).json({ error: 'Candidate must be at least 18 years old' });
  }

  const insertQuery = 'INSERT INTO candidates (name, age, party, qualification, votes) VALUES (?, ?, ?, ?, 0)';
  db.query(insertQuery, [name, age, party, qualification], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Candidate registered successfully' });
  });
});

// Endpoint to check voter status
// Endpoint to check voter status

app.get('/api/election-phase', (req, res) => {
  db.query('SELECT phase FROM election_phase WHERE id = 1', (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    
    // ✅ Fix: Check if the result has at least one row
    if (result.length === 0) {
      console.warn('No phase data found. Returning default phase.');
      return res.json({ phase: 'registration' }); // Default phase
    }

    res.json({ phase: result[0].phase });
  });
});


// Update election phase
app.post('/api/election-phase', (req, res) => {
  const { phase } = req.body;
  if (!['registration', 'voting', 'results'].includes(phase)) {
    return res.status(400).json({ error: 'Invalid phase' });
  }

  db.query('UPDATE election_phase SET phase = ? WHERE id = 1', [phase], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Election phase updated successfully' });
  });
});

const transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: 'kirtikganesan@yahoo.com',
    pass: 'nmbqisqszfjrunfj',
  },
});

// Function to generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999); // Generates a 6-digit OTP
};

// Store OTP temporarily (in-memory for simplicity)
let otpStorage = {};

// Endpoint to verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  console.log("Received verification request:");
  console.log("Email:", email);
  console.log("Entered OTP:", otp);
  console.log("Stored OTP:", otpStorage[email]); // Debug: Log stored OTP

  if (!email || !otp) {
    return res.status(400).send('Missing email or OTP');
  }

  if (otpStorage[email]) {
    if (otpStorage[email].toString() === otp.toString()) { // ✅ Ensure both are compared as strings
      delete otpStorage[email]; // Remove OTP after successful verification
      console.log(`OTP verified for ${email}`);
      res.status(200).send('OTP verified successfully');
    } else {
      console.log('Invalid OTP entered:', otp);
      res.status(400).send('Invalid OTP');
    }
  } else {
    console.log(`No OTP found for ${email}`);
    res.status(400).send('OTP not sent or expired');
  }
});

// Endpoint to send OTP and store it temporarily
app.post('/api/send-otp', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send('Email is required');
  }

  const otp = generateOTP();
  otpStorage[email] = otp.toString(); // ✅ Ensure OTP is stored as a string

  console.log(`Stored OTP for ${email}:`, otp); // Debug log

  // Send OTP via email
  transporter.sendMail({
    from: 'kirtikganesan@yahoo.com',
    to: email,
    subject: 'Your OTP for Registration',
    text: `Your OTP is: ${otp}`,
  }, (error, info) => {
    if (error) {
      console.error('Error sending OTP email:', error);
      return res.status(500).send('Error sending OTP email');
    }

    console.log('OTP sent successfully');
    res.status(200).json({ message: "OTP sent successfully", otp }); // ✅ Send OTP back for debugging
  });
});

app.post('/api/check-registration', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const query = "SELECT is_registered FROM registration WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error checking registration:', err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0 && results[0].is_registered === 'yes') {
      return res.json({ is_registered: 'yes' });
    } else {
      return res.json({ is_registered: 'no' });
    }
  });
});

// Update user as registered
app.post("/api/update-registration", (req, res) => {
  const { email, accountAddress, aadharNumber } = req.body;
  
  if (!email || !accountAddress || !aadharNumber) {
    return res.status(400).json({ error: "Email, account address, and Aadhar number are required" });
  }

  try {
    const sql = "UPDATE registration SET is_registered='yes', account_address = ?, aadhar_number = ? WHERE email = ?";
    const values = [accountAddress, aadharNumber, email];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error updating registration:", err);
        return res.status(500).json({ error: "Database update failed" });
      }
      res.status(200).json({ message: "Registration updated successfully" });
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/registered-users", async (req, res) => {
  try {
    const sql = "SELECT account_address, is_registered FROM registration WHERE is_registered = 'yes'";
    const [rows] = await db.promise().query(sql);

    console.log("Fetched Users:", rows); // Debugging line

    if (!rows || rows.length === 0) {
      return res.json({ message: "No registered users found" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching registered users:", error); // Logs the actual error
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/register-admin", async (req, res) => {
  const { accountAddress } = req.body;

  if (!accountAddress) {
    return res.status(400).json({ error: "Account address is required" });
  }

  try {
    const sql = "UPDATE registration SET admin_approved = 'yes' WHERE account_address = ?";
    const [result] = await db.promise().query(sql, [accountAddress]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Admin approved successfully!" });
    } else {
      res.status(404).json({ error: "Account not found or already approved" });
    }
  } catch (error) {
    console.error("Error approving admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/election-results", (req, res) => {
  // First, check if the election phase is "results"
  const phaseQuery = "SELECT phase FROM election_phase LIMIT 1";

  db.query(phaseQuery, (err, phaseResult) => {
    if (err) {
      console.error("Error fetching election phase:", err);
      return res.status(500).json({ message: "Database error." });
    }

    if (phaseResult.length === 0 || phaseResult[0].phase !== "results") {
      return res.json({ isElectionOver: false });
    }

    // Fetch the candidate with the highest votes
    const winnerQuery = "SELECT name, votes FROM candidates ORDER BY votes DESC LIMIT 1";

    db.query(winnerQuery, (err, winnerResult) => {
      if (err) {
        console.error("Error fetching election winner:", err);
        return res.status(500).json({ message: "Database error." });
      }

      if (winnerResult.length === 0) {
        return res.json({ isElectionOver: false });
      }

      // Return the winner details
      const winner = {
        name: winnerResult[0].name,
        votes: winnerResult[0].votes
      };

      res.json({ isElectionOver: true, winner });
    });
  });
});

app.post('/api/verify-aadhar', (req, res) => {
  const { aadharNumber } = req.body;

  if (!aadharNumber) {
    return res.status(400).json({ error: 'Aadhar number is required' });
  }

  const query = 'SELECT * FROM aadhar_data WHERE aadhar_number = ?';
  
  db.query(query, [aadharNumber], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.json({ exists: false });
    }

    const age = results[0].age;
    return res.json({ 
      exists: true, 
      age: age,
      isEligible: age >= 18 
    });
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
