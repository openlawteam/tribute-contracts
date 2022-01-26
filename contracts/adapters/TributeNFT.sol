pragma solidity ^0.8.0;
function c_0x1e4fd070(bytes32 c__0x1e4fd070) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/nft/NFT.sol";
import "../extensions/erc1155/ERC1155TokenExtension.sol";
import "../extensions/bank/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";

import "../helpers/DaoHelper.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";

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

contract TributeNFTContract is
    AdapterGuard,
    Reimbursable,
    IERC1155Receiver,
    IERC721Receiver
{
function c_0xba14ab71(bytes32 c__0xba14ab71) public pure {}

    using Address for address payable;

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
        // The address of the ERC-721 token that will be transferred to the DAO
        // in exchange for DAO internal tokens.
        address nftAddr;
        // The nft token identifier.
        uint256 nftTokenId;
        // The amount requested of DAO internal tokens (UNITS).
        uint256 requestAmount;
    }

    // Keeps track of all nft tribute proposals handled by each DAO.
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice Configures the adapter for a particular DAO.
     * @notice Registers the DAO internal token UNITS with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     */
    function configureDao(DaoRegistry dao, address tokenAddrToMint)
        external
        onlyAdapter(dao)
    {c_0xba14ab71(0xcbff80956c9beda546084a11e83cd5c66b92b1190d0e01dde7d22d562c933881); /* function */ 

c_0xba14ab71(0x715527114ecc6742e53c698583bd4ea1b1b6b4537a5269d1df301cfd4fcb5b14); /* line */ 
        c_0xba14ab71(0x5ef508ac58acf33a83f0f974c9f41fdb529e949fe77b01e57d43f862a8838b20); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xba14ab71(0x50cf4b75e2216271fe3d03ff21b090a9b011e5a53a90c8850707539de5e48041); /* line */ 
        c_0xba14ab71(0x9af18750e44e2318a77633343b7f82dd69a0ec3736e1957d9888e193b11246e7); /* statement */ 
bank.registerPotentialNewInternalToken(dao, tokenAddrToMint);
    }

    /**
     * @notice Creates and sponsors a tribute proposal to start the voting process.
     * @dev Applicant address must not be reserved.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param nftAddr The address of the ERC-721 or ERC 1155 token that will be transferred to the DAO in exchange for DAO internal tokens.
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
        uint256 requestAmount,
        bytes memory data
    ) external reimbursable(dao) {c_0xba14ab71(0x2718fe28f5144a73a08b0abdb24b403259e8040e705c877bdbee9f3273f9d211); /* function */ 

c_0xba14ab71(0x920b83aec0046bd0e5f9999209b39d7071695588ad0404c47b0dac4eac25c05d); /* line */ 
        c_0xba14ab71(0xe207e95a87032af932acee2573154062593c3a2faf7758247b2dc822148f6f62); /* requirePre */ 
c_0xba14ab71(0xd50cda2af553c1c2463cf4eb315289e83f78056c6e039589f759e5f8792189a2); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );c_0xba14ab71(0x4a4474a002edc41cf2c68377291860504be036775eacba98de3c0abae63d7a10); /* requirePost */ 

c_0xba14ab71(0xecdb94adeca616a54b6cf56551bde5db1cb29450bea92896a79fbd0d0503ce15); /* line */ 
        c_0xba14ab71(0xf55a7286e4db5fc71a9260ff113d42ad8427bc7f8b1643dd7f32990d6151a547); /* statement */ 
dao.submitProposal(proposalId);
c_0xba14ab71(0x8804ab24d169a77960da97e59cc19bb0fdd14aa46e1f696faa9aac358b3ce068); /* line */ 
        c_0xba14ab71(0x939bbe7459c6be8f227766f84eae159531df5c1f027292ae1f1ffddcc3126417); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0xba14ab71(0x988514bb39fbc42ce356ef5e7bf9c269dc2cdfd0287f3cc8881634ff5b797b05); /* line */ 
        c_0xba14ab71(0x9f6db192e4548a27eab19a9a19549a43e0fecaaa9a41dedbc942f45ccc852f0e); /* statement */ 
address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
c_0xba14ab71(0x50cf8bb7e17312cb658467734a0ad8df1ead23790636c48593e17a808c878bce); /* line */ 
        c_0xba14ab71(0xd52efcb9c9c8a48dc604afad5f48580b6dbbcfb402fb5052406e7a21d8008be7); /* statement */ 
dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
c_0xba14ab71(0xae09fcdb49a30f22015ecdad89f2a6c695f2e948d4cdc739c44cd1b1b0310f40); /* line */ 
        c_0xba14ab71(0x675dc4f4bd51aa73d91987809572d606ba8d5982a040a11d9ac41f6785e0a19a); /* statement */ 
DaoHelper.potentialNewMember(
            applicant,
            dao,
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
        );

c_0xba14ab71(0x0395a1ebb16f5cd30552bf65c101125886467cab8248bfe5e964f86d86cad9db); /* line */ 
        c_0xba14ab71(0x259da5e82d8b7cf451b348d32fccd64ede0c76823df92a0c87227a1dfd27dbe3); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);

c_0xba14ab71(0x17696f0bab717df210ae393d5270305063b3a34bb54fb2f404ec07c9fac53adc); /* line */ 
        c_0xba14ab71(0xd96c4c496d97d22ec08b596e464ae0c39674e54d462c79f95d19a7578feac551); /* statement */ 
proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            applicant,
            nftAddr,
            nftTokenId,
            requestAmount
        );
    }

    function _processProposal(DaoRegistry dao, bytes32 proposalId)
        internal
        returns (
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        )
    {c_0xba14ab71(0x28dd3701608ff8b4f37b5256593afe3619ab987d03e38f3d254cf2dddc787a2e); /* function */ 

c_0xba14ab71(0x64e03b26f25e9a718508aa0cf8dd758c53e8666fc64111fbe378554f079a2d21); /* line */ 
        c_0xba14ab71(0xe3f2d2c720f92b49e85f794619f198e0ea0bc3910151a940d308193659d1f62c); /* statement */ 
proposal = proposals[address(dao)][proposalId];
c_0xba14ab71(0x78c0bdec83115302565c31cfdfce8fb2ead2890b140e929a5de33a91ff3a9c4a); /* line */ 
        c_0xba14ab71(0xee73c226112ad9a2b03c69f0e6bd6c5f38a5a145a919352b06781bcbb24e43f1); /* requirePre */ 
c_0xba14ab71(0x6d783b721d26c41c76fd1a26bf68658dd1a1ec40db1bf9c01d8ddff32a5b4121); /* statement */ 
require(proposal.id == proposalId, "proposal does not exist");c_0xba14ab71(0x129bc3a892ef54d49b4d0662ce4ef6fda65d14001d207d00621cc9ebe15027cc); /* requirePost */ 

c_0xba14ab71(0x771533326185aaa361255ea428a51c224f9924aed4e50bcb40d8fec109092015); /* line */ 
        c_0xba14ab71(0x75a3ef182df9df9a142c4daf6a0797ec3d259837126cb3eafd1327f6b20774b6); /* requirePre */ 
c_0xba14ab71(0x1db6fa1168736d276870fb5a6f38c677ca5806a00e3797d88707312671d69c52); /* statement */ 
require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "proposal already processed"
        );c_0xba14ab71(0x570af113c16dd2a9038f054383ff3dace258eaabc6fdd55070e89d7d84a47318); /* requirePost */ 


c_0xba14ab71(0x6c14a31a859a9956d38e5f300370d39a9a38acf24451d8ab91efd6a596222fda); /* line */ 
        c_0xba14ab71(0x7c5b68e25a78a752dc6f79bdb1377c2b01835eef73a8d862b8c12f5eae0a2d59); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0xba14ab71(0x94aacc1a9e12cd78a856ccdff1961034cec046234a6eaa1d3c822600c197d12c); /* line */ 
        c_0xba14ab71(0x6b55ffc90ed44ba626b11c17e0c7d38c51ad84a474f8507c71ea2b1a94bec4af); /* requirePre */ 
c_0xba14ab71(0xd88c7cca8e63d336da5ab06b5f0f0d6875ec9e91a7b33cded4531e839ad41974); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0xba14ab71(0x69c0d4a8563abcb75560c688599c54e98fc9206fd54f5504042efcd4d32ff2f0); /* requirePost */ 


c_0xba14ab71(0x4acdb8b4dcca4aa9efbd06a35e9e1e93a35389545cd6c9d94a96ba75bf49a194); /* line */ 
        c_0xba14ab71(0x076bc5bf222c6350c960f6f228bfe4ccb7d404338ee5220e786958e82b11c8ba); /* statement */ 
voteResult = votingContract.voteResult(dao, proposalId);

