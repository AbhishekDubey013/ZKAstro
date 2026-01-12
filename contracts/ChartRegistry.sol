// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChartRegistry
 * @notice Stores immutable commitments of natal charts with ZK proofs
 * @dev Charts are stored as hashes to preserve privacy while enabling verification
 */
contract ChartRegistry {
    struct ChartCommitment {
        bytes32 chartHash;          // Keccak256 of chart data
        address user;               // Chart owner
        uint256 timestamp;          // Creation time
        bool zkVerified;            // ZK proof verification status
        string chartId;             // Off-chain chart ID (for lookup)
    }

    // Mapping: chartId => ChartCommitment
    mapping(string => ChartCommitment) public charts;
    
    // Mapping: user => chartIds[]
    mapping(address => string[]) public userCharts;
    
    // Total charts created
    uint256 public totalCharts;

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

    /**
     * @notice Register a new chart commitment
     * @param chartId Unique chart identifier
     * @param chartHash Hash of chart data
     * @param user Chart owner address
     * @param zkVerified Whether ZK proof was verified
     */
    function registerChart(
        string memory chartId,
        bytes32 chartHash,
        address user,
        bool zkVerified
    ) external {
        require(charts[chartId].timestamp == 0, "Chart already exists");
        require(chartHash != bytes32(0), "Invalid chart hash");
        require(user != address(0), "Invalid user address");

        ChartCommitment memory commitment = ChartCommitment({
            chartHash: chartHash,
            user: user,
            timestamp: block.timestamp,
            zkVerified: zkVerified,
            chartId: chartId
        });

        charts[chartId] = commitment;
        userCharts[user].push(chartId);
        totalCharts++;

        emit ChartCreated(chartId, chartHash, user, block.timestamp, zkVerified);
    }

    /**
     * @notice Verify a chart commitment matches provided data
     * @param chartId Chart identifier
     * @param chartHash Hash to verify
     * @return bool Whether the hash matches
     */
    function verifyChart(string memory chartId, bytes32 chartHash) 
        external 
        view 
        returns (bool) 
    {
        return charts[chartId].chartHash == chartHash;
    }

    /**
     * @notice Get chart commitment details
     * @param chartId Chart identifier
     * @return ChartCommitment struct
     */
    function getChart(string memory chartId) 
        external 
        view 
        returns (ChartCommitment memory) 
    {
        return charts[chartId];
    }

    /**
     * @notice Get all chart IDs for a user
     * @param user User address
     * @return string[] Array of chart IDs
     */
    function getUserCharts(address user) 
        external 
        view 
        returns (string[] memory) 
    {
        return userCharts[user];
    }

    /**
     * @notice Mark a chart as ZK verified
     * @param chartId Chart identifier
     */
    function markAsVerified(string memory chartId) external {
        require(charts[chartId].timestamp != 0, "Chart does not exist");
        charts[chartId].zkVerified = true;
        emit ChartVerified(chartId, charts[chartId].chartHash);
    }
}

