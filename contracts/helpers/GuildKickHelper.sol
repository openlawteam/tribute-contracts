pragma solidity ^0.8.0;
function c_0xcac00388(bytes32 c__0xcac00388) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../guards/MemberGuard.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/FairShareHelper.sol";
import "../helpers/DaoHelper.sol";
import "../extensions/bank/Bank.sol";

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

library GuildKickHelper {
function c_0x42250289(bytes32 c__0x42250289) public pure {}

    address internal constant TOTAL = address(0xbabe);
    address internal constant UNITS = address(0xFF1CE);
    address internal constant LOCKED_UNITS = address(0xFFF1CE);
    address internal constant LOOT = address(0xB105F00D);
    address internal constant LOCKED_LOOT = address(0xBB105F00D);

    bytes32 internal constant BANK = keccak256("bank");
    address internal constant GUILD = address(0xdead);

    function lockMemberTokens(DaoRegistry dao, address potentialKickedMember)
        internal
    {c_0x42250289(0xd8120e8b11feecd3a9c4ee3612c0fea2bafe0734f62fdd54bd003bc78575b1f8); /* function */ 

        // Get the bank extension
c_0x42250289(0x7c2d411e44c29a4c734cab7cae240bf6dbb8bcc6e69b51744b3024d070832d5d); /* line */ 
        c_0x42250289(0x9dfe98e2f9038803bb42e88d81737053642f2437eea41ddb536bc11619fd050c); /* statement */ 
BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        // Calculates the total units, loot and locked loot before any internal transfers
        // it considers the locked loot to be able to calculate the fair amount to ragequit,
        // but locked loot can not be burned.

c_0x42250289(0x6ad3364496fbbda316224a650ad2813b433cdc118d16899a4f8fc1dfea9a5251); /* line */ 
        c_0x42250289(0x692b595a51d33f09b6d06a37f7b1c584af5f182658732c0dffc663dc4fc7b231); /* statement */ 
uint256 unitsToBurn = bank.balanceOf(potentialKickedMember, UNITS);
c_0x42250289(0x601ec63191d41f157e64d62c72b0f5252680e996117c64f50915b57c1161dcb0); /* line */ 
        c_0x42250289(0xef1c1b44128d43b51c4b29aeb435b48f5b633427a542b8eb0d5da771b7278a7a); /* statement */ 
uint256 lootToBurn = bank.balanceOf(potentialKickedMember, LOOT);

c_0x42250289(0x3b6f3b9bf0da97f47181f813f0679558cd976fc19a02b69d77c5f51f080406c3); /* line */ 
        c_0x42250289(0xc4005fb849900024c22ea3804dc99c4c7f738178738bcbd88cfbbe74d49d3a4d); /* statement */ 
bank.registerPotentialNewToken(dao, LOCKED_UNITS);
c_0x42250289(0x698889d6c9a93a633c9faf60b0737b0208e5deeb7c164d3320fa8c5157f8b9ef); /* line */ 
        c_0x42250289(0x1bfb4a03ac5eae3ced2d5bf67152454d46bad3dad61cbb24566d195f67c4d963); /* statement */ 
bank.registerPotentialNewToken(dao, LOCKED_LOOT);

c_0x42250289(0x859858e2ad57502e070ae32771cd20b17b09c6a9e40abd5b20a2ede0fa97003c); /* line */ 
        c_0x42250289(0xc51e2a4ff4f8db3125cf729ca05cce93d7d791884356ef6cc2a77831396fd1ff); /* statement */ 
bank.addToBalance(
            dao,
            potentialKickedMember,
            LOCKED_UNITS,
            unitsToBurn
        );
c_0x42250289(0x8a097276c91bc7e72b6ccde0bce6de6a7f157fd183446d111f69c83233b8c51c); /* line */ 
        c_0x42250289(0xbc76a29d59a140cccd9264baa016e5e66ecea3d5e105b546fd255b7cbf8be7b5); /* statement */ 
bank.subtractFromBalance(
            dao,
            potentialKickedMember,
            UNITS,
            unitsToBurn
        );

c_0x42250289(0x4fbad1defe1368799507bccf2f0d710fc2cec162304cee1a3f1afbea3c4cc0fe); /* line */ 
        c_0x42250289(0x88e4e7e3a388eebd5999c2be10dd91ecf08a9b9800e857b26730e48a45293e11); /* statement */ 
bank.addToBalance(dao, potentialKickedMember, LOCKED_LOOT, lootToBurn);
c_0x42250289(0x631727b739293fbd60856f39089ea20cd125e7b357d815192ac35fefdcab3c81); /* line */ 
        c_0x42250289(0x5720f6296b6a1af5fade45b5b4dd560def1e04798f3acc07fb8b15567733361c); /* statement */ 
bank.subtractFromBalance(dao, potentialKickedMember, LOOT, lootToBurn);
    }

    function unlockMemberTokens(DaoRegistry dao, address kickedMember)
        internal
    {c_0x42250289(0xe3ba317a361f524ad0a4cebd0e4bdc80bde7bcff9a59103b42ef92c277a782e2); /* function */ 

c_0x42250289(0x55018f88c16e6f13b6c2b414434900f42ecb62df33bffdabe3e8429993479cfd); /* line */ 
        c_0x42250289(0x61006b20681e1b1f26215e2165b2fbec11b7c8cb8bff3dd59494ea082944029b); /* statement */ 
BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));

