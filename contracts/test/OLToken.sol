pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../utils/ERC20.sol";

contract OLT is ERC20 {
    constructor(uint256 _totalSupply)
        ERC20("OpenLawToken", "OLT", _totalSupply)
    {
        _mint(msg.sender, 10000 * (10**uint256(decimals())));
    }
}
