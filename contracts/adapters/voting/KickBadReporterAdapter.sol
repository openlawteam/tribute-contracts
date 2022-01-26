pragma solidity ^0.8.0;
function c_0x3576a37f(bytes32 c__0x3576a37f) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../../extensions/bank/Bank.sol";
import "../../helpers/GuildKickHelper.sol";
import "../../guards/MemberGuard.sol";
import "../../guards/AdapterGuard.sol";
import "../interfaces/IVoting.sol";
import "./OffchainVoting.sol";
import "../../utils/Signatures.sol";

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

contract KickBadReporterAdapter is MemberGuard {
function c_0xae42c433(bytes32 c__0xae42c433) public pure {}

    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata data
    ) external {c_0xae42c433(0x0c6838f5e11e53a56754809b096865968e8077d45a43a0c7c4b6636a509c44cf); /* function */ 

c_0xae42c433(0x279d21c7e6301f0e23091908a08826da3e145c91a2a4febd1408ff56d844d548); /* line */ 
        c_0xae42c433(0xb050ed761c354e6d987727a39f1cb6a503bb605cc2f8a7983bd8afba779f9964); /* statement */ 
OffchainVotingContract votingContract = _getVotingContract(dao);
c_0xae42c433(0x012969767fed8b1862e1f9d03e097207e81f4844c82f66fa830a9c1a21c77ff8); /* line */ 
        c_0xae42c433(0x5f299dc442b7a7cdda13bfeb19acf78c84d28bf90bb7ca519a51c45b4c1c4cbb); /* statement */ 
address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
c_0xae42c433(0x31f7064b54f8401470e2589c54744adb5c7b11d5b0aee31689cd05aaebeda7d6); /* line */ 
        c_0xae42c433(0x64088c3dbddd40111b7aaec0a7bc5f1a01a831e869357d567b6604b9762ea866); /* statement */ 
votingContract.sponsorChallengeProposal(dao, proposalId, sponsoredBy);
c_0xae42c433(0x8d1352f8d1932328acdebf08b5296bcb59c97e47a24cd9a1965d80d012b241e6); /* line */ 
        c_0xae42c433(0x0adc28df90aba3e2c2eb4f91a7a1a826e509291ad4c0f954b5234bf7c143792b); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    function processProposal(DaoRegistry dao, bytes32 proposalId) external {c_0xae42c433(0xf71f6ed77955049d82b724e2f09f936b7d4e1392468e2c732eba5685d58dabca); /* function */ 

c_0xae42c433(0x5ab56cd9195b48680c2d798896c2a306cfd6d84f67bace34d6e12cf87183ad1b); /* line */ 
        c_0xae42c433(0x28dde51cbeae5af9a09decf939d3ef1f3b979ecd4a4951d80e02f116682579e0); /* statement */ 
OffchainVotingContract votingContract = _getVotingContract(dao);
c_0xae42c433(0x734e733bb9487793b641e9cf6ee1efbf98a017c86008b401b80f74c5b765e480); /* line */ 
        c_0xae42c433(0xc8f4831a643f65c00574389a783f8eb82647caed80715528a7a6552fe4dc68e3); /* statement */ 
votingContract.processChallengeProposal(dao, proposalId);

c_0xae42c433(0x3a02984fe6819e40e99695644b1dff0c06770947e2c2464c39b0c363a04f6d6b); /* line */ 
        c_0xae42c433(0xa94798dbe3089f9f4371d0b7625b4f6eb95905889df04595bbcbec2051b92699); /* statement */ 
IVoting.VotingState votingState = votingContract.voteResult(
            dao,
            proposalId
        );
        // the person has been kicked out
c_0xae42c433(0x11a4c6b0fdc9be0b10bb2c8a4f50959705494fbeb80862735a2654ced9234b1c); /* line */ 
        c_0xae42c433(0x235b1e7f425cff6459e9daa40199aa425c81c309268ca6fa0974590f39ab4653); /* statement */ 
if (votingState == IVoting.VotingState.PASS) {c_0xae42c433(0x9ab26ae821fd8bf5fd0849fc30a08fa7f24ffefc1681f997281d8b6c7849a37b); /* branch */ 

            //slither-disable-next-line variable-scope
c_0xae42c433(0xb76e6b6f2636ad12ad0e1fced85dca4511b7b37328ded62c9ec932964bc7b651); /* line */ 
            c_0xae42c433(0x501fc1285b3717ee6ff842881f35cb402da7f208ce51bba4b8b834fa963b7f67); /* statement */ 
(, address challengeAddress) = votingContract.getChallengeDetails(
                dao,
                proposalId
            );
c_0xae42c433(0xa2fc4afc61ce3de5b22102fbf37d81d323de0e2870aa678f8b78213ee6ac1cea); /* line */ 
            c_0xae42c433(0xe623fb9d012e9b2ac30d9a2c067d7d1cd24157204178cc923aa008178a4dfcc8); /* statement */ 
GuildKickHelper.rageKick(dao, challengeAddress);
        } else {c_0xae42c433(0xe8af22de70335a56b39863ab587b31f63ceaa774a5465460ee4904764c2aa05a); /* statement */ 
c_0xae42c433(0xdfa13fae3793e9e4074fe55dc993d147257cdf49683541b9f0b461c05a25cc63); /* branch */ 
if (
            votingState == IVoting.VotingState.NOT_PASS ||
            votingState == IVoting.VotingState.TIE
        ) {c_0xae42c433(0x7e89343dd5d9413bf774a41e04f5771241c2bb9623addca6659e420935d0d5a5); /* branch */ 

            //slither-disable-next-line uninitialized-local,variable-scope
c_0xae42c433(0x91683446195c91d26ecf69c26f57fc4f20936d1fbb572f86c02bfee2ed19fdc0); /* line */ 
            c_0xae42c433(0x78b03bb999a84c9a4712e06ba38d0c970835a32fb698ce08d59d2683948e86e9); /* statement */ 
(uint256 units, address challengeAddress) = votingContract
                .getChallengeDetails(dao, proposalId);
c_0xae42c433(0xc30d390f76c548345ee05ab0c0049f9a951b05eee2144d32b8b3e24bd7affa05); /* line */ 
            c_0xae42c433(0xf6c9b073adf3e63bc3b7b0cdc6d26ef411b14aa1c815791c89f7a70fbc6d4902); /* statement */ 
BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );

c_0xae42c433(0x5599ee46eba4bda081ddf43b4acbcabe46fc530be33dc72bdc85996d9e385fb0); /* line */ 
            c_0xae42c433(0x37ce601d440ef648b563ad63bc73b694d17ee73ba6b6d816f53500c6d18b8eec); /* statement */ 
bank.subtractFromBalance(
                dao,
                challengeAddress,
                DaoHelper.LOOT,
                units
            );
c_0xae42c433(0x7a1ae6da9b683841c68abf62d97a3f618bc164c67d7364b8e7155656b1119418); /* line */ 
            c_0xae42c433(0xa08559568bcf73f2ad1fd34092f75f7e389e542dfea31670f797dc35374dab18); /* statement */ 
bank.addToBalance(dao, challengeAddress, DaoHelper.UNITS, units);
        } else {c_0xae42c433(0xf4ff2b3440b1e01c5d66e45f6310b954cc025f3748b821d8ea8395033ea17788); /* branch */ 

c_0xae42c433(0x46322aaea3c1dc782320ec4f714627f00dc98a548bf68f71a9b73df806b6d812); /* line */ 
            c_0xae42c433(0x49bd039bf275cbbec012889aee9576e713ea40052ae98c013a60dab86b2e4278); /* statement */ 
revert("vote not finished yet");
        }}
    }

    function _getVotingContract(DaoRegistry dao)
        internal
        view
        returns (OffchainVotingContract)
    {c_0xae42c433(0x657ba6849faf346296b73e748524a69de0f29ed13d3fca545ef39d1e686578c6); /* function */ 

c_0xae42c433(0xc88d55551a43bb33c3bdb802fbc0228da1761f50f4e89781c8ba9dfe473f70ed); /* line */ 
        c_0xae42c433(0xb399b9254a551c118764e25c81e972d1ca8fcff3f2b388b9c71f6cc63ed05198); /* statement */ 
address addr = dao.getAdapterAddress(DaoHelper.VOTING);
c_0xae42c433(0x8c8c8adf1ba51e5ea74e3cf1ec6023217b2f196daa27e577f128e46b6df6dd1a); /* line */ 
        c_0xae42c433(0xf037d54510a4281bdede4321b02c967f35ae72712e9ece97b7f007e5ec4ceaf0); /* statement */ 
return OffchainVotingContract(payable(addr));
    }
}
