pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../core/CloneFactory.sol";
import "./Bank.sol";

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

contract BankFactory is CloneFactory {
    address public identityAddress;

    event BankCreated(address bankAddress);

    constructor(address _identityAddress) {
        require(_identityAddress != address(0x0), "invalid addr");
        identityAddress = _identityAddress;
    }

    /**
     * @notice Create and initialize a new BankExtension
     * @param maxExternalTokens The maximum number of external tokens stored in the Bank
     */
    function createBank(uint8 maxExternalTokens) external {
        BankExtension bank = BankExtension(_createClone(identityAddress));
        bank.setMaxExternalTokens(maxExternalTokens);
        //slither-disable-next-line reentrancy-events
        emit BankCreated(address(bank));
    }
}
