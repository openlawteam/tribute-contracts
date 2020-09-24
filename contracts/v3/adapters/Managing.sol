pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./interfaces/IManaging.sol";
import "../core/Module.sol";
import "../core/Registry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../core/interfaces/IBank.sol";
import "../guards/AdapterGuard.sol";
import "../utils/SafeMath.sol";

contract ManagingContract is IManaging, Module, AdapterGuard {
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

        IBank bankContract = IBank(dao.getAddress(BANK_MODULE));
        require(
            bankContract.isNotReservedAddress(moduleAddress),
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

        IVoting votingContract = IVoting(dao.getAddress(VOTING_MODULE));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        dao.removeModule(proposal.moduleId);
        dao.addModule(proposal.moduleId, proposal.moduleAddress);
        proposals[proposalId].processed = true;
        dao.processProposal(proposalId);
    }
}
