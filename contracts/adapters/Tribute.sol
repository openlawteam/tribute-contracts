pragma solidity ^0.8.0;
function c_0x23cab5f5(bytes32 c__0x23cab5f5) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../helpers/DaoHelper.sol";
import "../adapters/interfaces/IVoting.sol";
import "./modifiers/Reimbursable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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

contract TributeContract is Reimbursable, AdapterGuard {
function c_0xeafe9746(bytes32 c__0xeafe9746) public pure {}

    using Address for address;
    using SafeERC20 for IERC20;

    struct ProposalDetails {
        // The proposal id.
        bytes32 id;
        // The applicant address (who will receive the DAO internal tokens and
        // become a member; this address may be different than the actual owner
        // of the ERC-20 tokens being provided as tribute).
        address applicant;
        // The address of the DAO internal token to be minted to the applicant.
        address tokenToMint;
        // The amount requested of DAO internal tokens.
        uint256 requestAmount;
        // The address of the ERC-20 tokens that will be transferred to the DAO
        // in exchange for DAO internal tokens.
        address token;
        // The amount of tribute tokens.
        uint256 tributeAmount;
        // The owner of the ERC-20 tokens being provided as tribute.
        address tributeTokenOwner;
    }

    // Keeps track of all tribute proposals handled by each DAO.
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;

    /**
     * @notice Configures the adapter for a particular DAO.
     * @notice Registers the DAO internal token with the DAO Bank.
     * @dev Only adapters registered to the DAO can execute the function call (or if the DAO is in creation mode).
     * @dev A DAO Bank extension must exist and be configured with proper access for this adapter.
     * @param dao The DAO address.
     * @param tokenAddrToMint The internal token address to be registered with the DAO Bank.
     */
    function configureDao(DaoRegistry dao, address tokenAddrToMint)
        external
        onlyAdapter(dao)
    {c_0xeafe9746(0x6dad94a04925de844a5ca9e9e36da56091d2d76ef86ad22ffbc7c30230af991e); /* function */ 

c_0xeafe9746(0x4bff024f8ad578303a83a227e014050936b89f1f057b7132896be60e754c77c9); /* line */ 
        c_0xeafe9746(0x53e454aa77f38d084f54da1737e44538658efaaf50a63bc143ebb822e94f1099); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xeafe9746(0x32891a2f2710cede925c970b98c020cf498883929c84ecc131dc192a63ac6e5c); /* line */ 
        c_0xeafe9746(0xb41a2beef9bb5a917ec64cfb13139f52a6c6e7c1b209046925bb88af5ede9dc1); /* statement */ 
bank.registerPotentialNewInternalToken(dao, tokenAddrToMint);
    }

    /**
     * @notice Creates and sponsors a tribute proposal to start the voting process.
     * @dev Applicant address must not be reserved.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param tokenToMint The address of the DAO internal token to be minted to the applicant.
     * @param requestAmount The amount requested of DAO internal tokens.
     * @param tokenAddr The address of the ERC-20 tokens that will be transferred to the DAO in exchange for DAO internal tokens.
     * @param tributeAmount The amount of tribute tokens.
     * @param tributeTokenOwner The owner of the ERC-20 tokens being provided as tribute.
     * @param data Additional information related to the tribute proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address applicant,
        address tokenToMint,
        uint256 requestAmount,
        address tokenAddr,
        uint256 tributeAmount,
        address tributeTokenOwner,
        bytes memory data
    ) external reimbursable(dao) {c_0xeafe9746(0x97517327a354458152a259826e28ec62b862287403ea3d793e6bf9094b7f6487); /* function */ 

c_0xeafe9746(0x5d4d4f7d9493dcd59ced4c3d8e8f563c71aaf265ae0bb6802e65e2b0339aae7c); /* line */ 
        c_0xeafe9746(0xc5d4b93ce27fe5d4200680ac798cfae05fd8c817886ecb7ad325b73fadc9fcd8); /* requirePre */ 
c_0xeafe9746(0x977940b9856c627df86e0030e4e55890a9e4b44fe64a30ecf2e50e05be0bf45b); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );c_0xeafe9746(0x4c799a8ffa281a87fb4fa61cdcb60d2141d8a52a949b2f03cafb1a4a8dea81ce); /* requirePost */ 


