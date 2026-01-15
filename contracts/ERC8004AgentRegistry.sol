// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ERC8004AgentRegistry
 * @author ZKastro Team
 * @notice ERC-8004 compliant agent identity and reputation registry
 * @dev Implements ERC-8004 Trustless Agents specification (Draft)
 * @custom:security-contact security@zkastro.xyz
 * 
 * ERC-8004 Standard: https://eips.ethereum.org/EIPS/eip-8004
 * Note: ERC-8004 is currently a Draft standard. This implementation may
 * evolve as the specification is finalized.
 * 
 * Features:
 * - Agent Identity: Unique profiles with metadata URIs
 * - Credentials: Verifiable badges and certifications
 * - Validation: Standard interface for action verification
 * - Reputation: Weighted scores with history tracking
 */
contract ERC8004AgentRegistry {
    // ═══════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Agent profile following ERC-8004 identity standard
    struct AgentProfile {
        uint256 agentId;           // Unique numeric ID
        string handle;             // Human-readable handle (e.g., "@auriga")
        string metadataURI;        // IPFS URI for full agent config
        address owner;             // Agent owner/creator
        uint256 reputation;        // Current reputation score
        uint256 totalPredictions;  // Total predictions made
        uint256 totalSelections;   // Times selected by users
        bool isValidated;          // Whether agent passed validation
        bool isActive;             // Agent status
        uint256 createdAt;         // Registration timestamp
        uint256 lastActionAt;      // Last activity timestamp
    }

    /// @notice Verifiable credential for agents
    struct Credential {
        bytes32 credentialType;    // Type hash (e.g., keccak256("ACCURACY_BADGE"))
        uint256 value;             // Credential value (e.g., accuracy percentage)
        uint256 issuedAt;          // Issue timestamp
        uint256 expiresAt;         // Expiration timestamp (0 = never)
        address issuer;            // Who issued the credential
        string proofURI;           // Optional proof/evidence URI
        bool revoked;              // Revocation status
    }

    /// @notice Validation record for agent actions
    struct ValidationRecord {
        bytes32 actionHash;        // Hash of the action being validated
        bool isValid;              // Validation result
        uint256 validatedAt;       // Validation timestamp
        address validator;         // Who performed validation
        string reason;             // Validation reason/notes
    }

    /// @notice Reputation event for history tracking
    struct ReputationEvent {
        uint256 agentId;
        int256 delta;              // Change in reputation (+/-)
        string reason;             // Reason for change
        address triggeredBy;       // User/system that triggered
        uint256 timestamp;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════

    // Agent storage
    mapping(uint256 => AgentProfile) public agents;
    mapping(string => uint256) public handleToAgentId;
    mapping(address => uint256[]) public ownerAgents;
    uint256 public nextAgentId = 1;
    uint256 public totalAgents;

    // Credentials storage
    mapping(uint256 => Credential[]) public agentCredentials;
    mapping(uint256 => mapping(bytes32 => uint256)) public credentialIndex; // agentId => type => index+1

    // Validation storage
    mapping(uint256 => ValidationRecord[]) public agentValidations;
    mapping(bytes32 => bool) public processedActions;

    // Reputation history
    mapping(uint256 => ReputationEvent[]) public reputationHistory;
    uint256 public totalReputationEvents;

    // Configuration
    address public admin;
    mapping(address => bool) public validators;
    mapping(address => bool) public credentialIssuers;

    // Credential type constants
    bytes32 public constant ACCURACY_BADGE = keccak256("ACCURACY_BADGE");
    bytes32 public constant CONSISTENCY_BADGE = keccak256("CONSISTENCY_BADGE");
    bytes32 public constant SPECIALIZATION_BADGE = keccak256("SPECIALIZATION_BADGE");
    bytes32 public constant VERIFIED_AGENT = keccak256("VERIFIED_AGENT");

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    event AgentRegistered(
        uint256 indexed agentId,
        string handle,
        address indexed owner,
        string metadataURI,
        uint256 timestamp
    );

    event AgentProfileUpdated(
        uint256 indexed agentId,
        string metadataURI,
        uint256 timestamp
    );

    event CredentialIssued(
        uint256 indexed agentId,
        bytes32 indexed credentialType,
        uint256 value,
        address indexed issuer,
        uint256 timestamp
    );

    event CredentialRevoked(
        uint256 indexed agentId,
        bytes32 indexed credentialType,
        address indexed revoker,
        uint256 timestamp
    );

    event AgentValidated(
        uint256 indexed agentId,
        bool isValid,
        address indexed validator,
        uint256 timestamp
    );

    event ActionValidated(
        uint256 indexed agentId,
        bytes32 indexed actionHash,
        bool isValid,
        address indexed validator,
        uint256 timestamp
    );

    event ReputationChanged(
        uint256 indexed agentId,
        int256 delta,
        uint256 newReputation,
        string reason,
        uint256 timestamp
    );

    event PredictionRecorded(
        uint256 indexed agentId,
        bytes32 indexed predictionId,
        uint256 timestamp
    );

    event SelectionRecorded(
        uint256 indexed agentId,
        bytes32 indexed predictionId,
        address indexed user,
        uint256 reputationDelta,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════

    modifier onlyAdmin() {
        require(msg.sender == admin, "ERC8004: not admin");
        _;
    }

    modifier onlyValidator() {
        require(validators[msg.sender] || msg.sender == admin, "ERC8004: not validator");
        _;
    }

    modifier onlyCredentialIssuer() {
        require(credentialIssuers[msg.sender] || msg.sender == admin, "ERC8004: not issuer");
        _;
    }

    modifier agentExists(uint256 agentId) {
        require(agents[agentId].agentId != 0, "ERC8004: agent not found");
        _;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    constructor() {
        admin = msg.sender;
        validators[msg.sender] = true;
        credentialIssuers[msg.sender] = true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT REGISTRATION (ERC-8004 Identity)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Register a new agent with ERC-8004 compliant profile
     * @param handle Unique agent handle (e.g., "@auriga")
     * @param metadataURI IPFS URI containing full agent configuration
     * @return agentId The assigned agent ID
     */
    function registerAgent(
        string memory handle,
        string memory metadataURI
    ) external returns (uint256) {
        require(bytes(handle).length > 0, "ERC8004: handle required");
        require(bytes(handle).length <= 32, "ERC8004: handle too long");
        require(handleToAgentId[handle] == 0, "ERC8004: handle taken");

        uint256 agentId = nextAgentId++;

        AgentProfile memory profile = AgentProfile({
            agentId: agentId,
            handle: handle,
            metadataURI: metadataURI,
            owner: msg.sender,
            reputation: 0,
            totalPredictions: 0,
            totalSelections: 0,
            isValidated: false,
            isActive: true,
            createdAt: block.timestamp,
            lastActionAt: block.timestamp
        });

        agents[agentId] = profile;
        handleToAgentId[handle] = agentId;
        ownerAgents[msg.sender].push(agentId);
        totalAgents++;

        emit AgentRegistered(agentId, handle, msg.sender, metadataURI, block.timestamp);

        return agentId;
    }

    /**
     * @notice Update agent metadata URI
     * @param agentId Agent to update
     * @param metadataURI New metadata URI
     */
    function updateAgentProfile(
        uint256 agentId,
        string memory metadataURI
    ) external agentExists(agentId) {
        require(agents[agentId].owner == msg.sender || msg.sender == admin, "ERC8004: not owner");
        
        agents[agentId].metadataURI = metadataURI;
        agents[agentId].lastActionAt = block.timestamp;

        emit AgentProfileUpdated(agentId, metadataURI, block.timestamp);
    }

    /**
     * @notice Get full agent profile
     * @param agentId Agent ID to query
     * @return profile The agent profile
     */
    function getAgentProfile(uint256 agentId) 
        external 
        view 
        agentExists(agentId)
        returns (AgentProfile memory) 
    {
        return agents[agentId];
    }

    /**
     * @notice Get agent ID by handle
     * @param handle Agent handle to look up
     * @return agentId The agent ID (0 if not found)
     */
    function getAgentByHandle(string memory handle) external view returns (uint256) {
        return handleToAgentId[handle];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CREDENTIALS (ERC-8004 Verifiable Credentials)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Issue a credential to an agent
     * @param agentId Agent receiving the credential
     * @param credentialType Type of credential (use constants)
     * @param value Credential value
     * @param expiresAt Expiration timestamp (0 = never expires)
     * @param proofURI Optional URI to proof/evidence
     */
    function issueCredential(
        uint256 agentId,
        bytes32 credentialType,
        uint256 value,
        uint256 expiresAt,
        string memory proofURI
    ) external onlyCredentialIssuer agentExists(agentId) {
        // Check if credential type already exists for this agent
        uint256 existingIndex = credentialIndex[agentId][credentialType];
        
        Credential memory cred = Credential({
            credentialType: credentialType,
            value: value,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            issuer: msg.sender,
            proofURI: proofURI,
            revoked: false
        });

        if (existingIndex > 0) {
            // Update existing credential
            agentCredentials[agentId][existingIndex - 1] = cred;
        } else {
            // Add new credential
            agentCredentials[agentId].push(cred);
            credentialIndex[agentId][credentialType] = agentCredentials[agentId].length;
        }

        emit CredentialIssued(agentId, credentialType, value, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke a credential
     * @param agentId Agent whose credential to revoke
     * @param credentialType Type of credential to revoke
     */
    function revokeCredential(
        uint256 agentId,
        bytes32 credentialType
    ) external onlyCredentialIssuer agentExists(agentId) {
        uint256 index = credentialIndex[agentId][credentialType];
        require(index > 0, "ERC8004: credential not found");

        agentCredentials[agentId][index - 1].revoked = true;

        emit CredentialRevoked(agentId, credentialType, msg.sender, block.timestamp);
    }

    /**
     * @notice Get all credentials for an agent
     * @param agentId Agent to query
     * @return credentials Array of credentials
     */
    function getAgentCredentials(uint256 agentId) 
        external 
        view 
        agentExists(agentId)
        returns (Credential[] memory) 
    {
        return agentCredentials[agentId];
    }

    /**
     * @notice Check if agent has a valid credential of a specific type
     * @param agentId Agent to check
     * @param credentialType Type of credential
     * @return hasCredential Whether agent has valid credential
     * @return value The credential value (0 if not found/invalid)
     */
    function hasValidCredential(uint256 agentId, bytes32 credentialType) 
        external 
        view 
        returns (bool hasCredential, uint256 value) 
    {
        uint256 index = credentialIndex[agentId][credentialType];
        if (index == 0) return (false, 0);

        Credential memory cred = agentCredentials[agentId][index - 1];
        
        if (cred.revoked) return (false, 0);
        if (cred.expiresAt != 0 && cred.expiresAt < block.timestamp) return (false, 0);

        return (true, cred.value);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VALIDATION (ERC-8004 Validation Interface)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Validate an agent (mark as verified)
     * @param agentId Agent to validate
     * @param isValid Validation result
     * @param reason Reason for validation decision
     */
    function validateAgent(
        uint256 agentId,
        bool isValid,
        string memory reason
    ) external onlyValidator agentExists(agentId) {
        agents[agentId].isValidated = isValid;
        agents[agentId].lastActionAt = block.timestamp;

        // Issue or revoke VERIFIED_AGENT credential
        if (isValid) {
            Credential memory cred = Credential({
                credentialType: VERIFIED_AGENT,
                value: 1,
                issuedAt: block.timestamp,
                expiresAt: 0,
                issuer: msg.sender,
                proofURI: "",
                revoked: false
            });

            uint256 existingIndex = credentialIndex[agentId][VERIFIED_AGENT];
            if (existingIndex > 0) {
                agentCredentials[agentId][existingIndex - 1] = cred;
            } else {
                agentCredentials[agentId].push(cred);
                credentialIndex[agentId][VERIFIED_AGENT] = agentCredentials[agentId].length;
            }
        } else {
            uint256 index = credentialIndex[agentId][VERIFIED_AGENT];
            if (index > 0) {
                agentCredentials[agentId][index - 1].revoked = true;
            }
        }

        // Record validation
        ValidationRecord memory record = ValidationRecord({
            actionHash: bytes32(0),
            isValid: isValid,
            validatedAt: block.timestamp,
            validator: msg.sender,
            reason: reason
        });
        agentValidations[agentId].push(record);

        emit AgentValidated(agentId, isValid, msg.sender, block.timestamp);
    }

    /**
     * @notice Validate a specific agent action
     * @param agentId Agent performing the action
     * @param actionHash Hash of the action being validated
     * @param isValid Whether action is valid
     * @param reason Reason for validation decision
     */
    function validateAction(
        uint256 agentId,
        bytes32 actionHash,
        bool isValid,
        string memory reason
    ) external onlyValidator agentExists(agentId) {
        require(!processedActions[actionHash], "ERC8004: action already processed");
        
        processedActions[actionHash] = true;

        ValidationRecord memory record = ValidationRecord({
            actionHash: actionHash,
            isValid: isValid,
            validatedAt: block.timestamp,
            validator: msg.sender,
            reason: reason
        });
        agentValidations[agentId].push(record);

        emit ActionValidated(agentId, actionHash, isValid, msg.sender, block.timestamp);
    }

    /**
     * @notice Check if an agent is validated
     * @param agentId Agent to check
     * @return isValidated Whether agent is validated
     */
    function isAgentValidated(uint256 agentId) external view returns (bool) {
        if (agents[agentId].agentId == 0) return false;
        return agents[agentId].isValidated;
    }

    /**
     * @notice Get validation history for an agent
     * @param agentId Agent to query
     * @return validations Array of validation records
     */
    function getValidationHistory(uint256 agentId) 
        external 
        view 
        agentExists(agentId)
        returns (ValidationRecord[] memory) 
    {
        return agentValidations[agentId];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REPUTATION (ERC-8004 Reputation Management)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Record a prediction made by an agent
     * @param agentId Agent making prediction
     * @param predictionId Unique prediction identifier
     */
    function recordPrediction(
        uint256 agentId,
        bytes32 predictionId
    ) external agentExists(agentId) {
        require(agents[agentId].isActive, "ERC8004: agent not active");

        agents[agentId].totalPredictions++;
        agents[agentId].lastActionAt = block.timestamp;

        emit PredictionRecorded(agentId, predictionId, block.timestamp);
    }

    /**
     * @notice Record when a user selects this agent's prediction
     * @param agentId Agent whose prediction was selected
     * @param predictionId Prediction identifier
     * @param user User who made selection
     * @param reputationDelta Reputation points to award
     */
    function recordSelection(
        uint256 agentId,
        bytes32 predictionId,
        address user,
        uint256 reputationDelta
    ) external agentExists(agentId) {
        require(agents[agentId].isActive, "ERC8004: agent not active");
        require(user != address(0), "ERC8004: invalid user");

        agents[agentId].totalSelections++;
        agents[agentId].reputation += reputationDelta;
        agents[agentId].lastActionAt = block.timestamp;

        // Record reputation event
        ReputationEvent memory repEvent = ReputationEvent({
            agentId: agentId,
            delta: int256(reputationDelta),
            reason: "Prediction selected by user",
            triggeredBy: user,
            timestamp: block.timestamp
        });
        reputationHistory[agentId].push(repEvent);
        totalReputationEvents++;

        emit SelectionRecorded(agentId, predictionId, user, reputationDelta, block.timestamp);
        emit ReputationChanged(
            agentId, 
            int256(reputationDelta), 
            agents[agentId].reputation, 
            "Prediction selected by user",
            block.timestamp
        );
    }

    /**
     * @notice Update agent reputation (admin/validator only)
     * @param agentId Agent to update
     * @param delta Reputation change (+/-)
     * @param reason Reason for change
     */
    function updateReputation(
        uint256 agentId,
        int256 delta,
        string memory reason
    ) external onlyValidator agentExists(agentId) {
        AgentProfile storage agent = agents[agentId];

        if (delta > 0) {
            agent.reputation += uint256(delta);
        } else if (delta < 0 && agent.reputation >= uint256(-delta)) {
            agent.reputation -= uint256(-delta);
        }
        agent.lastActionAt = block.timestamp;

        // Record event
        ReputationEvent memory repEvent = ReputationEvent({
            agentId: agentId,
            delta: delta,
            reason: reason,
            triggeredBy: msg.sender,
            timestamp: block.timestamp
        });
        reputationHistory[agentId].push(repEvent);
        totalReputationEvents++;

        emit ReputationChanged(agentId, delta, agent.reputation, reason, block.timestamp);
    }

    /**
     * @notice Get agent statistics
     * @param agentId Agent to query
     * @return reputation Current reputation
     * @return totalPredictions Total predictions made
     * @return totalSelections Times selected
     * @return winRate Win rate in basis points (e.g., 3333 = 33.33%)
     * @return isValidated Whether agent is validated
     */
    function getAgentStats(uint256 agentId) 
        external 
        view 
        agentExists(agentId)
        returns (
            uint256 reputation,
            uint256 totalPredictions,
            uint256 totalSelections,
            uint256 winRate,
            bool isValidated
        ) 
    {
        AgentProfile memory agent = agents[agentId];
        
        uint256 rate = 0;
        if (agent.totalPredictions > 0) {
            rate = (agent.totalSelections * 10000) / agent.totalPredictions;
        }

        return (
            agent.reputation,
            agent.totalPredictions,
            agent.totalSelections,
            rate,
            agent.isValidated
        );
    }

    /**
     * @notice Get reputation history for an agent
     * @param agentId Agent to query
     * @return events Array of reputation events
     */
    function getReputationHistory(uint256 agentId) 
        external 
        view 
        agentExists(agentId)
        returns (ReputationEvent[] memory) 
    {
        return reputationHistory[agentId];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Add or remove a validator
     * @param validator Address to update
     * @param isValidator Whether address should be validator
     */
    function setValidator(address validator, bool isValidator) external onlyAdmin {
        validators[validator] = isValidator;
    }

    /**
     * @notice Add or remove a credential issuer
     * @param issuer Address to update
     * @param isIssuer Whether address should be issuer
     */
    function setCredentialIssuer(address issuer, bool isIssuer) external onlyAdmin {
        credentialIssuers[issuer] = isIssuer;
    }

    /**
     * @notice Toggle agent active status
     * @param agentId Agent to update
     * @param isActive New status
     */
    function setAgentActive(uint256 agentId, bool isActive) external agentExists(agentId) {
        require(
            agents[agentId].owner == msg.sender || msg.sender == admin,
            "ERC8004: not authorized"
        );
        agents[agentId].isActive = isActive;
    }

    /**
     * @notice Transfer admin role
     * @param newAdmin New admin address
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "ERC8004: invalid address");
        admin = newAdmin;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VIEW HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Get all agents owned by an address
     * @param owner Owner address
     * @return agentIds Array of agent IDs
     */
    function getAgentsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerAgents[owner];
    }

    /**
     * @notice Get total number of registered agents
     * @return count Total agents
     */
    function getTotalAgents() external view returns (uint256) {
        return totalAgents;
    }

    /**
     * @notice Check if address is a validator
     * @param addr Address to check
     * @return isValidator Whether address is validator
     */
    function isValidator(address addr) external view returns (bool) {
        return validators[addr] || addr == admin;
    }

    /**
     * @notice Check if address is a credential issuer
     * @param addr Address to check
     * @return isIssuer Whether address is issuer
     */
    function isCredentialIssuer(address addr) external view returns (bool) {
        return credentialIssuers[addr] || addr == admin;
    }
}

