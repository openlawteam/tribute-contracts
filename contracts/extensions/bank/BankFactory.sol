pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/CloneFactory.sol";
import "../IFactory.sol";
import "./Bank.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

contract BankFactory is IFactory, CloneFactory, ReentrancyGuard {
    address public identityAddress;

    event BankCreated(address daoAddress, address extensionAddress);

    mapping(address => address) private _extensions;

    constructor(address _identityAddress) {
        require(_identityAddress != address(0x0), "invalid addr");
        identityAddress = _identityAddress;
    }

    /**
     * @notice Create and initialize a new BankExtension
     * @param maxExternalTokens The maximum number of external tokens stored in the Bank
     */
    // slither-disable-next-line reentrancy-events
    function create(address dao, uint8 maxExternalTokens)
        external
        nonReentrant
    {
        require(dao != address(0x0), "invalid dao addr");
        address extensionAddr = _createClone(identityAddress);
        _extensions[dao] = extensionAddr;
        BankExtension bank = BankExtension(extensionAddr);
        bank.setMaxExternalTokens(maxExternalTokens);
        emit BankCreated(dao, address(bank));
    }

    /**
     * @notice Returns the extension address created for that DAO, or 0x0... if it does not exist.
     */
    function getExtensionAddress(address dao)
        external
        view
        override
        returns (address)
    {
        return _extensions[dao];
    }
}