c_0xeafe9746(0x048587d27bf86462006960ca3e0b2a115c6d50779fe5216d393f654feeda92e9); /* line */ 
        c_0xeafe9746(0x73a0d294b4093802c27c9de802c933561ed9b755a5657727de7da2bf9a3ce77b); /* statement */ 
dao.submitProposal(proposalId);
c_0xeafe9746(0x7cd1177290598da7f4c3e710a933d3e3fe79f3e19e5750ec773165526548e695); /* line */ 
        c_0xeafe9746(0x6d48cc5ab143178a68b05bade5831ca97ffe9e33bff1df4d8c32034082a50ef3); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0xeafe9746(0x3290721ccf8ac6d6edd3c294a0907e49620df594e62837f5814648a117553736); /* line */ 
        c_0xeafe9746(0xcce546f99eb8cde2e3b84157471ca1df61376a590acddab2b9eca67080929920); /* statement */ 
address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );

c_0xeafe9746(0x30a4e686d0bde656540a5b9bf08a3f49c840a1ebb310dbf25274342458a9011d); /* line */ 
        c_0xeafe9746(0x6bc3207f5011f4a5bc9026699162672b52677c97db8cb7300e1d17b4b9cb5193); /* statement */ 
dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
c_0xeafe9746(0x76483f0bca5d60528b229da421dbf022db0c869afdb7c392dc05f0f701831098); /* line */ 
        c_0xeafe9746(0x3982ed687f428d1d169ab285d371ed5d2c17aaaba7d98156721c102f544e2526); /* statement */ 
DaoHelper.potentialNewMember(
            applicant,
            dao,
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
        );

c_0xeafe9746(0x2cb7cc27950cbe8eda2e54ecc3ade396fe8609eb59f49292eceb8fd0c56006e6); /* line */ 
        c_0xeafe9746(0xe9c00d610a359b0ab11ba480f901fb29033e39eae7d2043a5d9fe082e7005275); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);

c_0xeafe9746(0x63ac7abc10620888754286acfb8c70dd4d4c464e3e4bc357976125f5af33aa3c); /* line */ 
        c_0xeafe9746(0xd91e9cc70cd152d0f46b0daff19ada6d4deae330c6328cf3a697ca95006b5df4); /* statement */ 
proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            applicant,
            tokenToMint,
            requestAmount,
            tokenAddr,
            tributeAmount,
            tributeTokenOwner
        );
    }

    /**
     * @notice Processes a tribute proposal to handle minting and exchange of DAO internal tokens for tribute tokens (passed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @dev The owner of the ERC-20 tokens provided as tribute must first separately `approve` the adapter as spender of those tokens (so the tokens can be transferred for a passed vote).
     * @dev ERC-20 tribute tokens must be registered with the DAO Bank (a passed proposal will check and register the token if needed).
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        reimbursable(dao)
    {c_0xeafe9746(0x09e5992a24a64a6b71b7980654b085cc53c79f2cb3c32e5b27d01bf342471efb); /* function */ 

c_0xeafe9746(0xb950a9e9e0bf6bf1099be82baa8870a8cf9e69be6176ad25df96658af6bce117); /* line */ 
        c_0xeafe9746(0x15002a521726bcda17b30714692ea878306931fb313c3aea76300cf7d2affd1c); /* statement */ 
ProposalDetails memory proposal = proposals[address(dao)][proposalId];
c_0xeafe9746(0x2d17662ba5e94da7c3a85e42e6533a2ca0c6074f6ab683f88e8b85c4cd57ff48); /* line */ 
        c_0xeafe9746(0x1bf3381406ea8ccc7251ba74fd5fd6679fa930add3a65550f22baf448db7a3af); /* requirePre */ 
c_0xeafe9746(0x068935c2009ab637675dcd82b413862694008e3ec17e47f4f81cf506b3ad16a9); /* statement */ 
require(proposal.id == proposalId, "proposal does not exist");c_0xeafe9746(0xf6894f449c8f6a10a0ca8d5458bc898bdecea9fc82dad7a36233db6d1e71f94f); /* requirePost */ 

c_0xeafe9746(0x27b0cc7bd4fcba7e82626544f6e21a7c497218edcc67ff253e8908b0797128d6); /* line */ 
        c_0xeafe9746(0x6b610691b4f6d11d3a02c7c450d89fad6bef4363ad97e699b95ba4f6272774a5); /* requirePre */ 
