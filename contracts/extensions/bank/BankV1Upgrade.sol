pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT
import "./BankV1.sol";
import "./Bank.sol";
import "../../core/DaoRegistry.sol";
import "../IExtension.sol";
import "../../guards/AdapterGuard.sol";
import "../../helpers/DaoHelper.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

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

contract BankV1UpgradeExtension is BankExtension {
    using Address for address payable;
    using SafeERC20 for IERC20;

    BankV1Extension private _bank;

    function initialize2(BankV1Extension bankV1) external {
        require(_bank == BankV1Extension(address(0x0)), "already set");
        _bank = bankV1;
    }

    //slither-disable-next-line calls-loop
    function _migrateToken(address token) internal {
        if (_bank.availableInternalTokens(token)) {
            this.registerPotentialNewInternalToken(dao, token);
        } else if (_bank.availableTokens(token)) {
            this.registerPotentialNewToken(dao, token);
        }
    }

    //slither-disable-next-line calls-loop
    function _checkToken(address token) internal {
        if (!availableTokens[token] && !availableInternalTokens[token]) {
            require(
                _bank.availableInternalTokens(token) ||
                    _bank.availableTokens(token),
                "unknown token address"
            );
            _migrateToken(token);
        }
    }

    /**
     * @notice Adds to a member's balance of a given token
     * @param member The member whose balance will be updated
     * @param token The token to update
     * @param amount The new balance
     */

    //slither-disable-next-line reentrancy-benign
    function addToBalance(
        DaoRegistry _dao,
        address member,
        address token,
        uint256 amount
    ) public payable override hasExtensionAccess(_dao, AclFlag.ADD_TO_BALANCE) {
        _checkToken(token);
        uint256 newAmount = balanceOf(member, token) + amount;
        uint256 newTotalAmount = balanceOf(DaoHelper.TOTAL, token) + amount;

        _createNewAmountCheckpoint(member, token, newAmount);
        _createNewAmountCheckpoint(DaoHelper.TOTAL, token, newTotalAmount);
    }

    /**
     * @notice Remove from a member's balance of a given token
     * @param member The member whose balance will be updated
     * @param token The token to update
     * @param amount The new balance
     */
    //slither-disable-next-line reentrancy-benign
    function subtractFromBalance(
        DaoRegistry _dao,
        address member,
        address token,
        uint256 amount
    ) public override hasExtensionAccess(_dao, AclFlag.SUB_FROM_BALANCE) {
        _checkToken(token);
        uint256 newAmount = balanceOf(member, token) - amount;
        uint256 newTotalAmount = balanceOf(DaoHelper.TOTAL, token) - amount;

        _createNewAmountCheckpoint(member, token, newAmount);
        _createNewAmountCheckpoint(DaoHelper.TOTAL, token, newTotalAmount);
    }

    /**
     * @notice Make an internal token transfer
     * @param from The member who is sending tokens
     * @param to The member who is receiving tokens
     * @param amount The new amount to transfer
     */
    function internalTransfer(
        DaoRegistry _dao,
        address from,
        address to,
        address token,
        uint256 amount
    ) external override hasExtensionAccess(_dao, AclFlag.INTERNAL_TRANSFER) {
        // slither-disable-next-line unused-return
        try dao.notJailed(from) returns (
            // slither-disable-next-line uninitialized-local,variable-scope
            bool notJailed
        ) {
            require(notJailed, "no transfer from jail");
            require(dao.notJailed(to), "no transfer from jail");
        } catch {}

        uint256 newAmount = balanceOf(from, token) - amount;
        uint256 newAmount2 = balanceOf(to, token) + amount;

        _createNewAmountCheckpoint(from, token, newAmount);
        _createNewAmountCheckpoint(to, token, newAmount2);
    }

    /**
     * @notice Returns an member's balance of a given token
     * @param member The address to look up
     * @param tokenAddr The token where the member's balance of which will be returned
     * @return The amount in account's tokenAddr balance
     */
    //slither-disable-next-line calls-loop
    function balanceOf(address member, address tokenAddr)
        public
        view
        override
        returns (uint160)
    {
        uint32 nCheckpoints = numCheckpoints[tokenAddr][member];
        if (nCheckpoints == 0) {
            return _bank.balanceOf(member, tokenAddr);
        }

        return checkpoints[tokenAddr][member][nCheckpoints - 1].amount;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorAmount(
        address account,
        address tokenAddr,
        uint256 blockNumber
    ) external view override returns (uint256) {
        require(
            blockNumber < block.number,
            "bank::getPriorAmount: not yet determined"
        );

        uint32 nCheckpoints = numCheckpoints[tokenAddr][account];
        if (nCheckpoints == 0) {
            return _bank.getPriorAmount(account, tokenAddr, blockNumber);
        }

        // First check most recent balance
        if (
            checkpoints[tokenAddr][account][nCheckpoints - 1].fromBlock <=
            blockNumber
        ) {
            return checkpoints[tokenAddr][account][nCheckpoints - 1].amount;
        }

        // Next check implicit zero balance
        if (checkpoints[tokenAddr][account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[tokenAddr][account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.amount;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[tokenAddr][account][lower].amount;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            super.supportsInterface(interfaceId) ||
            this.withdrawTo.selector == interfaceId;
    }
}
