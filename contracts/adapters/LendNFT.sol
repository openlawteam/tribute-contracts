pragma solidity ^0.8.0;
function c_0x9c4b0d93(bytes32 c__0x9c4b0d93) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/nft/NFT.sol";
import "../extensions/erc1155/ERC1155TokenExtension.sol";
import "../extensions/token/erc20/InternalTokenVestingExtension.sol";
import "../adapters/interfaces/IVoting.sol";
import "../helpers/DaoHelper.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

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

contract LendNFTContract is
    AdapterGuard,
    Reimbursable,
    IERC1155Receiver,
    IERC721Receiver
{
function c_0x69d6c2d4(bytes32 c__0x69d6c2d4) public pure {}

    struct ProcessProposal {
        DaoRegistry dao;
        bytes32 proposalId;
    }

    struct ProposalDetails {
        // The proposal id.
        bytes32 id;
        // The applicant address (who will receive the DAO internal tokens and
        // become a member; this address may be different than the actual owner
        // of the ERC-721 token being provided as tribute).
        address applicant;
        // The address of the ERC-721 or ERC-1155 token that will be transferred to the DAO
        // in exchange for DAO internal tokens.
        address nftAddr;
        // The nft token identifier.
        uint256 nftTokenId;
        uint256 tributeAmount;
        // The amount requested of DAO internal tokens (UNITS).
        uint88 requestAmount;
        uint64 lendingPeriod;
        bool sentBack;
        uint64 lendingStart;
        address previousOwner;
    }

    // Keeps track of all nft tribute proposals handled by each DAO.
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice Configures the adapter for a particular DAO.
     * @notice Registers the DAO internal token with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     * @param token The token address that will be configured as internal token.
     */
    function configureDao(DaoRegistry dao, address token)
        external
        onlyAdapter(dao)
    {c_0x69d6c2d4(0xf625fa24c89e4b613d7e0204b5a0577874cead8fb5bbb15d09ad0b86cbd476c7); /* function */ 

c_0x69d6c2d4(0xccb80dd4d3ef678ada81430473e113a226807370495c6f60722bc051ea5d0573); /* line */ 
        c_0x69d6c2d4(0x228335a0fc957a4ec0bed0916765ab7fac466333a16afe0889569c5a2fd89f6c); /* statement */ 
BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
            .registerPotentialNewInternalToken(dao, token);
    }

    /**
     * @notice Creates and sponsors a tribute proposal to start the voting process.
     * @dev Applicant address must not be reserved.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param nftAddr The address of the ERC-721 token that will be transferred to the DAO in exchange for DAO internal tokens.
     * @param nftTokenId The NFT token id.
     * @param requestAmount The amount requested of DAO internal tokens (UNITS).
     * @param data Additional information related to the tribute proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address nftAddr,
        uint256 nftTokenId,
        uint88 requestAmount,
        uint64 lendingPeriod,
        bytes memory data
    ) external reimbursable(dao) {c_0x69d6c2d4(0x46d1a9f731b017aba096dfb9e78b54268fd6ff7a6c950b7aaa4ae81ec43eb04b); /* function */ 

c_0x69d6c2d4(0x2b518d42db3f4041f73218852298da3a1cd8dbea5f4b21ca2542f4fa5fec4c1d); /* line */ 
        c_0x69d6c2d4(0xa94446ea5706e09934a8e4934dbcda39863996f945a26e0b1a346842ee33e537); /* requirePre */ 
c_0x69d6c2d4(0x606f41e70bb7d8b4db89ec56dde242c5e8d10ac673bc53e1d19349e7fc760fac); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );c_0x69d6c2d4(0xe510b32bbc4f963f465a5d70b2b7aad5ef0ccaa9f006a1b83ee2468d6aa910ea); /* requirePost */ 


c_0x69d6c2d4(0xe32a2b9f208790e94c90da10be6858485d3460a3fba5908cbe7cbc3c6783ea09); /* line */ 
        c_0x69d6c2d4(0xc3a11fdc1832a21eb2887036755871881f413687b559c64149352ea023a0537b); /* statement */ 
dao.submitProposal(proposalId);
c_0x69d6c2d4(0xe41d95da7dfced85ee5a406a3e5ddf92c7ef085d038eb08c07e50f9cd8836dd0); /* line */ 
        c_0x69d6c2d4(0x640e510dfcbb5a107a6c9a375ae7cc825e4a7891d0d085568e30f22b250bd802); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0x69d6c2d4(0xdf1bc7a27abd9d42a097dc9146ab141245b86e34c4defa5365df4870d3c1af50); /* line */ 
        c_0x69d6c2d4(0x5112878a2d327436f4e45ba1811f677e134011b48c68927ab3349c3ac9156e1d); /* statement */ 
address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
c_0x69d6c2d4(0x3accd2ca0eb54f3241511c27f158b9dd0e16b5116e60c68bb28c515bb58f5d13); /* line */ 
        c_0x69d6c2d4(0x39ff3cff032fe7864a8101d0c27f908f4cc0cfe301c76da12b0b2c458ca8dcee); /* statement */ 
dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
c_0x69d6c2d4(0x4dcf44c74e62e9b19aae7ae862d87be06d738045812159673bd03636fb933cd7); /* line */ 
        c_0x69d6c2d4(0xec9e873616b3e64fb51211bf31cdb7b23ad39410841da7305b3670436b413386); /* statement */ 
DaoHelper.potentialNewMember(
            applicant,
            dao,
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
        );

c_0x69d6c2d4(0x7ebe00b48ff60d92cef0bbce3d42404b11493ce671abbf25ccdce066eebef205); /* line */ 
        c_0x69d6c2d4(0x7ec9e04fd9ef65689a52395ae45b3a266d9eb62a13c0571e0447f27f1e8141b6); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);

c_0x69d6c2d4(0x5f4eae659a7f88c1a951f96eb0915fc8fc99855b9613bbd3af59cc363f94f23a); /* line */ 
        c_0x69d6c2d4(0x8886c0e043165bb6f3d5ea829bf6c4be1ee5867ddf5a96dcccd53a3d0883bb1b); /* statement */ 
proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            applicant,
            nftAddr,
            nftTokenId,
            0,
            requestAmount,
            lendingPeriod,
            false,
            0,
            address(0x0)
        );
    }

    /**
     * @notice Processes the proposal to handle minting and exchange of DAO internal tokens for tribute token (passed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev The owner of the ERC-721 token provided as tribute must first separately `approve` the NFT extension as spender of that token (so the NFT can be transferred for a passed vote).
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    // The function can be called only from the _onERC1155Received & _onERC721Received functions
    // Which are protected against reentrancy attacks.
    //slither-disable-next-line reentrancy-no-eth
    function _processProposal(DaoRegistry dao, bytes32 proposalId)
        internal
        returns (
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        )
    {c_0x69d6c2d4(0xd025e5772348bb925048fedb5df15465e7a641c0d2e74d698f5b4b7f1a2d3f06); /* function */ 

c_0x69d6c2d4(0x7dba14b692d8e9ed03075bf4c899402e1ee659471ff578df94c15e7d0b809753); /* line */ 
        c_0x69d6c2d4(0x41b0e96e973d4ff0b5fe5637591c1ecad6df81e26f2d86ba3a4bd55704af583a); /* statement */ 
proposal = proposals[address(dao)][proposalId];
        //slither-disable-next-line timestamp
c_0x69d6c2d4(0x1f6c14eed8dddc65941fe94ace7d2ec8309e21801e2188053ce36d71acf38863); /* line */ 
        c_0x69d6c2d4(0xdeafcf2e3ff3450454c4cd7998662d0baf17191567d99b72f15a7a96f2c72e7c); /* requirePre */ 
c_0x69d6c2d4(0x6d4228865dfe1d1255b9580100decc05b43eea97ffab1ebddc4a48f1007c0ebf); /* statement */ 
require(proposal.id == proposalId, "proposal does not exist");c_0x69d6c2d4(0x2377fcf6aa42fa128f743ac29d8143c1b09852bb97f00b7e6fdc70b4708482b8); /* requirePost */ 

c_0x69d6c2d4(0xf5687b6f87af0be527aa689eb59b69c8d371b6ec4c1e9fdccafa2b3210eba70c); /* line */ 
        c_0x69d6c2d4(0x527fb6c110f263a8f9292b19b76d80c8df29da7e917db4aa3f7c213d3a49365a); /* requirePre */ 
c_0x69d6c2d4(0xab0730563b816574ea04d57d548b70f6bbb84a1929349ac64ab6fc922da06c24); /* statement */ 
require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "proposal already processed"
        );c_0x69d6c2d4(0x241dfb0900bd973992e47224215947c25b9c654066a86158667e7c3d4ae3cc44); /* requirePost */ 


c_0x69d6c2d4(0x1f00074b95828bdfad8178535905c974453e5853f6c1f891192590714707b94f); /* line */ 
        c_0x69d6c2d4(0x43c6efcbc2dfb00e6c4a16fd6b7dfa4b67f96887ceee05a823dbd04130d1ba00); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0x69d6c2d4(0x18d41d411f65e7339c5d148983f13e803961b952a4db20a617e97c526a6e8b65); /* line */ 
        c_0x69d6c2d4(0x8592cfbcd5fbe756c587533a46fefd73169bd0a5e74e79c6b244161a268d05bc); /* requirePre */ 
c_0x69d6c2d4(0x7798fe7b31704f1b8cde86f05c54e35d2ee972e0d9bdcc607bf67b2515d9311f); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0x69d6c2d4(0x88d1307e9cbae2d7e7011ac4f18e4765d2503544162d922ec4f29674506d37c8); /* requirePost */ 


c_0x69d6c2d4(0x6937853c2b9276d643c021a975fe2ee1d5c56fecb71b5d7c3dd49041adbc22ce); /* line */ 
        c_0x69d6c2d4(0xe02e6892e9da9a52d3f00006e58780793025291f32bd6dc54357a2cec7535070); /* statement */ 
voteResult = votingContract.voteResult(dao, proposalId);