c_0x42250289(0x1ea92974135708d34c4d654f80bf766053ed7bd5fbf58e3f1dbb19b931cee9f2); /* line */ 
        c_0x42250289(0x10b039f413949f6d8ab8f1aedd42f81e2d2d1ac2ad3d6f9e6f55d493a39fe5c9); /* statement */ 
uint256 unitsToReturn = bank.balanceOf(kickedMember, LOCKED_UNITS);
c_0x42250289(0x632be025ca919cdb7d9763eea4efdebbc7b38ca91c5ed3b9f24c94f70cd00e6a); /* line */ 
        c_0x42250289(0xc796dad3443ce97f666592188374660f6a3faaa25622a05c191dff27787ac848); /* statement */ 
uint256 lootToReturn = bank.balanceOf(kickedMember, LOCKED_LOOT);

c_0x42250289(0xad7de48b0626e2e50018bf01690e58e9f731e37974d4268b1b1aa5e3faad3574); /* line */ 
        c_0x42250289(0xb4e0a6c9fff45697816ce0ab70d537316d0047c003aeddaba8719c1dfcaa6856); /* statement */ 
bank.addToBalance(dao, kickedMember, UNITS, unitsToReturn);
c_0x42250289(0x489e9c016c811b2d78d4106e37497baba36a9c55f3c0361ad9e2bb5decee02ec); /* line */ 
        c_0x42250289(0xce0912eecab256839e8618f24ad18a72d7279641cfba5d831bda1825cb129d37); /* statement */ 
bank.subtractFromBalance(
            dao,
            kickedMember,
            LOCKED_UNITS,
            unitsToReturn
        );

c_0x42250289(0x5c42581493dc1cf332ed6bd024ed0e89110bc0e5812ce7c8dba1af5b7ab317d5); /* line */ 
        c_0x42250289(0xf5faacc8447b8373d6f52c3f8100dc231018702bf9899629191e73194169a15a); /* statement */ 
bank.addToBalance(dao, kickedMember, LOOT, lootToReturn);
c_0x42250289(0x774225674840c8d0ccff4a20808cfa2a5d837e557f017e527c3d2231ef2a19a2); /* line */ 
        c_0x42250289(0xca3b44445498070659298a92e9efbcecedfb0c9c8c593557309e7142b24e1d4c); /* statement */ 