c_0xba14ab71(0x5a7f0209a1f9c63a0a048f5dfd2ebb5ab32a6fd1dcae8c1d40df2be1fee60de1); /* line */ 
        c_0xba14ab71(0xb6e80beb9f90ab6494fedf30b5241b43f04fade427a1b43937fa1a4a0cecb9a1); /* statement */ 
dao.processProposal(proposalId);
        //if proposal passes and its an erc721 token - use NFT Extension
c_0xba14ab71(0xff9e644327848e45c807737888eecff81d16d1c95e92febd84635839db9b46c0); /* line */ 
        c_0xba14ab71(0x90c17ed762279eabb5901cfa2a7032b56d704b9a1f51517ada23d3b1f8520ab1); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0xba14ab71(0xc060b2e4a6a20f2cce408493a15cb08a42e266d6ac843dce4cd10211c6777712); /* branch */ 

c_0xba14ab71(0xef28cffec69e1879c2322eb59dde3c35347353826dc0f7a3da853d45d9e121eb); /* line */ 
            c_0xba14ab71(0xdbd164e46aeaa267fc19f24da625cc738cf130738617b14400a5ffdeda637c38); /* statement */ 
BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );
c_0xba14ab71(0xc1ee05064352f2ea4fe2cbc811333c55d030f223e2df9fbce6904a11a151688a); /* line */ 
            c_0xba14ab71(0x35ccaeeb0f1c6606bd82a50f9d1f9b14d73d094e08344e6fbde19c5d920b7224); /* requirePre */ 
c_0xba14ab71(0x2dd5307de659ca8cf223c5abc95f46f39bc40b20d50fb499281bb63aa49c7d23); /* statement */ 
require(
                bank.isInternalToken(DaoHelper.UNITS),
                "UNITS token is not an internal token"
            );c_0xba14ab71(0x57e17777b732afe38dfaf76cdc8849aabe2212ccd2e5d5f2ec4aa6b85ccf56d0); /* requirePost */ 


c_0xba14ab71(0xf5cc315581492a7b95da1a0e41be5289a85b189bfe24f764d517e9133ec96df8); /* line */ 
            c_0xba14ab71(0xc3419aff431cdf9964f1a6753b69b7d332d8fe6846d866079fbc4d60755d3bd2); /* statement */ 
bank.addToBalance(
                dao,
                proposal.applicant,
                DaoHelper.UNITS,
                proposal.requestAmount
            );

c_0xba14ab71(0x3cab570c68ecf3b6d8fba2bcd83544e767d63346de573feb6387ccacd9470146); /* line */ 
            c_0xba14ab71(0x3aeaa386b17ab639a8572a5c64125c71f3f1d2a7a6f1703226ff46cd6f048439); /* statement */ 
