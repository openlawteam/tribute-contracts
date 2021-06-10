// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../adapters/interfaces/chainlink/AggregatorV3Interface.sol";

contract FakeChainlinkPriceFeed is AggregatorV3Interface {
    uint8 public override decimals;

    string public override description;

    uint256 public override version;

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.

    function getRoundData(uint80 _roundId)
        external
        view
        virtual
        override
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        )
    {
        return (10, 200000000000, 10, 20, 15);
    }

    //200000000000 = answer ($2000)
    function latestRoundData()
        external
        view
        virtual
        override
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        )
    {
        return (10, 200000000000, 10, 20, 15);
    }
}