c_0xeafe9746(0xfbb1c68f570deaad58d176cdead12e4e2bc3acf0f610cf7bae3845b185567c4b); /* statement */ 
require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "proposal already processed"
        );c_0xeafe9746(0x766140f2e02ead3841823b61d9459b36e249bd9b6bfe73fe8e0247652465037f); /* requirePost */ 


c_0xeafe9746(0x1574bbfdc778939ab8768993d6f5898359d6404682ed3d63c1df2d370f85b8f4); /* line */ 
        c_0xeafe9746(0xe79210d332691eff7066557fab3fcf025b947ed7e5ae65d2020ebccb84a679af); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0xeafe9746(0xc03f554323a5b4664e904df2d07cf656501b3d7b38cd1d12f3c6b903077c31ef); /* line */ 
        c_0xeafe9746(0x5284554cc66c5710e4b4b6b10961b46761c2d2308250d65f592f2f7ea749e1fa); /* requirePre */ 
c_0xeafe9746(0xa546fdab0ffaae880c265774b16bbf9418e75fae20a69608281b1d9dc26bea65); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0xeafe9746(0xc2252bcfca20b79343503873a30074e40c96406474eaab431d996965b283d76c); /* requirePost */ 


c_0xeafe9746(0xa4bde23c5de0f7bac640870251069c41e618ba41ec99caf39a08a578eb72a7d3); /* line */ 
        c_0xeafe9746(0x9edb169ae8b759f50c9ca9ca5068886d39c60829ca358c0d3f81555b11235d54); /* statement */ 
IVoting.VotingState voteResult = votingContract.voteResult(
            dao,
            proposalId
        );

c_0xeafe9746(0xd5a1990e80c9e72a06457affc83176276b77614afb1fac14c2d026442ef39e7c); /* line */ 
        c_0xeafe9746(0x5f4fb71ba50a998607c4e760c52e40b1312b90e6750b2d3fb5fd40ad51b56eb1); /* statement */ 
dao.processProposal(proposalId);

c_0xeafe9746(0x8f733169540a9a16cf1fff926f29f620f9c61f0fa9b2316882ba9868063e47bd); /* line */ 
        c_0xeafe9746(0x3660d9dd785bd09cffabfd4edf9e9ec88048e0da917fd58a6fd2584ae871354a); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0xeafe9746(0x565dfb699804835fc9203df098f38a28c494c5efc10212e0910a5a29b2498ace); /* branch */ 

c_0xeafe9746(0x6b468555f9624a68fa3a74373ff98d1866c3852871a497af4589c5a79895426b); /* line */ 
            c_0xeafe9746(0x4a3926e2d80458881d94c2d9e5f874cf4e5f81fba93830690cf921177fe5932d); /* statement */ 
BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );
c_0xeafe9746(0x5d3f81333cf7ed494e0b02cd3add79634f645390f0af5df1c72fe04255a67cc7); /* line */ 
            c_0xeafe9746(0x9c90140fd1505b31db406b5a826ada93e84891b28f16c36e3ae2caa88884b1f1); /* statement */ 
address tokenToMint = proposal.tokenToMint;
c_0xeafe9746(0xdc3370ade13801321108de100d6e8f2a0843712ceed189fb5d9bbc8f16f70650); /* line */ 
            c_0xeafe9746(0xb98e4021995aac08077530f639755a7eee43d09883e03541b4cc4ee153ff9655); /* statement */ 
address applicant = proposal.applicant;
c_0xeafe9746(0x5eef1d9c759b236b6638a796a80a9c6c08ed51a33bcf2be99d24b8bff2d755f7); /* line */ 
            c_0xeafe9746(0x0846c20791f6ca685c99c37339842969160ce771897cd7dda5079c3ff1a2feb5); /* statement */ 
uint256 tributeAmount = proposal.tributeAmount;
c_0xeafe9746(0x364a98a0043a06444451db984bd36f4427ed90c59a526be3057b57e0636b6903); /* line */ 
            c_0xeafe9746(0xad2b5efdab0a3d26fe1bce1d366addfcb2c863d69dc193de0b59a46d53ff87a3); /* statement */ 
address tributeTokenOwner = proposal.tributeTokenOwner;
c_0xeafe9746(0x1eb2b9d027dd8eaecdf22f436c4a4656f9a40b902a0f7f59c4e95985e2ea7fca); /* line */ 
            c_0xeafe9746(0x6df0f5e08828f6a420a06ef36ec9b608a799356897d5cd22cc83a43eaf590600); /* requirePre */ 
