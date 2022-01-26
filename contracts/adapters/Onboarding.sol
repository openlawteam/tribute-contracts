pragma solidity ^0.8.0;
function c_0x03308afe(bytes32 c__0x03308afe) pure {}


// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../adapters/modifiers/Reimbursable.sol";
import "../guards/AdapterGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../helpers/DaoHelper.sol";

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

contract OnboardingContract is IOnboarding, AdapterGuard, Reimbursable {
function c_0xe97461b4(bytes32 c__0xe97461b4) public pure {}

    using Address for address payable;
    using SafeERC20 for IERC20;

    bytes32 constant ChunkSize = keccak256("onboarding.chunkSize");
    bytes32 constant UnitsPerChunk = keccak256("onboarding.unitsPerChunk");
    bytes32 constant TokenAddr = keccak256("onboarding.tokenAddr");
    bytes32 constant MaximumChunks = keccak256("onboarding.maximumChunks");

    struct ProposalDetails {
        bytes32 id;
        address unitsToMint;
        uint160 amount;
        uint88 unitsRequested;
        address token;
        address payable applicant;
    }

    struct OnboardingDetails {
        uint88 chunkSize;
        uint88 numberOfChunks;
        uint88 unitsPerChunk;
        uint88 unitsRequested;
        uint96 totalUnits;
        uint160 amount;
    }

    // proposals per dao
    mapping(DaoRegistry => mapping(bytes32 => ProposalDetails))
        public proposals;
    // minted units per dao, per token, per applicant
    mapping(DaoRegistry => mapping(address => mapping(address => uint88)))
        public units;

    /**
     * @notice Updates the DAO registry with the new configurations if valid.
     * @notice Updated the Bank extension with the new potential tokens if valid.
     * @param unitsToMint Which token needs to be minted if the proposal passes.
     * @param chunkSize How many tokens need to be minted per chunk bought.
     * @param unitsPerChunk How many units (tokens from tokenAddr) are being minted per chunk.
     * @param maximumChunks How many chunks can someone buy max. This helps force decentralization of token holders.
     * @param tokenAddr In which currency (tokenAddr) should the onboarding take place.
     */
    function configureDao(
        DaoRegistry dao,
        address unitsToMint,
        uint256 chunkSize,
        uint256 unitsPerChunk,
        uint256 maximumChunks,
        address tokenAddr
    ) external onlyAdapter(dao) {c_0xe97461b4(0x81984dbf46b2fc5c439f1c28426d6acb7b7a143b9adecf54bde02c26f873ef13); /* function */ 

c_0xe97461b4(0x4c9a6783b1317c4339de796c892939a3642e71ac0a5b96942c4613682ca28d5f); /* line */ 
        c_0xe97461b4(0x13569610566d6bee3e6cc46f8464302306290cfeb6f7ea656f75d09fac89e515); /* requirePre */ 
c_0xe97461b4(0x2f81e83befe37997dc621d74d9d663ae0c3e651e4b3fa842e42c6ad3f7d15b20); /* statement */ 
require(
            chunkSize > 0 && chunkSize < type(uint88).max,
            "chunkSize::invalid"
        );c_0xe97461b4(0xe3a0c9f8284c44dffb5652322e5dc3a609f1f99e707f5022e5ef514840243130); /* requirePost */ 

c_0xe97461b4(0xadfce03d13555fb129109f2da0108714d012085a16fc692a2349438b29ed1214); /* line */ 
        c_0xe97461b4(0x5dcf3a6fcf11f089bdfa382576db57cc4c7fada5697d1cd9c183a532da46de69); /* requirePre */ 
c_0xe97461b4(0x7d9d46b71db1ddb97e1c7ba352fc34f7b29bc338ff242134bc3d24516f2817d4); /* statement */ 
require(
            maximumChunks > 0 && maximumChunks < type(uint88).max,
            "maximumChunks::invalid"
        );c_0xe97461b4(0x719bea73ec8b1ce981eb7fbb53f0b7f700ea4ba1fcdcdf751ad86bbce8f1907d); /* requirePost */ 

c_0xe97461b4(0xd6ed1adc726f7804d5e59dc3c4a3aafb20965ebf06f1eba0c560a48c334452bc); /* line */ 
        c_0xe97461b4(0x777a45b835a4c21b42cabadd2181c4a80aa38185a4bb2f876fd6bb1dc5be1dbd); /* requirePre */ 
c_0xe97461b4(0x3eed86f32f86549bf58f172047c95bcda7ec75e484d43217e741b25e9f4ad421); /* statement */ 
require(
            unitsPerChunk > 0 && unitsPerChunk < type(uint88).max,
            "unitsPerChunk::invalid"
        );c_0xe97461b4(0x0d2b46dd003d49d0a2d482b20e50f4e92f8d46012c0a6f6a20515d4dc4134aaa); /* requirePost */ 

c_0xe97461b4(0xd648c3c2a7e07e956b706eb60c4ede327dbf3cafdc4fa0efd14edbff0c5e4161); /* line */ 
        c_0xe97461b4(0xabdaa15678b93866ade5aedcb3b576fd7f7b4fc6e57e06542ab8a3ba1b131e8b); /* requirePre */ 
c_0xe97461b4(0xcfe811477167e30b31d9134b6231c659c8df4664fdd24264b6766e217f665e95); /* statement */ 
require(
            maximumChunks * unitsPerChunk < type(uint88).max,
            "potential overflow"
        );c_0xe97461b4(0x7af766eda76a37b91945fe21e455f75f6a8612f5c9435543b3d7ede474f23006); /* requirePost */ 


c_0xe97461b4(0xd8478dc0610bf179474e932e3ccc6e48ac21b2a0ff534f84e91d67774f38b0d9); /* line */ 
        c_0xe97461b4(0xeb492ecbe32ebbfc2b53afe43c9b56946f1df221d3bf732cd1442464396b6001); /* statement */ 
dao.setConfiguration(
            _configKey(unitsToMint, MaximumChunks),
            maximumChunks
        );
c_0xe97461b4(0xf291ba810cfe05cb1e4c4ea9816f380f82df03ae1a347a6077249fec599d53d8); /* line */ 
        c_0xe97461b4(0x85c89604ea436f3a9f6ed201b4338af3ebf1329f164b149b28cd691197f58f2b); /* statement */ 
dao.setConfiguration(_configKey(unitsToMint, ChunkSize), chunkSize);
c_0xe97461b4(0x580a348b137af63bed013d76d0ad13fe6d68990de8adc83e575d4d366c3a5f72); /* line */ 
        c_0xe97461b4(0x2076139f08c85c5ceda92998158ce29f404a898fd70d55af3327c103dc529cfc); /* statement */ 
dao.setConfiguration(
            _configKey(unitsToMint, UnitsPerChunk),
            unitsPerChunk
        );
c_0xe97461b4(0xe8942262eabeb618b97fb1dd15d2740b157d03b0d2512a06c7ac457237519d76); /* line */ 
        c_0xe97461b4(0xdfecbee792d305bdbda84619b85c8bac94a9b77651ff7229a01dd3816fa02768); /* statement */ 
dao.setAddressConfiguration(
            _configKey(unitsToMint, TokenAddr),
            tokenAddr
        );

c_0xe97461b4(0x0f6f068e00361bcf5d20f46fc85e76e67c4a84031bdac5ebf4284c33e506d352); /* line */ 
        c_0xe97461b4(0xf9aaa4b846029f93fa04ee6476e39b163689f4bbb13ef8d8aba58ad04583dde4); /* statement */ 
BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
c_0xe97461b4(0x9d770765c748997fe0f80eaa0272c98c0d7b6df99c6910635a4c32002806c68b); /* line */ 
        c_0xe97461b4(0x117f829ebf030b101b9e84fbb392a89ca3ad85f6e1458ab5abbc8993b7b00565); /* statement */ 
bank.registerPotentialNewInternalToken(dao, unitsToMint);
c_0xe97461b4(0x048359d481a955f4d9e0224abb52644a83d7b1b1176b04556a26e40a47d7f354); /* line */ 
        c_0xe97461b4(0x5bcdae0be114dd44d6ed799cd17695b45fc6a2e9792d47fc486b84e4aaf1553c); /* statement */ 
bank.registerPotentialNewToken(dao, tokenAddr);
    }

    /**
     * @notice Submits and sponsors the proposal. Only members can call this function.
     * @param proposalId The proposal id to submit to the DAO Registry.
     * @param applicant The applicant address.
     * @param tokenToMint The token to be minted if the proposal pass.
     * @param tokenAmount The amount of token to mint.
     * @param data Additional proposal information.
     */
    // slither-disable-next-line reentrancy-benign
    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount,
        bytes memory data
    ) external override reimbursable(dao) {c_0xe97461b4(0x3d36c848f940053b6ae1505fabe2614fb861a23bea50ad9f48642491af0cea78); /* function */ 

c_0xe97461b4(0xc1c9f793d2fbd8cfa598e49cf5bf20f7b09d10ecdc9f08ffd5d06056a5cf338c); /* line */ 
        c_0xe97461b4(0x5c90c96ed0fdb6db5d0e68b3f62dfa876d601fd25700fc64b2814ae5aa010161); /* requirePre */ 
c_0xe97461b4(0x2a191ecb52ea0ec9ebbe5b0280bf69e71d2f1000ac3ae7506c563d8e1af572c9); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );c_0xe97461b4(0x75a2e4c193fa3d1220aeec6fd9a2182fbb6b109518fb35913e6e2c6244311b26); /* requirePost */ 


