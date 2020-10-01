pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "./DaoConstants.sol";
import "./DaoRegistry.sol";
import "../adapters/Onboarding.sol";

contract DaoFactory is DaoConstants {
    event NewDao(address summoner, address dao);

    mapping(bytes32 => address) addresses;

    constructor(
        address votingAddress,
        address ragequitAddress,
        address managingAddress,
        address financingAddress,
        address onboardingAddress,
        address nonVotingMembershipAddress
    ) {
        addresses[VOTING] = votingAddress;
        addresses[RAGEQUIT] = ragequitAddress;
        addresses[MANAGING] = managingAddress;
        addresses[FINANCING] = financingAddress;
        addresses[ONBOARDING] = onboardingAddress;
        addresses[NONVOTING_MEMBERSHIP] = nonVotingMembershipAddress;
    }

    /*
     * @dev: A new DAO is instantiated with only the Core Modules enabled, to reduce the call cost.
     *       Another call must be made to enable the default Adapters, see @registerDefaultAdapters.
     */
    function newDao(
        uint256 chunkSize,
        uint256 nbShares,
        uint256 votingPeriod,
        uint256 gracePeriod
    ) external returns (address) {
        DaoRegistry dao = new DaoRegistry();
        address daoAddress = address(dao);

        //Registring Adapters
        dao.addAdapter(VOTING, addresses[VOTING]);
        dao.addAdapter(ONBOARDING, addresses[ONBOARDING]);
        dao.addAdapter(FINANCING, addresses[FINANCING]);
        dao.addAdapter(MANAGING, addresses[MANAGING]);
        dao.addAdapter(RAGEQUIT, addresses[RAGEQUIT]);
        dao.addAdapter(NONVOTING_MEMBERSHIP, addresses[NONVOTING_MEMBERSHIP]);

        IVoting votingContract = IVoting(addresses[VOTING]);
        votingContract.registerDao(dao, votingPeriod, gracePeriod);

        dao.updateMemberShares(msg.sender, 1);

        OnboardingContract onboardingContract = OnboardingContract(
            addresses[ONBOARDING]
        );
        onboardingContract.configureOnboarding(dao, chunkSize, nbShares);

        emit NewDao(msg.sender, daoAddress);

        return daoAddress;
    }
}
