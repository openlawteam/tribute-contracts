pragma solidity ^0.8.0;
function c_0xc2f9ae45(bytes32 c__0xc2f9ae45) pure {}


// SPDX-License-Identifier: MIT
import "../../../core/DaoRegistry.sol";
import "../../../extensions/IExtension.sol";
import "../../../helpers/DaoHelper.sol";

/**
MIT License

Copyright (c) 2021 Openlaw

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
contract InternalTokenVestingExtension is IExtension {
function c_0xb8ceb7b2(bytes32 c__0xb8ceb7b2) public pure {}

    enum AclFlag {
        NEW_VESTING,
        REMOVE_VESTING
    }

    bool private _initialized;

    DaoRegistry private _dao;

    struct VestingSchedule {
        uint64 startDate;
        uint64 endDate;
        uint88 blockedAmount;
    }

    modifier hasExtensionAccess(DaoRegistry dao, AclFlag flag) {c_0xb8ceb7b2(0x708c82ab9b36d78508e4713f9b6ba1e72593a37b341be91fa75f3addcc70aaef); /* function */ 

c_0xb8ceb7b2(0x959097d63919d628861cffa281195f1a904cb6bcf3c9bde48f14f1e2f156d0e4); /* line */ 
        c_0xb8ceb7b2(0x984deaf610ff5abf114c3f22e32df37bc358b36c388f3e6290b03d3950ebe1db); /* requirePre */ 
c_0xb8ceb7b2(0x129aead891f935582b5f2b700084f8fdbd44df6eec94f6de4ac832940e16feee); /* statement */ 
require(
            dao == _dao &&
                (DaoHelper.isInCreationModeAndHasAccess(_dao) ||
                    _dao.hasAdapterAccessToExtension(
                        msg.sender,
                        address(this),
                        uint8(flag)
                    )),
            "vestingExt::accessDenied"
        );c_0xb8ceb7b2(0xd4a7d1a21f9390796104b2cffeb9901e9093ad38f99bff5a857d246018f44276); /* requirePost */ 


