// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "../core/DaoRegistry.sol";
import "../utils/Signatures.sol";

contract UpgradeableERC721Testing is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    Signatures
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using StringsUpgradeable for uint256;

    CountersUpgradeable.Counter private _tokenIdCounter;
    DaoRegistry public daoRegistry;

    bytes32 constant Transferable = keccak256("dao-collection.Transferable");
    bytes32 constant CollectionSize =
        keccak256("dao-collection.CollectionSize");
    bytes32 public constant SignerAddressConfig =
        keccak256("dao-collection.signerAddress");

    string public constant MINT_COUPON_MESSAGE_TYPE =
        "Message(address owner,uint256 nonce)";
    bytes32 public constant MINT_COUPON_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(MINT_COUPON_MESSAGE_TYPE));

    mapping(uint256 => bool) public claimed;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function mint(
        address owner,
        uint256 nonce,
        bytes memory signature
    ) public {
        bytes32 hash = hashCouponMessage(daoRegistry, owner, nonce);
        require(
            SignatureChecker.isValidSignatureNow(
                daoRegistry.getAddressConfiguration(SignerAddressConfig),
                hash,
                signature
            ),
            "invalid sig"
        );

        require(!claimed[nonce], "NFT already claimed");
        claimed[nonce] = true;

        uint256 tokenId = _tokenIdCounter.current();
        require(
            tokenId <= daoRegistry.getConfiguration(CollectionSize),
            "Collection fully minted"
        );

        _tokenIdCounter.increment();
        _safeMint(owner, tokenId);
    }

    /**
     * @notice Hashes the provided coupon as an ERC712 hash.
     * @param dao is the DAO instance to be configured
     */
    function hashCouponMessage(
        DaoRegistry dao,
        address owner,
        uint256 nonce
    ) public view returns (bytes32) {
        bytes32 message = keccak256(
            abi.encode(MINT_COUPON_MESSAGE_TYPEHASH, owner, nonce)
        );

        return hashMessage(dao, address(this), message);
    }

    function initialize(
        string memory name,
        string memory symbol,
        address daoAddress
    ) public initializer {
        __ERC721_init(name, symbol);
        __Ownable_init();
        __UUPSUpgradeable_init();
        daoRegistry = DaoRegistry(daoAddress);
        _tokenIdCounter.increment(); // Start at 1.
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(
            daoRegistry.getConfiguration(Transferable) == 1,
            "Collection is not transferable"
        );
        super._transfer(from, to, tokenId);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://fakeuri.com/";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        _requireMinted(tokenId);

        string memory baseURI = _baseURI();
        return baseURI;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
