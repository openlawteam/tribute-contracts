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

contract TributeERC721V2 is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    Signatures
{
    struct Checkpoint {
        // A checkpoint for marking number of votes from a given block
        uint96 fromBlock;
        uint160 amount;
    }

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

    mapping(address => mapping(uint32 => Checkpoint)) public checkpoints;
    mapping(address => uint32) public numCheckpoints;

    string public baseURI;
    string public UpgradeTestVar; // Proxy upgrade requires contracts to differ.

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function mint(
        address owner,
        uint256 nonce,
        bytes memory signature
    ) public {
        require(
            SignatureChecker.isValidSignatureNow(
                daoRegistry.getAddressConfiguration(SignerAddressConfig),
                hashCouponMessage(daoRegistry, owner, nonce),
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
        _createNewAmountCheckpoint(owner);
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
        address daoAddress,
        string memory newBaseURI
    ) public initializer {
        __ERC721_init(name, symbol);
        __Ownable_init();
        __UUPSUpgradeable_init();
        daoRegistry = DaoRegistry(daoAddress);
        _tokenIdCounter.increment(); // Start at 1.
        setBaseURI(newBaseURI);
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
        _createNewAmountCheckpoint(from);
        _createNewAmountCheckpoint(to);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        _requireMinted(tokenId);
        return _baseURI();
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    function getPriorAmount(address account, uint256 blockNumber)
        external
        view
        returns (uint256)
    {
        require(
            blockNumber < block.number,
            "nft::getPriorAmount: not yet determined"
        );

        uint32 nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[account][nCheckpoints - 1].amount;
        }

        // Next check implicit zero balance
        if (checkpoints[account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.amount;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[account][lower].amount;
    }

    function _createNewAmountCheckpoint(address member) internal {
        uint256 amount = balanceOf(member);

        uint160 newAmount = uint160(amount);

        uint32 nCheckpoints = numCheckpoints[member];
        if (
            // The only condition that we should allow the amount update
            // is when the block.number exactly matches the fromBlock value.
            // Anything different from that should generate a new checkpoint.
            //slither-disable-next-line incorrect-equality
            nCheckpoints > 0 &&
            checkpoints[member][nCheckpoints - 1].fromBlock == block.number
        ) {
            checkpoints[member][nCheckpoints - 1].amount = newAmount;
        } else {
            checkpoints[member][nCheckpoints] = Checkpoint(
                uint96(block.number),
                newAmount
            );
            numCheckpoints[member] = nCheckpoints + 1;
        }
        // slither-disable-next-line reentrancy-events
        // emit NewBalance(member, token, newAmount);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