return (proposal, voteResult);
        } else {c_0xba14ab71(0x1b1e1de49479da44e9625827371d8752bfee436fb977b1bc8cdcb79788af5a7d); /* statement */ 
c_0xba14ab71(0x2d2b5fcea29d96b8ba41587999dbc8d8cce9e9780a3c4a08e47a9f615ec512b6); /* branch */ 
if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {c_0xba14ab71(0x6cf2a1d9e87dd271e63fb861c5b71ce5e635da9f5c2aeb235de93fa395354bc8); /* branch */ 

c_0xba14ab71(0x79538c614079ce49870bf3c5fbd98600254b67133517a81c664a0900cb98b537); /* line */ 
            c_0xba14ab71(0x1d00ec4c5b02069e11272fe016c0a1b5ab46b87888524ba7e5d40b75235bc85c); /* statement */ 
return (proposal, voteResult);
        } else {c_0xba14ab71(0xa620f24cf60f899a051ee4c9645f5b0424524106155e54437d450a683507b430); /* branch */ 

c_0xba14ab71(0xb3c8e9d91471a0557f49787f7f5c340229c3fd5b45e1d2469a756720279037b7); /* line */ 
            c_0xba14ab71(0x17c98fb52a2bd78037ae9ec4abf4549f2cf325e2708f4c25ca7f5c392478326e); /* statement */ 
revert("proposal has not been voted on yet");
        }}
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
    ) external override returns (bytes4) {c_0xba14ab71(0xa7a5c3a0d3f3e4cab9dedf9f33c318c1142afd854e5488c7f71b9078d9c7a60d); /* function */ 

c_0xba14ab71(0x2c8aa53ed730a2bbfe5d3dc4cf91f08aed8411668ca386c60e16276a98a92a0d); /* line */ 
        c_0xba14ab71(0x3967e3e42857a199af4866dc033d7837aa4c6482966857ffbf3cfdf1a1856739); /* statement */ 
ProcessProposal memory ppS = abi.decode(data, (ProcessProposal));
c_0xba14ab71(0xecb2a643228201bef857052cc36f3a7e4a9a7448201b71d19ae903de0adcd232); /* line */ 
        c_0xba14ab71(0xe97c50b1da9841182887568e71687336601d5879616f947b9560db9bced95cb2); /* statement */ 
ReimbursementData memory rData = ReimbursableLib.beforeExecution(
            ppS.dao
        );
c_0xba14ab71(0xe6b04df1027fe8195c54f55349cf7ce28c556253e6367a53ba15f6f2b817e0f7); /* line */ 
        c_0xba14ab71(0x6423169af5b4b57bd6aac56a028f7b11d5b46f02c5ede926d6c58a6c0fad90dd); /* statement */ 
(
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        ) = _processProposal(ppS.dao, ppS.proposalId);

c_0xba14ab71(0x5ae85dc20f8eab67038e9a4d8b0a8630628c8935b5e39ec2cf92c8afeee6204a); /* line */ 
        c_0xba14ab71(0x5c03b89d5428bd4411f7b51d9803608fe18798248eb2f3a1c077ff72f337363a); /* requirePre */ 
c_0xba14ab71(0x84b199509063d4e8a5e160f8481c6411bf1c8b0a98bf756289abf4a4827308ff); /* statement */ 
require(proposal.nftTokenId == id, "wrong NFT");c_0xba14ab71(0xbb217c0f4385c969bdfdb50c317a440fe6159d9c28cf81f85df40a25183c3950); /* requirePost */ 

c_0xba14ab71(0xcd5dc214a89d54b3c0ff92bb73d4cb7a87c627f5410a7aef402da59a2cd62d72); /* line */ 
        c_0xba14ab71(0x91184eb459acc669098911724a79b4fc30de81a1b0fb3540083d11a9dcb4925b); /* requirePre */ 
c_0xba14ab71(0xd2ad1581e045e97db5716d0e8e0f0db68183ca7aa83822ddaecad72a173f216c); /* statement */ 
require(proposal.nftAddr == msg.sender, "wrong NFT addr");c_0xba14ab71(0x6b315ff4f0211a157a421c49c582690b87ad0dbed3db0f9cd5594714cc51fb5b); /* requirePost */ 


c_0xba14ab71(0xbddc39b39f251a7d93af6dba61431d76658c5f46607b0bc8fdf87e8c159b9c89); /* line */ 
        c_0xba14ab71(0x73b7c396ef0a6f71c2fb2efb1ba309e553b8f5464c25f85b68113f3580f60c72); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0xba14ab71(0x56b0028504e0e562926802e22a241e428e7b7de662f28dfd247922e51810eea5); /* branch */ 

c_0xba14ab71(0x63a404588aa0620aaa248dc0915a2d4e0632f82304e89da3fda5e14a53db7f10); /* line */ 
            c_0xba14ab71(0x2e7d95d4777213038b1f3faedd019625b21ab9bb367fad3290fcc943f0dd83d9); /* statement */ 
address erc1155ExtAddr = ppS.dao.getExtensionAddress(
                DaoHelper.ERC1155_EXT
            );

c_0xba14ab71(0x70a5f9eff68e5ed06c995606e5bbcf33bdca0622a4e84f465a0ff2e01cccab0b); /* line */ 
            c_0xba14ab71(0x2c641d940d842d2fa0a8e0e57f24e378b859c353c8bb5af98a6692d604ebf145); /* statement */ 
IERC1155 erc1155 = IERC1155(msg.sender);
c_0xba14ab71(0xa23ff65c706d8f0b0a270525c83a0e1115c93e5f492eb77924e4e61f351ec541); /* line */ 
            c_0xba14ab71(0x795866c850e5d97c5e7959e9c801e0e83ab3ba0a14a4595a85b73015ad7f6ab4); /* statement */ 
erc1155.safeTransferFrom(
                address(this),
                erc1155ExtAddr,
                id,
                value,
                ""
            );
        } else {c_0xba14ab71(0x435f18e34667d41e9d9c9eb02ef518173b951e7a2857ade2db19ada3b6d11df9); /* branch */ 

c_0xba14ab71(0xa229d5557cb8933e815e577f68832ff207e49ee5157c445687c2c6b63b498639); /* line */ 
            c_0xba14ab71(0x81aafc0b9c55d2ef8918a847e5f9cab86bda0c84f4370b626025b291eadc60cd); /* statement */ 
IERC1155 erc1155 = IERC1155(msg.sender);
c_0xba14ab71(0xdb8ef933cb5fcf8bc6a8a7b31acef49f3f29c0ed343a6fa632044ed32b3b2fa3); /* line */ 
            c_0xba14ab71(0x0f58841302a764f21c69d35ff8f5e05907a500b710897338ab88bf6300422660); /* statement */ 
erc1155.safeTransferFrom(address(this), from, id, value, "");
        }

