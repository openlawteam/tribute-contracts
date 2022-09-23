// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
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

    using StringsUpgradeable for uint256;

    DaoRegistry public daoRegistry;

    bytes32 constant TokenName = keccak256("dao-collection.TokenName");
    bytes32 constant TokenSymbol = keccak256("dao-collection.TokenSymbol");
    bytes32 constant TokenMediaPt1 = keccak256("dao-collection.TokenMediaPt1");
    bytes32 constant TokenMediaPt2 = keccak256("dao-collection.TokenMediaPt2");
    bytes32 constant Transferable = keccak256("dao-collection.Transferable");
    bytes32 constant CollectionSize =
        keccak256("dao-collection.CollectionSize");
    bytes32 public constant SignerAddressConfig =
        keccak256("dao-collection.signerAddress");

    string public constant MINT_COUPON_MESSAGE_TYPE =
        "Message(address owner,uint256 nonce)";
    bytes32 public constant MINT_COUPON_MESSAGE_TYPEHASH =
        keccak256(abi.encodePacked(MINT_COUPON_MESSAGE_TYPE));

    mapping(address => mapping(uint32 => Checkpoint)) public checkpoints;
    mapping(address => uint32) public numCheckpoints;

    string public baseURI;
    string public UpgradeTestVar;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // https://docs.openzeppelin.com/contracts/4.x/api/proxy#Initializable
    function initialize(address daoAddress) external initializer {
        __ERC721_init("", "");
        __Ownable_init();
        __UUPSUpgradeable_init();
        daoRegistry = DaoRegistry(daoAddress);
        setBaseURI("ipfs://");
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function mint(
        address owner,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(
            SignatureChecker.isValidSignatureNow(
                daoRegistry.getAddressConfiguration(SignerAddressConfig),
                hashCouponMessage(daoRegistry, owner, nonce),
                signature
            ),
            "invalid sig"
        );

        require(
            nonce <= daoRegistry.getConfiguration(CollectionSize),
            "Collection fully minted"
        );

        _safeMint(owner, nonce);
        _createNewAmountCheckpoint(owner);
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

    function name() public view virtual override returns (string memory) {
        return
            bytes32ToString(bytes32(daoRegistry.getConfiguration(TokenName)));
    }

    function symbol() public view virtual override returns (string memory) {
        return
            bytes32ToString(bytes32(daoRegistry.getConfiguration(TokenSymbol)));
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }

    function tokenURI(uint256)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    bytes32ToString(
                        bytes32(daoRegistry.getConfiguration(TokenMediaPt1))
                    ),
                    bytes32ToString(
                        bytes32(daoRegistry.getConfiguration(TokenMediaPt2))
                    )
                )
            );
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
    }

    function bytes32ToString(bytes32 _bytes32)
        public
        pure
        returns (string memory)
    {
        uint8 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}