c_0xb8ceb7b2(0xaa79b06717753fe1f8f2a787716b6ac24c4ea76e954b53e30900e8f6c123943f); /* line */ 
        _;
    }

    mapping(address => mapping(address => VestingSchedule)) public vesting;

    /// @notice Clonable contract must have an empty constructor
    constructor() {c_0xb8ceb7b2(0x20c42935d5aefbbcffefb570941e2b11daad9dda489c195bc4b39e9ea2cab7fd); /* function */ 
}

    /**
     * @notice Initializes the extension with the DAO that it belongs to.
     * @param dao The address of the DAO that owns the extension.
     */
    function initialize(DaoRegistry dao, address) external override {c_0xb8ceb7b2(0x0c3a25237702377e3aa7f577c0b9d9b0d8b69ffcb884737698fbd7954ba99b8a); /* function */ 

c_0xb8ceb7b2(0x9671b412d7da976e5bd609ae01c9f43884f5133c38ca6505104691d6147d5cd5); /* line */ 
        c_0xb8ceb7b2(0xa7863ad05299fb9b8c0780778fbe43cfc75b853c6b94dbc35b4188292ad14410); /* requirePre */ 
c_0xb8ceb7b2(0x44963557efbe7d3d45025ef9d6d816ee9486f2c74d6a600162aa910400a03191); /* statement */ 
require(!_initialized, "vestingExt::already initialized");c_0xb8ceb7b2(0x2ec018e10c51c33704eb98d6fda13a97c3ac06595e6a86c862a8f48f795bf690); /* requirePost */ 

c_0xb8ceb7b2(0x30d1fd247448068c87a1ddeef7dcae663e65bffd9b9362cf3bc477a3e01cf259); /* line */ 
        c_0xb8ceb7b2(0xc86bb616d24f2aa5fb3ab6e0ef3e34369a4ada5c25306f0dd9990c65555135e6); /* statement */ 
_initialized = true;
c_0xb8ceb7b2(0xfc4731fdc1722930e155a39b03ba8b8181bf38698d2785eae81a653f49bd2f64); /* line */ 
        c_0xb8ceb7b2(0xb1cccb72b157bacb5b566b67d41c2f5d50f1b2785201d27b862808af9c73c452); /* statement */ 
_dao = dao;
    }

    /**
     * @notice Creates a new vesting schedule for a member based on the internal token, amount and end date.
     * @param member The member address to update the balance.
     * @param internalToken The internal DAO token in which the member will receive the funds.
     * @param amount The amount staked.
     * @param endDate The unix timestamp in which the vesting schedule ends.
     */
    function createNewVesting(
        DaoRegistry dao,
        address member,
        address internalToken,
        uint88 amount,
        uint64 endDate
    ) external hasExtensionAccess(dao, AclFlag.NEW_VESTING) {c_0xb8ceb7b2(0x98aaed8e9802debd23024af2ec205cf3ed0ced6272eeb02cdb3fde3bd7d4e15f); /* function */ 

        //slither-disable-next-line timestamp
c_0xb8ceb7b2(0xa657ca3d28eb5cef170c7c63be795b1dc264376aaee6a066c5ee5d4326429474); /* line */ 
        c_0xb8ceb7b2(0xc275f9491f4bd6201456c969570dad321ef33aa6008aed6a3cab3e3c61a797f1); /* requirePre */ 
c_0xb8ceb7b2(0xd68692107a266b9008578569c8411404df15b4374a2af9db124e09047583a85a); /* statement */ 
require(endDate > block.timestamp, "vestingExt::end date in the past");c_0xb8ceb7b2(0x955db889cd6ef25a7dcee0fb4145f28adcb0a6938c7ae090bde09f14a29512a0); /* requirePost */ 

c_0xb8ceb7b2(0x979b195fb114d8c6ca02ece48a5ff32660b5036309f26e45342fac52d0680b77); /* line */ 
        c_0xb8ceb7b2(0x52134988adbbe2b5fbaef0fa2e859f878f5c8ff8ea420ab1456e2ddf133c0938); /* statement */ 
VestingSchedule storage schedule = vesting[member][internalToken];
c_0xb8ceb7b2(0x7c9382653e800d193bfc5db3e094e7dc9ab3bff28f92c25a9e36874d1454cbd6); /* line */ 
        c_0xb8ceb7b2(0xf86df10f066ba83eab26b41fa2fa1134d0af4286cd6be3597439604fbc774068); /* statement */ 
uint88 minBalance = getMinimumBalanceInternal(
            schedule.startDate,
            schedule.endDate,
            schedule.blockedAmount
        );

c_0xb8ceb7b2(0xa9fead8321d0e62e9d3f6959eba5c36a7046994b2b606bed4d2daea259abd339); /* line */ 
        c_0xb8ceb7b2(0x63f09639e0f39a8e05b47088bfedf774fc9bfe8222cdcc2884f5809d796ae82e); /* statement */ 
schedule.startDate = uint64(block.timestamp);
        //get max value between endDate and previous one
c_0xb8ceb7b2(0xaa8aee842fdf4a236a700a4cdce0c550c51548775fe5987d65089e5e9b2a2cce); /* line */ 
        c_0xb8ceb7b2(0x0762656a95005ff4a46538d2c6225ed4e9006318c120516e6633af8c70abdbf1); /* statement */ 
if (endDate > schedule.endDate) {c_0xb8ceb7b2(0x3f77957fc2af5ac4eaedca83461c7a08193bc465d63174b4cce28906b4f9f8c7); /* branch */ 

c_0xb8ceb7b2(0x10d0891ded82e2903911e18d5129ef83b7df2b13043d022db5b539512144f461); /* line */ 
            c_0xb8ceb7b2(0x828f25799d9bbce7aadacd3bf61757b18e4feedf8447a7dd0d1bbc125c3924db); /* statement */ 
schedule.endDate = endDate;
        }else { c_0xb8ceb7b2(0x05486f83a1794ac9896b26bed4036dcf574db8698061e07ae4f395bfc4d8d628); /* branch */ 
}

c_0xb8ceb7b2(0x508798cef4d4e2b5b206f5038f9536d64585c5c46c6e72bf6be83871bc40a2c0); /* line */ 
        c_0xb8ceb7b2(0x8c83d2bfa7214115b376170e9b75ddce53da6407a63c545593815b8c3d2a83af); /* statement */ 
schedule.blockedAmount = minBalance + amount;
    }

    /**
     * @notice Updates a vesting schedule of a member based on the internal token, and amount.
     * @param member The member address to update the balance.
     * @param internalToken The internal DAO token in which the member will receive the funds.
     * @param amountToRemove The amount to be removed.
     */
    function removeVesting(
        DaoRegistry dao,
        address member,
        address internalToken,
        uint88 amountToRemove
    ) external hasExtensionAccess(dao, AclFlag.REMOVE_VESTING) {c_0xb8ceb7b2(0x9db547f9e0d4a3c3d2a4094cad8d9d295f1391d39707048f588c0ecbae08f02b); /* function */ 

c_0xb8ceb7b2(0xa4080f2a90902bf6e9c8d65db34db95ebc15a50cfa6b5809140db8f74bd75a47); /* line */ 
        c_0xb8ceb7b2(0xde059dd65d0d22899bec708b5f266671765d989be42a390d921b86304b47411c); /* statement */ 
vesting[member][internalToken].blockedAmount -= amountToRemove;
    }

    /**
     * @notice Returns the minimum balance of the vesting for a given member and internal token.
     * @param member The member address to update the balance.
     * @param internalToken The internal DAO token in which the member will receive the funds.
     */
    function getMinimumBalance(address member, address internalToken)
        external
        view
        returns (uint88)
    {c_0xb8ceb7b2(0x4fabf19df2d89dc562c97dfa5ede1fb568914bbf9e0af7d4dc0e308d35f8c79c); /* function */ 

c_0xb8ceb7b2(0xc892fcedf209804934dce1a947eff1e7cd80598c746cc47e686c905f6fcb82ee); /* line */ 
        c_0xb8ceb7b2(0xabb6157f0465b1382eb29cb644358a7ed80462f83feac55d7ea794098bd4189f); /* statement */ 
VestingSchedule storage schedule = vesting[member][internalToken];
c_0xb8ceb7b2(0x8bdbad5a93ac925faaf0739a5731575bde1e33255d2fec6459215912b1c1431a); /* line */ 
        c_0xb8ceb7b2(0xc1c503d7ad56f08de89d8f88814dda993f3d37eea772eaa98dd7deb7d9d15f23); /* statement */ 
return
            getMinimumBalanceInternal(
                schedule.startDate,
                schedule.endDate,
                schedule.blockedAmount
            );
    }

    /**
     * @notice Returns the minimum balance of the vesting for a given start date, end date, and amount.
     * @param startDate The start date of the vesting to calculate the elapsed time.
     * @param endDate The end date of the vesting to calculate the vesting period.
     * @param amount The amount staked.
     */
    function getMinimumBalanceInternal(
        uint64 startDate,
        uint64 endDate,
        uint88 amount
    ) public view returns (uint88) {c_0xb8ceb7b2(0xf21b86a0309f365482f9a3e5fd899d2db7f72760ba48d182bd29d6468f8ea906); /* function */ 

        //slither-disable-next-line timestamp
c_0xb8ceb7b2(0xcaa630757c9642da14a3c52463be384eadf82cc75a3a38b8ffc6a7815dde9185); /* line */ 
        c_0xb8ceb7b2(0xe93b7411b3190939388c6be1197f6de6b647bb4e3b6dc8e7fe227aef54be7f12); /* statement */ 
if (block.timestamp > endDate) {c_0xb8ceb7b2(0xbe72211a59ec39e7b2a43571eb9426b2219eda76da9788295a42a2e4188de8a2); /* branch */ 

c_0xb8ceb7b2(0x879b94e67fe08b9af3c9d4ec35ed57c92b1527f2df2d2e34333736ea091f724a); /* line */ 
            c_0xb8ceb7b2(0xe2e35ebedf133e957b73c199ce5df88646e8097a1d0e2713dde5d01a2d25276c); /* statement */ 
return 0;
        }else { c_0xb8ceb7b2(0x2554c78afd5f295a87c9057815307fd393e107ff3185356f29ce352547078653); /* branch */ 
}

c_0xb8ceb7b2(0xf5c247099004b0fbaf15ba586523cd26b7805d18e175b347d4567289da0280f2); /* line */ 
        c_0xb8ceb7b2(0x90677954e0d80d7d7549d26d76e86e3d09913c37e97a45c2dd5cbfe2e029ef28); /* statement */ 
uint88 period = endDate - startDate;
        //slither-disable-next-line timestamp
c_0xb8ceb7b2(0x0208365753062448ee0a9bd3ba3b1466d5022587bf1acd53552fe7e9fb7d35cc); /* line */ 
        c_0xb8ceb7b2(0xa33f7510dc36bfb8d5e05f43c224c97c752c04eca3eab744e1430ce7a4fcf113); /* statement */ 
uint88 elapsedTime = uint88(block.timestamp) - startDate;

c_0xb8ceb7b2(0x8eecf9ef93281893f6097c3a718e3c2e3d745fc4c5bdceab33386b233c401389); /* line */ 
        c_0xb8ceb7b2(0x5aa4d94d9271b7389c1be567d27923d7abd278d22ff692b0483c45b17ebb5d68); /* statement */ 
uint88 vestedAmount = (amount * elapsedTime) / period;

c_0xb8ceb7b2(0x10e93ff5b94872616565be0a8838ed3cdbe7fa5cf22e5a754ee14519e1ad8013); /* line */ 
        c_0xb8ceb7b2(0x662bd89fcd9d9e2b2655ebef8c0cf061a80e5f2b4a7795bbcf8cea1860a6feee); /* statement */ 
return amount - vestedAmount;
    }
}