bank.subtractFromBalance(dao, kickedMember, LOCKED_LOOT, lootToReturn);
    }

    /**
     * @notice Transfers the funds from the Guild account to the kicked member account based on the current kick proposal id.
     * @notice The amount of funds is caculated using the actual balance of the member to make sure the member has not ragequited.
     * @dev A kick proposal must be in progress.
     * @dev Only one kick per DAO can be executed at time.
     * @dev Only active members can be kicked out.
     * @dev Only proposals that passed the voting process can be completed.
     * @param dao The dao address.
     */
    function rageKick(DaoRegistry dao, address kickedMember) internal {c_0x42250289(0x6bcbf094813e15fff1238a4e785115f0e6ca029800958172e200783252f0d0dd); /* function */ 

        // Get the bank extension
c_0x42250289(0x5218a6a4cb2d7432977b6787a4060534a27975dbeb7e392310be0cce5631b179); /* line */ 
        c_0x42250289(0x584ce49a77aef935bbc036163c5f273f3a3e4739f5b17f47dda48ccb23e72849); /* statement */ 
BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
c_0x42250289(0xbb90f1bf0a1e645f778df69c6bd1b93088e128bdbbb302b0d8e4393be920ca9d); /* line */ 
        c_0x42250289(0xa4264fb735a67bf998828c51e55bb9e311d61752b3402a3000748db4ada03826); /* statement */ 
uint256 nbTokens = bank.nbTokens();
        // Calculates the total units, loot and locked loot before any internal transfers
        // it considers the locked loot to be able to calculate the fair amount to ragequit,
        // but locked loot can not be burned.
c_0x42250289(0xac73b2b93c276d897ba5f042adfdeeb70974ab6f745ec4ff9c68e0bfaa4e382c); /* line */ 
        c_0x42250289(0x77b53e5097bc1cf0d685c8ceb29a7785ed14f35d331dfb05a64f1c43d39d1502); /* statement */ 
uint256 initialTotalTokens = DaoHelper.totalTokens(bank);

c_0x42250289(0x7a7ad5961786c8d35a7c9ec91532f490579f42164e0ea9b5dfefd110dfe9f0a4); /* line */ 
        c_0x42250289(0x4ae9f683c00324ef21ba028ad0a9d2f17f61fec1c8bebf10652196a5bf69c130); /* statement */ 
uint256 unitsToBurn = bank.balanceOf(kickedMember, LOCKED_UNITS);
c_0x42250289(0x694ecbf081964ab09f0c3a8d98ae5710a0e9d5104feebb53fe48039d0a94e505); /* line */ 
        c_0x42250289(0x44f7fb0705b910426b0cd407ea16519cbf7f46cf5829c468fb6db543d9285f85); /* statement */ 
uint256 lootToBurn = bank.balanceOf(kickedMember, LOCKED_LOOT);
c_0x42250289(0x0dc569007a4ae97bc4b2ac48fef82bf846df2978c9607fe8c9f166880f6cf631); /* line */ 
        c_0x42250289(0x144ae7661cb5559d74053206735efaa06cc9e35f9e7598e216f833d329ceeb30); /* statement */ 
uint256 unitsAndLootToBurn = unitsToBurn + lootToBurn;

c_0x42250289(0x9a9ea05b6472a693058bdb81753b946b819bd8b3f4f2e254ad0f2354a411c777); /* line */ 
        c_0x42250289(0x4928da75997d60b805774abf5b8c42481e7d4183d5f729ccbae3ab1388a122c8); /* statement */ 
if (unitsAndLootToBurn > 0) {c_0x42250289(0xd866f4fe208132449b64a1838e9c1dfa296066bac3a37f27b82d5cb4d44d0b4d); /* branch */ 

            // Transfers the funds from the internal Guild account to the internal member's account.
c_0x42250289(0x5283962b2257f965f3843516b13e993cfbeaf4fab220dd52f233a8f030ce248d); /* line */ 
            c_0x42250289(0x9519d87a88d33d15c52dfd3b9b2a7989b1fa55709f98b611522927a629bd818e); /* statement */ 
for (uint256 i = 0; i < nbTokens; i++) {
                //slither-disable-next-line calls-loop
c_0x42250289(0xe38e9f4cce04bbbe8729732b1187fab6d4f467c200db54d0a8b28da414e01109); /* line */ 
                c_0x42250289(0x865d37caadbeb66c8557c5e95080adbf924f7e2cf348ebe6ba28e853dcbe8eae); /* statement */ 
address token = bank.getToken(i);
                // Calculates the fair amount of funds to ragequit based on the token, units and loot.
                // It takes into account the historical guild balance when the kick proposal was created.
                //slither-disable-next-line calls-loop
c_0x42250289(0x8cf274ee849e337fe337492ccf48d2baeb56f3450a622ecd36a164fe4a3141fd); /* line */ 
                c_0x42250289(0xe6334473b79187b2361a263ecd523cf68c32f06cf9f170442430535f640049b1); /* statement */ 
uint256 amountToRagequit = FairShareHelper.calc(
                    bank.balanceOf(GUILD, token),
                    unitsAndLootToBurn,
                    initialTotalTokens
                );

                // Ony execute the internal transfer if the user has enough funds to receive.
c_0x42250289(0x605d2a736304e35e934c8c8eb582a5a618702216202b41732aa241efd6f5d483); /* line */ 
                c_0x42250289(0xc8dbb3802b8cd5fd2b8b72b8bf72f81ea4da92cb92b29d946de7bcae2cfac038); /* statement */ 
if (amountToRagequit > 0) {c_0x42250289(0xdec782097618d05674381653fdf76959bba0ebc84501ff0871f1e7ca5bea78a4); /* branch */ 

                    // gas optimization to allow a higher maximum token limit
                    // deliberately not using safemath here to keep overflows from preventing the function execution
                    // (which would break ragekicks) if a token overflows,
                    // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                    //slither-disable-next-line calls-loop
c_0x42250289(0x134a55b155725b51671af88c6da96999eb677edc5cbedd0d27839e6ffa32848e); /* line */ 
                    c_0x42250289(0x73cbcef8e31fd0378bda7d163202009d9d807b0fe05e32aa449239aab629211b); /* statement */ 
bank.internalTransfer(
                        dao,
                        GUILD,
                        kickedMember,
                        token,
                        amountToRagequit
                    );
                }else { c_0x42250289(0x6514b677d0571cd4956951973fa9a637b7e8217e437df26e911e4fbaf2128006); /* branch */ 
}
            }

c_0x42250289(0x1acb9a9dac441fbe9be92704beb1d787f344f7f6b3e61bd0557726b85e04ce51); /* line */ 
            c_0x42250289(0xa37b2a48d79d0e61072e30ac8fe3abcff04ebff4b28442ddd0a69087f7345f30); /* statement */ 
bank.subtractFromBalance(
                dao,
                kickedMember,
                LOCKED_UNITS,
                unitsToBurn
            );
c_0x42250289(0x6336bad1d575e4ba7420db3d69c35a8c8adc79f89b7f9db8d69f59bb6f324d71); /* line */ 
            c_0x42250289(0xe300a1a8ce7d2b7b7eb26dff082392da6a13d300a9b3ba4587a91356d581ac5f); /* statement */ 
bank.subtractFromBalance(
                dao,
                kickedMember,
                LOCKED_LOOT,
                lootToBurn
            );
        }else { c_0x42250289(0x340968951f8237103a100876d4a814c973d9a41495f32aa076c086a858702801); /* branch */ 
}
    }
}
