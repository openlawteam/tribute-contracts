pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../../core/Registry.sol";

interface IRagequit {
    function ragequit(Registry dao, uint256 sharesToBurn) external;
}
