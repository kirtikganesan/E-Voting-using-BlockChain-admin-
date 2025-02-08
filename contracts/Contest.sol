// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Contest {
    enum Phase { Registration, Voting, Results }
    Phase public currentPhase;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    address public admin;
    uint public candidateCount;
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    event CandidateAdded(uint indexed candidateId, string name);
    event Voted(address indexed voter, uint indexed candidateId);
    event PhaseChanged(Phase newPhase);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
        currentPhase = Phase.Registration; // Default phase
    }

    function addCandidate(string memory _name) public onlyAdmin {
        require(currentPhase == Phase.Registration, "Candidates can only be added during registration phase");
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, _name, 0);
        emit CandidateAdded(candidateCount, _name);
    }

    function vote(uint _candidateId) public {
        require(currentPhase == Phase.Voting, "Voting is not allowed in the current phase");
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");

        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender] = true;

        emit Voted(msg.sender, _candidateId);
    }

    function changePhase(Phase _newPhase) public onlyAdmin {
        require(uint(_newPhase) > uint(currentPhase), "Cannot revert to a previous phase");
        require(uint(_newPhase) <= uint(Phase.Results), "Invalid phase");
        
        currentPhase = _newPhase;
        emit PhaseChanged(_newPhase);
    }

    function getCandidate(uint _candidateId) public view returns (Candidate memory) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        return candidates[_candidateId];
    }

    function getTotalCandidates() public view returns (uint) {
        return candidateCount;
    }

    function getCurrentPhase() public view returns (Phase) {
        return currentPhase;
    }
}