c_0xe97461b4(0x442f13bcd12a27580a85903eeeeb8bd3646413f4b34dc2e8b96d2040237be19b); /* line */ 
        c_0xe97461b4(0xf73fa1a927594fb3f10e6c8e207a5be6d15fae8a54469c37ab81d492d0489573); /* statement */ 
DaoHelper.potentialNewMember(
            applicant,
            dao,
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
        );

c_0xe97461b4(0x5c30fe51103d98980900acd1729ec2fd6a30cb8552de345644bfe9183fa46755); /* line */ 
        c_0xe97461b4(0x1eb2dec330aad7dadaf5e9cc355f8edee0f491f5aa750c1871bb03f02e9dd78c); /* statement */ 
address tokenAddr = dao.getAddressConfiguration(
            _configKey(tokenToMint, TokenAddr)
        );

c_0xe97461b4(0x12282fe628f7451803e524ed6d373d2140c2136525eeb41236dd2f9985338a3a); /* line */ 
        c_0xe97461b4(0xf9dfddd262e573249875e21eaed95e0f5c7fe86720c5ec23984e5adae68e178c); /* statement */ 
_submitMembershipProposal(
            dao,
            proposalId,
            tokenToMint,
            applicant,
            tokenAmount,
            tokenAddr
        );

c_0xe97461b4(0x76accc3f8dc5ee6cf58f3664edf65dc3cbfd5bbaeb48436986cbff474faaf617); /* line */ 
        c_0xe97461b4(0x1958248ec298110a5f388408d720d534bdfd2a5ab154c128342de7eff9fe2b15); /* statement */ 
