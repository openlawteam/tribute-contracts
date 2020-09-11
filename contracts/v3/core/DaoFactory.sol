pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './Registry.sol';
import '../core/interfaces/IVoting.sol';
import '../core/interfaces/IProposal.sol';
import '../core/interfaces/IMember.sol';
import '../adapters/Onboarding.sol';
import '../adapters/Financing.sol';
import '../core/banking/Bank.sol';

contract DaoFactory {

    event NewDao(address summoner, address dao);

    mapping(bytes32 => address) addresses;
    bytes32 constant BANK_MODULE = keccak256("bank");
    bytes32 constant MEMBER_MODULE = keccak256("member");
    bytes32 constant PROPOSAL_MODULE = keccak256("proposal");
    bytes32 constant VOTING_MODULE = keccak256("voting");
    bytes32 constant ONBOARDING_MODULE = keccak256("onboarding");
    bytes32 constant FINANCING_MODULE = keccak256("financing");

    constructor (address memberAddress, address proposalAddress, address votingAddress) {
        addresses[MEMBER_MODULE] = memberAddress;
        addresses[PROPOSAL_MODULE] = proposalAddress;
        addresses[VOTING_MODULE] = votingAddress;
    }

    //TODO - do we want to restrict the access to onlyOwner for this function?
    function newDao(uint256 chunkSize, uint256 nbShares, uint256 votingPeriod) external returns (address) {
        Registry dao = new Registry();
        BankContract bank = new BankContract(dao);
        //Registering Core Modules
        dao.updateRegistry(BANK_MODULE, address(bank));
        dao.updateRegistry(MEMBER_MODULE, addresses[MEMBER_MODULE]);
        dao.updateRegistry(PROPOSAL_MODULE, addresses[PROPOSAL_MODULE]);
        dao.updateRegistry(VOTING_MODULE, addresses[VOTING_MODULE]);

        //Registring Adapters
        dao.updateRegistry(ONBOARDING_MODULE, address(new OnboardingContract(address(dao), chunkSize, nbShares)));
        dao.updateRegistry(FINANCING_MODULE, address(new FinancingContract(address(dao))));

        IVoting votingContract = IVoting(addresses[VOTING_MODULE]);
        votingContract.registerDao(address(dao), votingPeriod);

        IMember memberContract = IMember(addresses[MEMBER_MODULE]);
        memberContract.updateMember(dao, msg.sender, 1);

        emit NewDao(msg.sender, address(dao));

        return address(dao);
    }
}