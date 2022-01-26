pragma solidity ^0.8.0;
function c_0x9f446e7e(bytes32 c__0x9f446e7e) pure {}


// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../helpers/DaoHelper.sol";
import "../../bank/Bank.sol";
import "./IERC20TransferStrategy.sol";
import "./InternalTokenVestingExtension.sol";

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
contract ERC20TransferStrategySimple is IERC20TransferStrategy {
function c_0xd549bd59(bytes32 c__0xd549bd59) public pure {}

    bytes32 public constant ERC20_EXT_TRANSFER_TYPE =
        keccak256("erc20.transfer.type");

    /// @notice Clonable contract must have an empty constructor
    // constructor() {}

    function hasBankAccess(DaoRegistry dao, address caller)
        public
        view
        returns (bool)
    {c_0xd549bd59(0xf870ba17d097dfefc0f29c0ce47b435b5357f982d705af934bd695a6563bbfa7); /* function */ 

c_0xd549bd59(0x76e8a59fed5c6fa90b81927b848456595270237c0f903df4f78efa0cd07f8dc8); /* line */ 
        c_0xd549bd59(0x30e417e7cfdea0b26753909d891721dc27396ffab402e4bfcf9bfc9867f4eab9); /* statement */ 
return
            dao.hasAdapterAccessToExtension(
                caller,
                dao.getExtensionAddress(DaoHelper.BANK),
                uint8(BankExtension.AclFlag.INTERNAL_TRANSFER)
            );
    }

    function evaluateTransfer(
        DaoRegistry dao,
        address,
        address,
        address to,
        uint256 amount,
        address caller
    ) external view override returns (ApprovalType, uint256) {c_0xd549bd59(0x4fd2db712b0e7750adf01662a6367fabe6d8dad1c9102d4385de22fb0b71b2be); /* function */ 

        //if the transfer is an internal transfer, then make it unlimited
c_0xd549bd59(0x45dbcf07e542410b8608be1ba916e197007e1958d0cf1faeb3fa695b4564f176); /* line */ 
        c_0xd549bd59(0x6aea4eb243448e974907a33c20b42c0f16b741448c99ff69eae239471fe6c7a4); /* statement */ 
if (hasBankAccess(dao, caller)) {c_0xd549bd59(0x3e00e7de8c1924455c0c02bd712f3d9593d46d7f8b490f0109055ff3a8008641); /* branch */ 

c_0xd549bd59(0x1b1981943018f7f59e10b7d3924efddf7f331eb7e0289c4ca26b0aaa035c4e12); /* line */ 
            c_0xd549bd59(0xeeadf8edf964c413d7ca08dfe7aa74a639d6f9a5516c13695eb5f8e828702275); /* statement */ 
return (ApprovalType.SPECIAL, amount);
        }else { c_0xd549bd59(0xae997dcbba5205847cbd05c592388d15c05290b16912314acb4bf367f11ff359); /* branch */ 
}

c_0xd549bd59(0xf93d80720ffe50cdbd1abb0c188e8e61de90df5b4f418e51a966b9071f92fe69); /* line */ 
        c_0xd549bd59(0x3492e80cc8717e6f7e4d6dfc789be9b174c0c0cd1546ab13b2e31274f150bd1f); /* statement */ 
uint256 transferType = dao.getConfiguration(ERC20_EXT_TRANSFER_TYPE);
        // member only
c_0xd549bd59(0x59d8a353284d31047fab6e91c11ab1dffaa2150b468f17dbd1dc687ebdd9d3f9); /* line */ 
        c_0xd549bd59(0xc5f055dfe4464bf1e70e1e80d9ba92323772363e368a288e460bb00ffdd98740); /* statement */ 
if (transferType == 0 && dao.isMember(to)) {c_0xd549bd59(0x9fa92cf9f7383e5c97b688b2a554aa223b30ced42e0720f3e1b6f96347133fbe); /* branch */ 

            // members only transfer
c_0xd549bd59(0xbe20d8485b190de76dcd68d9b878c788c688b77371b16458a5e0d6859a918480); /* line */ 
            c_0xd549bd59(0xd2de9782b078f8b13719ae85a597ecb711fabda2e4138d2f7b8bbc5907b88779); /* statement */ 
return (ApprovalType.STANDARD, amount);
            // open transfer
        } else {c_0xd549bd59(0xa975162104b41ef0e50f07c0024a4c53a3bc270705fa0e7d6edf038085706425); /* statement */ 
c_0xd549bd59(0x842a185565c4641f1f0d3dfff8b63276a642328bac686fa9b179069d8b860020); /* branch */ 
if (transferType == 1) {c_0xd549bd59(0xe41475812f329749a37151b97daf9798424d6c73a920d5a159136cbde59b2e30); /* branch */ 

c_0xd549bd59(0x066926c1fc888904ed47152dbe88fde57397229476865009812f0f32477796ae); /* line */ 
            c_0xd549bd59(0xcb05b3322026fd57f7332b9708c04f5f66aa66c2f335b4478c280679d4f314d6); /* statement */ 
return (ApprovalType.STANDARD, amount);
        }else { c_0xd549bd59(0xcd45231045516459c4f6c7e569e4bca657db7b8cb6524e9adc75207bb7043f5f); /* branch */ 
}}
        //transfer not allowed
c_0xd549bd59(0x2ab84179024af2ebd30019b3c983a5955983e7058e28f4d5bbd89512bedd19f9); /* line */ 
        c_0xd549bd59(0x15dded0a3e1becbe3d0c211d49f731a3300f486019167e27c318ff633e4cd932); /* statement */ 
return (ApprovalType.NONE, 0);
    }
}
