pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IOnboarding.sol";
import "../core/DaoRegistry.sol";
import "../extensions/bank/Bank.sol";
import "../adapters/interfaces/IVoting.sol";
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

contract OnboardingContract is IOnboarding, AdapterGuard {
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
            _configKey(unitsToMint, MaximumChunks),
            maximumChunks
        );
        dao.setConfiguration(_configKey(unitsToMint, ChunkSize), chunkSize);
        dao.setConfiguration(
            _configKey(unitsToMint, UnitsPerChunk),
            unitsPerChunk
        );
        dao.setAddressConfiguration(
            _configKey(unitsToMint, TokenAddr),
            tokenAddr
        );

        BankExtension bank = BankExtension(
            dao.getExtensionAddress(DaoHelper.BANK)
        );
        bank.registerPotentialNewInternalToken(unitsToMint);
        bank.registerPotentialNewToken(tokenAddr);
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
    ) external override reentrancyGuard(dao) {
        require(
            DaoHelper.isNotReservedAddress(applicant),
            "applicant is reserved address"
        );

        DaoHelper.potentialNewMember(
            applicant,
            dao,
            BankExtension(dao.getExtensionAddress(DaoHelper.BANK))
        );

        address tokenAddr = dao.getAddressConfiguration(
            _configKey(tokenToMint, TokenAddr)
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

    /**
     * @notice Once the vote on a proposal is finished, it is time to process it. Anybody can call this function.
     * @param proposalId The proposal id to be processed. It needs to exist in the DAO Registry.
     */
    // slither-disable-next-line reentrancy-benign
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
            BankExtension bank = BankExtension(
                dao.getExtensionAddress(DaoHelper.BANK)
            );
            require(
                bank.isInternalToken(unitsToMint),
                "it can only mint units"
            );

            bank.addToBalance(applicant, unitsToMint, unitsRequested);

            address daoAddress = address(dao);
            if (token == DaoHelper.ETH_TOKEN) {
                // This call sends ETH directly to the GUILD bank, and the address can't be changed since
                // it is defined in the DaoHelper as a constant.
                //slither-disable-next-line arbitrary-send
                bank.addToBalance{value: amount}(
                    DaoHelper.GUILD,
                    token,
                    amount
                );
                if (msg.value > amount) {
                    payable(msg.sender).sendValue(msg.value - amount);
                }
            } else {
                bank.addToBalance(DaoHelper.GUILD, token, amount);
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

    /**
     * @notice Starts a vote on the proposal to onboard a new member.
     * @param proposalId The proposal id to be processed. It needs to exist in the DAO Registry.
     */
    function _sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) internal {
        IVoting votingContract = IVoting(
            dao.getAdapterAddress(DaoHelper.VOTING)
        );
        address sponsoredBy = votingContract.getSenderAddress(
            dao,
            address(this),
            data,
            msg.sender
        );
        dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract));
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
    ) internal returns (uint160) {
        OnboardingDetails memory details = OnboardingDetails(0, 0, 0, 0, 0, 0);
        details.chunkSize = uint88(
            dao.getConfiguration(_configKey(tokenToMint, ChunkSize))
        );
        require(details.chunkSize > 0, "config chunkSize missing");

        details.numberOfChunks = uint88(value / details.chunkSize);
        require(details.numberOfChunks > 0, "not sufficient funds");

        details.unitsPerChunk = uint88(
            dao.getConfiguration(_configKey(tokenToMint, UnitsPerChunk))
        );

        require(details.unitsPerChunk > 0, "config unitsPerChunk missing");
        details.amount = details.numberOfChunks * details.chunkSize;
        details.unitsRequested = details.numberOfChunks * details.unitsPerChunk;

        details.totalUnits =
            _getUnits(address(dao), token, applicant) +
            details.unitsRequested;

        require(
            details.totalUnits / details.unitsPerChunk <
                dao.getConfiguration(_configKey(tokenToMint, MaximumChunks)),
            "total units for this member must be lower than the maximum"
        );

        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            tokenToMint,
            details.amount,
            details.unitsRequested,
            token,
            applicant
        );

        dao.submitProposal(proposalId);

        return details.amount;
    }

    /**
     * @notice Gets the current number of units.
     * @param daoAddress The DAO Address that contains the units.
     * @param token The Token Address in which the Unit were minted.
     * @param applicant The Applicant Address which holds the units.
     */
    function _getUnits(
        address daoAddress,
        address token,
        address applicant
    ) internal view returns (uint88) {
        return units[daoAddress][token][applicant];
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
    {
        return keccak256(abi.encode(tokenAddrToMint, key));
    }
}
