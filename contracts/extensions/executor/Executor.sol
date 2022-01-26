pragma solidity ^0.8.0;
function c_0xe1e0cddf(bytes32 c__0xe1e0cddf) pure {}


// SPDX-License-Identifier: MIT

import "../../core/DaoRegistry.sol";
import "../IExtension.sol";

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

/**
 * @dev Proxy contract which executes delegated calls to another contract using the EVM
 * instruction `delegatecall`, the call is triggered via fallback function.
 * The call is executed in the target contract identified by its address via `implementation` argument.
 * The success and return data of the delegated call are be returned back to the caller of the proxy.
 * Only contracts with the ACL Flag: EXECUTOR are allowed to use the proxy delegated call function.
 * This contract was based on the OpenZeppelin Proxy contract:
 * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Proxy.sol
 */
contract ExecutorExtension is IExtension {
function c_0x299c9f99(bytes32 c__0x299c9f99) public pure {}

    using Address for address payable;

    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern
    DaoRegistry public dao;

    enum AclFlag {
        EXECUTE
    }

    /// @notice Clonable contract must have an empty constructor
    constructor() {c_0x299c9f99(0xd547706271033e7e7d9df2962436fa48c81bb117a4c25475db49b33348ed4d6e); /* function */ 
}

    modifier hasExtensionAccess(AclFlag flag) {c_0x299c9f99(0x753dc76d3b236a64391282183108f2a9d5051d0e2c5c60adc6475ef8b87e2d13); /* function */ 

c_0x299c9f99(0x7afb1f585a93c86c1084501b87a4fe853f597ae67b080993c562785b88ab220b); /* line */ 
        c_0x299c9f99(0x1bae3a4bef3c4fb86b63effc5044fd5361f2959e140c51e332095396d82a838a); /* requirePre */ 
c_0x299c9f99(0x051d4c62f8f13bb38935472f949a64b8aebdad2797cd773179df8ca17f11c3e9); /* statement */ 
require(
            (address(this) == msg.sender ||
                address(dao) == msg.sender ||
                DaoHelper.isInCreationModeAndHasAccess(dao) ||
                dao.hasAdapterAccessToExtension(
                    msg.sender,
                    address(this),
                    uint8(flag)
                )),
            "executorExt::accessDenied"
        );c_0x299c9f99(0xd4dc834670a021674b95884e776a94bc2cc79a85e70ab5e2c9b2b9a3910657b4); /* requirePost */ 

c_0x299c9f99(0xc9461eb0e4da09d6c9db6cb0acb30f7a8455c36403fbba9579fef8d8a0d49c8a); /* line */ 
        _;
    }

    /**
     * @notice Initialises the Executor extension to be associated with a DAO
     * @dev Can only be called once
     * @param creator The DAO's creator, who will be an initial member
     */
    function initialize(DaoRegistry _dao, address creator) external override {c_0x299c9f99(0xd82dca46a79073ed7fe4a59752d46bd163ba849cd73be824d6e993ad99fb50de); /* function */ 

c_0x299c9f99(0x7e95d99c61246722f4cfb0e34101f6177ab47ed0bdd2837f935760f7d4b7ba55); /* line */ 
        c_0x299c9f99(0x555743461ef030404bc38488a306d38adc2ad6964d7480db5c001c16f9feb878); /* requirePre */ 
c_0x299c9f99(0x3cad79e468538efda26aa7477120759bbe84267d91010920281a918d4a3f6c51); /* statement */ 
require(!initialized, "executorExt::already initialized");c_0x299c9f99(0x90a096b7021dfe4d290af21c4719371a319519665d8aaa5f43e1e90d22e6915d); /* requirePost */ 

c_0x299c9f99(0xa67f531d364efe6b04e19974bff843130d029208ae5caac2692240c3c95b98d5); /* line */ 
        c_0x299c9f99(0x57a697799affbd178e929e8ace3deccb81dff06244ff2050e70907d702d0977d); /* requirePre */ 
c_0x299c9f99(0x3a8fb5fa87b256b4802d557c63907e4a68748f4a4d71496685cc2d6ecb50512c); /* statement */ 
require(_dao.isMember(creator), "executorExt::not member");c_0x299c9f99(0xca97ccefd5b2490b82ba5a60b2a47d365ead02ebbabe844b9f6d8fba9a67bae0); /* requirePost */ 

c_0x299c9f99(0xfbcc40a151fdfa35d4feb8809dbdbd65753d9061fd00bbf3f0648c4a769b6014); /* line */ 
        c_0x299c9f99(0x9ad86796b4f761223cf06d8d0ba4d2a5c2671bdbf8893bfe20a331c5ace27309); /* statement */ 
dao = _dao;
c_0x299c9f99(0xb6ec7d370c8fc887ddb5ae9ac1b610e025d9b4adfe99f02e437bcf2ffc9489c0); /* line */ 
        c_0x299c9f99(0xf4f3fbf674519f7714f8bed8697e2d377af54b826fa5b568fb3ec45295e04bf4); /* statement */ 
initialized = true;
    }

    /**
     * @dev Delegates the current call to `implementation`.
     *
     * This function does not return to its internall call site, it will return directly to the external caller.
     */
    function _delegate(address implementation)
        internal
        virtual
        hasExtensionAccess(AclFlag.EXECUTE)
    {c_0x299c9f99(0x204d4697676ab4725a17efec9e09eca162cfa4075274d056736921e6dd4ed515); /* function */ 

c_0x299c9f99(0x74ef1be1e3f17c7aac39318bdbc07598d54b3f1c08c40de15f833113d4bc4ea0); /* line */ 
        c_0x299c9f99(0x9a89d692ddf95659681f59eb9e5a8d06b679c08ec97f3dcae1773c18657fa7f3); /* requirePre */ 
c_0x299c9f99(0x416b8c1c0977f7a2413bcf3d81f082c49d90f5cd863f108764989c0b24a6aa18); /* statement */ 
require(
            DaoHelper.isNotZeroAddress(implementation),
            "executorExt: impl address can not be zero"
        );c_0x299c9f99(0x95d02be952d5821dd92e5cb47baa004117ce83d244c45ce47573d98a71185fc2); /* requirePost */ 

c_0x299c9f99(0x7b24bb49a62e23f778132101b78a209ae7e480f8dc971fd81d251c8ede4b3190); /* line */ 
        c_0x299c9f99(0x480dc17b33d3cd1c9a237e78d21d221335f6f966a6d88ec5086e6a830707929c); /* requirePre */ 
c_0x299c9f99(0xc17648446ef47bc4963ffd4c5f38ac3e1acd17182cb3476387941bc5b6f985e5); /* statement */ 
require(
            DaoHelper.isNotReservedAddress(implementation),
            "executorExt: impl address can not be reserved"
        );c_0x299c9f99(0x9970c06f840ade2cf8f95f33bb98b107187455e6fdef514b26134d1658d8a444); /* requirePost */ 


c_0x299c9f99(0x579c979651dd29435fd2e287c5bbe14f2abbadf3127752c2aa1b11807b2cf06b); /* line */ 
        c_0x299c9f99(0x893a235ce5a8cc5fb1e9e8aafc7deb9461b9e98ea40398ad76d19cdd2bdb3fa9); /* statement */ 
address daoAddr;
c_0x299c9f99(0x0a38d688acf95eff3914f4d138d3425104385f903d5ea573255ab636881b9f66); /* line */ 
        c_0x299c9f99(0x3033e88fc4bfe98134c620e01741a8f658cfca27c6c5225d35d7052fe1cc6c9e); /* statement */ 
bytes memory data = msg.data;
c_0x299c9f99(0x6542e5437fd23552bef5108589d87034a5a7f56af6ec7a73d332cdce6568ead3); /* line */ 
        assembly {
            daoAddr := mload(add(data, 36))
        }

c_0x299c9f99(0x6a6c2c106c65e30f8c4b7a179c5d2d5c400deacfb57d5f86995403f078053dff); /* line */ 
        c_0x299c9f99(0xe31ba304843314c253ce4ebfc2794b698e5751f98aaa11a1ba63b2e7b6b51f35); /* requirePre */ 
c_0x299c9f99(0x5735eae024e7d76055b487aba28f463a6f8a4d838f6fc3f31921034c1f5dc2ec); /* statement */ 
require(daoAddr == address(dao), "wrong dao!");c_0x299c9f99(0x102b3eec00fe02a8a123008d1970d3218d10726507d5ef26606f0d583291a612); /* requirePost */ 


        // solhint-disable-next-line no-inline-assembly
c_0x299c9f99(0x5a44ceb8f0fb86a052cdf3c293e59f1130b2831fc3ad5a8a0fe84ad3a3487766); /* line */ 
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())
            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(
                gas(),
                implementation,
                0,
                calldatasize(),
                0,
                0
            )

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @dev Delegates the current call to the sender address.
     *
     * This function does not return to its internall call site, it will return directly to the external caller.
     */
    function _fallback() internal virtual {c_0x299c9f99(0x9ee87d5d0ad9cc66a0eda3fbed4a36697269d2007ce5c329b70d09dddd0a5519); /* function */ 

c_0x299c9f99(0x791376cce39515c54dd38b0718fb5ccdcd72085d1f8907543b9b988472dc0cb3); /* line */ 
        c_0x299c9f99(0x0984b7344fb8b82167b068bda1709f23743024078ac211217b1f8bd03e4af433); /* statement */ 
_delegate(msg.sender);
    }

    /**
     * @dev Fallback function that delegates calls to the sender address. Will run if no other
     * function in the contract matches the call data.
     */
    // Only senders with the EXECUTE ACL Flag enabled is allowed to send eth.
    //slither-disable-next-line locked-ether
    fallback() external payable {c_0x299c9f99(0xee1f07271ee65fd3a4f795bfad869d6772aec3b226a5e8152aaf9507102a6f50); /* function */ 

c_0x299c9f99(0x67899a6aaa1b2e6941cb6f38651b1dbd6c7f1f459de02a080e3cdd94c93fd97c); /* line */ 
        c_0x299c9f99(0xa334819d03b3c12b2a9f331b2358f09f5d646ca2d20a658fde2810b7e7025675); /* statement */ 
_fallback();
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data
     * is empty.
     */
    // Only senders with the EXECUTE ACL Flag enabled is allowed to send eth.
    //slither-disable-next-line locked-ether
    receive() external payable {
c_0x299c9f99(0xbc1c7ea9cf387e4189295f3dd46210afcc220e63277d06625b70643139e99d46); /* line */ 
        _fallback();
    }
}
