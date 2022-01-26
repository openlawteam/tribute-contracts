pragma solidity ^0.8.0;
function c_0xa11e6152(bytes32 c__0xa11e6152) pure {}


// SPDX-License-Identifier: MIT

import "../core/DaoRegistry.sol";
import "../guards/AdapterGuard.sol";
import "./modifiers/Reimbursable.sol";
import "../adapters/interfaces/IVoting.sol";
import "../adapters/interfaces/IDistribute.sol";
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

contract DistributeContract is IDistribute, AdapterGuard, Reimbursable {
function c_0xee961af5(bytes32 c__0xee961af5) public pure {}

    // Event to indicate the distribution process has been completed
    // if the unitHolder address is 0x0, then the amount were distributed to all members of the DAO.
    event Distributed(
        address daoAddress,
        address token,
        uint256 amount,
        address unitHolder
    );

    // The distribution status
    enum DistributionStatus {
        NOT_STARTED,
        IN_PROGRESS,
        DONE,
        FAILED
    }

    // State of the distribution proposal
    struct Distribution {
        // The distribution token in which the members should receive the funds. Must be supported by the DAO.
        address token;
        // The amount to distribute.
        uint256 amount;
        // The unit holder address that will receive the funds. If 0x0, the funds will be distributed to all members of the DAO.
        address unitHolderAddr;
        // The distribution status.
        DistributionStatus status;
        // Current iteration index to control the cached for-loop.
        uint256 currentIndex;
        // The block number in which the proposal has been created.
        uint256 blockNumber;
    }

    // Keeps track of all the distributions executed per DAO.
    mapping(address => mapping(bytes32 => Distribution)) public distributions;

    // Keeps track of the latest ongoing distribution proposal per DAO to ensure only 1 proposal can be processed at a time.
    mapping(address => bytes32) public ongoingDistributions;

    /**
     * @notice Creates a distribution proposal for one or all members of the DAO, opens it for voting, and sponsors it.
     * @dev Only tokens that are allowed by the Bank are accepted.
     * @dev If the unitHolderAddr is 0x0, then the funds will be distributed to all members of the DAO.
     * @dev Proposal ids can not be reused.
     * @dev The amount must be greater than zero.
     * @param dao The dao address.
     * @param proposalId The distribution proposal id.
     * @param unitHolderAddr The member address that should receive the funds, if 0x0, the funds will be distributed to all members of the DAO.
     * @param token The distribution token in which the members should receive the funds. Must be supported by the DAO.
     * @param amount The amount to distribute.
     * @param data Additional information related to the distribution proposal.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address unitHolderAddr,
        address token,
        uint256 amount,
        bytes calldata data
    ) external override reimbursable(dao) {c_0xee961af5(0xbf8398357234070d8bbd8a71c607d11d6bd0c56053423b1aba5269a08700cd89); /* function */ 

c_0xee961af5(0xb91b040a94ebbe2b6ad98a2f01c4164e0601bd799bd0298ccb0ded4e0f9c6612); /* line */ 
        c_0xee961af5(0x9d372001ac84beb82dbc53b0d9c9721f2326ab8bfde10ed13340c52ded66baf3); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0xee961af5(0x7240b75c86267e0e7f40e4d73dc9e3a4c90bda2c1c80026881200c0f00d13e59); /* line */ 
        c_0xee961af5(0x54af71819c69abf53f1a20a363c21734329ead61d0c78c229ef026c6d73c4967); /* statement */ 
address submittedBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );

c_0xee961af5(0x72e4f9f8d513ad5ccf27376c12f2c8536a16ca1b1dbe4e94f6594efe1305759f); /* line */ 
        c_0xee961af5(0x35dddfea027d6ce5ca73e2781489914c090cbd74c33fcb09625eda87ac42c6af); /* requirePre */ 
c_0xee961af5(0x8299f0d060e9a9105271f11823e8bf9d95a668ffc46e5298f5efab8a66b8ef87); /* statement */ 
require(amount > 0, "invalid amount");c_0xee961af5(0x11b46e3b4fb4c3e64562ea9d8d35eac699d2b5c889012730d0a931c1d717381d); /* requirePost */ 


        // Creates the distribution proposal.
c_0xee961af5(0x67c3ccdcac7182ada99621ab8945743c8cba8df2f2b5d6a8c4d79eb8d31b13fc); /* line */ 
        c_0xee961af5(0xd29d39a65b948b64d0c77c00965e378d37bacf2cd98459a56e81947d83980645); /* statement */ 
