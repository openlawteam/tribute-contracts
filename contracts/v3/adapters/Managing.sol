pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/DaoConstants.sol";
import "../core/Registry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/MemberGuard.sol";
import "../utils/SafeMath.sol";

contract ManagingContract is IManaging, DaoConstants, MemberGuard {
    using SafeMath for uint256;

    struct ProposalDetails {
        address applicant;
        bytes32 moduleId;
        address moduleAddress;
        bool processed;
    }

    mapping(uint256 => ProposalDetails) public proposals;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function createModuleChangeRequest(
        Registry dao,
        bytes32 moduleId,
        address moduleAddress
    ) external override onlyMember(dao) returns (uint256) {
        require(moduleAddress != address(0x0), "invalid module address");

        require(
            dao.isNotReservedAddress(moduleAddress),
            "module is using reserved address"
        );

        //FIXME: is there a way to check if the new module implements the module interface properly?

        uint256 proposalId = dao.submitProposal(msg.sender);

        ProposalDetails storage proposal = proposals[proposalId];
        proposal.applicant = msg.sender;
        proposal.moduleId = moduleId;
        proposal.moduleAddress = moduleAddress;
        proposal.processed = false;
        return proposalId;
    }

    function sponsorProposal(
        Registry dao,
        uint256 proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        dao.sponsorProposal(proposalId, msg.sender, data);
    }

    function processProposal(Registry dao, uint256 proposalId)
        external
        override
        onlyMember(dao)
    {
        ProposalDetails memory proposal = proposals[proposalId];
        require(!proposal.processed, "proposal already processed");

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        dao.removeAdapter(proposal.moduleId);
        dao.addAdapter(proposal.moduleId, proposal.moduleAddress);
        proposals[proposalId].processed = true;
        dao.processProposal(proposalId);
    }
}
