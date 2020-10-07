pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT

import "./DaoConstants.sol";
import "./DaoRegistry.sol";
import "../adapters/Onboarding.sol";
import "../adapters/NonVotingOnboarding.sol";

contract DaoFactory is DaoConstants {

    struct Adapter {
        bytes32 id;
        address addr;
    }

    /*
     * @dev: A new DAO is instantiated with only the Core Modules enabled, to reduce the call cost.
     *       Another call must be made to enable the default Adapters, see @registerDefaultAdapters.
     */
    function setAdapters(
        DaoRegistry dao,
        Adapter[] calldata adapters) external {
            //Registring Adapters
        require(dao.state() == DaoRegistry.DaoState.CREATION, "this DAO has already been setup");
        
        for (uint256 i = 0; i < adapters.length; i++) {
            dao.addAdapter(adapters[i].id, adapters[i].addr);
        }
        /*
        IVoting votingContract = IVoting(addresses[VOTING]);
        votingContract.registerDao(dao, votingPeriod, gracePeriod);

        dao.updateMemberShares(msg.sender, 1);

        OnboardingContract onboardingContract = OnboardingContract(
            addresses[ONBOARDING]
        );
        onboardingContract.configureOnboarding(dao, chunkSize, nbShares);
        */
    }
}