c_0x69d6c2d4(0x90727358116ea7dc15443848c15695717b44970bff92967e1e63b83044861b63); /* line */ 
        c_0x69d6c2d4(0x7e875b458d2c828acd25bbdadce1f8b5648a894cf994b1373605a38f7e2e918c); /* statement */ 
dao.processProposal(proposalId);
        //if proposal passes and its an erc721 token - use NFT Extension
c_0x69d6c2d4(0x18a2e7c93436601b6e2f32c3f93ea2d8166d1f77ab7e30308e79a5e072df8ac9); /* line */ 
        c_0x69d6c2d4(0xdc3a83f0b90ca0965df8424480ee144f17688443e0c3a0001bb940844e1d1832); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0x69d6c2d4(0x51d43845658b650998c375a5a18ddd96981860427b7c4890a4d62fd6c071fd34); /* branch */ 

c_0x69d6c2d4(0xb413e042eca9e14bd9a07e0cee26f8b9dc90762fd20286990b1ca681ac7c9204); /* line */ 
            c_0x69d6c2d4(0xad112b56cb6931e33f4c4095096e3beff44e595e79e27a7a5c344f370120362d); /* statement */ 
BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );

c_0x69d6c2d4(0xac3f983f526424edf5ae330dad13ced5d0c161eb4152986f25e9b1eb17104010); /* line */ 
            c_0x69d6c2d4(0x3e0e8fd4ac4457f5d67d3ab3d9bdfe451101d401c39efaa0f48d3dd490920616); /* requirePre */ 
c_0x69d6c2d4(0xa805a8c55503c800c3e7005b997964b9171e1a9c779206d250ba18ee67f32ea1); /* statement */ 
require(
                bank.isInternalToken(DaoHelper.UNITS),
                "UNITS token is not an internal token"
            );c_0x69d6c2d4(0xde9f70c4b485fdb3e623b924cd675b6fe4fa807773c468cda5e0abe3fd584d60); /* requirePost */ 


c_0x69d6c2d4(0xe0505a098c01a1dcb970ca4c22d56aaf9e4cdb6bae626b7a1bf2d24a783025f2); /* line */ 
            c_0x69d6c2d4(0xeafe45e6a77faeeff0debc62a9f3326f416d7eadae6f8bd080f14dc8987e36e9); /* statement */ 
bank.addToBalance(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                proposal.requestAmount
            );

c_0x69d6c2d4(0x598579a8dad8cdfd51e2c508ba3466addc20270c1a99f6ff2ce3d4f5bbe17e84); /* line */ 
            c_0x69d6c2d4(0xdb25eee062aeaa13ba4369c1f9496b070fb228b5451ee482f046fd066954a732); /* statement */ 
InternalTokenVestingExtension vesting = InternalTokenVestingExtension(
                    dao.getExtensionAddress(
                        DaoHelper.INTERNAL_TOKEN_VESTING_EXT
                    )
                );
            //slither-disable-next-line timestamp
c_0x69d6c2d4(0x6eba197a1ccb6267df07c56602c5d71acbe667ee9740de592929b42445988c5d); /* line */ 
            c_0x69d6c2d4(0x949c059936f57af91593b3ba99182f49e69cede3f6095f31dbcde54eb96fd5e6); /* statement */ 
proposal.lendingStart = uint64(block.timestamp);
            //add vesting here
c_0x69d6c2d4(0x3169ddcdd292e56c3f8efd05c629935c79f11651df5f30b185ac64c65001f1fd); /* line */ 
            c_0x69d6c2d4(0x392c71a38d74e95051d571c0d94b2a0d07f5b99be7245474369e6c313a94a540); /* statement */ 
vesting.createNewVesting(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                proposal.requestAmount,
                proposal.lendingStart + proposal.lendingPeriod
            );

c_0x69d6c2d4(0xee77df9986c91445afd6224f5bf4c4b086241a051546c4744a2606c1bbdd61e2); /* line */ 
            c_0x69d6c2d4(0xed3dd5c7f921ab0e4638934b7aa0b281c0a47c4d7290057b74eb8c52f54aa380); /* statement */ 
