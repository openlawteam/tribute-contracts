pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './ModuleRegistry.sol';
import './Proposal.sol';
import './Voting.sol';

contract DaoFactory {

    event NewDao(address summoner, address dao);

    mapping(bytes32 => address) addresses;
    bytes32 constant BANK_MODULE = keccak256("bank");
    bytes32 constant MEMBER_MODULE = keccak256("member");
    bytes32 constant PROPOSAL_MODULE = keccak256("proposal");
    bytes32 constant VOTING_MODULE = keccak256("voting");

    constructor (address bankAddress, address memberAddress, address proposalAddress, address votingAddress) {
        addresses[BANK_MODULE] = bankAddress;
        addresses[MEMBER_MODULE] = memberAddress;
        addresses[PROPOSAL_MODULE] = proposalAddress;
        addresses[VOTING_MODULE] = votingAddress;
    }

    function newDao() external returns (address) {
        ModuleRegistry dao = new ModuleRegistry();
        dao.updateRegistry(BANK_MODULE, addresses[BANK_MODULE]);
        dao.updateRegistry(MEMBER_MODULE, addresses[MEMBER_MODULE]);
        dao.updateRegistry(PROPOSAL_MODULE, addresses[PROPOSAL_MODULE]);
        dao.updateRegistry(VOTING_MODULE, addresses[VOTING_MODULE]);

        emit NewDao(msg.sender, address(dao));

        return address(dao);
    }
}