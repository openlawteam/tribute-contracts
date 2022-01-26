pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoConstants.sol";
import "../core/DaoRegistry.sol";
import "../utils/PotentialNewMember.sol";
import "../extensions/bank/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../guards/AdapterGuard.sol";
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

contract OnboardingContract is
    IOnboarding,
    DaoConstants,
    PotentialNewMember,
    MemberGuard,
    AdapterGuard
{
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
    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;
    // minted units per dao, per token, per applicant
    mapping(address => mapping(address => mapping(address => uint88)))
        public units;

    function configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(tokenAddrToMint, key));
    }

    function configureDao(
        DaoRegistry dao,
        address unitsToMint,
        uint256 chunkSize,
        uint256 unitsPerChunk,
        uint256 maximumChunks,
        address tokenAddr
    ) external onlyAdapter(dao) {
        require(
            chunkSize > 0 && chunkSize < type(uint88).max,
            "chunkSize::invalid"
        );
        require(
            maximumChunks > 0 && maximumChunks < type(uint88).max,
            "maximumChunks::invalid"
        );
        require(
            unitsPerChunk > 0 && unitsPerChunk < type(uint88).max,
            "unitsPerChunk::invalid"
        );
        require(
            maximumChunks * unitsPerChunk < type(uint88).max,
            "potential overflow"
        );

        dao.setConfiguration(
            configKey(unitsToMint, MaximumChunks),
            maximumChunks
        );
        dao.setConfiguration(configKey(unitsToMint, ChunkSize), chunkSize);
        dao.setConfiguration(
            configKey(unitsToMint, UnitsPerChunk),
            unitsPerChunk
        );
        dao.setAddressConfiguration(
            configKey(unitsToMint, TokenAddr),
            tokenAddr
        );

        BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
        require(bank.dao() == dao, "wrong dao");
        bank.registerPotentialNewInternalToken(unitsToMint);
        bank.registerPotentialNewToken(tokenAddr);
    }

    function submitProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount,
        bytes memory data
    ) public override reentrancyGuard(dao) {
        require(
            isNotReservedAddress(applicant),
            "applicant is reserved address"
        );

        potentialNewMember(
            applicant,
            dao,
            BankExtension(dao.getExtensionAddress(BANK))
        );

        address tokenAddr = dao.getAddressConfiguration(
            configKey(tokenToMint, TokenAddr)
        );

        _submitMembershipProposal(
            dao,
            proposalId,
            tokenToMint,
            applicant,
            tokenAmount,
            tokenAddr
        );

        _sponsorProposal(dao, proposalId, data);
    }

    function _sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) internal {
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
        dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
    }

    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        payable
        override
        reentrancyGuard(dao)
    {
        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        require(proposal.id == proposalId, "proposal does not exist");
        require(
            !dao.getProposalFlag(
                proposalId,
                DaoRegistry.ProposalFlag.PROCESSED
            ),
            "proposal already processed"
        );

        IVoting votingContract = IVoting(dao.votingAdapter(proposalId));
        require(address(votingContract) != address(0), "adapter not found");

        IVoting.VotingState voteResult = votingContract.voteResult(
            dao,
            proposalId
        );

        dao.processProposal(proposalId);

        address token = proposal.token;
        uint256 amount = proposal.amount;
        if (voteResult == IVoting.VotingState.PASS) {
            address unitsToMint = proposal.unitsToMint;
            uint256 unitsRequested = proposal.unitsRequested;
            address applicant = proposal.applicant;
            BankExtension bank = BankExtension(dao.getExtensionAddress(BANK));
            require(bank.dao() == dao, "wrong dao");
            require(
                bank.isInternalToken(unitsToMint),
                "it can only mint units"
            );

            bank.addToBalance(applicant, unitsToMint, unitsRequested);

            address daoAddress = address(dao);
            if (token == ETH_TOKEN) {
                bank.addToBalance{value: amount}(GUILD, token, amount);
                if (msg.value > amount) {
                    payable(msg.sender).sendValue(msg.value - amount);
                }
            } else {
                bank.addToBalance(GUILD, token, amount);
                IERC20 erc20 = IERC20(token);
                erc20.safeTransferFrom(msg.sender, address(bank), amount);
            }

            uint88 totalUnits = _getUnits(daoAddress, unitsToMint, applicant) +
                proposal.unitsRequested;
            units[daoAddress][unitsToMint][applicant] = totalUnits;
        } else if (
            voteResult == IVoting.VotingState.NOT_PASS ||
            voteResult == IVoting.VotingState.TIE
        ) {
            if (msg.value > 0) {
                payable(msg.sender).sendValue(msg.value);
            }
            //do nothing
        } else {
            revert("proposal has not been voted on yet");
        }
    }

    function _submitMembershipProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        address tokenToMint,
        address payable applicant,
        uint256 value,
        address token
    ) internal returns (uint160) {
        OnboardingDetails memory details;
        details.chunkSize = uint88(
            dao.getConfiguration(configKey(tokenToMint, ChunkSize))
        );
        require(details.chunkSize > 0, "config chunkSize missing");

        details.numberOfChunks = uint88(value / details.chunkSize);
        require(details.numberOfChunks > 0, "not sufficient funds");

        details.unitsPerChunk = uint88(
            dao.getConfiguration(configKey(tokenToMint, UnitsPerChunk))
        );

        require(details.unitsPerChunk > 0, "config unitsPerChunk missing");
        details.amount = details.numberOfChunks * details.chunkSize;
        details.unitsRequested = details.numberOfChunks * details.unitsPerChunk;

        details.totalUnits =
            _getUnits(address(dao), token, applicant) +
            details.unitsRequested;

        require(
            details.totalUnits / details.unitsPerChunk <
                dao.getConfiguration(configKey(tokenToMint, MaximumChunks)),
            "total units for this member must be lower than the maximum"
        );

        dao.submitProposal(proposalId);
        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            tokenToMint,
            details.amount,
            details.unitsRequested,
            token,
            applicant
        );

        return details.amount;
    }

    function _getUnits(
        address daoAddress,
        address token,
        address applicant
    ) internal view returns (uint88) {
        return units[daoAddress][token][applicant];
    }
}