return (proposal, voteResult);
        } else {c_0x69d6c2d4(0x10445253ad317ee33b460b9c468aab85b69456c831606b8697092ad923329d01); /* statement */ 
c_0x69d6c2d4(0x84e393d077ede5e4cf22066d728452fdf78a63d400d5c25afa8e5c85df1ebc1b); /* branch */ 
if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {c_0x69d6c2d4(0xdbf8d945c6fa406c8f4be81b54fefd17c5d4e1fd4ee2f547e1290834816dbb09); /* branch */ 

c_0x69d6c2d4(0x6444c788f8e82ba1c9b01746c44aebb38ea43b20f63b4966a977109550aa848d); /* line */ 
            c_0x69d6c2d4(0xf9fd6d91e89e28bd0d2895782512e5ade9801a1ff0f1606024078cdd4de0d1eb); /* statement */ 
return (proposal, voteResult);
        } else {c_0x69d6c2d4(0x197ecce990dbbe84c538280c1ae032eded8b65cd07b9969b319c9f3d2c9f6d4c); /* branch */ 

c_0x69d6c2d4(0x2034e40838c50840ddfb955a2bf984b4f3e8969476191f2eaf643b1ffa06ba40); /* line */ 
            c_0x69d6c2d4(0x755870650d8d04ca400e9e956f5169bcb21248d5e15b068947c606404872e47e); /* statement */ 
revert("proposal has not been voted on yet");
        }}
    }

    /**
     * @notice Sends the NFT back to the original owner.
     */
    // slither-disable-next-line reentrancy-benign
    function sendNFTBack(DaoRegistry dao, bytes32 proposalId)
        external
        reimbursable(dao)
    {c_0x69d6c2d4(0x0b4af2022e6f9a10371190e82e6e338c92b8a19aa74f18395178c1bc315d8660); /* function */ 

c_0x69d6c2d4(0x0b59f2cceb53d040c880320a9734df9d3a17315f15c6ee527c297088e6bff3ab); /* line */ 
        c_0x69d6c2d4(0x9040f2a582cfd7a351b6bf664f8b6a5799b058e99483bc204ef62b433ee601e5); /* statement */ 
ProposalDetails storage proposal = proposals[address(dao)][proposalId];
c_0x69d6c2d4(0xdf9a4d282bad50581e6c8bb6006463097e0d1b1cbb4cd278fcacedaa1bd899f6); /* line */ 
        c_0x69d6c2d4(0x8be36a95c36ad15a67c9b2c2bdfcafe3afa68199233649a59b2f9ae74fa50c88); /* requirePre */ 
c_0x69d6c2d4(0xc72c92fe6951242ac3d74b6a1b863cbd702ef30eff3e80cab15bbfecf7ba9ba2); /* statement */ 
require(proposal.lendingStart > 0, "lending not started");c_0x69d6c2d4(0x7c29d30db32fa056b9efa08d75ade3b2d96713413e92294251cd2da80e30dcc3); /* requirePost */ 

c_0x69d6c2d4(0x97e8ac3042bb0ff654aa55de790faa4c02f5943f5ee1cb90196394fc65200b50); /* line */ 
        c_0x69d6c2d4(0x4d1e217c02164ec7f127a9fa4e9a83469894311f01f6ce3f7105a8c5b1947679); /* requirePre */ 
c_0x69d6c2d4(0x2305f46684a8ae047b717b43f1eb9ff0821af9720d60b806a4ee8b98ad0251ab); /* statement */ 
require(!proposal.sentBack, "already sent back");c_0x69d6c2d4(0xcba31458edb39e2aa819d6c5984cec90e9f14216861fd2c3fceaf3766f79df28); /* requirePost */ 

c_0x69d6c2d4(0x9dbe0765cfbdd8fb2e591153ef358008b6d583715b711c4f8c6452a2fe5822a9); /* line */ 
        c_0x69d6c2d4(0x002cf0aaeced3aedd1a07392d5819ab99b3afb9af94ca88ac3b9f1dafcc7910e); /* requirePre */ 
c_0x69d6c2d4(0xa6e8042fb3429de65f9948a2e62198d9c10ee61b7bfd732c013576d3da6e3b0c); /* statement */ 
require(
            msg.sender == proposal.previousOwner,
            "only the previous owner can withdraw the NFT"
        );c_0x69d6c2d4(0x842bcb30e0af7db785e398b518d9b87843cadcc9045b687935a43c93e096729d); /* requirePost */ 


c_0x69d6c2d4(0xbd754c75d4af6376def68508e1eb0248ba9fbed5e049d8f8397d0ab5d28bd61f); /* line */ 
        c_0x69d6c2d4(0xed8f28ca5d5f5456da5baea11787ffe85c0f189e0bc1948c05c6bf027b6697a9); /* statement */ 
proposal.sentBack = true;
        //slither-disable-next-line timestamp
c_0x69d6c2d4(0xde02ce6cd837f3dac0bca8d99b214ab468f00aba838d398547777237a1f9ecca); /* line */ 
        c_0x69d6c2d4(0x6f1fb9e9723b80bc70dd93c7cb58356673aeea4f7a4fc4d96a9b9e964278b896); /* statement */ 
uint256 elapsedTime = block.timestamp - proposal.lendingStart;
        //slither-disable-next-line timestamp
c_0x69d6c2d4(0x93e88be3f135bd03c0ee9c4e7913d6715d3ce577206df18fe6a16be44ca17ec7); /* line */ 
        c_0x69d6c2d4(0xef84dd7e542f1f15e9e6f358a7594fe1dfd0d0f61eaaa09f1bb51d32aab0ba67); /* statement */ 
if (elapsedTime < proposal.lendingPeriod) {c_0x69d6c2d4(0x9bf233109ce850facd7e3ae2109adbd03e91c01f9a134e0b1f77b2ba03c414fa); /* branch */ 

c_0x69d6c2d4(0x46435bbea1a3a293f95e1ae1dd7594eff53feac276a40205d5f054f02c0b867a); /* line */ 
            c_0x69d6c2d4(0x98c44987b8a2c70c6ed3ca004a3304812185f725200644f899c42d3857e70c7d); /* statement */ 
InternalTokenVestingExtension vesting = InternalTokenVestingExtension(
                    dao.getExtensionAddress(
                        DaoHelper.INTERNAL_TOKEN_VESTING_EXT
                    )
                );

c_0x69d6c2d4(0xffbb0bbce256685e49f0febd98b15a61907ade4b7caabe23ec33ebf1443bfff6); /* line */ 
            c_0x69d6c2d4(0x32e94cde1dd11ebc5a1e6f976b0d20f6b008b415b8d812051dc5fd9c9327120d); /* statement */ 
uint256 blockedAmount = vesting.getMinimumBalanceInternal(
                proposal.lendingStart,
                proposal.lendingStart + proposal.lendingPeriod,
                proposal.requestAmount
            );
c_0x69d6c2d4(0x0f0f9bd5aed446b4f3a71cb9a69fb16c0fc59c6000514d884d48af207b5ecfae); /* line */ 
            c_0x69d6c2d4(0x04202d30189776bb28888acc37acb3d2d4da54188a38db143e5325dbae6e8130); /* statement */ 
BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );
c_0x69d6c2d4(0xdc703a59a57c6b84cf078f032ae709f6e75f470e9e37254430eff4c9818d6506); /* line */ 
            c_0x69d6c2d4(0x1a52a4353df9a09e17027258a5a440079ce2ad168e1b35102a8bda2371660cf3); /* statement */ 
bank.subtractFromBalance(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                blockedAmount
            );
c_0x69d6c2d4(0xd62d44dfebf472b8240a83d4e44d4030e558a66d04baf9478624c0262ac116ab); /* line */ 
            c_0x69d6c2d4(0x2cc03f2e7bb21c854a42dd7b1abbb52b71f1aee9088eebf72fe82befad55a564); /* statement */ 
vesting.removeVesting(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                uint64(proposal.lendingPeriod - elapsedTime)
            );
        }else { c_0x69d6c2d4(0xebb3cc2a283d737a0eb5634b6ff876918a1a9a1fb41ddeb6f1d650a61f6e0fea); /* branch */ 
}

        // Only ERC-721 tokens will contain tributeAmount == 0
