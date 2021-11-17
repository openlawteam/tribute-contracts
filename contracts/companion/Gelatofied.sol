// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract Gelatofied {
    using SafeERC20 for IERC20;

    address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address payable public immutable gelato;

    modifier gelatofy(uint256 _amount) {
        require(
            gelato == address(0x1) || msg.sender == gelato,
            "Gelatofied: Only gelato"
        );

        _;

        (bool success, ) = gelato.call{value: _amount}("");
        require(success, "Gelatofied: Gelato fee failed");
    }

    constructor(address payable _gelato) {
        require(_gelato != address(0), "Gelato can not be zero address");

        gelato = _gelato;
    }
}
