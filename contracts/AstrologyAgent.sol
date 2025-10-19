// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AstrologyAgent
 * @notice Autonomous astrology prediction agent on Base
 * @dev Each agent is an independent contract with its own reputation
 */
contract AstrologyAgent {
    // ═══════════════════════════════════════════════════════════════════════
    // AGENT IDENTITY
    // ═══════════════════════════════════════════════════════════════════════
    
    string public handle;           // e.g. "@auriga"
    string public name;              // e.g. "Auriga"
    string public method;            // Prediction methodology
    address public owner;            // Agent creator/owner
    
    // ═══════════════════════════════════════════════════════════════════════
    // AGENT CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    uint256 public aggressiveness;   // 500-1500 (represents 0.5x - 1.5x multiplier)
    string public personality;       // Agent's prediction style
    string public metadataURI;       // IPFS link to full agent config
    
    // ═══════════════════════════════════════════════════════════════════════
    // REPUTATION & STATISTICS
    // ═══════════════════════════════════════════════════════════════════════
    
    uint256 public totalPredictions; // Total predictions generated
    uint256 public totalSelections;  // Times users selected this agent
    uint256 public reputationScore;  // Cumulative reputation points
    
    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    bool public isActive;            // Can generate predictions
    uint256 public createdAt;        // Deployment timestamp
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    event PredictionGenerated(
        bytes32 indexed requestId,
        uint256 timestamp
    );
    
    event AgentSelected(
        bytes32 indexed requestId,
        address indexed user,
        uint256 reputationDelta
    );
    
    event ConfigUpdated(string newMetadataURI);
    event ActiveStatusChanged(bool isActive);
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════
    
    constructor(
        string memory _handle,
        string memory _name,
        string memory _method,
        uint256 _aggressiveness,
        string memory _personality,
        string memory _metadataURI
    ) {
        require(_aggressiveness >= 500 && _aggressiveness <= 1500, "Invalid aggressiveness");
        require(bytes(_handle).length > 0, "Handle required");
        require(bytes(_name).length > 0, "Name required");
        
        handle = _handle;
        name = _name;
        method = _method;
        aggressiveness = _aggressiveness;
        personality = _personality;
        metadataURI = _metadataURI;
        owner = msg.sender;
        isActive = true;
        createdAt = block.timestamp;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Record that this agent generated a prediction
     * @param requestId The prediction request ID
     */
    function recordPrediction(bytes32 requestId) external {
        require(isActive, "Agent not active");
        totalPredictions++;
        emit PredictionGenerated(requestId, block.timestamp);
    }
    
    /**
     * @notice Record that a user selected this agent's prediction
     * @param requestId The prediction request ID
     * @param user The user who selected this agent
     * @param reputationDelta Reputation points to add
     */
    function recordSelection(
        bytes32 requestId,
        address user,
        uint256 reputationDelta
    ) external {
        require(isActive, "Agent not active");
        totalSelections++;
        reputationScore += reputationDelta;
        emit AgentSelected(requestId, user, reputationDelta);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Get agent statistics
     * @return predictions Total predictions generated
     * @return selections Total times selected by users
     * @return reputation Current reputation score
     * @return winRate Win rate percentage (selections / predictions * 100)
     */
    function getStats() external view returns (
        uint256 predictions,
        uint256 selections,
        uint256 reputation,
        uint256 winRate
    ) {
        predictions = totalPredictions;
        selections = totalSelections;
        reputation = reputationScore;
        winRate = predictions > 0 ? (selections * 100) / predictions : 0;
    }
    
    /**
     * @notice Get full agent info
     */
    function getAgentInfo() external view returns (
        string memory _handle,
        string memory _name,
        string memory _method,
        uint256 _aggressiveness,
        string memory _personality,
        string memory _metadataURI,
        bool _isActive,
        uint256 _createdAt
    ) {
        return (
            handle,
            name,
            method,
            aggressiveness,
            personality,
            metadataURI,
            isActive,
            createdAt
        );
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Update agent metadata URI (owner only)
     * @param newMetadataURI New IPFS URI
     */
    function updateMetadata(string memory newMetadataURI) external {
        require(msg.sender == owner, "Not owner");
        metadataURI = newMetadataURI;
        emit ConfigUpdated(newMetadataURI);
    }
    
    /**
     * @notice Toggle agent active status (owner only)
     * @param _isActive New active status
     */
    function setActive(bool _isActive) external {
        require(msg.sender == owner, "Not owner");
        isActive = _isActive;
        emit ActiveStatusChanged(_isActive);
    }
    
    /**
     * @notice Transfer ownership (owner only)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Not owner");
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}