c_0x69d6c2d4(0x8821dcdf2da89eedd1c3df2bb89c5c83c089affdcea6db4261c1b1706ba87e4a); /* line */ 
        c_0x69d6c2d4(0x00282760d60844d0ce180d2013cc6ed1e74d120ff37dc9270201f87daeca2394); /* statement */ 
if (proposal.tributeAmount == 0) {c_0x69d6c2d4(0xf7c3427cbb8a468c02c28ab6b8d696a2a6118916d3f2c8494a3d3b551b8f7908); /* branch */ 

c_0x69d6c2d4(0x6e3d010f726d93850372eb90d4bb8401daa04f5b084bd182f5e9502aab6b5e7c); /* line */ 
            c_0x69d6c2d4(0x5a8af2b19196b650ea22cf39179a3d502c437e0ca8d62ac4e215279ed4204fbe); /* statement */ 
NFTExtension nftExt = NFTExtension(
                dao.getExtensionAddress(DaoHelper.NFT)
            );

c_0x69d6c2d4(0x1b63e48b02daaea9b281a48c4ab1091c45a51c2aace2ddb3e527f8faef6f6543); /* line */ 
            c_0x69d6c2d4(0x8f59da14d544d96b522518b052ad68f1557673ac1bbf6023266a13682a3819ed); /* statement */ 
nftExt.withdrawNFT(
                dao,
                proposal.previousOwner,
                proposal.nftAddr,
                proposal.nftTokenId
            );
        } else {c_0x69d6c2d4(0x2fc9ee2d2499acd86c657bccdbb7b12d97b856f56572e9ef75ec1775488d4734); /* branch */ 

c_0x69d6c2d4(0xc3da30e4276451ed2d73add571fcf00223b4372d651be649095f8a7bf4831760); /* line */ 
            c_0x69d6c2d4(0xa3273783cb4485552f74662fa36d87c5af5cd2c7e7a578456ed041553d248dbd); /* statement */ 
ERC1155TokenExtension tokenExt = ERC1155TokenExtension(
                dao.getExtensionAddress(DaoHelper.ERC1155_EXT)
            );
c_0x69d6c2d4(0xba9de74d964af8d179b0bde409c9e361f78a0b9e9103cc92035710a5047a2197); /* line */ 
            c_0x69d6c2d4(0x5bd0589b69ed708d5d7bd70384d418ef8d8d9d0ef43a741225b7f3a16cc0fd1a); /* statement */ 
tokenExt.withdrawNFT(
                dao,
                DaoHelper.GUILD,
                proposal.previousOwner,
                proposal.nftAddr,
                proposal.nftTokenId,
                proposal.tributeAmount
            );
        }
    }

    /**
     *  @notice required function from IERC1155 standard to be able to to receive tokens
     */
    function onERC1155Received(
        address,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {c_0x69d6c2d4(0xaa907a7c93600ef702ddd0e989a8583b5d2323f2b8e982763ef227425f82e527); /* function */ 

c_0x69d6c2d4(0x85a86fdfeca6648aed1a517f72f1d661445a78726d13a151d567d2044e3ce3e3); /* line */ 
        c_0x69d6c2d4(0x7e21eb5a9d5f7ee1c8cd80deffbdba4d2607e09de5cc6c605635197ec2d21442); /* statement */ 
ProcessProposal memory ppS = abi.decode(data, (ProcessProposal));
c_0x69d6c2d4(0x5238b291af5727ff6082ddbc059e1d202edd08854efb334bee15faf1f6da88be); /* line */ 
        c_0x69d6c2d4(0x7e481819681aab5ca270a038e7b85757f85886ab180672a05f6e7d8ce4ba6fbd); /* statement */ 
return _onERC1155Received(ppS.dao, ppS.proposalId, from, id, value);
    }

    function _onERC1155Received(
        DaoRegistry dao,
        bytes32 proposalId,
        address from,
        uint256 id,
        uint256 value
    ) internal reimbursable(dao) returns (bytes4) {c_0x69d6c2d4(0x5bcf3df4e87c75c7f3870ea25f94803e0d4dbf9c899c8615ac18494c07b44556); /* function */ 

c_0x69d6c2d4(0x619807d2505538dfadb1e0e375eaf91cdce6aab9fc5f59d7eaeb5277fb351c31); /* line */ 
        c_0x69d6c2d4(0x7d197a168200b9618e83511d5b0458736995e7894838ed46c28b3c7c22d54ae7); /* statement */ 
(
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        ) = _processProposal(dao, proposalId);

c_0x69d6c2d4(0xdd77242d7c32658fccb5fbd4386122f1bb9a854b0e102e322513329e1c087b2d); /* line */ 
        c_0x69d6c2d4(0xd95c139d7611d6b7424768a0dcee4dfd5a75c472cf90a0830bd388ff818bae63); /* requirePre */ 
c_0x69d6c2d4(0x1c071668b43066b28617ed564a7534ceed0fddcaabb93adda170fdf0bd64a92e); /* statement */ 
require(proposal.nftTokenId == id, "wrong NFT");c_0x69d6c2d4(0x92bbd75e8f6e5d0837caa2da59176f37e52a0b9e9d0bed4233cb4f2eee29cb84); /* requirePost */ 

c_0x69d6c2d4(0xd4c29be9b42971f17bac2e08fb9029976e2bc5b027e279dcac4a5f656faad52c); /* line */ 
        c_0x69d6c2d4(0x833850d725ac40f37fb1c6d87e848ecc0ac739bda9d38af10843f8707866f9b7); /* requirePre */ 
c_0x69d6c2d4(0x35f2e8ffe797ca89f31a10861708d2597ca9b55d9d37ad1adc2b9f2f0e57f186); /* statement */ 
require(proposal.nftAddr == msg.sender, "wrong NFT addr");c_0x69d6c2d4(0x20dff1fa7fd20dfdb813cbc1df6a3ceffdc8c9b57aeeac112ec96f39c111b6f1); /* requirePost */ 

c_0x69d6c2d4(0xc0ada2eed0fe8853692c4b8deaeab392e9ed7eaafe21b4228b5f7f8afe412568); /* line */ 
        c_0x69d6c2d4(0x2b2bf025790aaa1f4371fceabb071eb42f4a7f7b85e38c40a440e2d34d79bf36); /* statement */ 
proposal.tributeAmount = value;
c_0x69d6c2d4(0x7127d6fcc123a365bbdd04dca8cc81e68af119d87fed30d4304a65a1740d1606); /* line */ 
        c_0x69d6c2d4(0xa076308dffe8346517f94d561bf026ea467942fbd451f1ec9d56fb0904bc68ff); /* statement */ 
proposal.previousOwner = from;

        // Strict matching is expect to ensure the vote has passed.
        // slither-disable-next-line incorrect-equality,timestamp
c_0x69d6c2d4(0xc162a09d745e2a3686c22f7aa795b22ac32114db2836588f274c60fbb0eeaac4); /* line */ 
        c_0x69d6c2d4(0x1a3a77d43b70c6aa3435090e74432d23202cf3c83b7489d72fdca5ec64ab720c); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0x69d6c2d4(0xc89c39de6f42e4ecfc44688bfb509b3ec1bac9edee3eb2733189fb97bc9f162d); /* branch */ 

c_0x69d6c2d4(0x122ae82a35f650a37524550487ebc640637126ab87a4f835cadcb78c95e6e1d6); /* line */ 
            c_0x69d6c2d4(0xc37ff2717e0ff4de5347a29b9274938bab392f3aba6adc1eabe1b6a1bbce9964); /* statement */ 
address erc1155ExtAddr = dao.getExtensionAddress(
                DaoHelper.ERC1155_EXT
            );

c_0x69d6c2d4(0x80e95e97ac2dbedea899afbcdc93b482427323f5ec23aa11c54971012bcfd98c); /* line */ 
            c_0x69d6c2d4(0x199d0e176fb65c1a2050c18cd7a1b6ac41444d619e92d2f69c6e6e305e3a9293); /* statement */ 
IERC1155 erc1155 = IERC1155(msg.sender);
c_0x69d6c2d4(0x7c9ff7b17a59d3cfc713abdce237f27f42aa2d4738543845604b3b0d3de32756); /* line */ 
            c_0x69d6c2d4(0x7f4dc0fabc491ca51c132282854ae55f1e666d6b6b2f56d83bddfc1aeca9cc0b); /* statement */ 
erc1155.safeTransferFrom(
                address(this),
                erc1155ExtAddr,
                id,
                value,
                ""
            );
        } else {c_0x69d6c2d4(0x6893a58d0da1cfa7ac9e8f6eef85a26f627332cbb3cf628f6d05bbc8894e2d74); /* branch */ 

c_0x69d6c2d4(0xbaee80c3d10cef27fcb2211b617fd66226cd9103f3748ef21e5646a3f92bd3d1); /* line */ 
            c_0x69d6c2d4(0xd95a9c04fa1c1c213de97d593e78ab9ec47af82e871378e0a8f1731aff56c806); /* statement */ 
IERC1155 erc1155 = IERC1155(msg.sender);
c_0x69d6c2d4(0xe80944fd495971db13ca6308c00370c92a1ad52c6485e2edf5891901813bbf1a); /* line */ 
            c_0x69d6c2d4(0x5dd8f963a041da0b8b59224c14e47c64cb526210ecc27d6a04325f968dfb5648); /* statement */ 
erc1155.safeTransferFrom(address(this), from, id, value, "");
        }
c_0x69d6c2d4(0x877285aa17234620e2ebab0e1c29718a9be4e5e9723031b77ea967acdda20e84); /* line */ 
        c_0x69d6c2d4(0x09e25d3ab73d9df88397e91267b8c5f23e7827f210dff3d4048620ce6673dbee); /* statement */ 
return this.onERC1155Received.selector;
    }

    /**
     *  @notice required function from IERC1155 standard to be able to to batch receive tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {c_0x69d6c2d4(0x70e395292b41b1cff621c663c230303989aa819330e2cb9fc358c4be9d940ef2); /* function */ 

