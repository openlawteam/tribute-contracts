pragma solidity ^0.8.0;
function c_0xaef9de2f(bytes32 c__0xaef9de2f) pure {}


import "../../core/DaoRegistry.sol";
import "../../companion/interfaces/IReimbursement.sol";
import "./Reimbursable.sol";

// SPDX-License-Identifier: MIT

/**
MIT License

Copyright (c) 2021 Openlaw

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
library ReimbursableLib {
function c_0x4a4bd023(bytes32 c__0x4a4bd023) public pure {}

    function beforeExecution(DaoRegistry dao)
        internal
        returns (Reimbursable.ReimbursementData memory data)
    {c_0x4a4bd023(0xfb5ff8c8ff0564379dcf6da67efbbf1c3be1de768f94543a302dd43a7631cd62); /* function */ 

c_0x4a4bd023(0x192b25ecc72d461d4651df69c4b292a3329f517c2437d0a16a0822c1d57d8b7e); /* line */ 
        c_0x4a4bd023(0x41bdea3f322c559e9bacbbf1010106604b04c0df8dd6b94f52455331f563e873); /* statement */ 
data.gasStart = gasleft();
c_0x4a4bd023(0x46008a9af8ab4ebf97bfd7eaa6da1506baf3a6530153a4b51c0b47a1522477e6); /* line */ 
        c_0x4a4bd023(0x6310bc0732a04a1f05ebe3e83795cd4344e0c7c27351765745701bbeffcaa91a); /* requirePre */ 
c_0x4a4bd023(0x49869397dd697d8421e468098a1ee3ec696ef252725be0d4399b92b6b6f46a7b); /* statement */ 
require(dao.lockedAt() != block.number, "reentrancy guard");c_0x4a4bd023(0xfb44379e8123a5cb741047d3ea02285e8141b6f297b56e5ec3178368947e6afc); /* requirePost */ 

c_0x4a4bd023(0x6e4145bc762978538366af632f6da24cc24999c2d657c97683d1ef672f400b0f); /* line */ 
        c_0x4a4bd023(0x75f62599e4f22dd1852a0b641dc6ec62dd2d3fa55d05add8df788a4fed4d75a6); /* statement */ 
dao.lockSession();
c_0x4a4bd023(0xee9acfe3406d5b373469cf97149d971292c8f21cf257c0c6c0dab07f53dedbb0); /* line */ 
        c_0x4a4bd023(0x950bfdb01ff716a8ffa112bb55adb0dd30650916e4e6c9229af8776b5f5f56b6); /* statement */ 
address reimbursementAdapter = dao.adapters(DaoHelper.REIMBURSEMENT);
c_0x4a4bd023(0xf32fa1822e316d7caba59e62cc75a578bfa7ebf9eb458d4847872c4e4522f258); /* line */ 
        c_0x4a4bd023(0xc2bd98b988db6f61368b284eb918eec79017c465e2b89eccf40754939bb5a55c); /* statement */ 