_sponsorProposal(dao, proposalId, data);
    }

    /**
     * @notice Once the vote on a proposal is finished, it is time to process it. Anybody can call this function.
     * @param proposalId The proposal id to be processed. It needs to exist in the DAO Registry.
     */
    // slither-disable-next-line reentrancy-benign
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        payable
        override
        reimbursable(dao)
    {c_0xe97461b4(0xdb2becce7313982dd05838bf28b5e9005085daab71e71de8f7afda08374754e9); /* function */ 

c_0xe97461b4(0x0e800f64cd8d6d1d68f317e9cc252f679f469d649c8fb3c8992d1bcc5af6353f); /* line */ 
        c_0xe97461b4(0x4d6b5b13fea86d840341e7512b7593bbb8e217ba7c1d7eb0072192fa3b3aacdd); /* statement */ 
ProposalDetails storage proposal = proposals[dao][proposalId];
c_0xe97461b4(0xa5387d62e6e950ed8bad1b45a9f45b320bcd8f01942ffa932cc24c94272bf0e0); /* line */ 
        c_0xe97461b4(0xae413b37edd570dc2e3ec860defdcdab1b6e143d1167e22668d5d24a8506c7b0); /* requirePre */ 
c_0xe97461b4(0xc05b5d2a0be8a09c68bad203fc9f47b9338b41572795103e0e59b333452848e1); /* statement */ 
require(proposal.id == proposalId, "proposal does not exist");c_0xe97461b4(0x9b5d49d7d19de9a9818d856a14e631ddd63930456ce9295723b3ad797e3fc5ee); /* requirePost */ 

c_0xe97461b4(0xd2cc52bfdd7cc189f8c866219f7b0d1b16c06f8e519be40846eaa576dbef41ed); /* line */ 
        c_0xe97461b4(0xefa82344686ac5d3f3d915471361547ea066c0b8c51328b24cff0c6f85e5d716); /* requirePre */ 
c_0xe97461b4(0x90e890d0dad2727c5fdb6d3c216b948e1032a8c5f459c33945dda6ab0196cb2e); /* statement */ 
require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "proposal already processed"
        );c_0xe97461b4(0x7a3a2bcb9367099553687527c8eabd77aa7bc2e83db73bd39c5fe2df76b915f2); /* requirePost */ 


