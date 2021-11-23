pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../helpers/DaoHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import "@openzeppelin/contracts/token/ERC1155/IERC1555.sol";

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
abstract contract GovernanceGuard {
    modifier onlyGovernor(DaoRegistry dao, bytes32 governorRole) {
        _onlyGovernorMember(dao, msg.sender, governorRole);
        _;
    }

    function _onlyGovernorMember(
        DaoRegistry dao,
        address memberAddr,
        bytes32 governorRole
    ) internal view {
        require(
            isActiveGovernor(dao, memberAddr, governorRole),
            "onlyGovernor"
        );
    }

    /**
     * @dev Checks if the member address holds enough funds to be considered a governor.
     * @param dao The DAO Address.
     * @param memberAddr The message sender to be verified as governor.
     * @param governorRole The role config of the adapter or extension to retrieve the governance token address.
     */
    function isActiveGovernor(
        DaoRegistry dao,
        address memberAddr,
        bytes32 governorRole
    ) public view returns (bool) {
        address governanceToken = dao.getAddressConfiguration(governorRole);
        require(
            DaoHelper.isNotZeroAddress(governanceToken),
            "missing governance token config"
        );

        address bankAddress = dao.extensions(DaoHelper.BANK);
        if (DaoHelper.isNotZeroAddress(bankAddress)) {
            address delegatedMemberAddr = dao.getAddressIfDelegated(memberAddr);

            BankExtension bank = BankExtension(bankAddress);
            if (bank.isInternalToken(governanceToken)) {
                return bank.balanceOf(delegatedMemberAddr, governanceToken) > 0;
            } else {
                //TODO check for ERC721, ERC1155?
                return
                    IERC20(governanceToken).balanceOf(delegatedMemberAddr) > 0;
            }
        }

        return dao.isMember(memberAddr);
    }
}