dao.submitProposal(proposalId);

c_0xee961af5(0xfdcfedbfab930c1948ed66580f37c30b4faecc5403bd233033abbcc61f08fc32); /* line */ 
        c_0xee961af5(0xab775c1c759959d7d7f140ceb8c40199606236612e91badf81cea00fe25ca5c5); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xee961af5(0x73222f25bc30938752d87c62eed75337677223478215a0a9d78647ad77a1a1d1); /* line */ 
        c_0xee961af5(0xc85b16ed6940b0ae6230a598d099e67cb1abc94e164d13fcfff0d91db3d077fa); /* requirePre */ 
c_0xee961af5(0x44bdf5e10af20e9eda517ee6842a2b8b7a19eaabd1e742c8f86e30d4f3a2abde); /* statement */ 
require(bank.isTokenAllowed(token), "token not allowed");c_0xee961af5(0x7be6c99f4037a4ff84aaa603f5cdf5642714bc133122a874c25505816421d648); /* requirePost */ 


        // Only check the number of units if there is a valid unit holder address.
c_0xee961af5(0xb63b16abdeff68f9ebc2548042db6853ea70b3cf868cb34b58fe8aa9747fd9ed); /* line */ 
        c_0xee961af5(0xa483755fa0265962d8848899f9ff5fb5aebbcdd55f0dc9e807794ca0004b233b); /* statement */ 
if (unitHolderAddr != address(0x0)) {c_0xee961af5(0x3ccadb36cbbd643199ea9886d306d082b6e806a8d1fdca6984843c1f2e228791); /* branch */ 

            // Gets the number of units of the member
c_0xee961af5(0xc6b9aefee6840a20a8083912ca6463da5609d24941e2383f4b2c22f7b619547c); /* line */ 
            c_0xee961af5(0x83e90c0a0594bc9454abd2c0a3c369daaec0e482df4c427e6a562971f7109cac); /* statement */ 
uint256 units = bank.balanceOf(unitHolderAddr, DaoHelper.UNITS);
            // Checks if the member has enough units to reveice the funds.
c_0xee961af5(0x1d0243991c3d6b69a90ea57754d271feecede92dd018acf42260815757c30d60); /* line */ 
            c_0xee961af5(0xe6d4e3ee440d8a19254b0f045978995c3d94193def1e217d09eb3e7366bb44a8); /* requirePre */ 
c_0xee961af5(0x9d9c8455e00096e2643df3c5ee7c019c7078a31b5cc722c074eb56c318d01185); /* statement */ 
require(units > 0, "not enough units");c_0xee961af5(0x89e2d7d03859ab4cbb303e8082ae8487053c6269efa12c1038fa8c0bc5c4dd4a); /* requirePost */ 

        }else { c_0xee961af5(0x58722545b232c47d7038f418e88c8fff9d6b5cab48186ab15fbf2a4474be2e73); /* branch */ 
}

        // Saves the state of the proposal.
c_0xee961af5(0xbf3064fdd0ad875f51e8714d559cd78aa2cc6173687266e3d51aadcf08643176); /* line */ 
        c_0xee961af5(0x66128be4d936dcce2a617c79978423ba67b919b882097a51f2e133598ab8ab48); /* statement */ 
distributions[address(dao)][proposalId] = Distribution(
            token,
            amount,
            unitHolderAddr,
            DistributionStatus.NOT_STARTED,
            0,
            block.number
        );

        // Starts the voting process for the proposal.
c_0xee961af5(0xdcc8a15eeff99fb38e46344cf3c5e260ba4d49b035d2d9bd7ea18a71da3324c4); /* line */ 
        c_0xee961af5(0x2ed040a2c5188ae9ae4c6932256f39b760834a9c9ae6fc09cc292b761ec24bff); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);

        // Sponsors the proposal.
c_0xee961af5(0x139c79fddc6a5bf405f29448b6ff9943e9530dd71bcbcffe4c4905b321ed1281); /* line */ 
        c_0xee961af5(0x0b4520a3bc7c0802f681e366483aa6367ecb9333a32d9ca95f290cd4d32ec341); /* statement */ 
