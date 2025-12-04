// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title ChartRegistry - Solidity Implementation
 * @notice Stores immutable commitments of natal charts with ZK proofs
 * @dev This is the Solidity equivalent of the Stylus Rust implementation for benchmarking
 */
contract ChartRegistrySolidity {
    // Chart data structure
    struct ChartCommitment {
        bytes32 chartHash;
        address user;
        uint256 timestamp;
        bool zkVerified;
        bool exists;
    }
    
    // Mappings
    mapping(bytes32 => ChartCommitment) private charts; // chartId hash => commitment
    
    // State
    uint256 public totalCharts;
    address public owner;
    
    // Events
    event ChartCreated(
        string indexed chartId,
        bytes32 indexed chartHash,
        address indexed user,
        uint256 timestamp,
        bool zkVerified
    );
    
    event ChartVerified(
        string indexed chartId,
        bytes32 chartHash
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Constructor / Initializer
    constructor() {
        owner = msg.sender;
        totalCharts = 0;
    }
    
    /**
     * @notice Initialize the contract (for proxy pattern compatibility)
     */
    function init() external {
        if (owner == address(0)) {
            owner = msg.sender;
            totalCharts = 0;
        }
    }
    
    /**
     * @notice Register a new chart commitment
     * @param chartId Unique identifier for the chart
     * @param chartHash Hash commitment of the chart data
     * @param user Address of the chart owner
     * @param zkVerified Whether the chart has been ZK verified
     * @return success Whether the registration was successful
     */
    function registerChart(
        string calldata chartId,
        bytes32 chartHash,
        address user,
        bool zkVerified
    ) external returns (bool success) {
        bytes32 chartKey = keccak256(abi.encodePacked(chartId));
        
        // Check if chart already exists
        if (charts[chartKey].exists) {
            return false;
        }
        
        // Validate inputs
        if (chartHash == bytes32(0) || user == address(0)) {
            return false;
        }
        
        // Store chart commitment
        charts[chartKey] = ChartCommitment({
            chartHash: chartHash,
            user: user,
            timestamp: block.timestamp,
            zkVerified: zkVerified,
            exists: true
        });
        
        // Increment total
        totalCharts++;
        
        // Emit event
        emit ChartCreated(chartId, chartHash, user, block.timestamp, zkVerified);
        
        return true;
    }
    
    /**
     * @notice Verify a chart commitment matches provided hash
     * @param chartId Chart identifier
     * @param chartHash Expected hash
     * @return matches Whether the hash matches
     */
    function verifyChart(
        string calldata chartId,
        bytes32 chartHash
    ) external view returns (bool matches) {
        bytes32 chartKey = keccak256(abi.encodePacked(chartId));
        
        if (!charts[chartKey].exists) {
            return false;
        }
        
        return charts[chartKey].chartHash == chartHash;
    }
    
    /**
     * @notice Get chart hash
     * @param chartId Chart identifier
     * @return chartHash The stored hash
     */
    function getChartHash(string calldata chartId) external view returns (bytes32) {
        bytes32 chartKey = keccak256(abi.encodePacked(chartId));
        return charts[chartKey].chartHash;
    }
    
    /**
     * @notice Get chart user
     * @param chartId Chart identifier
     * @return user The chart owner address
     */
    function getChartUser(string calldata chartId) external view returns (address) {
        bytes32 chartKey = keccak256(abi.encodePacked(chartId));
        return charts[chartKey].user;
    }
    
    /**
     * @notice Get chart timestamp
     * @param chartId Chart identifier
     * @return timestamp The registration timestamp
     */
    function getChartTimestamp(string calldata chartId) external view returns (uint256) {
        bytes32 chartKey = keccak256(abi.encodePacked(chartId));
        return charts[chartKey].timestamp;
    }
    
    /**
     * @notice Check if chart is ZK verified
     * @param chartId Chart identifier
     * @return verified Whether the chart is verified
     */
    function isZkVerified(string calldata chartId) external view returns (bool) {
        bytes32 chartKey = keccak256(abi.encodePacked(chartId));
        return charts[chartKey].zkVerified;
    }
    
    /**
     * @notice Mark a chart as ZK verified (only owner)
     * @param chartId Chart identifier
     * @return success Whether the operation succeeded
     */
    function markAsVerified(string calldata chartId) external onlyOwner returns (bool) {
        bytes32 chartKey = keccak256(abi.encodePacked(chartId));
        
        if (!charts[chartKey].exists) {
            return false;
        }
        
        charts[chartKey].zkVerified = true;
        
        emit ChartVerified(chartId, charts[chartKey].chartHash);
        
        return true;
    }
    
    /**
     * @notice Check if a chart exists
     * @param chartId Chart identifier
     * @return exists Whether the chart exists
     */
    function chartExists(string calldata chartId) external view returns (bool) {
        bytes32 chartKey = keccak256(abi.encodePacked(chartId));
        return charts[chartKey].exists;
    }
    
    /**
     * @notice Batch register multiple charts (for benchmarking)
     * @param chartIds Array of chart identifiers
     * @param chartHashes Array of chart hashes
     * @param users Array of user addresses
     * @param zkVerifieds Array of verification statuses
     * @return count Number of successfully registered charts
     */
    function batchRegisterCharts(
        string[] calldata chartIds,
        bytes32[] calldata chartHashes,
        address[] calldata users,
        bool[] calldata zkVerifieds
    ) external returns (uint256 count) {
        require(
            chartIds.length == chartHashes.length &&
            chartHashes.length == users.length &&
            users.length == zkVerifieds.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < chartIds.length; i++) {
            bytes32 chartKey = keccak256(abi.encodePacked(chartIds[i]));
            
            if (!charts[chartKey].exists && chartHashes[i] != bytes32(0) && users[i] != address(0)) {
                charts[chartKey] = ChartCommitment({
                    chartHash: chartHashes[i],
                    user: users[i],
                    timestamp: block.timestamp,
                    zkVerified: zkVerifieds[i],
                    exists: true
                });
                
                totalCharts++;
                count++;
                
                emit ChartCreated(chartIds[i], chartHashes[i], users[i], block.timestamp, zkVerifieds[i]);
            }
        }
        
        return count;
    }
}

