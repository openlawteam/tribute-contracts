pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../utils/SafeMath.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
import "../guards/DaoGuard.sol";

contract OnboardingContract is
    IOnboarding,
    DaoConstants,
    MemberGuard,
    AdapterGuard,
    DaoGuard
{
    using SafeMath for uint256;

    struct ProposalDetails {
        uint256 id;
        uint256 amount;
        uint256 sharesRequested;
        address token;
        bool processed;
        address applicant;
    }

    struct OnboardingConfig {
        uint256 chunkSize;
        uint256 sharesPerChunk;
        address tokenAddr;
    }

    mapping(address => OnboardingConfig) public configs;
    mapping(address => mapping(uint256 => ProposalDetails)) public proposals;

    function configureDao(
        DaoRegistry dao,
        uint256 chunkSize,
        uint256 sharesPerChunk,
        address tokenAddr
    ) external onlyAdapter(dao) {
        configs[address(dao)].chunkSize = chunkSize;
        configs[address(dao)].sharesPerChunk = sharesPerChunk;
        configs[address(dao)].tokenAddr = tokenAddr;
    }

    function _submitMembershipProposal(
        DaoRegistry dao,
        address applicant,
        uint256 value,
        address token
    ) internal returns (uint256) {
        OnboardingConfig memory config = configs[address(dao)];

        require(config.sharesPerChunk > 0, "sharesPerChunk should not be 0");
        require(config.chunkSize > 0, "chunkSize should not be 0");

        uint256 numberOfChunks = value.div(config.chunkSize);
        require(numberOfChunks > 0, "not sufficient funds");

        uint256 amount = numberOfChunks.mul(config.chunkSize);
        uint256 sharesRequested = numberOfChunks.mul(config.sharesPerChunk);

        _submitMembershipProposalInternal(
            dao,
            applicant,
            sharesRequested,
            amount,
            token
        );

        return amount;
    }

    function onboard(
        DaoRegistry dao,
        uint256 tokenAmount
    ) external payable override{
        address tokenAddr = configs[address(dao)].tokenAddr;
        if (tokenAddr == ETH_TOKEN) {
            // ETH onboarding
            require(msg.value > 0, "not enough ETH");
            // If the applicant sends ETH to onboard, use the msg.value as default token amount
            tokenAmount = msg.value;
        } else {
            IERC20 token = IERC20(tokenAddr);
            // ERC20 onboarding
            require(
                token.allowance(msg.sender, address(this)) >= tokenAmount,
                "ERC20 transfer not allowed"
            );
            require(
                token.transferFrom(msg.sender, address(this), tokenAmount),
                "ERC20 failed transferFrom"
            );
        }

        uint256 amountUsed = _submitMembershipProposal(
            dao,
            msg.sender,
            tokenAmount,
            tokenAddr
        );

        if (amountUsed < tokenAmount) {
            uint256 amount = tokenAmount - amountUsed;
            if (tokenAddr == ETH_TOKEN) {
                msg.sender.transfer(amount);
            } else {
                IERC20 token = IERC20(tokenAddr);
                require(
                    token.transfer(msg.sender, amount),
                    "ERC20 failed transfer"
                );
            }
        }
    }

    function updateDelegateKey(DaoRegistry dao, address delegateKey) external {
        dao.updateDelegateKey(msg.sender, delegateKey);
    }

    function _submitMembershipProposalInternal(
        DaoRegistry dao,
        address newMember,
        uint256 sharesRequested,
        uint256 amount,
        address token
    ) internal {
        uint256 proposalId = dao.submitProposal(msg.sender);
        ProposalDetails memory p = ProposalDetails(
            proposalId,
            amount,
            sharesRequested,
            token,
            false,
            newMember
        );
        proposals[address(dao)][proposalId] = p;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );
        dao.sponsorProposal(proposalId, msg.sender, data);
    }

    function processProposal(DaoRegistry dao, uint256 proposalId)
        external
        override
        onlyMember(dao)
    {
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal need to pass"
        );
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];

        _mintSharesToMember(dao, proposal.applicant, proposal.sharesRequested);

        dao.addToBalance(GUILD, ETH_TOKEN, proposal.amount);
        dao.processProposal(proposalId);
    }

    function _mintSharesToMember(DaoRegistry dao, address memberAddr, uint256 shares) internal {
        dao.balanceOf(TOTAL, LOOT).add(dao.balanceOf(TOTAL, SHARES)).add(shares); // this throws if it overflows
        dao.addToBalance(memberAddr, SHARES, shares);
    }
}
