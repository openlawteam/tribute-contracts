pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import './Module.sol';
import './Registry.sol';
import '../core/interfaces/IVoting.sol';
import '../core/interfaces/IProposal.sol';
import '../core/interfaces/IMember.sol';
import '../adapters/Onboarding.sol';
import '../adapters/Financing.sol';
import '../core/banking/Bank.sol';

contract DaoFactory is Module {

    event NewDao(address summoner, address dao);

    mapping(bytes32 => address) addresses;

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
        dao.addModule(BANK_MODULE, address(bank));
        dao.addModule(MEMBER_MODULE, addresses[MEMBER_MODULE]);
        dao.addModule(PROPOSAL_MODULE, addresses[PROPOSAL_MODULE]);
        dao.addModule(VOTING_MODULE, addresses[VOTING_MODULE]);

        //Registring Adapters
        dao.addModule(ONBOARDING_MODULE, address(new OnboardingContract(address(dao), chunkSize, nbShares)));
        dao.addModule(FINANCING_MODULE, address(new FinancingContract(address(dao))));

        IVoting votingContract = IVoting(addresses[VOTING_MODULE]);
        votingContract.registerDao(address(dao), votingPeriod);

        IMember memberContract = IMember(addresses[MEMBER_MODULE]);
        memberContract.updateMember(dao, msg.sender, 1);

        emit NewDao(msg.sender, address(dao));

        return address(dao);
    }
}