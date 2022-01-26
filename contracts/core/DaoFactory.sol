pragma solidity ^0.8.0;
function c_0x755d0932(bytes32 c__0x755d0932) pure {}


// SPDX-License-Identifier: MIT
import "./DaoRegistry.sol";
import "./CloneFactory.sol";

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

contract DaoFactory is CloneFactory {
function c_0x7db1992e(bytes32 c__0x7db1992e) public pure {}

    struct Adapter {
        bytes32 id;
        address addr;
        uint128 flags;
    }

    // daoAddr => hashedName
    mapping(address => bytes32) public daos;
    // hashedName => daoAddr
    mapping(bytes32 => address) public addresses;

    address public identityAddress;

    /**
     * @notice Event emitted when a new DAO has been created.
     * @param _address The DAO address.
     * @param _name The DAO name.
     */
    event DAOCreated(address _address, string _name);

    constructor(address _identityAddress) {c_0x7db1992e(0xc891982a6cedbe061cde0ef50923b37f0f6b3c4f32d5fda7f63d68f63579518c); /* function */ 

c_0x7db1992e(0x5c9b066eda7b7b8f504a66bd0f38ca660a3e1ce3f13e48550eb1ba82c5f8531a); /* line */ 
        c_0x7db1992e(0xfc2a0c12dac5ba6fc5a8b85ac71163c86376741910f95574de65085baae175e5); /* requirePre */ 
c_0x7db1992e(0x762e6475f3ca0825e8bb0116f4974de609a0143a25ed1f86b8675fee0cb13544); /* statement */ 
require(_identityAddress != address(0x0), "invalid addr");c_0x7db1992e(0x1eafe9e2570965796b8e3fd574bb94ade3f29caaeaf8fc9806417fe2a59d2385); /* requirePost */ 

c_0x7db1992e(0xe58981c4222bdd0db2af42470249739099ec052b2bc406512a5490ce59721244); /* line */ 
        c_0x7db1992e(0x02e4f085f7494a02a8931b8b973619031d2d417802a3264acbc464178f1f0cab); /* statement */ 
identityAddress = _identityAddress;
    }

    /**
     * @notice Creates and initializes a new DaoRegistry with the DAO creator and the transaction sender.
     * @notice Enters the new DaoRegistry in the DaoFactory state.
     * @dev The daoName must not already have been taken.
     * @param daoName The name of the DAO which, after being hashed, is used to access the address.
     * @param creator The DAO's creator, who will be an initial member.
     */
    function createDao(string calldata daoName, address creator) external {c_0x7db1992e(0x3933f68c0ea441b9856df148b4e268b9ed389c88bc7e9c12ba2f8685a9d10bd5); /* function */ 

c_0x7db1992e(0x8a087747b7fcfbaf903e39d1bfc1487570659900a6a2de91ba17290e523118d9); /* line */ 
        c_0x7db1992e(0x7667aa930a061aa77e8f3b4b38526cd7458caac5651bbbfe829053385945d31e); /* statement */ 
bytes32 hashedName = keccak256(abi.encode(daoName));
c_0x7db1992e(0x9ccf95296a6d14ad73bf99944ac76fcfb90d6ce49832cef1545becc08a40f044); /* line */ 
        c_0x7db1992e(0x4e36e4e438f703801e3086eb91fa5bed295d7a9bda2df86eb1c2430d8d6595b0); /* requirePre */ 
c_0x7db1992e(0x863af4d17c65d05219f7d8a97b94d2aaa412bd561d171b9ac98e1f89026db32d); /* statement */ 
require(
            addresses[hashedName] == address(0x0),
            string(abi.encodePacked("name ", daoName, " already taken"))
        );c_0x7db1992e(0x01dfbf93fe21549d2264c240b75922f079a244621480cc65d8553043b3033f08); /* requirePost */ 

c_0x7db1992e(0x6dad89f10e72a8735f97a2d4bac768bfb4d63d7f4aa9d9c1d7fc12ca503f707f); /* line */ 
        c_0x7db1992e(0xd391fe8545a36f72a71c6e2419e9560c2c741e9aa2de78ea3cd89c1ccd9060e8); /* statement */ 
DaoRegistry dao = DaoRegistry(_createClone(identityAddress));

c_0x7db1992e(0xf73ffdb5d49695e9915c4ff12d5ffd209e8a0f151856b8d74364053fc9c732bd); /* line */ 
        c_0x7db1992e(0x78b50ff2ff6b423adf1b3caeb844b21bd7caf4c0396c5d1d951cab46508566e5); /* statement */ 
address daoAddr = address(dao);
c_0x7db1992e(0xd500b0c8c722606b88b5848693688c08ba723c25e665ef242e27e3f1c6cb4e59); /* line */ 
        c_0x7db1992e(0x142ce2e256346141df878fe966ecebb4d34a8f9f1214555e507dc673ea37d158); /* statement */ 
addresses[hashedName] = daoAddr;
c_0x7db1992e(0x595aae0b7c766646d49cba8870aa801ce3bbcbae453c1f84bae8625c19cca15b); /* line */ 
        c_0x7db1992e(0x78d2f09167fd295e9f94a740b0ee26f1f726c846cfb56945701f8836e02ccda7); /* statement */ 
daos[daoAddr] = hashedName;

c_0x7db1992e(0x7c82269eacccc5dbdf8ab6615a3727c542f712b8ee392734109ee35e56e407bf); /* line */ 
        c_0x7db1992e(0x6feec69e59064fdc1bbff3312e27efb6d2995529f99941e8e36effdd941ca6ac); /* statement */ 
dao.initialize(creator, msg.sender);
        //slither-disable-next-line reentrancy-events
c_0x7db1992e(0x04cad6c6619263b4aeada93dd2c0d6d259925700c85135538e6ba6b2a697a26a); /* line */ 
        c_0x7db1992e(0x8e677b6ca38908926added09a4cdfe018c46bf3489014886dd35b6bf9978be0e); /* statement */ 
emit DAOCreated(daoAddr, daoName);
    }

    /**
     * @notice Returns the DAO address based on its name.
     * @return The address of a DAO, given its name.
     * @param daoName Name of the DAO to be searched.
     */
    function getDaoAddress(string calldata daoName)
        external
        view
        returns (address)
    {c_0x7db1992e(0x5a86ff15bf6abfea34666b98a650995472ccef856610abb76f5ba566d0cbaede); /* function */ 

c_0x7db1992e(0x29d03c877b181672b1a4af8618948c37eb5060276f7dea52a5b93a834247fdcd); /* line */ 
        c_0x7db1992e(0x7560d769471abdb3349a16c168812781b0ac26ed2f77a6cb604f7a267d00ed11); /* statement */ 
return addresses[keccak256(abi.encode(daoName))];
    }

    /**
     * @notice Adds adapters and sets their ACL for DaoRegistry functions.
     * @dev A new DAO is instantiated with only the Core Modules enabled, to reduce the call cost. This call must be made to add adapters.
     * @dev The message sender must be an active member of the DAO.
     * @dev The DAO must be in `CREATION` state.
     * @param dao DaoRegistry to have adapters added to.
     * @param adapters Adapter structs to be added to the DAO.
     */
    function addAdapters(DaoRegistry dao, Adapter[] calldata adapters)
        external
    {c_0x7db1992e(0x2a76fdf9ab72f6da6fc7675d0d0c016017ac41edba16721e1c292c8c1f6a9f7d); /* function */ 

c_0x7db1992e(0xbe940cdf33e5edf79671b6dab9a6389d62e07a7fd0efd5c45afda212a902e02c); /* line */ 
        c_0x7db1992e(0x2ad28e5ee92d4ad97949f296cf87babb6c44b7163397ef4dbae39c96dd726dcf); /* requirePre */ 
c_0x7db1992e(0x69ae761680c66ee59fbd3c4f152e1a1740bd60a0516b54f8b784b9e13ba0f529); /* statement */ 
require(dao.isMember(msg.sender), "not member");c_0x7db1992e(0x5d1a5aba69740f017bbdadafbcb6a3eb604ffd125c2984019c312a10de1059d9); /* requirePost */ 

        //Registring Adapters
c_0x7db1992e(0x483ba4674c7dbb9d53f81a8c00e1b08925559af35bfda2e79fa0bf206d15a037); /* line */ 
        c_0x7db1992e(0xddf65a58e7d8b035c85660a07602d50e7a1763360bb7b018d74d880f82dd43a8); /* requirePre */ 
c_0x7db1992e(0x9482da58721afd0c72450f1af51bb924704f71317d07bed6668e6b70f9c20879); /* statement */ 
require(
            dao.state() == DaoRegistry.DaoState.CREATION,
            "this DAO has already been setup"
        );c_0x7db1992e(0x4d1339419d137506d5cafebf703e8c9444e6d0032be87dabb31f49684cb21cd0); /* requirePost */ 


c_0x7db1992e(0xf8d4ea73a81fc9f209a373bed2b73779ea3e275b10d75c27ddc321fd96539d4c); /* line */ 
        c_0x7db1992e(0xaee7f09bfd879969cd4769b9aa34e546b5cb3cb97d9f1d75fe011fa69d7da51d); /* statement */ 
for (uint256 i = 0; i < adapters.length; i++) {
            //slither-disable-next-line calls-loop
c_0x7db1992e(0xa425367357b580e1e424822aa2008fcf0f17b0a1681386814bf3f3f99af251d9); /* line */ 
            c_0x7db1992e(0x141d387518a72b75478f63c8a64491d881614fd3caf3ff31831b1b8dfab37de4); /* statement */ 
dao.replaceAdapter(
                adapters[i].id,
                adapters[i].addr,
                adapters[i].flags,
                new bytes32[](0),
                new uint256[](0)
            );
        }
    }

    /**
     * @notice Configures extension to set the ACL for each adapter that needs to access the extension.
     * @dev The message sender must be an active member of the DAO.
     * @dev The DAO must be in `CREATION` state.
     * @param dao DaoRegistry for which the extension is being configured.
     * @param extension The address of the extension to be configured.
     * @param adapters Adapter structs for which the ACL is being set for the extension.
     */
    function configureExtension(
        DaoRegistry dao,
        address extension,
        Adapter[] calldata adapters
    ) external {c_0x7db1992e(0x21445274ab7a5bcb644d8c33721051bed864d71313c0a0ad8ba0322350a8df1f); /* function */ 

c_0x7db1992e(0x9743c7f4493997adf4f68ca3cb583fb428c60eb148d752e65f5d35d461df0b42); /* line */ 
        c_0x7db1992e(0xa53514f0052e9b7ee3551f45b9e0309ef9e254a49f6687b9b9d55494c37ca9a3); /* requirePre */ 
c_0x7db1992e(0x3985249404def36a474b872d621ba8a90b28aa6bed4e42c0db4802a927c115bb); /* statement */ 
require(dao.isMember(msg.sender), "not member");c_0x7db1992e(0x0992448b67d0656eb14fc7279c0f8c5a7149d93fbe5e4c57313f26248c8aa388); /* requirePost */ 

        //Registring Adapters
c_0x7db1992e(0x156b52c378e6c230bd2faae16fc8f16828aea88078664fd03ee7a29b02a15f91); /* line */ 
        c_0x7db1992e(0x6b2918eca5bd2491fc0dc214f3aeca41b4b6b63248125cdaa267f44b0df3a72f); /* requirePre */ 
c_0x7db1992e(0x5c48e638e83d29f5e6602df0fece62b35c00308e465169b871ef999ab06793ed); /* statement */ 
require(
            dao.state() == DaoRegistry.DaoState.CREATION,
            "this DAO has already been setup"
        );c_0x7db1992e(0x3792629bf7076c9b03b9d944ed31da47bf8856e1560f94ab2be622b4a2eccd9e); /* requirePost */ 


c_0x7db1992e(0xe01c6e8e5a5588b189864eb7e09ff846fe5be68f1fa75ecf0d3baa3617b59d84); /* line */ 
        c_0x7db1992e(0xc7cbb3d333c80725b89d76426d50013e4cab19e4ef26a9a46046c4cf479f401e); /* statement */ 
for (uint256 i = 0; i < adapters.length; i++) {
            //slither-disable-next-line calls-loop
c_0x7db1992e(0x7c16efbe0d6255197cf6eeff1e6a17d3e081af02e4dae4d48a4d61a8bcb8d505); /* line */ 
            c_0x7db1992e(0xde47c0ce31c412c48fa5c0cc99a5127ad7c63fe26a13869edd2a4a047cb899d1); /* statement */ 
dao.setAclToExtensionForAdapter(
                extension,
                adapters[i].addr,
                adapters[i].flags
            );
        }
    }

    /**
     * @notice Removes an adapter with a given ID from a DAO, and adds a new one of the same ID.
     * @dev The message sender must be an active member of the DAO.
     * @dev The DAO must be in `CREATION` state.
     * @param dao DAO to be updated.
     * @param adapter Adapter that will be replacing the currently-existing adapter of the same ID.
     */
    function updateAdapter(DaoRegistry dao, Adapter calldata adapter) external {c_0x7db1992e(0x69a67a98013f722fcba084eab3935bc5aa4cdae78d408e2eae28e7482d9a1d05); /* function */ 

c_0x7db1992e(0x1f5feb0468eda405c41b1aaa3b9d7831befd0e718f3b61e1899fe35ee683fe19); /* line */ 
        c_0x7db1992e(0x8cffd9675d1d38388361c07aec918ac2d854e31ea1fe35b5c6eddd3e5e8a6997); /* requirePre */ 
c_0x7db1992e(0xde64a7d74683dd38ddea13c997cb7e2f875fa4e8a8d8e0955ca1bb7fe9395683); /* statement */ 
require(dao.isMember(msg.sender), "not member");c_0x7db1992e(0x0eeecd6a00940430285b09d6f3cf334cb3895362ba1505133e7a0502d6e59302); /* requirePost */ 

c_0x7db1992e(0xdfc37e8559c915b2e91732348f80cbb7eea79b7f1592d89bce3e0ee9fa0aaabf); /* line */ 
        c_0x7db1992e(0xb2dd35084ef95647f77d915ab74246521759929fc45516bb7d6b812049a636d1); /* requirePre */ 
c_0x7db1992e(0x91e42e6ccdd523c192fafaeef24fae92237559c97b18555169f5c031a590d5dd); /* statement */ 
require(
            dao.state() == DaoRegistry.DaoState.CREATION,
            "this DAO has already been setup"
        );c_0x7db1992e(0x21b312a1201f378d7fb3eb0f7b54a7f63797f2a71c644d2c6c4668ac5dabc863); /* requirePost */ 


c_0x7db1992e(0xb19d7e41c17263f548cbe6583fab6210bd2e8b6073885f425f8266eddb6cb00d); /* line */ 
        c_0x7db1992e(0x21ca85fae9f60827d3d4fc0ee436c251199962bc41a1ff4e3557c75ab3d6eadc); /* statement */ 
dao.replaceAdapter(
            adapter.id,
            adapter.addr,
            adapter.flags,
            new bytes32[](0),
            new uint256[](0)
        );
    }
}
