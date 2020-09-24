pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./Module.sol";
import "./Registry.sol";
import "../adapters/interfaces/IVoting.sol";
import "../adapters/Onboarding.sol";
import "../adapters/Financing.sol";
import "../adapters/Managing.sol";
import "../adapters/Ragequit.sol";

contract DaoFactory is Module {
    event NewDao(address summoner, address dao);

    mapping(bytes32 => address) addresses;

    constructor(
        address votingAddress,
        address ragequitAddress,
        address managingAddress,
        address financingAddress,
        address onboardingAddress
    ) {
        addresses[VOTING_MODULE] = votingAddress;
        addresses[RAGEQUIT_MODULE] = ragequitAddress;
        addresses[MANAGING_MODULE] = managingAddress;
        addresses[FINANCING_MODULE] = financingAddress;
        addresses[ONBOARDING_MODULE] = onboardingAddress;
    }

    /*
     * @dev: A new DAO is instantiated with only the Core Modules enabled, to reduce the call cost.
     *       Another call must be made to enable the default Adapters, see @registerDefaultAdapters.
     */
    function newDao(
        uint256 chunkSize,
        uint256 nbShares,
        uint256 votingPeriod
    ) external returns (address) {
        Registry dao = new Registry();
        address daoAddress = address(dao);

        //Registring Adapters
        dao.addModule(VOTING_MODULE, addresses[VOTING_MODULE]);
        dao.addModule(ONBOARDING_MODULE, addresses[ONBOARDING_MODULE]);
        dao.addModule(FINANCING_MODULE, addresses[FINANCING_MODULE]);
        dao.addModule(MANAGING_MODULE, addresses[MANAGING_MODULE]);
        dao.addModule(RAGEQUIT_MODULE, addresses[RAGEQUIT_MODULE]);

        IVoting votingContract = IVoting(addresses[VOTING_MODULE]);
        votingContract.registerDao(dao, votingPeriod);

        dao.updateMember(dao, msg.sender, 1);

        OnboardingContract onboardingContract = OnboardingContract(
            addresses[ONBOARDING_MODULE]
        );
        onboardingContract.configureOnboarding(dao, chunkSize, nbShares);

        emit NewDao(msg.sender, daoAddress);

        return daoAddress;
    }
}
