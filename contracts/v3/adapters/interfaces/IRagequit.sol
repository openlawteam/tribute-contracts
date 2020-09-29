pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";

interface IRagequit {
    function ragequit(DaoRegistry dao, uint256 sharesToBurn, uint256 lootToBurn) external;
}
