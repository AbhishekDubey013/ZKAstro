// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentReputation
 * @notice Transparent, immutable agent reputation system
 * @dev All prediction selections and reputation updates recorded on-chain
 */
contract AgentReputation {
    struct Agent {
        string agentId;             // Off-chain agent ID (UUID)
        string handle;              // Agent handle (e.g., @auriga)
        uint256 reputation;         // Current reputation score
        uint256 totalPredictions;   // Total predictions made
        uint256 totalSelections;    // Times selected by users
        bool isActive;              // Agent status
        uint256 createdAt;          // Registration timestamp
    }

    struct ReputationEvent {
        string agentId;             // Agent identifier
        address user;               // User who made selection
        string predictionId;        // Prediction request ID
        int256 reputationChange;    // Change in reputation (+/-)
        string reason;              // Reason for change
        uint256 timestamp;          // Event timestamp
    }

    // Mappings
    mapping(string => Agent) public agents;                      // agentId => Agent
    mapping(string => bool) public agentExists;                  // Quick lookup
    mapping(string => ReputationEvent[]) public agentHistory;    // agentId => events
    
    // All agents (for enumeration)
    string[] public allAgentIds;
    
    // Prediction selection tracking (prevent double-counting)
    mapping(string => bool) public predictionProcessed;
    
    // Total events
    uint256 public totalEvents;

    // Events
    event AgentRegistered(
        string indexed agentId,
        string handle,
        uint256 timestamp
    );

    event PredictionSelected(
        string indexed agentId,
        string indexed predictionId,
        address indexed user,
        int256 reputationChange,
        uint256 newReputation,
        uint256 timestamp
    );

    event ReputationUpdated(
        string indexed agentId,
        int256 change,
        uint256 newReputation,
        string reason,
        uint256 timestamp
    );

    event AgentStatusChanged(
        string indexed agentId,
        bool isActive
    );

    /**
     * @notice Register a new agent
     * @param agentId Unique agent identifier
     * @param handle Agent handle (e.g., @auriga)
     */
    function registerAgent(
        string memory agentId,
        string memory handle
    ) external {
        require(!agentExists[agentId], "Agent already registered");
        require(bytes(agentId).length > 0, "Invalid agent ID");
        require(bytes(handle).length > 0, "Invalid handle");

        Agent memory newAgent = Agent({
            agentId: agentId,
            handle: handle,
            reputation: 0,
            totalPredictions: 0,
            totalSelections: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        agents[agentId] = newAgent;
        agentExists[agentId] = true;
        allAgentIds.push(agentId);

        emit AgentRegistered(agentId, handle, block.timestamp);
    }

    /**
     * @notice Record a prediction selection (user chose this agent's prediction)
     * @param agentId Agent whose prediction was selected
     * @param predictionId Unique prediction request ID
     * @param user User who made the selection
     * @param reputationBonus Reputation points awarded
     */
    function recordPredictionSelection(
        string memory agentId,
        string memory predictionId,
        address user,
        int256 reputationBonus
    ) external {
        require(agentExists[agentId], "Agent not registered");
        require(!predictionProcessed[predictionId], "Prediction already processed");
        require(user != address(0), "Invalid user address");

        // Mark prediction as processed
        predictionProcessed[predictionId] = true;

        // Update agent stats
        Agent storage agent = agents[agentId];
        agent.totalSelections++;
        
        // Update reputation
        if (reputationBonus > 0) {
            agent.reputation += uint256(reputationBonus);
        } else if (reputationBonus < 0 && agent.reputation >= uint256(-reputationBonus)) {
            agent.reputation -= uint256(-reputationBonus);
        }

        // Record event
        ReputationEvent memory repEvent = ReputationEvent({
            agentId: agentId,
            user: user,
            predictionId: predictionId,
            reputationChange: reputationBonus,
            reason: "Prediction selected by user",
            timestamp: block.timestamp
        });

        agentHistory[agentId].push(repEvent);
        totalEvents++;

        emit PredictionSelected(
            agentId,
            predictionId,
            user,
            reputationBonus,
            agent.reputation,
            block.timestamp
        );
    }

    /**
     * @notice Record that agent made a prediction (for stats)
     * @param agentId Agent identifier
     */
    function recordPrediction(string memory agentId) external {
        require(agentExists[agentId], "Agent not registered");
        agents[agentId].totalPredictions++;
    }

    /**
     * @notice Update agent reputation (admin/platform action)
     * @param agentId Agent identifier
     * @param change Reputation change (+/-)
     * @param reason Reason for change
     */
    function updateReputation(
        string memory agentId,
        int256 change,
        string memory reason
    ) external {
        require(agentExists[agentId], "Agent not registered");

        Agent storage agent = agents[agentId];
        
        // Apply change
        if (change > 0) {
            agent.reputation += uint256(change);
        } else if (change < 0 && agent.reputation >= uint256(-change)) {
            agent.reputation -= uint256(-change);
        }

        // Record event
        ReputationEvent memory repEvent = ReputationEvent({
            agentId: agentId,
            user: address(0), // Platform action
            predictionId: "",
            reputationChange: change,
            reason: reason,
            timestamp: block.timestamp
        });

        agentHistory[agentId].push(repEvent);
        totalEvents++;

        emit ReputationUpdated(
            agentId,
            change,
            agent.reputation,
            reason,
            block.timestamp
        );
    }

    /**
     * @notice Toggle agent active status
     * @param agentId Agent identifier
     * @param isActive New status
     */
    function setAgentStatus(string memory agentId, bool isActive) external {
        require(agentExists[agentId], "Agent not registered");
        agents[agentId].isActive = isActive;
        emit AgentStatusChanged(agentId, isActive);
    }

    /**
     * @notice Get agent details
     * @param agentId Agent identifier
     * @return Agent struct
     */
    function getAgent(string memory agentId) 
        external 
        view 
        returns (Agent memory) 
    {
        require(agentExists[agentId], "Agent not registered");
        return agents[agentId];
    }

    /**
     * @notice Get agent reputation history
     * @param agentId Agent identifier
     * @return ReputationEvent[] Array of events
     */
    function getAgentHistory(string memory agentId) 
        external 
        view 
        returns (ReputationEvent[] memory) 
    {
        return agentHistory[agentId];
    }

    /**
     * @notice Get all registered agents
     * @return string[] Array of agent IDs
     */
    function getAllAgents() 
        external 
        view 
        returns (string[] memory) 
    {
        return allAgentIds;
    }

    /**
     * @notice Get total number of agents
     * @return uint256 Total agents
     */
    function getTotalAgents() 
        external 
        view 
        returns (uint256) 
    {
        return allAgentIds.length;
    }

    /**
     * @notice Get agent stats
     * @param agentId Agent identifier
     * @return reputation Current reputation
     * @return totalPredictions Total predictions made
     * @return totalSelections Times selected
     * @return winRate Win rate (selections / predictions)
     */
    function getAgentStats(string memory agentId) 
        external 
        view 
        returns (
            uint256 reputation,
            uint256 totalPredictions,
            uint256 totalSelections,
            uint256 winRate
        ) 
    {
        require(agentExists[agentId], "Agent not registered");
        Agent memory agent = agents[agentId];
        
        uint256 rate = 0;
        if (agent.totalPredictions > 0) {
            rate = (agent.totalSelections * 10000) / agent.totalPredictions;
        }
        
        return (
            agent.reputation,
            agent.totalPredictions,
            agent.totalSelections,
            rate // Basis points (e.g., 3333 = 33.33%)
        );
    }
}