if (reimbursementAdapter == address(0x0)) {c_0x4a4bd023(0x9ed228486ec0cc6a17f579b45300ccb0446529a40e30427aa119d9ff0ebc3d98); /* branch */ 

c_0x4a4bd023(0x5ecb8e55d9da4a52e4b25686e3c8f02b0737564debcda0f96b455fb60fb02a88); /* line */ 
            c_0x4a4bd023(0x8a7d9d22487ff12d8637dc19a10d887c97341122cdb100154ca6174e24c3cff8); /* statement */ 
data.shouldReimburse = false;
        } else {c_0x4a4bd023(0x35893a584d15f065d3048d39e3492c185a909797fee948b9e490ea312956ccca); /* branch */ 

c_0x4a4bd023(0x30139c0db8e3067d44f92fc200000251d599888e9908a6ed5e7c751b139c31c7); /* line */ 
            c_0x4a4bd023(0xd49b34938dd24866e940f01fcb4651f4bd5106fae7d3eaa549ed5757947b8335); /* statement */ 
data.reimbursement = IReimbursement(reimbursementAdapter);

c_0x4a4bd023(0x04519efa6eb0ff3518018f07e11b198b883797a07e630dd09bda28e6a82f635b); /* line */ 
            c_0x4a4bd023(0xb8c57076156a219590b649b7500b27386e8821d4bbb1397a7123021c5b31b047); /* statement */ 
(bool shouldReimburse, uint256 spendLimitPeriod) = data
                .reimbursement
                .shouldReimburse(dao, data.gasStart);

c_0x4a4bd023(0x0b867ab8ee4649b7c6cc5d6a834fca7861df9bb366be261435fc44307d7eb2dc); /* line */ 
            c_0x4a4bd023(0x29164e1d9995739366fe9c9a45f05d12d053072ffe1f137a3e5f3b292c2d9563); /* statement */ 
data.shouldReimburse = shouldReimburse;
c_0x4a4bd023(0x2a949ab5904b4d1ad7ec5d62b2bcc2f2a2738b0ba0a7e26b37a034ba4c41e6dc); /* line */ 
            c_0x4a4bd023(0x7113554a76cbf424cd0104ab0fd57c134778b65d90246b6e1a2a737f03166da5); /* statement */ 
data.spendLimitPeriod = spendLimitPeriod;
        }
    }

    function afterExecution(
        DaoRegistry dao,
        Reimbursable.ReimbursementData memory data
    ) internal {c_0x4a4bd023(0x42ac075d595d4bf67fe4b0e9a8131e153d94e54d86a791a751e3fe40f249d5a3); /* function */ 

c_0x4a4bd023(0xa0f30fb059f2786afa047a1fcb423cf9518b21f3f723d5979471cd9333100cdc); /* line */ 
        c_0x4a4bd023(0x14ff9df639f28e67d3d1da0b7d8d414168154e118e77e5d1e8abdd6c603f7cd0); /* statement */ 
afterExecution2(dao, data, payable(msg.sender));
    }

    function afterExecution2(
        DaoRegistry dao,
        Reimbursable.ReimbursementData memory data,
        address payable caller
    ) internal {c_0x4a4bd023(0x2048cad6e51381c6d582e0c7593ceca4a2d9b65f26773a316a5886c6049123b8); /* function */ 

c_0x4a4bd023(0x32a465e53bc6dd29e49459750ff2d4b441b3c249f910cfa6f27bf9f13aac9980); /* line */ 
        c_0x4a4bd023(0x652fec691e07a3d64f10e3f1c1d48322f3794fac564afd8297b2728a8f1f2c33); /* statement */ 
if (data.shouldReimburse) {c_0x4a4bd023(0xbad567aabe9f472330b7e72c6cd09cb14870434866b84f288c6c2498d315d36a); /* branch */ 

c_0x4a4bd023(0xe433e25acd4bd6378ada9fdf64ae1c5bf8fb928c86cf29b076438d41d5411892); /* line */ 
            c_0x4a4bd023(0xa5438421a54995c8041c298c90dbc9e96b50f9d80aba380fba6235d0c201e4d5); /* statement */ 
data.reimbursement.reimburseTransaction(
                dao,
                caller,
                data.gasStart - gasleft(),
                data.spendLimitPeriod
            );
        }else { c_0x4a4bd023(0x753b0eb4f9607d8fa17a4bcccd32de26f24a8873906f8565d3db492510a4dc9b); /* branch */ 
}
c_0x4a4bd023(0xb85270621f77b5972fab584291d082496ef2fe92e3cbf086a80226eb0cdcf21c); /* line */ 
        c_0x4a4bd023(0x7d8b2fb065947480850cb712d5c905f4d526b83529573dd5ec9ac11dcbff0746); /* statement */ 
dao.unlockSession();
    }
}