c_0xe97461b4(0x9951644b51acfc59a8b1f9b86b1c9dd8947224661161af04f388373fafc5adf9); /* line */ 
        c_0xe97461b4(0xb9cbd21c883e45192726ce452a93b8d492ffb97e5ba84d67ddacefeb67e27482); /* statement */ 
IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
c_0xe97461b4(0xd149e9bfe510425468f795328b20b115d6a836791fd0c95616cc8af74dd7b78e); /* line */ 
        c_0xe97461b4(0xa4d399bfcb77717cf3cb94f6821bce3c18b8cb88e1d3006976659b105ad34283); /* requirePre */ 
c_0xe97461b4(0x32f7b42bc8f989d0c3ca97b9ece4e5938e53ee92e559dfddb5c2fa56c8e880e3); /* statement */ 
require(address(votingContract) != address(0), "adapter not found");c_0xe97461b4(0x2b709ff4dae95dae805f493a1a1488f7b01ae34e8a5d926289cf9b03ebf828e1); /* requirePost */ 


c_0xe97461b4(0xc46eb7929a97a71856579c2b60bba1ca9c5924e6cf0314498bd9006002108c04); /* line */ 
        c_0xe97461b4(0xf9324e4f4d34790b5bdaee70250b1fd20057b1295bd80c36fe317b97ccf145b8); /* statement */ 
IVoting.VotingState voteResult = votingContract.voteResult(
            dao,
            proposalId
        );

c_0xe97461b4(0xdb2c5781e4ae8b6bc1d46b80e83e8497439a0d22c465a0bfff56573c9c893c22); /* line */ 
        c_0xe97461b4(0xc2d06ae8fa2daf31f9c48307bfedf46d351796b75f2225a553da9e4b16ae3502); /* statement */ 
dao.processProposal(proposalId);

c_0xe97461b4(0x7a432e8318a049a639da3de59a1ea62946ab7652cc6c684cdeec8cfca8d49ec3); /* line */ 
        c_0xe97461b4(0x34194d0f7a8fadb0074937a0be1fd0e7ed21c808a18645357654a02f565eeb91); /* statement */ 
if (voteResult == IVoting.VotingState.PASS) {c_0xe97461b4(0x75a82300a2ddb4da7196724ebb28cad8341a9013d16190119fb041c61beac141); /* branch */ 

c_0xe97461b4(0x154c52bb21fc3da1cc5b6f2f8906e9d2aadf38ac2081c1187f7fa7d595c88880); /* line */ 
            c_0xe97461b4(0x54efc935466af00c12e27be1cc344226d04faccec84244ea76942a5c97cf4fbb); /* statement */ 
address unitsToMint = proposal.unitsToMint;
c_0xe97461b4(0xfb7b13b576c0bb50fff40a8ce1e75ce3677e6a2933ddef8c8c8f10f2ae4c6fd1); /* line */ 
            c_0xe97461b4(0x2570bb480ceacdd72b4409a2fed1b2657bf4d9c28f023a87ea2e9fe2d0a092fc); /* statement */ 
uint256 unitsRequested = proposal.unitsRequested;
c_0xe97461b4(0x207b9e05ebf685168719f1019ed43a51db35674835a321cae0204c82bb2b213e); /* line */ 
            c_0xe97461b4(0xa28a7b0a6136a6ec336b442880a25a9bee38539b06026215a3eeea60bf86cc00); /* statement */ 
address applicant = proposal.applicant;
c_0xe97461b4(0x45ced043b2e0e99f1efe1f0b70f5b9762292ea970e08fb08d85f766dec9d6873); /* line */ 
            c_0xe97461b4(0x263f8e6bc7f576210f30817252655c6067675104f682efb3aa25b0b0917c8671); /* statement */ 
BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );
c_0xe97461b4(0xcbd2524913f70dc0f315feada17e109a927eae2b071e400869d7a661c13472ca); /* line */ 
            c_0xe97461b4(0x17f19e5c5e081f49facc261092e8beded0a6fbde82d8f25c77d28d9e975c73fe); /* requirePre */ 
