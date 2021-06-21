pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../core/DaoConstants.sol";
import "../../bank/Bank.sol";

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

/**
 *
 * The ERC20Extension is a contract to give erc20 functionality
 * to the internal token units held by DAO members inside the DAO itself.
 */
contract ERC20TransferStrategy is DaoConstants {
    enum ApprovalType {NONE, STANDARD, SPECIAL}

    // The custom configuration to set the transfer type, e.g:
    // (0: transfers are enabled only between dao members)
    // (1: transfers are enabled between dao members and external accounts)
    // (2: all transfers are paused)
    bytes32 public constant ERC20_EXT_TRANSFER_TYPE =
        keccak256("erc20ExtTransferType");

    /// @notice Clonable contract must have an empty constructor
    // constructor() {}

    function hasBankAccess(DaoRegistry dao, address caller) public view returns (bool) {
        return dao.hasAdapterAccessToExtension(
            caller,
            dao.getExtensionAddress(BANK),
            uint8(BankExtension.AclFlag.INTERNAL_TRANSFER)
        );
    }

    function evaluateTransfer(DaoRegistry dao, address tokenAddr, address from, address to, uint256 amount, address caller) public view returns (ApprovalType, uint256)  {
        if(hasBankAccess(dao, caller)) {
            return (ApprovalType.SPECIAL, amount);
        }

        

        return (ApprovalType.STANDARD, amount);

    }
}
