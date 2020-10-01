pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../v3/utils/ERC20.sol";

contract OLToken is ERC20 {
    string public name    = "OpenLaw Token";
    string public symbol  = "OLT";

    constructor(uint256 _initialSupply) ERC20(_initialSupply) { }

    /* @dev default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }
}