c_0xe97461b4(0x017c42cda66e647a0ca5dceb44f36ac3c91fc99da744014db17b5896c12f5c2b); /* statement */ 
require(
                bank.isInternalToken(unitsToMint),
                "it can only mint units"
            );c_0xe97461b4(0x100a86f1b415e23c8d2913a1407457d04624e758356e49a9152b18b744f16a98); /* requirePost */ 


c_0xe97461b4(0x5b18a74dce62d2d6feb3f82eb16c70c00e9e98f7d9c227868fb1eb2622c19c8f); /* line */ 
            c_0xe97461b4(0x0b5712e1ffa196b490cca22cebca7ed6dea6f318a32406f0043e63e57b04a4b1); /* statement */ 
bank.addToBalance(dao, applicant, unitsToMint, unitsRequested);

c_0xe97461b4(0xc2e158e862f27782e1901a4125a51670176aa19ac05cbe67555253d16d6c9721); /* line */ 
            c_0xe97461b4(0x5537ec295fd3fba18b5ddc2450c7b8bd974e98c75397e56ad7947a798452b1f5); /* statement */ 
if (proposal.token == DaoHelper.ETH_TOKEN) {c_0xe97461b4(0x39962367adb61f7fc1660d9502bad292d9ba4fc9a4296c93e71e4cc30e0ef417); /* branch */ 

                // This call sends ETH directly to the GUILD bank, and the address can't be changed since
                // it is defined in the DaoHelper as a constant.
                //slither-disable-next-line arbitrary-send
c_0xe97461b4(0xe568fc1b05b111ac8d539ad31649ce2563ff62ecffe08b72d7b3d046beaf8b55); /* line */ 
                c_0xe97461b4(0x6e6ae2ff5571aa36230e4c0c9b49b379f02e63fa6940d1a276e28d969d745316); /* statement */ 
bank.addToBalance{value: proposal.amount}(
                    dao,
                    DaoHelper.GUILD,
                    proposal.token,
                    proposal.amount
                );
c_0xe97461b4(0x6b56bf7f1e7f3012e554b8b9924ccfd3909547be8db52682736885548e52ab50); /* line */ 
                c_0xe97461b4(0xb7bf58b66fa4c6080c2349db79de7598d84490889485b550cf3c4588d9fd27cc); /* statement */ 
if (msg.value > proposal.amount) {c_0xe97461b4(0x3c1295eb9d687f4a0c0f745ce0cf628892bc3aadf836f47ff00240f024e46baa); /* branch */ 

c_0xe97461b4(0xe1d3bcd68e583df60be0010d5de02997ba9132f6082ef4c9afceaea9c64868b8); /* line */ 
                    c_0xe97461b4(0xf05b1bc62b61baf5889c73ccf82128d4f5d98981ecf210189f9c6e7cba7decda); /* statement */ 
payable(msg.sender).sendValue(msg.value - proposal.amount);
                }else { c_0xe97461b4(0xc72b0c7272364bd2e8032dbe0c318d7300bda03dccec1260b84396ff069c4c6b); /* branch */ 
}
            } else {c_0xe97461b4(0x832b8482b1b72869a806c01c30790d061657fee5933c149b53130fff6b21db55); /* branch */ 

c_0xe97461b4(0x5f3535bc0dbff016165d370446a33c3ba04c1851a7ee68f5c63e7b9dd7536c8a); /* line */ 
                c_0xe97461b4(0xe305ad25dc71178999bfffa3a6a8ff04b9214c627b6907a60359d120e5ad3756); /* statement */ 
bank.addToBalance(
                    dao,
                    DaoHelper.GUILD,
                    proposal.token,
                    proposal.amount
                );
c_0xe97461b4(0x2a0b907d7f05013dce6a198e6c152f3061831bd0bb6a81f2b9d0bfffc16affeb); /* line */ 
                c_0xe97461b4(0xdad46bfdb3628d2fe5732f1588edce66d71aa50aeac26e0a736ae4e2053f3be0); /* statement */ 
IERC20(proposal.token).safeTransferFrom(
                    msg.sender,
                    address(bank),
                    proposal.amount
                );
            }

c_0xe97461b4(0x4d56aefa859d630e2c5e420670eaf50d6d182b7f5dfd4ee621486357650c410c); /* line */ 
            c_0xe97461b4(0x98434d1fba312e3741247c0ef606f7046905fab9c4dc7d3024ec82ae2d827947); /* statement */ 