c_0x69d6c2d4(0x525fea2dc0f01cbbec527b04dd2bada813b74f80a1cbfa14d6f8ac4c995684ec); /* line */ 
        c_0x69d6c2d4(0x790c419f5d92e068ff2624e771ad7a6fc0c3bacdf86aa3a00aee555067806986); /* statement */ 
revert("not supported");
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {c_0x69d6c2d4(0xb12e5b48e31545d37fab2486b29bb7266f8583b1a8e75ff6a1b80cd159c7c8cb); /* function */ 

c_0x69d6c2d4(0x26e42e5a1f263c1b79da8f6ba4b092e56ab6480021272755e1489486283638fc); /* line */ 
        c_0x69d6c2d4(0xa3aabd3f2ec702efa3277d64e7cd4a1d8e0c4afa5a136ef888f448da9973b54d); /* statement */ 
ProcessProposal memory ppS = abi.decode(data, (ProcessProposal));
c_0x69d6c2d4(0xab4103cd875898ca75d489c90301ca79f0f08afb555631ba139c7e1d5f72ca50); /* line */ 
        c_0x69d6c2d4(0xd8632830d229e295a7798a4122f88f682f247cf0854b88d4431c3d1cf4942636); /* statement */ 
return _onERC721Received(ppS.dao, ppS.proposalId, from, tokenId);
    }

    function _onERC721Received(
        DaoRegistry dao,
        bytes32 proposalId,
        address from,
        uint256 tokenId
    ) internal reimbursable(dao) returns (bytes4) {c_0x69d6c2d4(0x22cbdcdb9d5cac9e95a02e706b6bf657e241aa4b1343e93c735ac4e9cd91bdbe); /* function */ 

c_0x69d6c2d4(0x66e98a6330427f046cce9ec0aa20e7b600ab44ecad880a8116c464a3ecb258f0); /* line */ 
        c_0x69d6c2d4(0x4d5e7cd42001ef0fe08ba1a3fe4a461af822ba25452faa428001ba9b32238c8d); /* statement */ 
(
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        ) = _processProposal(dao, proposalId);
c_0x69d6c2d4(0x6f1934c22b7bef7dc4acf87995a0cd4064922d2d52332734104b325a8333957f); /* line */ 
        c_0x69d6c2d4(0xb28029b278d555d630b96f33e0af685bea8f8372ff8745c58b6dc2c86fc91dbb); /* requirePre */ 
c_0x69d6c2d4(0x220a2c4119f64ffc1623dc370e86caefb7417ee848e309991bedb7a8b410dea2); /* statement */ 
require(proposal.nftTokenId == tokenId, "wrong NFT");c_0x69d6c2d4(0xc2ff8bfd5aaeada631f483f9f62a732b0950c6148e649ccab38fdeecc1cb4d38); /* requirePost */ 

c_0x69d6c2d4(0x8ab849a79cec0591a09fa912c907d59034e4375c952ee4ac42c29f88d7c58978); /* line */ 
        c_0x69d6c2d4(0x2afd5f20dd636d04b32acc528b1bbbf5a001b8daaf273949699515052ede0520); /* requirePre */ 
c_0x69d6c2d4(0xdb530406a975e8bfe2c5b99b2e4e7a421d5adf63fe345dec27dab4a0cbe88bf4); /* statement */ 
require(proposal.nftAddr == msg.sender, "wrong NFT addr");c_0x69d6c2d4(0xcac2b89ae4eff4d487dc3ea8d7b1f99da338da1a17f15a34acedaa5904aefa58); /* requirePost */ 

c_0x69d6c2d4(0x3411416d2796999087ac5f06cd83ed1dba4c30127337e598dfb4d1853042e923); /* line */ 
        c_0x69d6c2d4(0x086ca88443dbedb672e2d123f5a1c654ee24d5577cbec15de51c84231c38330d); /* statement */ 
proposal.tributeAmount = 0;
c_0x69d6c2d4(0x4f03f1dc97f203ac3376b0fe57f65cd3e561bc00929dee4b4774ee1d7c2867f3); /* line */ 
        c_0x69d6c2d4(0x11226d79a98570369db3e253c1c0d2bba54dfd90e6f228c7831150e7018762f4); /* statement */ 
proposal.previousOwner = from;
c_0x69d6c2d4(0x2bf34212204bdf10f57e303506b71737e85716fb38bf0ed0902af4c9761c1efc); /* line */ 
        c_0x69d6c2d4(0x0cf37a1f08c4d0ba2d82a7fb3b8e5fb89bf5068fc04d8c340e6d5012c2afa438); /* statement */ 
IERC721 erc721 = IERC721(msg.sender);

        // Strict matching is expect to ensure the vote has passed
        // slither-disable-next-line incorrect-equality,timestamp
c_0x69d6c2d4(0xd1ced28d0a679ed168f9d627e90d04d677c53e24a9f80578c4190c52342d6611); /* line */ 
        c_0x69d6c2d4(0x867d11e610264cf1df9b3aff5b002b79edd0123161b5f1c7e014ba6020f1015b); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0x69d6c2d4(0xbac8f9a611dfa021ea05b54cb0837efbcaf33ad87ac975ae4570f275aebdb11b); /* branch */ 

c_0x69d6c2d4(0x8b354bc8912c1f78dbcdc0fa417971a065d4ea6eeb636571f4317bf1d02eacef); /* line */ 
            c_0x69d6c2d4(0x483210667a438b67a3a6fd01e75f3d3d525a9f20ff9a47b3aba5298e84b41048); /* statement */ 
NFTExtension nftExt = NFTExtension(
                dao.getExtensionAddress(DaoHelper.NFT)
            );
c_0x69d6c2d4(0x4c16cdeb00ae3146cf53f28a99a0a085252dec65f02a363bd4904a4e9c3fc58b); /* line */ 
            c_0x69d6c2d4(0x9ef44780b3b197640104c89a1cba4a74bb9614885b6a839d2ab9a46e19e76696); /* statement */ 
erc721.approve(address(nftExt), proposal.nftTokenId);
c_0x69d6c2d4(0x310e582dd4a1b17568cba81794dc5e51ed9ab0c5cf886193fa59bf32e5dfb3c3); /* line */ 
            c_0x69d6c2d4(0x7364205585611d7b451f65e8128ff8618659cbe6e0e4d77512c661fe30ef9a4e); /* statement */ 
nftExt.collect(dao, proposal.nftAddr, proposal.nftTokenId);
        } else {c_0x69d6c2d4(0x659e0edc56a25e8c86b40d74978a17d94c2e04eae02c85cad7edff2ec16da6f6); /* branch */ 

c_0x69d6c2d4(0x79dce625795ec9b4f9f47c4f8c210f48af8347a0ff71fcf2213a03c1111217cf); /* line */ 
            c_0x69d6c2d4(0x5b5697db14da0c7fc78b643444bd92f7fd58c52a1f5bcc6c457e656f48820c29); /* statement */ 
erc721.safeTransferFrom(address(this), from, tokenId);
        }

c_0x69d6c2d4(0x184b3644fb01f6615d978e19d6d7992fb834c6acf3f3d5ae09dbdf986a0e147a); /* line */ 
        c_0x69d6c2d4(0xf0af30ab2354c7935624c4a9a1240df878679212eae42e829e105e6748286e51); /* statement */ 
return this.onERC721Received.selector;
    }

    /**
     * @notice Supports ERC-165 & ERC-1155 interfaces only.
     * @dev https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md
     */
    function supportsInterface(bytes4 interfaceID)
        external
        pure
        override
        returns (bool)
    {c_0x69d6c2d4(0x39dcfd075d959eff6d1c63efbd4785dbb02d970ee68550c946122c942b81333d); /* function */ 

c_0x69d6c2d4(0x2d0fe25286804ebb991769a54e5fe9b66d07f5374c62a7622594608797101863); /* line */ 
        c_0x69d6c2d4(0x9edff760787243533d041d9ee32da926b65a8fd8e496d4ef2176fc5723a84e46); /* statement */ 
return
            interfaceID == this.supportsInterface.selector ||
            interfaceID == this.onERC1155Received.selector ||
            interfaceID == this.onERC721Received.selector;
    }
}
