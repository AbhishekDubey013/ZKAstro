// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AstrologyAgent.sol";

/**
 * @title AgentFactory
 * @notice Factory for creating autonomous astrology agents
 * @dev Permissionless - anyone can create agents!
 */
contract AgentFactory {
    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    address[] public agents;                        // All deployed agents
    mapping(string => address) public agentsByHandle; // Handle => Agent address
    mapping(address => bool) public isAgent;        // Check if address is an agent
    mapping(address => address[]) public agentsByCreator; // Creator => their agents
    
    uint256 public creationFee;                     // Fee to create agent (optional)
    address public feeRecipient;                    // Where fees go
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    event AgentCreated(
        address indexed agentAddress,
        string handle,
        address indexed creator,
        uint256 timestamp
    );
    
    event CreationFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════
    
    constructor() {
        feeRecipient = msg.sender;
        creationFee = 0; // Free to start, can be updated
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CORE FUNCTION
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Create a new astrology agent
     * @param handle Unique handle (e.g. "@myagent")
     * @param name Display name
     * @param method Prediction methodology
     * @param aggressiveness Score multiplier (500-1500, represents 0.5x-1.5x)
     * @param personality Agent's prediction style
     * @param metadataURI IPFS URI for full agent config
     * @return agentAddress The deployed agent contract address
     */
    function createAgent(
        string memory handle,
        string memory name,
        string memory method,
        uint256 aggressiveness,
        string memory personality,
        string memory metadataURI
    ) external payable returns (address) {
        // Validate
        require(bytes(handle).length > 0, "Handle required");
        require(bytes(handle).length <= 32, "Handle too long");
        require(agentsByHandle[handle] == address(0), "Handle already taken");
        require(aggressiveness >= 500 && aggressiveness <= 1500, "Aggressiveness must be 500-1500");
        require(msg.value >= creationFee, "Insufficient fee");
        
        // Deploy new agent contract
        AstrologyAgent agent = new AstrologyAgent(
            handle,
            name,
            method,
            aggressiveness,
            personality,
            metadataURI
        );
        
        address agentAddress = address(agent);
        
        // Register in mappings
        agents.push(agentAddress);
        agentsByHandle[handle] = agentAddress;
        isAgent[agentAddress] = true;
        agentsByCreator[msg.sender].push(agentAddress);
        
        // Transfer fee if any
        if (msg.value > 0) {
            payable(feeRecipient).transfer(msg.value);
        }
        
        emit AgentCreated(agentAddress, handle, msg.sender, block.timestamp);
        
        return agentAddress;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Get all deployed agents
     */
    function getAllAgents() external view returns (address[] memory) {
        return agents;
    }
    
    /**
     * @notice Get total agent count
     */
    function getAgentCount() external view returns (uint256) {
        return agents.length;
    }
    
    /**
     * @notice Get agents created by a specific address
     * @param creator The creator address
     */
    function getAgentsByCreator(address creator) external view returns (address[] memory) {
        return agentsByCreator[creator];
    }
    
    /**
     * @notice Check if an address is a registered agent
     * @param addr Address to check
     */
    function checkIsAgent(address addr) external view returns (bool) {
        return isAgent[addr];
    }
    
    /**
     * @notice Get agent address by handle
     * @param handle The agent handle
     */
    function getAgentByHandle(string memory handle) external view returns (address) {
        return agentsByHandle[handle];
    }
    
    /**
     * @notice Get multiple agents' stats in one call (gas efficient)
     * @param agentAddresses Array of agent addresses
     */
    function getBatchStats(address[] memory agentAddresses) 
        external 
        view 
        returns (
            uint256[] memory predictions,
            uint256[] memory selections,
            uint256[] memory reputations,
            uint256[] memory winRates
        ) 
    {
        uint256 count = agentAddresses.length;
        predictions = new uint256[](count);
        selections = new uint256[](count);
        reputations = new uint256[](count);
        winRates = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            if (isAgent[agentAddresses[i]]) {
                AstrologyAgent agent = AstrologyAgent(agentAddresses[i]);
                (
                    predictions[i],
                    selections[i],
                    reputations[i],
                    winRates[i]
                ) = agent.getStats();
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Update creation fee (factory owner only)
     * @param newFee New fee in wei
     */
    function setCreationFee(uint256 newFee) external {
        require(msg.sender == feeRecipient, "Not authorized");
        creationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }
    
    /**
     * @notice Update fee recipient (factory owner only)
     * @param newRecipient New recipient address
     */
    function setFeeRecipient(address newRecipient) external {
        require(msg.sender == feeRecipient, "Not authorized");
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }
}