uint88 totalUnits = _getUnits(dao, unitsToMint, applicant) +
                proposal.unitsRequested;
c_0xe97461b4(0xb9030397c14ae292cbd5aa17fa91afab0d404589ceabc0d27eb11eb8641a1169); /* line */ 
            c_0xe97461b4(0xa769a13b2241730a103d93efe99eeb6e92ebc625abd2bb81be6ea0ea2dcd63f3); /* statement */ 
units[dao][unitsToMint][applicant] = totalUnits;
        } else {c_0xe97461b4(0x5f0a5edc70156f79d64e2979cf277b5dd7d9590fb03d065aaf6a697d8a416d17); /* statement */ 
c_0xe97461b4(0x5036ff9173440e0891ad46dccbf8ab02c744167aafaf926e9d424232c33cf44d); /* branch */ 
if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {c_0xe97461b4(0x3e63e067cc1f49fdb30f26353520d1e160aa50a4e7281cd18530d32e33b19b6c); /* branch */ 

c_0xe97461b4(0xb812db9454358537670313ba64be9a3e6ef4f0f767258a407ec58970b0dea08e); /* line */ 
            c_0xe97461b4(0x44dafb03f46f657d490fa516e5819e33f2d2eb57997faefae01be1d8b2bc8d79); /* statement */ 
if (msg.value > 0) {c_0xe97461b4(0x8a5f2752ee81eebfb406b1338c58806a15ec789df43278749f0de9ea4ef09488); /* branch */ 

c_0xe97461b4(0x1a281538945049ab9cc9cf8f279e4d9739940336c0c6d1d45bff0fed34673bdd); /* line */ 
                c_0xe97461b4(0x963dac253b59bf210ea133b5406c0ba1e9158e65167d0d211fa7be52ce527c1c); /* statement */ 
payable(msg.sender).sendValue(msg.value);
            }else { c_0xe97461b4(0x9a50668111c409654f060a84c726e8af24072f65a011182948ded19a1800cfd1); /* branch */ 
}
            //do nothing
        } else {c_0xe97461b4(0x8eb366dff574cb24179e662e06bd7bd76e5b35e6fe6e02db03648719b43cf96e); /* branch */ 

c_0xe97461b4(0x9a570f32e791dc5afe41142d0569b4a87e0cf628492f2a1b686c5a05b8da4b5b); /* line */ 
            c_0xe97461b4(0x5d6838ae6d4b1b008691fcd0b872b75dc3b76c293c9d5cc2ecb4747ec27a7786); /* statement */ 
revert("proposal has not been voted on yet");
        }}
    }

    /**
     * @notice Starts a vote on the proposal to onboard a new member.
     * @param proposalId The proposal id to be processed. It needs to exist in the DAO Registry.
     */
    function _sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) internal {c_0xe97461b4(0x7106bb5b147dbd12a0c5a254e5fc7c186c9189c3dbbffb22ef309fddf93bd77c); /* function */ 

c_0xe97461b4(0xa82ae782f7024e4e34f865983d5bcd4c0a7c3dbf57afc361ffcd7ba5d61444f8); /* line */ 
        c_0xe97461b4(0x97669b6f4cb827023ddb0a3ef7259a774bb894e9c150443c235f56088f15ab0e); /* statement */ 
IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
c_0xe97461b4(0xdd771acf2662a1d83d69702b3a98819823c268adc9441d143fd0878bf0bd2478); /* line */ 
        c_0xe97461b4(0xb197806f87c0fd61527166a81ac9e63723babae48935baeb475677b531e12526); /* statement */ 
address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
c_0xe97461b4(0x1154a24b894df78b439a4dc9c93fd74e407b51250e516aaa24dbf011830c1497); /* line */ 
        c_0xe97461b4(0x39a4b4b4f0db51026abc917c3e35f49845826152f8d180f647c3386f434dfb2b); /* statement */ 
dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
c_0xe97461b4(0xbcc7b8bbfbe7f4292f79c21ffcf505b62fdc6770d9a1271796d1bed6fa6dfecb); /* line */ 
        c_0xe97461b4(0xf79b0822ac5088ff44abca9d33b201c4a6d1fa87dc0e83855f72f2a342fbd85e); /* statement */ 
votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    /**
     * @notice Marks the proposalId as submitted in the DAO and saves the information in the internal adapter state.
     * @notice Updates the total of units issued in the DAO, and checks if it is within the limits.
     */
    function _submitMembershipProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address tokenToMint,
        address payable applicant,
        uint256 value,
        address token
    ) internal returns (uint160) {c_0xe97461b4(0xb5d5d212a87c389e4d9161d9e1e57586b1edf54c73abb3c826ded56043957d84); /* function */ 

c_0xe97461b4(0x961b28ca3687cb79f9ed9ca3e4014d466f9723a9941a7af6b041af8bd4ee433a); /* line */ 
        c_0xe97461b4(0xabfd1ce901eac0c8e34f1944148420d28ceb77382b07f03d271c4c7f7b060ff7); /* statement */ 
OnboardingDetails memory details = OnboardingDetails(0, 0, 0, 0, 0, 0);
c_0xe97461b4(0x14a2836a1445364304441a61977551dc25b3cb0a9b62a8c11fad14a02c9d3169); /* line */ 
        c_0xe97461b4(0x86421803fed8575f9c96c52d29c03eeb7b7fd86c3b9b263a6039d55e31910d9a); /* statement */ 
details.chunkSize = uint88(
            dao.getConfiguration(_configKey(tokenToMint, ChunkSize))
        );
c_0xe97461b4(0x78f9b528cbd128f64f28a3b1374bbfdb460fc32a1392a6e595077d26bab325fc); /* line */ 
        c_0xe97461b4(0x4d5f34421faf1f1c92b94c92e0ab4c2234d9f77f3153982ae87a485fc427cd28); /* requirePre */ 
c_0xe97461b4(0xeb9772bd419a0e5036ab9453c38a36bcbda9b824aa88919859b8363b8fb5d47c); /* statement */ 
require(details.chunkSize > 0, "config chunkSize missing");c_0xe97461b4(0x7ef43c2a1d07713e964902476feb32c02e3965da6c33f3c99a35ed20add18ee5); /* requirePost */ 


c_0xe97461b4(0xf9d0721d5b5b7db028edb7ff69a0e98274c9a45607051c9bffd40ba2d5084754); /* line */ 
        c_0xe97461b4(0x901d15ffad0d89eb87f1b4de93567f00df7713c50ba8cbb756313978b65fe2a4); /* statement */ 
details.numberOfChunks = uint88(value / details.chunkSize);
c_0xe97461b4(0x0afaca846195c901f2acaf25cfcd18a6044831f993cc96c3364231df38a7218d); /* line */ 
        c_0xe97461b4(0x5088275112822ea47287a3459c0f39d6fd8d0ad1f5e3f8e7ccb70d5c4de70ca8); /* requirePre */ 
c_0xe97461b4(0x3b97c1a17dcf4982f6abb82f70dd9362f4cd93fd00bee520fc9c39d44ecb875b); /* statement */ 
require(details.numberOfChunks > 0, "not sufficient funds");c_0xe97461b4(0x503a5651fffed5e926f9ef04eb4c6c2ca675ab7952b45e91265e938ab2a38d41); /* requirePost */ 


c_0xe97461b4(0x09e94b2ec007070fdb97aa95c0a35ba80affef338fdedc443424083da57f3efd); /* line */ 
        c_0xe97461b4(0xfeb5451a0305026c329fbe6336cc0d1ea3639467f7ed9259773f72a8ce843d72); /* statement */ 
details.unitsPerChunk = uint88(
            dao.getConfiguration(_configKey(tokenToMint, UnitsPerChunk))
        );

c_0xe97461b4(0xba76f071efcfddc3027a2374ecac2d0d317a349911dfd23afd7258c91655be47); /* line */ 
        c_0xe97461b4(0x802676e012004cd4a39793b9e828640f85bb6ad81efc5d3e8553c0acda92b81f); /* requirePre */ 
c_0xe97461b4(0xac97beb597ecfceaa2f0cd3ee599a2b777e5238fd87c987c47dda44b818872c1); /* statement */ 
require(details.unitsPerChunk > 0, "config unitsPerChunk missing");c_0xe97461b4(0xc385b5096f08f2e0ab15525eb1aa2e6b4378408f1b70a72748d01a8cff3958df); /* requirePost */ 

c_0xe97461b4(0x58618633546f0a30471e6d8829b0fb1b4bda8f9c378d7a1694b553a48e6e20f3); /* line */ 
        c_0xe97461b4(0x1731120a9a9990588fbad4cac1c2d47d8fe0bc12391dc7ce08156d7af95bb310); /* statement */ 
details.amount = details.numberOfChunks * details.chunkSize;
c_0xe97461b4(0x317168db86bde7d5e19e048227998c1c19ea9436dd481266a3ecd7b45ee50af6); /* line */ 
        c_0xe97461b4(0xd3f190eaac2409df087aa37e737c971bf95697b32932b1e5c09c58b8e33d8df8); /* statement */ 
details.unitsRequested = details.numberOfChunks * details.unitsPerChunk;

c_0xe97461b4(0x9ba2582e54e0136d44472553500a992b740e4fecdff02b0162cc46bca552dfb0); /* line */ 
        c_0xe97461b4(0x8f1f164c9abcadf005a968fa0c73444ef2e5b915b4263fbd51952cf167067952); /* statement */ 
details.totalUnits =
            _getUnits(dao, token, applicant) +
            details.unitsRequested;

c_0xe97461b4(0xf2fa6635183ef203d0204598bed69f3a9f68dce65dbf9b2f104663d47ab405ba); /* line */ 
        c_0xe97461b4(0x127949c53d7d2423333d1285ddaa3652abb7b0eaf49c476e6cb0b13066694eac); /* requirePre */ 
c_0xe97461b4(0xdd9f727e261dd96b557dc9b6afde8f1a4d5399fc10542b0a399bedb7a17dfa28); /* statement */ 
require(
            details.totalUnits / details.unitsPerChunk <
                dao.getConfiguration(_configKey(tokenToMint, MaximumChunks)),
            "total units for this member must be lower than the maximum"
        );c_0xe97461b4(0x6dc33c7b9e62419b674f35f90fd12c440a173451bf71066c1473f4fac4cd31d5); /* requirePost */ 


c_0xe97461b4(0xc44ac1a7f48bbae26457b6dd37fef4b2d49a5f1738be78ebcdd8550120a94323); /* line */ 
        c_0xe97461b4(0x138251f4170a0ddd1613873112c96c528f3d59353bc1ef3110eb82618a1791b4); /* statement */ 
proposals[dao][proposalId] = ProposalDetails(
            proposalId,
            tokenToMint,
            details.amount,
            details.unitsRequested,
            token,
            applicant
        );

c_0xe97461b4(0xd3ea13db88903e96e9e17d789749dbeae2dd6914240704b00bade0573347b313); /* line */ 
        c_0xe97461b4(0xe722aca9ec8ba463a82f08db03bfb59a3e8ec5e4123d3ac8861b4d5b118a7230); /* statement */ 
dao.submitProposal(proposalId);

c_0xe97461b4(0x6b21ac1b1ce2cbaaad4716085be17c7d4aa0f7c6ab4f8ffa16daad5d6b60c8f4); /* line */ 
        c_0xe97461b4(0x7df35c8fb74ed600e4d00362d195e97f6b4af44702c17a86215a87ba17c2fbf0); /* statement */ 
return details.amount;
    }

    /**
     * @notice Gets the current number of units.
     * @param dao The DAO that contains the units.
     * @param token The Token Address in which the Unit were minted.
     * @param applicant The Applicant Address which holds the units.
     */
    function _getUnits(
        DaoRegistry dao,
        address token,
        address applicant
    ) internal view returns (uint88) {c_0xe97461b4(0x718c7de1ec280d4d14ee5aaddb18e290c1b29547255d4682d7f6d784ca735041); /* function */ 

c_0xe97461b4(0xda16167e7c34ff03ab158684ecd3ab0854c421ac1f5dbfc66b2e0666aca8f6ca); /* line */ 
        c_0xe97461b4(0xdecc0127d1c6f6855f9d11b4269a8fe183fa98656ab1d7dcc03ac889b2cfd4dc); /* statement */ 
return units[dao][token][applicant];
    }

    /**
     * @notice Builds the configuration key by encoding an address with a string key.
     * @param tokenAddrToMint The address to encode.
     * @param key The key to encode.
     */
    function _configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
        returns (bytes32)
    {c_0xe97461b4(0xd22fd6bae1b64d6e40059ea79a707121275ce270c8d2de05b41c307a1346fe39); /* function */ 

c_0xe97461b4(0x3f53709881fa58008feea6cf38c30981c4f876b13ac226407cac7253de8354a4); /* line */ 
        c_0xe97461b4(0xd0f89928de4a9bef03fc59e2a8a20615204761426d07210175535bda79a0b439); /* statement */ 
return keccak256(abi.encode(tokenAddrToMint, key));
    }
}