c_0xba14ab71(0xe9a2ba90b2fd4bc3eb47246992533dca36e277ddc5a4ecd99bf90b7a1d78eda0); /* line */ 
        c_0xba14ab71(0x798c05931dfe396aae3d98dfdaf4e208f2c72616ed937088e62a056013c1453e); /* statement */ 
ReimbursableLib.afterExecution2(ppS.dao, rData, payable(from));
c_0xba14ab71(0x53523425ed424adc73af0bc1697e8ca484e57f057581ffbaa9e4e15111607990); /* line */ 
        c_0xba14ab71(0x83ff2be9f867e70ee7a2681422309f7afa3f1ab958bb6fa35d9441f291da81b8); /* statement */ 
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
    ) external pure override returns (bytes4) {c_0xba14ab71(0xcfad6fc980d29952a1eac8e0208c29e58b01e353832a01122c8a790d338e8c2e); /* function */ 

c_0xba14ab71(0x2164d5c04dfc2f2d141ddbabf32dc182329fa770e63cba4dc8e58a7c3b983340); /* line */ 
        c_0xba14ab71(0x7bd409fc1dca3c472646b26cba7714105a179779328aaed82e547246ce4722a7); /* statement */ 
revert("not supported");
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
    {c_0xba14ab71(0x23e5281e4f62940637e821f8aca20b0318d3294cee374ce514bda295c4cb4c26); /* function */ 

c_0xba14ab71(0x42540ed0f8c6877ff646a72f5cdc6748ba610aac57d6efb96f62c6b45c0b0a59); /* line */ 
        c_0xba14ab71(0xd7cbd73acf5953a83173f68e35897665adba732dd9c9c59f26efcd1ce3e250fe); /* statement */ 
return
            interfaceID == this.supportsInterface.selector ||
            interfaceID == this.onERC1155Received.selector ||
            interfaceID == this.onERC721Received.selector;
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {c_0xba14ab71(0x4baf63b9b88611a1198e005270e67636b476f76ba67589bdacf67205d6d503c2); /* function */ 

c_0xba14ab71(0x6486a16a9b7517d4b24d96ab2a9eeafde223e65d0f6a5661f5051bfef7569e43); /* line */ 
        c_0xba14ab71(0x9797ade4cf71404c067f1da15ec9b8b710d4128e702fe413799a3ed2546eec22); /* statement */ 
ProcessProposal memory ppS = abi.decode(data, (ProcessProposal));
c_0xba14ab71(0x7b73dee16678b158ef10658ecda6865c1fb6d646787977adc790e9d7971e3647); /* line */ 
        c_0xba14ab71(0x68712244da0a4a30d12fd33bf252a08693a3ab717483916c75d384af06364c7e); /* statement */ 
ReimbursementData memory rData = ReimbursableLib.beforeExecution(
            ppS.dao
        );

c_0xba14ab71(0x42f6104dd8cf4bcda9a8d1144e8fa6d836ba74b7dc8592470c4050cdf5f4d949); /* line */ 
        c_0xba14ab71(0xc68990f5676c9a1f3ef2cf9b4eb8fc2c66acf504c1ad06e047788ce1c0b9d3cf); /* statement */ 
(
            ProposalDetails storage proposal,
            IVoting.VotingState voteResult
        ) = _processProposal(ppS.dao, ppS.proposalId);

c_0xba14ab71(0x5c361497a3e683ed39fe85c0afaf48e1422e74ad64eeb1d4122e7fa833999e5d); /* line */ 
        c_0xba14ab71(0x84a55e7b9ff8ad5401aaf99c9a6749b18a8da4e05a11bae6516c47dfb2c7b8dc); /* requirePre */ 
c_0xba14ab71(0x62b80f975f4a534502dee86187630f5f65c049e068b6d697c2af75c5f387a9bd); /* statement */ 
require(proposal.nftTokenId == tokenId, "wrong NFT");c_0xba14ab71(0xe58ffaa883db66f5fc1f3f7eef782d571a5b68ffffc066379963d04b58cc1b76); /* requirePost */ 

c_0xba14ab71(0xb282d6e67d93ed92ff851367ec396c3c5e8423b25a45e1fc73000ed23cab9eb1); /* line */ 
        c_0xba14ab71(0x13915301417ccce7846b39a5fbf1b71417d38fc9182461221d3fccf1f2c827ff); /* requirePre */ 
c_0xba14ab71(0x8157b55ef5c9e718c6250badfdc99ec9b0c06ab0efe31e3b0ac2a386400a81cd); /* statement */ 
require(proposal.nftAddr == msg.sender, "wrong NFT addr");c_0xba14ab71(0x9d122fa0fa3e5aa65219fa89d602399a698aa9ce4eb611ded427bf7026824fc5); /* requirePost */ 

c_0xba14ab71(0x368d60e18b02b9ca70ba1e0e3834289c5aae9a48fa6dd24c2a72e4de4275168c); /* line */ 
        c_0xba14ab71(0x1e655c31d734548ef3295d9c6f1f718c889505cda0becd94c9bb5d264578195f); /* statement */ 
IERC721 erc721 = IERC721(msg.sender);
        //if proposal passes and its an erc721 token - use NFT Extension
c_0xba14ab71(0xa22fa425035d6f0ce31ca98a5155681fea8c544f990a285942a661cc42a0d3df); /* line */ 
        c_0xba14ab71(0x344041922996ef8edd699ebd1528c63f6f4e2b06cf6d6bb4e916c649409101a3); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0xba14ab71(0xbf8fb927c8f627813a77c7c873e9accb82a2e9d4da2af425664e8147131e5ba9); /* branch */ 

c_0xba14ab71(0x649ad52e435da2f0d937465af8bb04f9893a168ff36503c91442d3750dd7c827); /* line */ 
            c_0xba14ab71(0x3bd3c531a25e8696ccb33a954d546d3c7b78b993a9b3939969ce6eabb5d33e2f); /* statement */ 
NFTExtension nftExt = NFTExtension(
                ppS.dao.getExtensionAddress(DaoHelper.NFT)
            );
c_0xba14ab71(0x8af09e0d294b141289c328133962fa8a52331a1194a4ae9dfc72b667089c68c1); /* line */ 
            c_0xba14ab71(0xe862c76e48fef5f95ffc31bffca2c74730acd986349488238253d696f6a1658d); /* statement */ 
erc721.approve(address(nftExt), proposal.nftTokenId);

c_0xba14ab71(0x4b3da741b4750525a6714771829faa303a35b990074b1d4fba0d520b1ecfea69); /* line */ 
            c_0xba14ab71(0x54b82b67249ee5c30bc80db5c12c93f6c0bc12dd81a104e508245e20b81652a2); /* statement */ 
nftExt.collect(ppS.dao, proposal.nftAddr, proposal.nftTokenId);
        } else {c_0xba14ab71(0xb6155fd7819d01087af20839b36dd3d6d0f891643c79aaa4736f04a1159f5d68); /* branch */ 

c_0xba14ab71(0xd27bb6c4f26a4929119ce3b9aaebaffcc6fbe90156a82bd9d2b1ba67e8feabef); /* line */ 
            c_0xba14ab71(0xaab616d73566b45f13f4a4f9fa55b4611bddf40ba58b01cfe7d1208b8df9eef9); /* statement */ 
erc721.safeTransferFrom(address(this), from, tokenId);
        }

c_0xba14ab71(0x76b2e9f86c510d2115999d5cadadee9c254516b045d23b26811cca42413db53e); /* line */ 
        c_0xba14ab71(0xf452e0a40fb4aa542a9e9dcbc824b903e2ea81dc90b80c383f7a586652c154cb); /* statement */ 
ReimbursableLib.afterExecution2(ppS.dao, rData, payable(from));
c_0xba14ab71(0x62af8527954f0b983ff21a79753ec3c5e7549a31c06826c50a088444ec9d4f73); /* line */ 
        c_0xba14ab71(0xa3e4592cfa0445e29d287096197c481c789a85d10605fde11f6096b1de3d2a15); /* statement */ 
return this.onERC721Received.selector;
    }
}
