pragma solidity ^0.8.0;
function c_0xb65896c6(bytes32 c__0xb65896c6) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "./interfaces/IRagequit.sol";
import "../helpers/FairShareHelper.sol";
import "../helpers/DaoHelper.sol";
import "../guards/AdapterGuard.sol";

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

contract RagequitContract is IRagequit, AdapterGuard {
function c_0x75d3a487(bytes32 c__0x75d3a487) public pure {}

    /**
     * @notice Event emitted when a member of the DAO executes a ragequit with all or parts of the member's units/loot.
     */
    event MemberRagequit(
        address daoAddress,
        address memberAddr,
        uint256 burnedUnits,
        uint256 burnedLoot,
        uint256 initialTotalUnitsAndLoot
    );

    /**
     * @notice Allows a member or advisor of the DAO to opt out by burning the proportional amount of units/loot of the member.
     * @notice Anyone is allowed to call this function, but only members and advisors that have units are able to execute the entire ragequit process.
     * @notice The array of token needs to be sorted in ascending order before executing this call, otherwise the transaction will fail.
     * @dev The sum of unitsToBurn and lootToBurn have to be greater than zero.
     * @dev The member becomes an inactive member of the DAO once all the units/loot are burned.
     * @dev If the member provides an invalid/not allowed token, the entire processed is reverted.
     * @dev If no tokens are informed, the transaction is reverted.
     * @param dao The dao address that the member is part of.
     * @param unitsToBurn The amount of units of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param tokens The array of tokens that the funds should be sent to.
     */
    function ragequit(
        DaoRegistry dao,
        uint256 unitsToBurn,
        uint256 lootToBurn,
        address[] calldata tokens
    ) external override reentrancyGuard(dao) {c_0x75d3a487(0x8b148830d4664cfcf8a0e8223bf3c615f977a9f18f18e8dfc1feec7b03da92c3); /* function */ 

        // At least one token needs to be provided
c_0x75d3a487(0x1e693261daad6edddedf6ee6b92a3dd0f24acf6c1d0eb124fc9ea78abf39efe4); /* line */ 
        c_0x75d3a487(0xe4af7ed7605d3c8d1d5a69868839e1d64770f68de2671351e96ec1e1952269f4); /* requirePre */ 
c_0x75d3a487(0xb95d03eb42862aa413c706d154a7265a028f3891e9854d32b4d7bd70a70a5ddc); /* statement */ 
require(tokens.length > 0, "missing tokens");c_0x75d3a487(0xfc710e203a3a3a8eb047d2833961243621769ab5b653940b1c815756e0344cb9); /* requirePost */ 

        // Checks if the are enough units and/or loot to burn
c_0x75d3a487(0x90fe013a004d94697a8b33a93b94f226b34e491039080a2c69bccfa214686f29); /* line */ 
        c_0x75d3a487(0x2aaf59964ae64052f03df893ba8853d6b594c3b41c6b2683d24d929b9ab20247); /* requirePre */ 
c_0x75d3a487(0xef8a950ecd1253ea9a83c5c71e284a56680bebb5e6b6be49958e32093ec7d0dc); /* statement */ 
require(unitsToBurn + lootToBurn > 0, "insufficient units/loot");c_0x75d3a487(0x72830ed2985ef8b4dad5152521e8895a9dcea5c230cc73dd4e73c25f54193feb); /* requirePost */ 

        // Gets the delegated address, otherwise returns the sender address.
c_0x75d3a487(0x14ce0a9278e09114ca1804497c0eb1e74787674e96d8134c1e930485595504a4); /* line */ 
        c_0x75d3a487(0x0704897aab4859ba5eee7dea62680acca9c2f09daae4d6d1de1e01688d7984a2); /* statement */ 
address memberAddr = DaoHelper.msgSender(dao, msg.sender);

        // Instantiates the Bank extension to handle the internal balance checks and transfers.
c_0x75d3a487(0x887cf8caaf5d1607af6036244ef3842cb7cc1f8d37aaae4ec0dda6517042400b); /* line */ 
        c_0x75d3a487(0x0e256939cfdb46075e0179411a4d458653c33b0a77c81de3af0d7d2918f87ab8); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        // Check if member has enough units to burn.
c_0x75d3a487(0xaf4619acd95784d8fe5a7ff625b4230a6ba3bde549347ef012c3be6bcc3219f1); /* line */ 
        c_0x75d3a487(0x989a467617bb6230c3f05eae1ea0409bbf77299609020c6fbacf67208dcd4f29); /* requirePre */ 
c_0x75d3a487(0x5eafb63ed20d63eff5fd91ec914355e1d081d166971af3756ab76504cc0fb5e2); /* statement */ 
require(
            bank.balanceOf(memberAddr, DaoHelper.UNITS) >= unitsToBurn,
            "insufficient units"
        );c_0x75d3a487(0x0f652182f984de1efa27d8c5d1454cbb7520c4a09b61eeb43704ef3feae9dcc5); /* requirePost */ 

        // Check if the member has enough loot to burn.
c_0x75d3a487(0x79c98a794c84fc4f096884968890371ff40bd90258b48eb1dded8f13b63706f7); /* line */ 
        c_0x75d3a487(0xdb0b63cfe06e3e478804df7d75e874e62bd61d22387907ceb9f494ac730e0ccf); /* requirePre */ 
c_0x75d3a487(0x76bd9070c7bba4e0f24a59f9f06cd00c7e4d7575c52d247b65f8b21e6aac6688); /* statement */ 
require(
            bank.balanceOf(memberAddr, DaoHelper.LOOT) >= lootToBurn,
            "insufficient loot"
        );c_0x75d3a487(0x17217b6d07f0ca6a3a44e1efe18e2eba26cbcf795a29278e4dd1efecd614d710); /* requirePost */ 


        // Start the ragequit process by updating the member's internal account balances.
c_0x75d3a487(0x210a6c4a3e0e509a281e3c3c7b55b96054e86e1cf805290daaaf9164e76386b3); /* line */ 
        c_0x75d3a487(0x733a82c356f031509282ad6b4115475c57f3428c06d6669fdffcdffa5682c591); /* statement */ 
_prepareRagequit(
            dao,
            memberAddr,
            unitsToBurn,
            lootToBurn,
            tokens,
            bank
        );
    }

    /**
     * @notice Subtracts from the internal member's account the proportional units and/or loot.
     * @param memberAddr The member address that wants to burn the units and/or loot.
     * @param unitsToBurn The amount of units of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param tokens The array of tokens that the funds should be sent to.
     * @param bank The bank extension.
     */
    // slither-disable-next-line reentrancy-events
    function _prepareRagequit(
        DaoRegistry dao,
        address memberAddr,
        uint256 unitsToBurn,
        uint256 lootToBurn,
        address[] memory tokens,
        BankExtension bank
    ) internal {c_0x75d3a487(0xcc8cec0eabd688bef0ec939ed379d0aa3cca9063ba05d050b5c13a70d166e599); /* function */ 

        // Calculates the total units, loot and locked loot before any internal transfers
        // it considers the locked loot to be able to calculate the fair amount to ragequit,
        // but locked loot can not be burned.
c_0x75d3a487(0x85ea923afb2c7cd6c6d00dc7db56b21042f9ada886b5d3e74738f90112b27a9a); /* line */ 
        c_0x75d3a487(0xfe2458b9d62edfd35c84a3153b8966cf5a6e4c396ef68860d69ff64319298d62); /* statement */ 
uint256 totalTokens = DaoHelper.totalTokens(bank);

        // Burns / subtracts from member's balance the number of units to burn.
c_0x75d3a487(0xd0daa3e1cf2b755776bca5a60cb3dc46b48bdcc3829ad4ab89d0376c80a8f6ff); /* line */ 
        c_0x75d3a487(0x3f5868d37be24016afd29a52af404534c648d25fe03efc23da0199f8f7a9db7a); /* statement */ 
bank.internalTransfer(
            dao,
            memberAddr,
            DaoHelper.GUILD,
            DaoHelper.UNITS,
            unitsToBurn
        );
        // Burns / subtracts from member's balance the number of loot to burn.
c_0x75d3a487(0xbf8b9c6decc79ab55e159ee04a8aff0bfade18e84c685a029e6a0cb0997753ce); /* line */ 
        c_0x75d3a487(0x59f4a304c2c402b7987cbca24203b0175c149caf7f05e6d3c3e26c0f37857852); /* statement */ 
bank.internalTransfer(
            dao,
            memberAddr,
            DaoHelper.GUILD,
            DaoHelper.LOOT,
            lootToBurn
        );

        // Completes the ragequit process by updating the GUILD internal balance based on each provided token.
c_0x75d3a487(0x61564b247b4c9010938f5ea5c2e204f8a8fa7a29f359dcb91cdf7e039775c25a); /* line */ 
        c_0x75d3a487(0xbcc3edfe26dcca18b7a5c1d81d39b27497119d708e46944df1d3b8254e8a7078); /* statement */ 
_burnUnits(
            dao,
            memberAddr,
            unitsToBurn,
            lootToBurn,
            totalTokens,
            tokens,
            bank
        );
    }

    /**
     * @notice Subtracts from the bank's account the proportional units and/or loot,
     * @notice and transfers the funds to the member's internal account based on the provided tokens.
     * @param memberAddr The member address that wants to burn the units and/or loot.
     * @param unitsToBurn The amount of units of the member that must be converted into funds.
     * @param lootToBurn The amount of loot of the member that must be converted into funds.
     * @param initialTotalUnitsAndLoot The sum of units and loot before internal transfers.
     * @param tokens The array of tokens that the funds should be sent to.
     * @param bank The bank extension.
     */
    function _burnUnits(
        DaoRegistry dao,
        address memberAddr,
        uint256 unitsToBurn,
        uint256 lootToBurn,
        uint256 initialTotalUnitsAndLoot,
        address[] memory tokens,
        BankExtension bank
    ) internal {c_0x75d3a487(0xebab271a89bcc0075171fabfa67880737d7af69258afe4332ad4cf2744ff53b2); /* function */ 

        // Calculates the total amount of units and loot to burn
c_0x75d3a487(0xefa2729cd1747518c848fd263a6abcb7c8427747e13c387c56787c196d64bba6); /* line */ 
        c_0x75d3a487(0xed003ef50e506cd089359598d60eaafd2836f3aa215f2dd788ac7ffd63f134cc); /* statement */ 
uint256 unitsAndLootToBurn = unitsToBurn + lootToBurn;

        // Transfers the funds from the internal Guild account to the internal member's account based on each token provided by the member.
        // The provided token must be supported/allowed by the Guild Bank, otherwise it reverts the entire transaction.
c_0x75d3a487(0xae9ad4b69c4d18d96e226e9da9ec68aea55b81185054a24cb8569a2adace238a); /* line */ 
        c_0x75d3a487(0xc99120fb0ec6cb69e72c77d6414e0502a5e86b3fb0b077980dbc5c7c0a3f1dfc); /* statement */ 
uint256 length = tokens.length;
c_0x75d3a487(0xc048fc765ee023156aae26e52af6335b471f73fc3fe96f57d9158d0c7c665d47); /* line */ 
        c_0x75d3a487(0x3610cdbd9c59fe4c4fdd5ee89e40951266591baa83d014baa535689b776148b0); /* statement */ 
for (uint256 i = 0; i < length; i++) {
c_0x75d3a487(0x05f6c47be24f418f0adeec9c3da81752bbe3523c4c4f4e0e0f71277220c629f0); /* line */ 
            c_0x75d3a487(0x606a291866ec20a7dac3f80d78e32bdafc8e7d1ba9f92b03fcd53be7b1bc3c0c); /* statement */ 
address currentToken = tokens[i];
c_0x75d3a487(0xe3c29fb6d8cf1288729833443b3f35c5d9e1e6fb99c36d45360b69b710d82f34); /* line */ 
            c_0x75d3a487(0xff95780698702c13187987465b33ed06bb329218f06d14b7ab1fa8ea96728b91); /* statement */ 
uint256 j = i + 1;
c_0x75d3a487(0xd6afd4d47dba3f94480fffe234e20307ffe9e45f374f7ca19b99df8abeca911d); /* line */ 
            c_0x75d3a487(0x89da7da9362a8aa230ee19a5e1b4d24b939940423e489f4feb7062248293acb7); /* statement */ 
if (j < length) {c_0x75d3a487(0xd2b0c151899b1d50f108536e88287da843df4cbafd7e79643fc0b115ebc7a10a); /* branch */ 

                // Next token needs to be greater than the current one to prevent duplicates
c_0x75d3a487(0x53e7ae2de2c2eff24bc665138f5c81d75e4f68205cecb9789cd63836e4308825); /* line */ 
                c_0x75d3a487(0x8152fd4d975fb973c61ee7c95870fd4678f9485cd47ed89d9b8ddc3f0f33234e); /* requirePre */ 
c_0x75d3a487(0x33067530737ea6cf9938a814511ca7a7b169ada3ac0ced4ae7d3151169336397); /* statement */ 
require(currentToken < tokens[j], "duplicate token");c_0x75d3a487(0x1b74e896ad66966c69ff82c32bacb389efdf297895ae9068c8d2a7f25efe621c); /* requirePost */ 

            }else { c_0x75d3a487(0x707c4ebc0331fb937c1a9ba16dd312b14658c47e5c60a4722b30d15ad0bdd802); /* branch */ 
}

            // Checks if the token is supported by the Guild Bank.
            //slither-disable-next-line calls-loop
c_0x75d3a487(0x9a3452a9bccfe2ce3e628ba3f4ecb3ec6feec39b30b360197df96932edaf8586); /* line */ 
            c_0x75d3a487(0x48480197a5d1afc5077f73e24c9e10b7f1fd0089e5aa681ba93b3dc7eb645434); /* requirePre */ 
c_0x75d3a487(0xfedf4b8e7f7a33396bb25a44435d635eb8a9c04b240f440ccc6b29739209e8bc); /* statement */ 
require(bank.isTokenAllowed(currentToken), "token not allowed");c_0x75d3a487(0xf7e4765025922ab3d0b6d46e3416f9444e91e7256862b374f5437d63e3b31d87); /* requirePost */ 


            // Calculates the fair amount of funds to ragequit based on the token, units and loot
            //slither-disable-next-line calls-loop
c_0x75d3a487(0xf5de751c5dc736d2c83acdb537f83a31e6676286d2383bf1f2af1429938b6cdd); /* line */ 
            c_0x75d3a487(0x2f86182501450cd73ae70fad8bcc0791492cecee61f974528baee86c77505cfc); /* statement */ 
uint256 amountToRagequit = FairShareHelper.calc(
                bank.balanceOf(DaoHelper.GUILD, currentToken),
                unitsAndLootToBurn,
                initialTotalUnitsAndLoot
            );

            // Ony execute the internal transfer if the user has enough funds to receive.
c_0x75d3a487(0x15aa3adb3473ddf6dff7d1ac604dd5c017e08b24aa05594ef820460822c873ff); /* line */ 
            c_0x75d3a487(0xe8966cc52713f98c0259170494ae4a0cbb85608088a41852a0a3c889d21a7d77); /* statement */ 
if (amountToRagequit > 0) {c_0x75d3a487(0x8ed208a0f7e97a6205c36da5a50d2cfcd1c397f193832ecf0898512e0aa2f87b); /* branch */ 

                // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution
                // (which would break ragekicks) if a token overflows,
                // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                //slither-disable-next-line calls-loop
c_0x75d3a487(0x90d18e60d513162912b0b91a3ddb3446435aff269b356ba494219366074ccdc2); /* line */ 
                c_0x75d3a487(0x26db764b708d484da80eee6576ec5b004ad9b456a3084b3144feadfddcc56f98); /* statement */ 
bank.internalTransfer(
                    dao,
                    DaoHelper.GUILD,
                    memberAddr,
                    currentToken,
                    amountToRagequit
                );
            }else { c_0x75d3a487(0x778e6e67ebba66c9ade42ccc7362315d776e27aaba83b4e6c07fec5b5564f463); /* branch */ 
}
        }

        // Once the units and loot were burned, and the transfers completed,
        // emit an event to indicate a successfull operation.
        //slither-disable-next-line reentrancy-events
c_0x75d3a487(0x202537d72a315bd917014943f676b2516936606f2e78a395d20f71c872e6b618); /* line */ 
        c_0x75d3a487(0x6d0751edab3a9062e87d046c11bb87b292e393b5bfcd6978487a3a4ad3410548); /* statement */ 
emit MemberRagequit(
            address(dao),
            memberAddr,
            unitsToBurn,
            lootToBurn,
            initialTotalUnitsAndLoot
        );
    }
}