dao.sponsorProposal(proposalId, submittedBy, address(votingContract));
    }

    /**
     * @notice Process the distribution proposal, calculates the fair amount of funds to distribute to the members based on the units holdings.
     * @dev A distribution proposal proposal must be in progress.
     * @dev Only one proposal per DAO can be executed at time.
     * @dev Only active members can receive funds.
     * @dev Only proposals that passed the voting can be set to In Progress status.
     * @param dao The dao address.
     * @param proposalId The distribution proposal id.
     */
    // The function is protected against reentrancy with the reentrancyGuard
    // Which prevents concurrent modifications in the DAO registry.
    //slither-disable-next-line reentrancy-no-eth
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        reimbursable(dao)
    {c_0xee961af5(0xfd43714878f924b8ee9f9c957d68a1e0734afd2cf991f73cdc76f0d5218546f0); /* function */ 

c_0xee961af5(0xdf2350e2a978d15c60169239efb6683cf61c773c7af270a3f8806e5bbcec454b); /* line */ 
        c_0xee961af5(0xb007a5db60df714639e4d30ba8fc56684709dde4e9f9a1a1920b61cb33a5e235); /* statement */ 
dao.processProposal(proposalId);

        // Checks if the proposal exists or is not in progress yet.
c_0xee961af5(0x175d4b000d7f5c671eb1f04ae3ac3ade08b9bacd8cc5dd3e284a203c52269903); /* line */ 
        c_0xee961af5(0xaba0f86960cc5937b312742a6377e76276952fdf754c7629e5a69c5efa21c931); /* statement */ 
Distribution storage distribution = distributions[address(dao)][
            proposalId
        ];
c_0xee961af5(0x157c97756f424368337b57341f8ed827ab1f46b281ba57b6fdab41632dfc9b85); /* line */ 
        c_0xee961af5(0xda97020031f3a0338ddfd0d965e879f2dbb6769c0a29c102a0ac7e190c509f57); /* requirePre */ 
c_0xee961af5(0x10fa2efd4831e3a3927b1ff6a694c06eaf9569f3246459eab74d34b543671602); /* statement */ 
require(
            distribution.status == DistributionStatus.NOT_STARTED,
            "proposal already completed or in progress"
        );c_0xee961af5(0x4aba39c1f739483bc2224e85776d0158f9422f8c1e9d2a81388bdaee33f624ba); /* requirePost */ 


        // Checks if there is an ongoing proposal, only one proposal can be executed at time.
c_0xee961af5(0xe94798b7c5b25fa69488c1230d63c3181e51bcbbb4d4d7541d432ed86824eeab); /* line */ 
        c_0xee961af5(0x9e8d2aeb0eeeff838cb6206d9889f32c84fed7de71fa95bffa71221901d56193); /* statement */ 
bytes32 ongoingProposalId = ongoingDistributions[address(dao)];
c_0xee961af5(0xc7927d2635c3bb730dacc827bea18463ffe53d9e306ac6628b2dafe0d9059327); /* line */ 
        c_0xee961af5(0xf93941340e56c6c1dbc72356b4caeff5c92031f11782315ec3f0fde5cf49c59e); /* requirePre */ 
c_0xee961af5(0xa38d3e1809659eb3bf1a194276b595ba59970cf43b7971d6228c3cf68dcb600f); /* statement */ 
require(
            ongoingProposalId == bytes32(0) ||
                distributions[address(dao)][ongoingProposalId].status !=
                DistributionStatus.IN_PROGRESS,
            "another proposal already in progress"
        );c_0xee961af5(0x38d8d53f4e98848a89faad2f1b7f91c2a67cd7fc7151b6acffcceda9ff0f5cd6); /* requirePost */ 


        // Checks if the proposal has passed.
c_0xee961af5(0x73c8ea93ab48f08f0f9a92d14fa00e9b7c34128abef52a306b801f86ec5c4e8c); /* line */ 
        c_0xee961af5(0x049d2643cdfa53b40f24bba94825c5d726a1d1f8b47f24752c9d3904fe25945a); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0xee961af5(0x5966d99b31f9a0d7b3fbf9d21ba7addb87bc361f4d93f56794897e031e637839); /* line */ 
        c_0xee961af5(0x2c5db2c681aae337ddf0c693cf4601fa5a5ecbaa7465b7699a174f2e02a4f969); /* requirePre */ 
c_0xee961af5(0xa6f682ec0a3c70ca6639c40f23de477f5c5757b325d4fbbe637cbfa8f26cf9e0); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0xee961af5(0xc8eeeeb9a50a080c009f2f81913a54b6511dd5794f6d4ed511b484395519eb46); /* requirePost */ 


c_0xee961af5(0xf2cf55fc954883a7326828b3ff6b6a6552e5ab1984df4b107cdfe3abbe470841); /* line */ 
        c_0xee961af5(0x3aa05c3b363e8326292616a52f9233d932c8aced9a73f184d98a14f0beb512d4); /* statement */ 
IVoting.VotingState voteResult = votingContract.voteResult(
            dao,
            proposalId
        );
c_0xee961af5(0x958b5675610a714bd2203e4ed9eb855453947eafddbe23c93af2faf58710d5da); /* line */ 
        c_0xee961af5(0xbb1dc395dd7b3669287f2bd78b8346a90e9b9ae519583935c74cb259449d8474); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0xee961af5(0x51403baaa4f97ba58646910f0a7f48c4fe457bcf57f638f08ff2aa7e52c2a3b6); /* branch */ 

c_0xee961af5(0x50796c1a43888a67d6532ba1e8127502186bfc34720bdeba115e039044c23380); /* line */ 
            c_0xee961af5(0x1d326334c7d49547001ae22c765cff4a974f9a8c44ae7dbfcf5f15191fb419eb); /* statement */ 
distribution.status = DistributionStatus.IN_PROGRESS;
c_0xee961af5(0xa11de652e19333246f5649fc1587786d3ca0b1a70afcf03cd2c9ac07c2137786); /* line */ 
            c_0xee961af5(0x8b9235342cc1aed35c87da61a21c74ee5419095d6946e62cf097ccae05be1d77); /* statement */ 
distribution.blockNumber = block.number;
c_0xee961af5(0xbc48a092988ae6db42f9fa7e1c7f30160e7aeed34e9712ff9f35bde0a3312fd4); /* line */ 
            c_0xee961af5(0x8f17fbbe06e6c0d0f1da98086c3ac96579856de01bd1b9a04ba6d9052d63d957); /* statement */ 
ongoingDistributions[address(dao)] = proposalId;

c_0xee961af5(0xba3cfb6b71bb945ebf1c147e35f0fcc3b5f5f63f7abd8fe2b0086d3f2367699b); /* line */ 
            c_0xee961af5(0x571c68dc107f0602ec845214b2cf209dcacaef6e480b740214ac7ea13d3afa5f); /* statement */ 
BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );

c_0xee961af5(0x54c188629f601aeb1a87287aeb89ec9759bc475f50cb93d095c862e361f41341); /* line */ 
            c_0xee961af5(0xff1d0e64a9df52b9cb320367243dd75bc564be7cfaa448c380f26beb890f7766); /* statement */ 
bank.internalTransfer(
                dao,
                DaoHelper.GUILD,
                DaoHelper.ESCROW,
                distribution.token,
                distribution.amount
            );
        } else {c_0xee961af5(0x7fd45f1b78d6d9ab9cba0ba125590809b5533cf0e8e0e65e29a3d28097eb948f); /* statement */ 
c_0xee961af5(0x4f4c2247d6e6e04ed8f113845cadb9ada4cc58286e18dacfcfaa246437ed8934); /* branch */ 
if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {c_0xee961af5(0x5921b0aa79fff75b3a3e86677d458b8a0bd0777720a58c4e49de9e395ebaee61); /* branch */ 

c_0xee961af5(0xedab9df9fd6582693435888fad29efd8dafb0c27203d7a02b515d209a43af5a5); /* line */ 
            c_0xee961af5(0xf7291bc3dbbdc437cf3215ea1e92da4bafcf2edeca0af7da395572d9be8cc0db); /* statement */ 
distribution.status = DistributionStatus.FAILED;
        } else {c_0xee961af5(0x7fc26798b0152ce3d17d7390c4611171c9a43edd2bbb799f84f22508169fa46d); /* branch */ 

c_0xee961af5(0x0a10508e701b8f73130a8d30ec653cfdbe814222cfba19c2f170bd53cdac6e38); /* line */ 
            c_0xee961af5(0x33cdec8712cde92da5a70972f6125f82bda74cbd899d0c6a5bd37d13fe4d3372); /* statement */ 
revert("proposal has not been voted on");
        }}
    }

    /**
     * @notice Transfers the funds from the Guild account to the member's internal accounts.
     * @notice The amount of funds is caculated using the historical number of units of each member.
     * @dev A distribution proposal must be in progress.
     * @dev Only proposals that have passed the voting can be completed.
     * @dev Only active members can receive funds.
     * @param dao The dao address.
     * @param toIndex The index to control the cached for-loop.
     */
    // slither-disable-next-line reentrancy-benign
    function distribute(DaoRegistry dao, uint256 toIndex)
        external
        override
        reimbursable(dao)
    {c_0xee961af5(0xe42e97375817807c15c14e6300275171dab6dfd9f0fc35f60525347575d39b00); /* function */ 

        // Checks if the proposal does not exist or is not completed yet
c_0xee961af5(0x4f54f341c98b78a326c83cb632c2744548da841f5ef1bb7bfb0b0c3a024f74b2); /* line */ 
        c_0xee961af5(0x0344ee1bb06cccad470dfd6a7fd905ec23d6c0bd977fc329e012f9f3d4c4efde); /* statement */ 
bytes32 ongoingProposalId = ongoingDistributions[address(dao)];
c_0xee961af5(0xdbfe8f6716b7ba886b6b43fb2af72a3d8bb3558d690c8fbcb67dc3ab39f6432b); /* line */ 
        c_0xee961af5(0xcc5b7d487a545dfa42a2033909aad872d439da910e9641209f21c2ba6e1f6ffd); /* statement */ 
Distribution storage distribution = distributions[address(dao)][
            ongoingProposalId
        ];
c_0xee961af5(0x7c475059345cb07f3ca79f5e502386f92e24071a15e8a13dabdaeebd8c7893b1); /* line */ 
        c_0xee961af5(0x40f99922e60dde42f59591f24370274621db6abb938c554218a3d9b3789fe8e5); /* statement */ 
uint256 blockNumber = distribution.blockNumber;
c_0xee961af5(0xd3b51a278b4320a7aeaceee1a0f512a797dd8c848536676e656cc5648a33181f); /* line */ 
        c_0xee961af5(0xf469adec454e2e3c272f17b61958ab6a2f9b4a9bf35434012281e11065c88576); /* requirePre */ 
c_0xee961af5(0x0f18a4b6e5eb39fd1e58b1172d2f24256107e8017f84645b16d3fc57ec3ed909); /* statement */ 
require(
            distribution.status == DistributionStatus.IN_PROGRESS,
            "distrib completed or not exist"
        );c_0xee961af5(0x876db703b67963e6173afce8f8c1d7d60aea6ab156e2791f4f73fdd5f7ff582e); /* requirePost */ 


        // Check if the given index was already processed
c_0xee961af5(0xf7e5548a96759249c229da932e1a3f2ad6a735a5a963c51b07013198d0571bfc); /* line */ 
        c_0xee961af5(0x33fd81588edab9895cb83b1980af57d449f4c3b452ee65be5adf48419c673a7b); /* statement */ 
uint256 currentIndex = distribution.currentIndex;
c_0xee961af5(0x18aef2edfc8aa0c5aaf1c25241a0aed7dd11698f32431ee15c6b3b1a0be179cf); /* line */ 
        c_0xee961af5(0x9dc6772aac11931c93313fbca0fd5b7f0d44f8254f238fa760d396eeff1897b9); /* requirePre */ 
c_0xee961af5(0x0cb7a7b5af6e1a26f111ff6d58f74f575d005239f9367a16f000993f6d14536f); /* statement */ 
require(currentIndex <= toIndex, "toIndex too low");c_0xee961af5(0xa8c65125446995ac29237e68975d54e3cabab80baff49da6a5b29f9b28a34314); /* requirePost */ 


c_0xee961af5(0x93179f89f9c71f1859c514dbd0f8f24b2e1faa740e3dc64caedb3c9222a76d86); /* line */ 
        c_0xee961af5(0x413cb778ceb87d3a823b2a7f15cf1bc27c65ebbc4611730cdbe10fc7767b27cc); /* statement */ 
address token = distribution.token;
c_0xee961af5(0x3527d822673e48aff47ebf05c8729218abb93bed857c063a0fba2d91d142f525); /* line */ 
        c_0xee961af5(0x1ad8ab74d47cdeb27072d2cb8b08a498e5e0d49be4645addf77be4d55ece66b3); /* statement */ 
uint256 amount = distribution.amount;

        // Get the total number of units when the proposal was processed.
c_0xee961af5(0x8e4423dcff26f00eb86e34690c599b0863cb501d376179866aa50e0b186d17db); /* line */ 
        c_0xee961af5(0xedcd0de2d565cf9e5e02944cf3833d618795e0a1c3c4856701fb5f6d7d202687); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );

c_0xee961af5(0xe593df4590db79277959e1f667d3da35c1647f280bc2b8f5cadabea34c50a915); /* line */ 
        c_0xee961af5(0x890c57398f7dc95e4f86ec584af88197a46d16e55b73722de43182c316cefc7b); /* statement */ 
address unitHolderAddr = distribution.unitHolderAddr;
c_0xee961af5(0x75a021fed15230196e44fbb0812e736ce58d0d7de5e165835a7d5ec610d39606); /* line */ 
        c_0xee961af5(0x14be5425d55bd3fd6bcd3e973644d05507f817765d9c616cb7a789660833bde9); /* statement */ 
if (unitHolderAddr != address(0x0)) {c_0xee961af5(0x1a01d110a4a6ce3d02e599cd25c5fe38f6d0e5e5c1d8baa4b35d22bb203c3da9); /* branch */ 

c_0xee961af5(0xdc601b4b0cab349d45ddc0dd0b4461a92df2e24b01f58d41e8fe0ebe6da3802b); /* line */ 
            c_0xee961af5(0x00dc0fc97755ad83c9f872c43d7b22665a9647fd3deb83b841132af15b90a6ab); /* statement */ 
distribution.status = DistributionStatus.DONE;
c_0xee961af5(0x3e91d7d494783d381bfd4b505651c5cf694545ba3f7809e7cbb9a46f4b9c8da3); /* line */ 
            c_0xee961af5(0xa58ee25923b0bc082295a48ec22c149360956b41b3fed865d3863e53bf213f8f); /* statement */ 
_distributeOne(
                dao,
                bank,
                unitHolderAddr,
                blockNumber,
                token,
                amount
            );
            //slither-disable-next-line reentrancy-events
c_0xee961af5(0xe9c3053118f831f9f869ddcd7890b401ef698260cd9d0c73bb7da6c755696e85); /* line */ 
            c_0xee961af5(0x2c59f18c7f49ec7c5c2dd84848b3763822cbeb1df8ce8279f50b2ecb9dd6d4ba); /* statement */ 
emit Distributed(address(dao), token, amount, unitHolderAddr);
        } else {c_0xee961af5(0xc6121cc399c7e14c7aaf939b557c074eea8f8bc6714bd1e41f1151f4918f9242); /* branch */ 

            // Set the max index supported which is based on the number of members
c_0xee961af5(0x5d6a8038a228fd9ba7d677ca473106f1faa47f8462b481b34c027ece0eb46a2b); /* line */ 
            c_0xee961af5(0xa7485a77e7216fa3d6a4a88a35a2cddc12011b6bc87fa54f3071052d008e31c7); /* statement */ 
uint256 nbMembers = dao.getNbMembers();
c_0xee961af5(0x2f61c5806128eb4a501436c67da7fff7efb3767c01602da5aa9c0953f941002e); /* line */ 
            c_0xee961af5(0xfa2c61d5577760af09b55c46cf42e74e3495ab860c702e606c5b1c3e3a3e5bf5); /* statement */ 
uint256 maxIndex = toIndex;
c_0xee961af5(0x3ddf2448fcf368ef7e8fde9158710c781479cdf75bc76feddc71c0c205ee6dac); /* line */ 
            c_0xee961af5(0xf28fdb97a9c1834c818d0297542d37a83702f6ce181926a5985ed8a7c9f2623a); /* statement */ 
if (maxIndex > nbMembers) {c_0xee961af5(0x0ff468d27ec5f1a79d9c7d9e81f23b06e5d34c03be04e2e1fa9efa7039bea7a6); /* branch */ 

c_0xee961af5(0x775c369946d9116ed58192c2bcfd908ab6855ce04b49fb00eee10a64d8308ce9); /* line */ 
                c_0xee961af5(0x35b50954344a82107152a532da10233e9fa7f79f8d86a9d8fa30efac8126f93b); /* statement */ 
maxIndex = nbMembers;
            }else { c_0xee961af5(0x980944751bb1218aa1e90543b68af21a7b5ada52b82bc88dc15da9970687ce97); /* branch */ 
}

c_0xee961af5(0x03fd81047cf05e76fbc2c45d03e9af21cba1281d2a03936f4bf08fbe5b26830b); /* line */ 
            c_0xee961af5(0x7d3bcdce9a5d4b975ef56cdaf3ff8ba70fb880660fde4f0e88b96efffa6c09c3); /* statement */ 
distribution.currentIndex = maxIndex;
c_0xee961af5(0x35bf5e2c3e821c2348042a03a99cf5b6ebc730915952754151f6219fef057de4); /* line */ 
            c_0xee961af5(0xef687e83677cb89168e404e2a125ad6fecc374afb86fc26b68d4091561ea874e); /* statement */ 
if (maxIndex == nbMembers) {c_0xee961af5(0x628ce864875af32355ab821b0d7b672be1ac01a7ad335e21d159fcc3b535dac5); /* branch */ 

c_0xee961af5(0x16834dfa57693e1014f511ca8126860a98c0289d985bfa2295bf0ea2b6c5f8a4); /* line */ 
                c_0xee961af5(0x9dda448308d601e28585ba3d5123f2ccc67529c1de1829f2ff0dbfa2cb6f054e); /* statement */ 
distribution.status = DistributionStatus.DONE;
                //slither-disable-next-line reentrancy-events
c_0xee961af5(0x7b5a722232c1ea610a17becd7ce0da8482b01b1a4ef2b3efce0aba07aef4cf32); /* line */ 
                c_0xee961af5(0xbca561967dd28bc644e5a4c4ae03ac75f8f16decc45bf7f368506404bdee7e04); /* statement */ 
emit Distributed(address(dao), token, amount, unitHolderAddr);
            }else { c_0xee961af5(0xa0f40226deec363bded108de977ce3c7cbcc774d196ac526c0b0804b62e294f9); /* branch */ 
}

c_0xee961af5(0xa5ee8345346f3568e566c5e6be1c40f7686606fd7aa593cf03461a3de09c8b72); /* line */ 
            c_0xee961af5(0x964e85cd2b153a280faba4a2e164809a19397df28083b2dcdeb05169a6ff5ccd); /* statement */ 
_distributeAll(
                dao,
                bank,
                currentIndex,
                maxIndex,
                blockNumber,
                token,
                amount
            );
        }
    }

    /**
     * @notice Updates the holder account with the amount based on the token parameter.
     * @notice It is an internal transfer only that happens in the Bank extension.
     */
    function _distributeOne(
        DaoRegistry dao,
        BankExtension bank,
        address unitHolderAddr,
        uint256 blockNumber,
        address token,
        uint256 amount
    ) internal {c_0xee961af5(0xd68ce716915832f0176f76a79542266d7f935c2d570291df32e09b1cb1ecd67a); /* function */ 

c_0xee961af5(0x7b21af334198f6ea6b8fb2a09bd96b5526989357a99af06a1402cba51370d64e); /* line */ 
        c_0xee961af5(0x849f41ff55f7e6f4446cac48aec070195f924dd6abc041d8ca78240862984b4e); /* statement */ 
uint256 memberTokens = DaoHelper.priorMemberTokens(
            bank,
            unitHolderAddr,
            blockNumber
        );
c_0xee961af5(0xd14bd2a8d17c78d5b523d8bed9b37d128b07def710fea1a308826f1dbb4e5710); /* line */ 
        c_0xee961af5(0x97821054aba55880395094fd929c4e0cff83b5ad2e2f180c47c1fd3d96f1a76d); /* requirePre */ 
c_0xee961af5(0x6e1ef9010c4c120f2ddae886b55c69e6535006fa712de672f38e5b7265db5033); /* statement */ 
require(memberTokens != 0, "not enough tokens");c_0xee961af5(0x572c8b61c1a040cf53063afb10b951d801055e9d66ae8322b7af3b9bd357c8eb); /* requirePost */ 

        // Distributes the funds to 1 unit holder only
c_0xee961af5(0x041e07be499f7419d6dedf51054102be1f13604335aa8c401f124a41c5e5ac89); /* line */ 
        c_0xee961af5(0x83a4d7411ddbed05ebd22ada4bcda6f9d54885bc521430888aba11bc25237706); /* statement */ 
bank.internalTransfer(
            dao,
            DaoHelper.ESCROW,
            unitHolderAddr,
            token,
            amount
        );
    }

    /**
     * @notice Updates all the holder accounts with the amount based on the token parameter.
     * @notice It is an internal transfer only that happens in the Bank extension.
     */
    function _distributeAll(
        DaoRegistry dao,
        BankExtension bank,
        uint256 currentIndex,
        uint256 maxIndex,
        uint256 blockNumber,
        address token,
        uint256 amount
    ) internal {c_0xee961af5(0x4ac004e136908fce3d014002b7fd2e57e95383224fed2d7d1a1c4a043e75acc0); /* function */ 

c_0xee961af5(0xd5e1a7974dc094a99fd0ae3fb7a51aa52a31345ac321cc7866948178424c5cfe); /* line */ 
        c_0xee961af5(0xe5ea2e6e0e451e07ea7789c26e095d2e571b62bccf0dab84053858ea83c12033); /* statement */ 
uint256 totalTokens = DaoHelper.priorTotalTokens(bank, blockNumber);
        // Distributes the funds to all unit holders of the DAO and ignores non-active members.
c_0xee961af5(0x1da47b3db9491916879e6e6815610310a369de68403291de8ca4e661197ad139); /* line */ 
        c_0xee961af5(0x195324a14f48e46c4bb3c8525bc8bd3b93f44a537ffb4b7eeaee87a9f2ba87e1); /* statement */ 
for (uint256 i = currentIndex; i < maxIndex; i++) {
            //slither-disable-next-line calls-loop
c_0xee961af5(0x49bb00c477b4aef27540394a9ce7a727e6b9bfc948e3c75e0a999be2238fa790); /* line */ 
            c_0xee961af5(0xf6bc134839c793b30c88b100bba772c400f3b187a26e1de4a295e93b9a35c3c8); /* statement */ 
address memberAddr = dao.getMemberAddress(i);
            //slither-disable-next-line calls-loop
c_0xee961af5(0xeda84beb6e51bb9bef5f770c6e29f1a81f629f449fdbd0431a5b809fe06064a9); /* line */ 
            c_0xee961af5(0x52609765353eaf7c376ac63f22a40dc3416c5d0f64584abdd50a40664effb1d2); /* statement */ 
uint256 memberUnits = bank.getPriorAmount(
                memberAddr,
                DaoHelper.UNITS,
                blockNumber
            );
c_0xee961af5(0xeb662f8ca4a4d50cb1218521ec8417ab2685b0a3491ef527591735f9208fa253); /* line */ 
            c_0xee961af5(0xcfd97ca34c3b65d1a02e954ce4071f0e5d2e0106902b3439b2ca4e1287d4feaa); /* statement */ 
if (memberUnits > 0) {c_0xee961af5(0x8c6a0f1b4fa5258070f59c869a7847709a03e681c06897241aa9123bbe9855aa); /* branch */ 

                //slither-disable-next-line calls-loop
c_0xee961af5(0x2a9e6628b674beafabf19ca5f136c8a85f31de158f71211c4548db79990a7d76); /* line */ 
                c_0xee961af5(0xb2ff18d4c83909ea4fa712cc49031b52250eb6771cc6141f6985bcd733302f1a); /* statement */ 
uint256 amountToDistribute = FairShareHelper.calc(
                    amount,
                    memberUnits,
                    totalTokens
                );

c_0xee961af5(0xdecabacf3119f86982189adb683c15468e45906cebe27b929cc59280cfb93fb2); /* line */ 
                c_0xee961af5(0xc9c271948222c7969fa520a54311bde8ef0f836ed0025a9809f87a5a8252422d); /* statement */ 
if (amountToDistribute > 0) {c_0xee961af5(0x3960a9c68d310113d24bdf0d500bd3bd85c3aaf76c842fc5b0275501ff142bf6); /* branch */ 

                    //slither-disable-next-line calls-loop
c_0xee961af5(0x33dfabbb60f861077e410d50d27ad4325d264e6a579a32ea279b96b8dfe5b737); /* line */ 
                    c_0xee961af5(0xdf066bd05abda8c2e9e550bb105d556d5a1cabec5041d3180b521fb6231aee5c); /* statement */ 
bank.internalTransfer(
                        dao,
                        DaoHelper.ESCROW,
                        memberAddr,
                        token,
                        amountToDistribute
                    );
                }else { c_0xee961af5(0xf98620840af4fd741f18943c91f31218243fb41b7189af070ec06589f754fb71); /* branch */ 
}
            }else { c_0xee961af5(0x610fb432a89ce899ea76c257179544b8f94b04b9c111b21ddcd06d360a1c539b); /* branch */ 
}
        }
    }
}