c_0xeafe9746(0x1269e4b75d6f0a81dfcf5e6beccb14011931e7e25cb6f22a3e9bf9f1c4e05b3e); /* statement */ 
require(
                bank.isInternalToken(tokenToMint),
                "it can only mint internal tokens"
            );c_0xeafe9746(0x71f15d58f3462fb7c4818fe2d8cb8d87932f69f935d1723b7595ccc6d9b31626); /* requirePost */ 


c_0xeafe9746(0xbb7ff7842aa32f80ddc24bc3d4001b0d860335dfd1f3910f1b59304659cc363d); /* line */ 
            c_0xeafe9746(0x1826337bf478b68e8cf4e1ae152d7117785ab5b2e94ae97716b256a2b40f8e6f); /* statement */ 
if (!bank.isTokenAllowed(proposal.token)) {c_0xeafe9746(0x29251d84b02d638a6e0cc6dee97234cc0efaade2c04c5fadeb6068f886652a01); /* branch */ 

c_0xeafe9746(0x08699bc3609b6c9237aa0377dde26543b6d1e9f0a1a951a3fa955041ea128fde); /* line */ 
                c_0xeafe9746(0x1aa738d5ecfa6b4a2335750f129210296bdec6e281cd1a9db3dd60da59eac345); /* statement */ 
bank.registerPotentialNewToken(dao, proposal.token);
            }else { c_0xeafe9746(0x7ce16b7d7258900390ddc1c3c3188c5dca104a31752d462cd058d1a3bca00f15); /* branch */ 
}
c_0xeafe9746(0x46f18fcf43f6ab44a3b6159a643a57ad70b9707c034667d3140cdbbdc12e0afc); /* line */ 
            c_0xeafe9746(0x938f51a25e31f81497372cd1ccff2e9bfc4114ced6a7c7d7dcc52dd55bf19441); /* statement */ 
IERC20 erc20 = IERC20(proposal.token);
c_0xeafe9746(0x06c4e9d966ac026d85b7a331d8f9b1859a495993f22eb6a1ccc78e8e153accb6); /* line */ 
            c_0xeafe9746(0xf8ea81483defabf6da9a670bb3b702e38f46f1ae5b1d98ae3e7ee85cedafa282); /* statement */ 
erc20.safeTransferFrom(
                tributeTokenOwner,
                address(bank),
                tributeAmount
            );

c_0xeafe9746(0x9b7d55b26f11b0d8b27524e0a8d2f1600dd74adb23291892a8e51cd8bc9c4a5e); /* line */ 
            c_0xeafe9746(0xa2e6316490c6f46bf8ba5d3846bfcc1cb615eb454995af4d8e595d43711c814d); /* statement */ 
bank.addToBalance(
                dao,
                applicant,
                tokenToMint,
                proposal.requestAmount
            );
c_0xeafe9746(0xa86d040d4974a045e1c9a92f28b8e708b3b1155c9a4daabb1fea4ac4c178bad1); /* line */ 
            c_0xeafe9746(0x66cb11d7af4526c4d18882706f60a4267c58ee9c052fa1268ee882cac3edce9c); /* statement */ 
bank.addToBalance(
                dao,
                DaoHelper.GUILD,
                proposal.token,
                tributeAmount
            );
        } else {c_0xeafe9746(0xf23048b7f7f386ce8a6ee835362837670a7f1c05449a7d7335d4bdbc89962f6c); /* statement */ 
c_0xeafe9746(0x5c27dde8752617c42de93eae820915bf85a717e270ab4091ebef5b873f985fd7); /* branch */ 
if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {c_0xeafe9746(0x903d2db324f7e284f60028b2361a1f136a014f1048acff04868135d920b91b0f); /* branch */ 

            //do nothing
        } else {c_0xeafe9746(0x8438338cdc6c00a85c867634e7264ec4bdc4a4b583d48ebb6ff35e398ddeb62b); /* branch */ 

c_0xeafe9746(0xae12d66f765fee4c849834c02ccb3247633ad597216ad06da2adc570428b1574); /* line */ 
            c_0xeafe9746(0xebbb9e718b8c83ef1b87625bf257f2ad717eb39ad6ccc3579f09b1bfffacc3fe); /* statement */ 
revert("proposal has not been voted on yet");
        }}
    }
}
