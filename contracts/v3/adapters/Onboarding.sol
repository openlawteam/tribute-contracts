pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/Module.sol";
import "../core/Registry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../utils/SafeMath.sol";
import "../guards/AdapterGuard.sol";
import "../guards/ModuleGuard.sol";

contract OnboardingContract is IOnboarding, Module, AdapterGuard, ModuleGuard {
    using SafeMath for uint256;

    struct ProposalDetails {
        uint id;
        uint256 amount;
        uint256 sharesRequested;
        bool processed;
        address applicant;
    }

    struct OnboardingConfig {
        uint256 chunkSize;
        uint256 sharesPerChunk;
    }

    mapping(address => OnboardingConfig) public configs;
    mapping(address => mapping(uint256 => ProposalDetails)) public proposals;

    function configureOnboarding(
        Registry dao,
        uint256 chunkSize,
        uint256 sharesPerChunk
    ) external onlyModule(dao) {
        configs[address(dao)].chunkSize = chunkSize;
        configs[address(dao)].sharesPerChunk = sharesPerChunk;
    }

    function processOnboarding(
        Registry dao,
        address applicant,
        uint256 value
    ) external override returns (uint256) {
        OnboardingConfig memory config = configs[address(dao)];

        require(config.sharesPerChunk > 0, "shares per chunk should not be 0");
        require(config.chunkSize > 0, "shares per chunk should not be 0");

        uint256 numberOfChunks = value.div(config.chunkSize);
        require(numberOfChunks > 0, "not sufficient ETH");
        uint256 amount = numberOfChunks.mul(config.chunkSize);
        uint256 sharesRequested = numberOfChunks.mul(config.sharesPerChunk);

        _submitMembershipProposal(dao, applicant, sharesRequested, amount);

        return amount;
    }

    function updateDelegateKey(Registry dao, address delegateKey) external {
        IMember memberContract = IMember(dao.getAddress(MEMBER_MODULE));
        memberContract.updateDelegateKey(dao, msg.sender, delegateKey);
    }

    function _submitMembershipProposal(
        Registry dao,
        address newMember,
        uint256 sharesRequested,
        uint256 amount
    ) internal {
        uint256 proposalId = dao.submitProposal(msg.sender);
        ProposalDetails memory p = ProposalDetails(proposalId, amount, sharesRequested, false, newMember);
        proposals[address(dao)][proposalId] = p;
    }

    function sponsorProposal(
        Registry dao,
        uint256 proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        require(
            proposals[address(dao)][proposalId].id == proposalId, 
            "proposal does not exist"
        );
        dao.sponsorProposal(proposalId, msg.sender, data);
    }

    function processProposal(Registry dao, uint256 proposalId)
        external
        override
        onlyMember(dao)
    {
        require(
            proposals[address(dao)][proposalId].id == proposalId, 
            "proposal does not exist"
        );
        
        IVoting votingContract = IVoting(dao.getAddress(VOTING_MODULE));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal need to pass"
        );
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];

        IMember memberContract = IMember(dao.getAddress(MEMBER_MODULE));
        memberContract.updateMember(
            dao,
            proposal.applicant,
            proposal.sharesRequested
        );

        // address 0 represents native ETH
        dao.addToGuild(dao, address(0), proposal.amount);
        dao.processProposal(proposalId);
    }
}
