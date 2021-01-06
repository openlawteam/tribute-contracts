pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT

/**
 * @dev Wrappers over Solidity's uintXX/intXX casting operators with added overflow
 * checks.
 *
 * Downcasting from uint256/int256 in Solidity does not revert on overflow. This can
 * easily result in undesired exploitation or bugs, since developers usually
 * assume that overflows raise errors. `SafeCast` restores this intuition by
 * reverting the transaction when such an operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 *
 * Can be combined with {SafeMath} and {SignedSafeMath} to extend it to smaller types, by performing
 * all math on `uint256` and `int256` and then downcasting.
 */

library SafeCast {
    /**
     * @dev Returns the downcasted uint128 from uint256, reverting on
     * overflow (when the input is greater than largest uint128).
     *
     * Counterpart to Solidity's `uint128` operator.
     *
     * Requirements:
     *
     * - input must fit into 128 bits
     */
    function toUint128(uint256 value) internal pure returns (uint128) {
        require(value < 2**128, "SafeCast: value doesn't fit in 128 bits");
        return uint128(value);
    }

    /**
     * @dev Returns the downcasted uint64 from uint256, reverting on
     * overflow (when the input is greater than largest uint64).
     *
     * Counterpart to Solidity's `uint64` operator.
     *
     * Requirements:
     *
     * - input must fit into 64 bits
     */
    function toUint64(uint256 value) internal pure returns (uint64) {
        require(value < 2**64, "SafeCast: value doesn't fit in 64 bits");
        return uint64(value);
    }

    /**
     * @dev Returns the downcasted uint32 from uint256, reverting on
     * overflow (when the input is greater than largest uint32).
     *
     * Counterpart to Solidity's `uint32` operator.
     *
     * Requirements:
     *
     * - input must fit into 32 bits
     */
    function toUint32(uint256 value) internal pure returns (uint32) {
        require(value < 2**32, "SafeCast: value doesn't fit in 32 bits");
        return uint32(value);
    }

    /**
     * @dev Returns the downcasted uint16 from uint256, reverting on
     * overflow (when the input is greater than largest uint16).
     *
     * Counterpart to Solidity's `uint16` operator.
     *
     * Requirements:
     *
     * - input must fit into 16 bits
     */
    function toUint16(uint256 value) internal pure returns (uint16) {
        require(value < 2**16, "SafeCast: value doesn't fit in 16 bits");
        return uint16(value);
    }

    /**
     * @dev Returns the downcasted uint8 from uint256, reverting on
     * overflow (when the input is greater than largest uint8).
     *
     * Counterpart to Solidity's `uint8` operator.
     *
     * Requirements:
     *
     * - input must fit into 8 bits.
     */
    function toUint8(uint256 value) internal pure returns (uint8) {
        require(value < 2**8, "SafeCast: value doesn't fit in 8 bits");
        return uint8(value);
    }

    /**
     * @dev Converts a signed int256 into an unsigned uint256.
     *
     * Requirements:
     *
     * - input must be greater than or equal to 0.
     */
    function toUint256(int256 value) internal pure returns (uint256) {
        require(value >= 0, "SafeCast: value must be positive");
        return uint256(value);
    }

    /**
     * @dev Returns the downcasted int128 from int256, reverting on
     * overflow (when the input is less than smallest int128 or
     * greater than largest int128).
     *
     * Counterpart to Solidity's `int128` operator.
     *
     * Requirements:
     *
     * - input must fit into 128 bits
     *
     * _Available since v3.1._
     */
    function toInt128(int256 value) internal pure returns (int128) {
        require(
            value >= -2**127 && value < 2**127,
            "SafeCast: value doesn't fit in 128 bits"
        );
        return int128(value);
    }

    /**
     * @dev Returns the downcasted int64 from int256, reverting on
     * overflow (when the input is less than smallest int64 or
     * greater than largest int64).
     *
     * Counterpart to Solidity's `int64` operator.
     *
     * Requirements:
     *
     * - input must fit into 64 bits
     *
     * _Available since v3.1._
     */
    function toInt64(int256 value) internal pure returns (int64) {
        require(
            value >= -2**63 && value < 2**63,
            "SafeCast: value doesn't fit in 64 bits"
        );
        return int64(value);
    }

    /**
     * @dev Returns the downcasted int32 from int256, reverting on
     * overflow (when the input is less than smallest int32 or
     * greater than largest int32).
     *
     * Counterpart to Solidity's `int32` operator.
     *
     * Requirements:
     *
     * - input must fit into 32 bits
     *
     * _Available since v3.1._
     */
    function toInt32(int256 value) internal pure returns (int32) {
        require(
            value >= -2**31 && value < 2**31,
            "SafeCast: value doesn't fit in 32 bits"
        );
        return int32(value);
    }

    /**
     * @dev Returns the downcasted int16 from int256, reverting on
     * overflow (when the input is less than smallest int16 or
     * greater than largest int16).
     *
     * Counterpart to Solidity's `int16` operator.
     *
     * Requirements:
     *
     * - input must fit into 16 bits
     *
     * _Available since v3.1._
     */
    function toInt16(int256 value) internal pure returns (int16) {
        require(
            value >= -2**15 && value < 2**15,
            "SafeCast: value doesn't fit in 16 bits"
        );
        return int16(value);
    }

    /**
     * @dev Returns the downcasted int8 from int256, reverting on
     * overflow (when the input is less than smallest int8 or
     * greater than largest int8).
     *
     * Counterpart to Solidity's `int8` operator.
     *
     * Requirements:
     *
     * - input must fit into 8 bits.
     *
     * _Available since v3.1._
     */
    function toInt8(int256 value) internal pure returns (int8) {
        require(
            value >= -2**7 && value < 2**7,
            "SafeCast: value doesn't fit in 8 bits"
        );
        return int8(value);
    }

    /**
     * @dev Converts an unsigned uint256 into a signed int256.
     *
     * Requirements:
     *
     * - input must be less than or equal to maxInt256.
     */
    function toInt256(uint256 value) internal pure returns (int256) {
        require(value < 2**255, "SafeCast: value doesn't fit in an int256");
        return int256(value);
    }
}
////

library FlagHelper {
    enum Flag {
        EXISTS,
        SPONSORED,
        PROCESSED,
        JAILED,
        ADD_ADAPTER,
        REMOVE_ADAPTER,
        JAIL_MEMBER,
        UNJAIL_MEMBER,
        EXECUTE,
        SUBMIT_PROPOSAL,
        SPONSOR_PROPOSAL,
        PROCESS_PROPOSAL,
        UPDATE_DELEGATE_KEY,
        REGISTER_NEW_TOKEN,
        REGISTER_NEW_INTERNAL_TOKEN,
        ADD_TO_BALANCE,
        SUB_FROM_BALANCE,
        INTERNAL_TRANSFER,
        SET_CONFIGURATION
    }

    //helper
    function getFlag(uint256 flags, Flag flag) public pure returns (bool) {
        return (flags >> uint8(flag)) % 2 == 1;
    }

    function setFlag(
        uint256 flags,
        Flag flag,
        bool value
    ) public pure returns (uint256) {
        if (getFlag(flags, flag) != value) {
            if (value) {
                return flags + 2**uint256(flag);
            } else {
                return flags - 2**uint256(flag);
            }
        } else {
            return flags;
        }
    }
}


///
library FairShareHelper {
    /**
     * @notice calculates the fair share amount based the total shares and current balance.
     */
    function calc(
        uint256 balance,
        uint256 shares,
        uint256 _totalShares
    ) internal pure returns (uint256) {
        require(_totalShares != 0, "total shares should not be 0");
        if (balance == 0) {
            return 0;
        }
        uint256 prod = balance * shares;
        if (prod / balance == shares) {
            // no overflow in multiplication above?
            return prod / _totalShares;
        }
        return (balance / _totalShares) * shares;
    }
}


//

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

//

contract ERC20 is IERC20 {
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * To select a different value for {decimals}, use {_setupDecimals}.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(
        string memory nameParam,
        string memory symbolParam,
        uint256 totalSupplyParam
    ) {
        _name = nameParam;
        _symbol = symbolParam;
        _decimals = 18;
        _totalSupply = totalSupplyParam;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is
     * called.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Total number of tokens in existence
     */
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Gets the balance of the specified address.
     * @param owner The address to query the balance of.
     * @return An uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address owner) public view override returns (uint256) {
        return _balances[owner];
    }

    /**
     * @dev Function to check the amount of tokens that an owner allowed to a spender.
     * @param owner address The address which owns the funds.
     * @param spender address The address which will spend the funds.
     * @return A uint256 specifying the amount of tokens still available for the spender.
     */
    function allowance(address owner, address spender)
        public
        view
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    /**
     * @dev Transfer token for a specified address
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     */
    function transfer(address to, uint256 value)
        public
        override
        returns (bool)
    {
        _transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
     * Beware that changing an allowance with this method brings the risk that someone may use both the old
     * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
     * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     */
    function approve(address spender, uint256 value)
        public
        override
        returns (bool)
    {
        _approve(msg.sender, spender, value);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another.
     * Note that while this function emits an Approval event, this is not required as per the specification,
     * and other compliant implementations may not emit the event.
     * @param from address The address which you want to send tokens from
     * @param to address The address which you want to transfer to
     * @param value uint256 the amount of tokens to be transferred
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        _transfer(from, to, value);
        _approve(from, msg.sender, _allowances[from][msg.sender] - value);
        return true;
    }

    /**
     * @dev Increase the amount of tokens that an owner allowed to a spender.
     * approve should be called when allowed_[_spender] == 0. To increment
     * allowed value is better to use this function to avoid 2 calls (and wait until
     * the first transaction is mined)
     * From MonolithDAO Token.sol
     * Emits an Approval event.
     * @param spender The address which will spend the funds.
     * @param addedValue The amount of tokens to increase the allowance by.
     */
    function increaseAllowance(address spender, uint256 addedValue)
        public
        returns (bool)
    {
        _approve(
            msg.sender,
            spender,
            _allowances[msg.sender][spender] + addedValue
        );
        return true;
    }

    /**
     * @dev Decrease the amount of tokens that an owner allowed to a spender.
     * approve should be called when allowed_[_spender] == 0. To decrement
     * allowed value is better to use this function to avoid 2 calls (and wait until
     * the first transaction is mined)
     * From MonolithDAO Token.sol
     * Emits an Approval event.
     * @param spender The address which will spend the funds.
     * @param subtractedValue The amount of tokens to decrease the allowance by.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        returns (bool)
    {
        _approve(
            msg.sender,
            spender,
            _allowances[msg.sender][spender] - subtractedValue
        );
        return true;
    }

    /**
     * @dev Transfer token for a specified addresses
     * @param from The address to transfer from.
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal {
        require(to != address(0), "to address should not be zero");

        _balances[from] = _balances[from] - value;
        _balances[to] = _balances[to] + value;
        emit Transfer(from, to, value);
    }

    /**
     * @dev Internal function that mints an amount of the token and assigns it to
     * an account. This encapsulates the modification of balances such that the
     * proper events are emitted.
     * @param account The account that will receive the created tokens.
     * @param value The amount that will be created.
     */
    function _mint(address account, uint256 value) internal {
        require(account != address(0), "to address should not be zero");

        _totalSupply = _totalSupply + value;
        _balances[account] = _balances[account] + value;
        emit Transfer(address(0), account, value);
    }

    /**
     * @dev Internal function that burns an amount of the token of a given
     * account.
     * @param account The account whose tokens will be burnt.
     * @param value The amount that will be burnt.
     */
    function _burn(address account, uint256 value) internal {
        require(account != address(0), "account address should not be zero");

        _totalSupply = _totalSupply - value;
        _balances[account] = _balances[account] - value;
        emit Transfer(account, address(0), value);
    }

    /**
     * @dev Approve an address to spend another addresses' tokens.
     * @param owner The address that owns the tokens.
     * @param spender The address that will spend the tokens.
     * @param value The number of tokens that can be spent.
     */
    function _approve(
        address owner,
        address spender,
        uint256 value
    ) internal {
        require(spender != address(0), "sender address should not be zero");
        require(owner != address(0), "owner address should not be zero");

        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    /**
     * @dev Internal function that burns an amount of the token of a given
     * account, deducting from the sender's allowance for said account. Uses the
     * internal burn function.
     * Emits an Approval event (reflecting the reduced allowance).
     * @param account The account whose tokens will be burnt.
     * @param value The amount that will be burnt.
     */
    function _burnFrom(address account, uint256 value) internal {
        _burn(account, value);
        _approve(account, msg.sender, _allowances[account][msg.sender] - value);
    }
}
///

abstract contract AdapterGuard {
    /**
     * @dev Only registered adapters are allowed to execute the function call.
     */
    modifier onlyAdapter(DaoRegistry dao) {
        require(
            dao.state() == DaoRegistry.DaoState.CREATION ||
                dao.isAdapter(msg.sender),
            "onlyAdapter"
        );
        _;
    }

    modifier hasAccess(DaoRegistry dao, FlagHelper.Flag flag) {
        require(
            dao.state() == DaoRegistry.DaoState.CREATION ||
                dao.hasAdapterAccess(msg.sender, flag),
            "hasAccess"
        );
        _;
    }
}
////

abstract contract MemberGuard {
    /**
     * @dev Only members of the DAO are allowed to execute the function call.
     */
    modifier onlyMember(DaoRegistry dao) {
        require(dao.isActiveMember(msg.sender), "onlyMember");
        _;
    }
}

//

abstract contract DaoConstants {
    // Adapters
    bytes32 public constant VOTING = keccak256("voting");
    bytes32 public constant ONBOARDING = keccak256("onboarding");
    bytes32 public constant NONVOTING_ONBOARDING =
        keccak256("nonvoting-onboarding");
    bytes32 public constant FINANCING = keccak256("financing");
    bytes32 public constant MANAGING = keccak256("managing");
    bytes32 public constant RAGEQUIT = keccak256("ragequit");
    bytes32 public constant GUILDKICK = keccak256("guildkick");

    /// @notice The reserved address for Guild bank account
    address public constant GUILD = address(0xdead);
    /// @notice The reserved address for Total funds bank account
    address public constant TOTAL = address(0xbabe);
    address public constant SHARES = address(0xFF1CE);
    address public constant LOOT = address(0xB105F00D);
    address public constant LOCKED_LOOT = address(0xBAAAAAAD);
    address public constant ETH_TOKEN = address(0x0);
}
//

/*START Interfaces for Adapaters Below Here*/

///
interface IVoting {
    function startNewVotingForProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function getSenderAddress(
        DaoRegistry dao,
        address actionId,
        bytes memory data,
        address sender
    ) external returns (address);

    function voteResult(DaoRegistry dao, uint256 proposalId)
        external
        returns (uint256 state);
}
///
interface IFinancing {
    function createFinancingRequest(
        DaoRegistry dao,
        address applicant,
        address token,
        uint256 amount,
        bytes32 details
    ) external returns (uint64);

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(DaoRegistry dao, uint256 proposalId) external;
}
///
interface IConfiguration {
    function submitConfigurationProposal(
        DaoRegistry dao,
        bytes32[] calldata keys,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (uint64);

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(DaoRegistry dao, uint256 proposalId) external;
}
///
interface IManaging {
    function createModuleChangeRequest(
        DaoRegistry dao,
        bytes32 moduleId,
        address moduleAddress,
        bytes32[] calldata keys,
        uint256[] calldata values,
        uint256 flags
    ) external returns (uint64);

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function processProposal(DaoRegistry dao, uint256 proposalId) external;
}
///
interface IOnboarding {
    function onboard(
        DaoRegistry dao,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount
    ) external payable returns (uint64);

    function sponsorProposal(
        DaoRegistry dao,
        uint256 proposalId,
        bytes calldata data
    ) external;

    function cancelProposal(DaoRegistry dao, uint256 proposalId) external;

    function processProposal(DaoRegistry dao, uint256 proposalId) external;
}
///
interface IGuildKick {
    function submitKickProposal(
        DaoRegistry dao,
        address memberToKick,
        bytes calldata data
    ) external returns (uint64);

    function guildKick(DaoRegistry dao, uint256 proposalId) external;

    function rageKick(
        DaoRegistry dao,
        uint256 proposalId,
        uint256 toIndex
    ) external;
}

interface IRagequit {
    function burnShares(
        DaoRegistry dao,
        address memberAddr,
        uint256 toIndex
    ) external;

    function startRagequit(
        DaoRegistry dao,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) external;
}
/*END OF ADAPTER INTERFACES */

//DAO REGISTRY 
contract DaoRegistry is DaoConstants, AdapterGuard {
    bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern

    /*
     * LIBRARIES
     */
    using FlagHelper for uint256;

    enum DaoState {CREATION, READY}

    /*
     * EVENTS
     */
    /// @dev - Events for Proposals
    event SubmittedProposal(uint64 proposalId, uint256 flags);
    event SponsoredProposal(uint64 proposalId, uint256 flags);
    event ProcessedProposal(uint64 proposalId, uint256 flags);
    event AdapterAdded(
        bytes32 adapterId,
        address adapterAddress,
        uint256 flags
    );
    event AdapterRemoved(bytes32 adapterId);

    /// @dev - Events for Members
    event UpdateDelegateKey(address memberAddress, address newDelegateKey);

    /// @dev - Events for Bank
    event MemberJailed(address memberAddr);

    event MemberUnjailed(address memberAddr);

    event NewBalance(address member, address tokenAddr, uint256 amount);

    /*
     * STRUCTURES
     */
    struct Proposal {
        // the structure to track all the proposals in the DAO
        address adapterAddress; // the adapter address that called the functions to change the DAO state
        uint256 flags; // flags to track the state of the proposal: exist, sponsored, processed, canceled, etc.
    }

    struct Member {
        // the structure to track all the members in the DAO
        uint256 flags; // flags to track the state of the member: exist, jailed, etc
    }

    struct Checkpoint {
        // A checkpoint for marking number of votes from a given block
        uint96 fromBlock;
        uint160 amount;
    }

    struct DelegateCheckpoint {
        // A checkpoint for marking number of votes from a given block
        uint96 fromBlock;
        address delegateKey;
    }

    struct Bank {
        address[] tokens;
        address[] internalTokens;
        // tokenAddress => availability
        mapping(address => bool) availableTokens;
        mapping(address => bool) availableInternalTokens;
        // tokenAddress => memberAddress => checkpointNum => Checkpoint
        mapping(address => mapping(address => mapping(uint32 => Checkpoint))) checkpoints;
        // tokenAddress => memberAddress => numCheckpoints
        mapping(address => mapping(address => uint32)) numCheckpoints;
    }

    struct AdapterDetails {
        bytes32 id;
        uint256 acl;
    }

    /*
     * PUBLIC VARIABLES
     */
    mapping(address => Member) public members; // the map to track all members of the DAO

    // delegate key => member address mapping
    mapping(address => address) public memberAddressesByDelegatedKey;
    Bank private _bank; // the state of the DAO Bank

    // memberAddress => checkpointNum => DelegateCheckpoint
    mapping(address => mapping(uint32 => DelegateCheckpoint)) checkpoints;
    // memberAddress => numDelegateCheckpoints
    mapping(address => uint32) numCheckpoints;

    DaoState public state;

    /// @notice The number of proposals submitted to the DAO
    uint64 public proposalCount;
    /// @notice The map that keeps track of all proposasls submitted to the DAO
    mapping(uint64 => Proposal) public proposals;
    /// @notice The map that keeps track of all adapters registered in the DAO
    mapping(bytes32 => address) public registry;
    /// @notice The inverse map to get the adapter id based on its address
    mapping(address => AdapterDetails) public inverseRegistry;
    /// @notice The map that keeps track of configuration parameters for the DAO and adapters
    mapping(bytes32 => uint256) public mainConfiguration;
    mapping(bytes32 => address) public addressConfiguration;

    /// @notice Clonable contract must have an empty constructor
    // constructor() {
    // }

    //TODO: we may need to add some ACL to ensure only the factory is allowed to clone it, otherwise
    //any will able to deploy it, and the first one to call this function is added to the DAO as a member.
    /**
     * @notice Initialises the DAO
     * @dev Involves initialising available tokens, checkpoints, and membership of creator
     * @dev Can only be called once
     * @param creator The DAO's creator, who will be the first member
     */
    function initialize(address creator) external {
        require(!initialized, "dao already initialized");

        address memberAddr = creator;
        Member storage member = members[memberAddr];
        member.flags = member.flags.setFlag(FlagHelper.Flag.EXISTS, true);
        memberAddressesByDelegatedKey[memberAddr] = memberAddr;

        _bank.availableInternalTokens[SHARES] = true;
        _bank.internalTokens.push(SHARES);

        _createNewAmountCheckpoint(memberAddr, SHARES, 1);
        _createNewAmountCheckpoint(TOTAL, SHARES, 1);

        initialized = true;
    }

    receive() external payable {
        revert("you cannot send money back directly");
    }

    /**
     * @dev Sets the state of the dao to READY
     */
    function finalizeDao() external {
        state = DaoState.READY;
    }

    /**
     * @notice Sets a configuration value
     * @dev Changes the value of a key in the configuration mapping
     * @param key The configuration key for which the value will be set
     * @param value The value to set the key
     */
    function setConfiguration(bytes32 key, uint256 value)
        external
        hasAccess(this, FlagHelper.Flag.SET_CONFIGURATION)
    {
        mainConfiguration[key] = value;
    }

    /**
     * @notice Sets an configuration value
     * @dev Changes the value of a key in the configuration mapping
     * @param key The configuration key for which the value will be set
     * @param value The value to set the key
     */
    function setAddressConfiguration(bytes32 key, address value)
        external
        hasAccess(this, FlagHelper.Flag.SET_CONFIGURATION)
    {
        addressConfiguration[key] = value;
    }

    /**
     * @return The configuration value of a particular key
     * @param key The key to look up in the configuration mapping
     */
    function getConfiguration(bytes32 key) external view returns (uint256) {
        return mainConfiguration[key];
    }

    /**
     * @return The configuration value of a particular key
     * @param key The key to look up in the configuration mapping
     */
    function getAddressConfiguration(bytes32 key)
        external
        view
        returns (address)
    {
        return addressConfiguration[key];
    }

    /**
     * @notice Adds a new adapter to the registry
     * @param adapterId The unique identifier of the new adapter
     * @param adapterAddress The address of the adapter
     * @param acl The access control list of the adapter
     */
    function addAdapter(
        bytes32 adapterId,
        address adapterAddress,
        uint256 acl
    ) external hasAccess(this, FlagHelper.Flag.ADD_ADAPTER) {
        require(adapterId != bytes32(0), "adapterId must not be empty");
        require(
            adapterAddress != address(0x0),
            "adapterAddress must not be empty"
        );
        require(
            registry[adapterId] == address(0x0),
            "adapterId already in use"
        );
        registry[adapterId] = adapterAddress;
        inverseRegistry[adapterAddress].id = adapterId;
        inverseRegistry[adapterAddress].acl = acl;
        emit AdapterAdded(adapterId, adapterAddress, acl);
    }

    /**
     * @notice Removes an adapter from the registry
     * @param adapterId The unique identifier of the adapter
     */
    function removeAdapter(bytes32 adapterId)
        external
        hasAccess(this, FlagHelper.Flag.REMOVE_ADAPTER)
    {
        require(adapterId != bytes32(0), "adapterId must not be empty");
        require(
            registry[adapterId] != address(0x0),
            "adapterId not registered"
        );
        delete inverseRegistry[registry[adapterId]];
        delete registry[adapterId];
        emit AdapterRemoved(adapterId);
    }

    /**
     * @notice Looks up if there is an adapter of a given address
     * @return Whether or not the address is an adapter
     * @param adapterAddress The address to look up
     */
    function isAdapter(address adapterAddress) public view returns (bool) {
        return inverseRegistry[adapterAddress].id != bytes32(0);
    }

    /**
     * @notice Checks if an adapter has a given ACL flag
     * @return Whether or not the given adapter has the given flag set
     * @param adapterAddress The address to look up
     * @param flag The ACL flag to check against the given address
     */
    function hasAdapterAccess(address adapterAddress, FlagHelper.Flag flag)
        public
        view
        returns (bool)
    {
        return
            inverseRegistry[adapterAddress].id != bytes32(0) &&
            inverseRegistry[adapterAddress].acl.getFlag(flag);
    }

    /**
     * @return The address of a given adapter ID
     * @param adapterId The ID to look up
     */
    function getAdapterAddress(bytes32 adapterId)
        external
        view
        returns (address)
    {
        return registry[adapterId];
    }

    /**
     * @notice Jails a member
     * @dev Sets all relevant flags and delegations to ensure a user can not participate
     * @param memberAddr The member to jail
     */
    function jailMember(address memberAddr)
        external
        hasAccess(this, FlagHelper.Flag.JAIL_MEMBER)
    {
        Member storage member = members[memberAddr];
        uint256 flags = member.flags;
        require(flags.getFlag(FlagHelper.Flag.EXISTS), "member does not exist");
        if (!flags.getFlag(FlagHelper.Flag.JAILED)) {
            member.flags = flags.setFlag(FlagHelper.Flag.JAILED, true);

            // Stop the member from voting at that point in time
            _createNewDelegateCheckpoint(memberAddr, address(1)); // 1 instead of 0 to avoid existence check
            emit MemberJailed(memberAddr);
        }
    }

    /**
     * @notice Unjails a member
     * @dev Resets all relevant flags to allow participation
     * @param memberAddr The member to unjail
     */
    function unjailMember(address memberAddr)
        external
        hasAccess(this, FlagHelper.Flag.UNJAIL_MEMBER)
    {
        Member storage member = members[memberAddr];
        uint256 flags = member.flags;
        require(flags.getFlag(FlagHelper.Flag.EXISTS), "member does not exist");
        if (flags.getFlag(FlagHelper.Flag.JAILED)) {
            member.flags = flags.setFlag(FlagHelper.Flag.JAILED, false);
            _createNewDelegateCheckpoint(
                memberAddr,
                getPreviousDelegateKey(memberAddr)
            ); // we do this to re-allow votes
            emit MemberUnjailed(memberAddr);
        }
    }

    /**
     * @notice Executes an arbitrary function call
     * @dev Calls a function and reverts if unsuccessful
     * @return The return data of the function call
     * @param _actionTo The address at which the function will be called
     * @param _actionValue The value to pass in to function call
     * @param _actionData The data to give the function call
     */
    function execute(
        address _actionTo,
        uint256 _actionValue,
        bytes calldata _actionData
    ) external hasAccess(this, FlagHelper.Flag.EXECUTE) returns (bytes memory) {
        (bool success, bytes memory retData) =
            _actionTo.call{value: _actionValue}(_actionData);

        if (!success) {
            string memory m = _getRevertMsg(retData);
            revert(m);
        }
        return retData;
    }

    /**
     * PROPOSALS
     */
    /**
     * @notice Submit proposals to the DAO registry
     * @return The proposal ID of the newly-created proposal
     */
    function submitProposal()
        external
        hasAccess(this, FlagHelper.Flag.SUBMIT_PROPOSAL)
        returns (uint64)
    {
        proposals[proposalCount++] = Proposal(msg.sender, 1);
        uint64 proposalId = proposalCount - 1;

        emit SubmittedProposal(proposalId, 1);

        return proposalId;
    }

    /**
     * @notice Sponsor proposals that were submitted to the DAO registry
     * @dev adds SPONSORED to the proposal flag
     * @param proposalId The ID of the proposal to sponsor
     * @param sponsoringMember The member who is sponsoring the proposal
     */
    function sponsorProposal(uint64 proposalId, address sponsoringMember)
        external
        hasAccess(this, FlagHelper.Flag.SPONSOR_PROPOSAL)
    {
        Proposal storage proposal =
            _setProposalFlag(proposalId, FlagHelper.Flag.SPONSORED);

        uint256 flags = proposal.flags;

        require(
            proposal.adapterAddress == msg.sender,
            "only the adapter that submitted the proposal can process it"
        );
        require(
            flags.getFlag(FlagHelper.Flag.EXISTS),
            "proposal does not exist"
        );
        require(
            !flags.getFlag(FlagHelper.Flag.PROCESSED),
            "proposal must not be processed"
        );
        require(
            isActiveMember(sponsoringMember),
            "only active members can sponsor proposals"
        );

        emit SponsoredProposal(proposalId, flags);
    }

    /**
     * @notice Mark a proposal as processed in the DAO registry
     * @param proposalId The ID of the proposal that is being processed
     */
    function processProposal(uint64 proposalId)
        external
        hasAccess(this, FlagHelper.Flag.PROCESS_PROPOSAL)
    {
        Proposal storage proposal =
            _setProposalFlag(proposalId, FlagHelper.Flag.PROCESSED);
        uint256 flags = proposal.flags;

        emit ProcessedProposal(proposalId, flags);
    }

    /**
     * @notice Sets a flag of a proposal
     * @dev Reverts if the proposal is already processed
     * @param proposalId The ID of the proposal to be changed
     * @param flag The flag that will be set on the proposal
     */
    function _setProposalFlag(uint64 proposalId, FlagHelper.Flag flag)
        internal
        returns (Proposal storage)
    {
        Proposal storage proposal = proposals[proposalId];

        require(
            proposal.adapterAddress == msg.sender,
            "only the adapter that submitted the proposal can set its flag"
        );

        uint256 flags = proposal.flags;
        require(
            flags.getFlag(FlagHelper.Flag.EXISTS),
            "proposal does not exist for this dao"
        );

        require(
            !flags.getFlag(FlagHelper.Flag.PROCESSED),
            "proposal already processed"
        );
        flags = flags.setFlag(flag, true);
        proposals[proposalId].flags = flags;

        return proposals[proposalId];
    }

    /**
     * @return Whether or not the given token is an available internal token in the bank
     * @param token The address of the token to look up
     */
    function isInternalToken(address token) external view returns (bool) {
        return _bank.availableInternalTokens[token];
    }

    /**
     * @return Whether or not the given token is an available token in the bank
     * @param token The address of the token to look up
     */
    function isTokenAllowed(address token) external view returns (bool) {
        return _bank.availableTokens[token];
    }

    /*
     * MEMBERS
     */

    /**
     * @return Whether or not a given address is an active member of the DAO
     * @dev Requires the user to not be jailed and have a positive balance in either
     *      SHARES, LOOT or LOCKED_LOOT
     * @param addr The address to look up
     */
    function isActiveMember(address addr) public view returns (bool) {
        address memberAddr = memberAddressesByDelegatedKey[addr];
        uint256 memberFlags = members[memberAddr].flags;
        return
            memberFlags.getFlag(FlagHelper.Flag.EXISTS) &&
            !memberFlags.getFlag(FlagHelper.Flag.JAILED) &&
            (balanceOf(memberAddr, SHARES) > 0 ||
                balanceOf(memberAddr, LOOT) > 0 ||
                balanceOf(memberAddr, LOCKED_LOOT) > 0);
    }

    /**
     * @return Whether or not a flag is set for a given proposal
     * @param proposalId The proposal to check against flag
     * @param flag The flag to check in the proposal
     */
    function getProposalFlag(uint64 proposalId, FlagHelper.Flag flag)
        external
        view
        returns (bool)
    {
        return proposals[proposalId].flags.getFlag(flag);
    }

    /**
     * @notice Updates the delegate key of a member
     * @param memberAddr The member doing the delegation
     * @param newDelegateKey The member who is being delegated to
     */
    function updateDelegateKey(address memberAddr, address newDelegateKey)
        external
        hasAccess(this, FlagHelper.Flag.UPDATE_DELEGATE_KEY)
    {
        require(newDelegateKey != address(0), "newDelegateKey cannot be 0");

        // skip checks if member is setting the delegate key to their member address
        if (newDelegateKey != memberAddr) {
            require(
                // newDelegate must not be delegated to
                memberAddressesByDelegatedKey[newDelegateKey] == address(0x0),
                "cannot overwrite existing members"
            );
        }

        Member storage member = members[memberAddr];
        require(
            member.flags.getFlag(FlagHelper.Flag.EXISTS),
            "member does not exist"
        );

        // Reset the delegation of the previous delegate
        memberAddressesByDelegatedKey[
            getCurrentDelegateKey(memberAddr)
        ] = address(0x0);

        memberAddressesByDelegatedKey[newDelegateKey] = memberAddr;

        _createNewDelegateCheckpoint(memberAddr, newDelegateKey);
        emit UpdateDelegateKey(memberAddr, newDelegateKey);
    }

    /*
     * BANK
     */

    /**
     * @notice Registers a potential new token in the bank
     * @dev Can not be a reserved token or an available internal token
     * @param token The address of the token
     */
    function registerPotentialNewToken(address token)
        external
        hasAccess(this, FlagHelper.Flag.REGISTER_NEW_TOKEN)
    {
        require(isNotReservedAddress(token), "reservedToken");
        require(!_bank.availableInternalTokens[token], "internalToken");

        if (!_bank.availableTokens[token]) {
            _bank.availableTokens[token] = true;
            _bank.tokens.push(token);
        }
    }

    /**
     * @notice Registers a potential new internal token in the bank
     * @dev Can not be a reserved token or an available token
     * @param token The address of the token
     */
    function registerPotentialNewInternalToken(address token)
        external
        hasAccess(this, FlagHelper.Flag.REGISTER_NEW_INTERNAL_TOKEN)
    {
        require(isNotReservedAddress(token), "reservedToken");
        require(!_bank.availableTokens[token], "internalToken");
        if (!_bank.availableInternalTokens[token]) {
            _bank.availableInternalTokens[token] = true;
            _bank.internalTokens.push(token);
        }
    }

    /**
     * Public read-only functions
     */

    /**
     * @return Whether or not a given address is reserved
     * @dev Returns false if applicant address is one of the constants GUILD or TOTAL
     * @param applicant The address to check
     */
    function isNotReservedAddress(address applicant)
        public
        pure
        returns (bool)
    {
        return applicant != GUILD && applicant != TOTAL;
    }

    /**
     * Internal bookkeeping
     */

    /**
     * @return The token from the bank of a given index
     * @param index The index to look up in the bank's tokens
     */
    function getToken(uint256 index) external view returns (address) {
        return _bank.tokens[index];
    }

    /**
     * @return The amount of token addresses in the bank
     */
    function nbTokens() external view returns (uint256) {
        return _bank.tokens.length;
    }

    /**
     * @return The internal token at a given index
     * @param index The index to look up in the bank's array of internal tokens
     */
    function getInternalToken(uint256 index) external view returns (address) {
        return _bank.internalTokens[index];
    }

    /**
     * @return The amount of internal token addresses in the bank
     */
    function nbInternalTokens() external view returns (uint256) {
        return _bank.internalTokens.length;
    }

    /**
     * @notice Adds to a user's balance of a given token
     * @param user The user whose balance will be updated
     * @param token The token to update
     * @param amount The new balance
     */
    function addToBalance(
        address user,
        address token,
        uint256 amount
    ) public hasAccess(this, FlagHelper.Flag.ADD_TO_BALANCE) {
        require(
            _bank.availableTokens[token] ||
                _bank.availableInternalTokens[token],
            "unknown token address"
        );
        uint256 newAmount = balanceOf(user, token) + amount;
        uint256 newTotalAmount = balanceOf(TOTAL, token) + amount;

        _createNewAmountCheckpoint(user, token, newAmount);
        _createNewAmountCheckpoint(TOTAL, token, newTotalAmount);

        Member storage member = members[user];
        if (!member.flags.getFlag(FlagHelper.Flag.EXISTS)) {
            member.flags = member.flags.setFlag(FlagHelper.Flag.EXISTS, true);
            memberAddressesByDelegatedKey[user] = user;
        }
    }

    /**
     * @notice Remove from a user's balance of a given token
     * @param user The user whose balance will be updated
     * @param token The token to update
     * @param amount The new balance
     */
    function subtractFromBalance(
        address user,
        address token,
        uint256 amount
    ) public hasAccess(this, FlagHelper.Flag.SUB_FROM_BALANCE) {
        uint256 newAmount = balanceOf(user, token) - amount;
        uint256 newTotalAmount = balanceOf(TOTAL, token) - amount;

        _createNewAmountCheckpoint(user, token, newAmount);
        _createNewAmountCheckpoint(TOTAL, token, newTotalAmount);
    }

    /**
     * @notice Make an internal token transfer
     * @param from The user who is sending tokens
     * @param to The user who is receiving tokens
     * @param amount The new amount to transfer
     */
    function internalTransfer(
        address from,
        address to,
        address token,
        uint256 amount
    ) public hasAccess(this, FlagHelper.Flag.INTERNAL_TRANSFER) {
        uint256 newAmount = balanceOf(from, token) - amount;
        uint256 newAmount2 = balanceOf(to, token) + amount;

        _createNewAmountCheckpoint(from, token, newAmount);
        _createNewAmountCheckpoint(to, token, newAmount2);
    }

    /**
     * @notice Returns an account's balance of a given token
     * @param account The address to look up
     * @param tokenAddr The token where the user's balance of which will be returned
     * @return The amount in account's tokenAddr balance
     */
    function balanceOf(address account, address tokenAddr)
        public
        view
        returns (uint256)
    {
        uint32 nCheckpoints = _bank.numCheckpoints[tokenAddr][account];
        return
            nCheckpoints > 0
                ? _bank.checkpoints[tokenAddr][account][nCheckpoints - 1].amount
                : 0;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorAmount(
        address account,
        address tokenAddr,
        uint256 blockNumber
    ) external view returns (uint256) {
        require(
            blockNumber < block.number,
            "Uni::getPriorAmount: not yet determined"
        );

        uint32 nCheckpoints = _bank.numCheckpoints[tokenAddr][account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (
            _bank.checkpoints[tokenAddr][account][nCheckpoints - 1].fromBlock <=
            blockNumber
        ) {
            return
                _bank.checkpoints[tokenAddr][account][nCheckpoints - 1].amount;
        }

        // Next check implicit zero balance
        if (_bank.checkpoints[tokenAddr][account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp =
                _bank.checkpoints[tokenAddr][account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.amount;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return _bank.checkpoints[tokenAddr][account][lower].amount;
    }

    /**
     * @param checkAddr The address to check for a delegate
     * @return the delegated address or the checked address if it is not a delegate
     */
    function getAddressIfDelegated(address checkAddr)
        public
        view
        returns (address)
    {
        address delegatedKey = memberAddressesByDelegatedKey[checkAddr];
        return delegatedKey == address(0x0) ? checkAddr : delegatedKey;
    }

    /**
     * @param memberAddr The member whose delegate will be returned
     * @return the delegate key at the current time for a member
     */
    function getCurrentDelegateKey(address memberAddr)
        public
        view
        returns (address)
    {
        uint32 nCheckpoints = numCheckpoints[memberAddr];
        return
            nCheckpoints > 0
                ? checkpoints[memberAddr][nCheckpoints - 1].delegateKey
                : memberAddr;
    }

    /**
     * @param memberAddr The member address to look up
     * @return The delegate key address for memberAddr at the second last checkpoint number
     */
    function getPreviousDelegateKey(address memberAddr)
        public
        view
        returns (address)
    {
        uint32 nCheckpoints = numCheckpoints[memberAddr];
        return
            nCheckpoints > 1
                ? checkpoints[memberAddr][nCheckpoints - 2].delegateKey
                : memberAddr;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param memberAddr The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorDelegateKey(address memberAddr, uint256 blockNumber)
        external
        view
        returns (address)
    {
        require(
            blockNumber < block.number,
            "Uni::getPriorDelegateKey: not yet determined"
        );

        uint32 nCheckpoints = numCheckpoints[memberAddr];
        if (nCheckpoints == 0) {
            return memberAddr;
        }

        // First check most recent balance
        if (
            checkpoints[memberAddr][nCheckpoints - 1].fromBlock <= blockNumber
        ) {
            return checkpoints[memberAddr][nCheckpoints - 1].delegateKey;
        }

        // Next check implicit zero balance
        if (checkpoints[memberAddr][0].fromBlock > blockNumber) {
            return memberAddr;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            DelegateCheckpoint memory cp = checkpoints[memberAddr][center];
            if (cp.fromBlock == blockNumber) {
                return cp.delegateKey;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[memberAddr][lower].delegateKey;
    }

    /**
     * @notice Creates a new amount checkpoint for a token of a certain member
     * @param member The member whose checkpoints will be added to
     * @param tokenAddr The token of which the balance will be changed
     * @param amount The amount to be written into the new checkpoint
     */
    function _createNewAmountCheckpoint(
        address member,
        address tokenAddr,
        uint256 amount
    ) internal {
        uint32 srcRepNum = _bank.numCheckpoints[tokenAddr][member];
        _writeAmountCheckpoint(member, tokenAddr, srcRepNum, amount);
        emit NewBalance(member, tokenAddr, amount);
    }

    /**
     * @notice Creates a new delegate checkpoint of a certain member
     * @param member The member whose delegate checkpoints will be added to
     * @param newDelegateKey The delegate key that will be written into the new checkpoint
     */
    function _createNewDelegateCheckpoint(
        address member,
        address newDelegateKey
    ) internal {
        uint32 srcRepNum = numCheckpoints[member];
        _writeDelegateCheckpoint(member, srcRepNum, newDelegateKey);
    }

    /**
     * @notice Writes to a delegate checkpoint of a certain checkpoint number
     * @dev Creates a new checkpoint if there is not yet one of the given number
     * @param member The member whose delegate checkpoints will overwritten
     * @param nCheckpoints The number of the checkpoint to overwrite
     * @param newDelegateKey The delegate key that will be written into the checkpoint
     */
    function _writeDelegateCheckpoint(
        address member,
        uint32 nCheckpoints,
        address newDelegateKey
    ) internal {
        if (
            nCheckpoints > 0 &&
            checkpoints[member][nCheckpoints - 1].fromBlock == block.number
        ) {
            checkpoints[member][nCheckpoints - 1].delegateKey = newDelegateKey;
        } else {
            checkpoints[member][nCheckpoints] = DelegateCheckpoint(
                uint96(block.number),
                newDelegateKey
            );
            numCheckpoints[member] = nCheckpoints + 1;
        }
    }

    /**
     * @notice Writes to an amount checkpoint of a certain checkpoint number
     * @dev Creates a new checkpoint if there is not yet one of the given number
     * @param member The member whose delegate checkpoints will overwritten
     * @param tokenAddr The token that will have its balance for the user udpated
     * @param nCheckpoints The number of the checkpoint to overwrite
     * @param _newAmount The amount to write into the specified checkpoint
     */
    function _writeAmountCheckpoint(
        address member,
        address tokenAddr,
        uint32 nCheckpoints,
        uint256 _newAmount
    ) internal {
        require(_newAmount < type(uint160).max, "too big of a vote");
        uint160 newAmount = uint160(_newAmount);

        if (
            nCheckpoints > 0 &&
            _bank.checkpoints[tokenAddr][member][nCheckpoints - 1].fromBlock ==
            block.number
        ) {
            _bank.checkpoints[tokenAddr][member][nCheckpoints - 1]
                .amount = newAmount;
        } else {
            _bank.checkpoints[tokenAddr][member][nCheckpoints] = Checkpoint(
                uint96(block.number),
                newAmount
            );
            _bank.numCheckpoints[tokenAddr][member] = nCheckpoints + 1;
        }
    }

    /*
     * Internal Utility Functions
     */

    /**
     * @dev Get the revert message from a call
     * @notice This is needed in order to get the human-readable revert message from a call
     * @param _res Response of the call
     * @return Revert message string
     */
    function _getRevertMsg(bytes memory _res)
        internal
        pure
        returns (string memory)
    {
        // If the _res length is less than 68, then the transaction failed silently (without a revert message)
        if (_res.length < 68) return "Transaction reverted silently";
        bytes memory revertData = _slice(_res, 4, _res.length - 4); // Remove the selector which is the first 4 bytes
        return abi.decode(revertData, (string)); // All that remains is the revert string
    }

    /**
     * @notice Slices a bytes type
     * @param _bytes The bytes that will be sliced
     * @param _start The start index to begin slicing from
     * @param _length The number of bytes to include in the slice, starting from _start
     * @return A new bytes object, that is the same as _bytes, from indices _start to (_start + length)
     */
    function _slice(
        bytes memory _bytes,
        uint256 _start,
        uint256 _length
    ) internal pure returns (bytes memory) {
        require(_bytes.length >= (_start + _length), "Read out of bounds");

        bytes memory tempBytes;

        assembly {
            switch iszero(_length)
                case 0 {
                    // Get a location of some free memory and store it in tempBytes as
                    // Solidity does for memory variables.
                    tempBytes := mload(0x40)

                    // The first word of the slice result is potentially a partial
                    // word read from the original array. To read it, we calculate
                    // the length of that partial word and start copying that many
                    // bytes into the array. The first word we copy will start with
                    // data we don't care about, but the last `lengthmod` bytes will
                    // land at the beginning of the contents of the new array. When
                    // we're done copying, we overwrite the full first word with
                    // the actual length of the slice.
                    let lengthmod := and(_length, 31)

                    // The multiplication in the next line is necessary
                    // because when slicing multiples of 32 bytes (lengthmod == 0)
                    // the following copy loop was copying the origin's length
                    // and then ending prematurely not copying everything it should.
                    let mc := add(
                        add(tempBytes, lengthmod),
                        mul(0x20, iszero(lengthmod))
                    )
                    let end := add(mc, _length)

                    for {
                        // The multiplication in the next line has the same exact purpose
                        // as the one above.
                        let cc := add(
                            add(
                                add(_bytes, lengthmod),
                                mul(0x20, iszero(lengthmod))
                            ),
                            _start
                        )
                    } lt(mc, end) {
                        mc := add(mc, 0x20)
                        cc := add(cc, 0x20)
                    } {
                        mstore(mc, mload(cc))
                    }

                    mstore(tempBytes, _length)

                    //update free-memory pointer
                    //allocating the array padded to 32 bytes like the compiler does now
                    mstore(0x40, and(add(mc, 31), not(31)))
                }
                //if we want a zero-length slice let's just return a zero-length array
                default {
                    tempBytes := mload(0x40)

                    mstore(0x40, add(tempBytes, 0x20))
                }
        }

        return tempBytes;
    }
}

/*ADD Adapter Code Below */

contract ConfigurationContract is IConfiguration, DaoConstants, MemberGuard {
    using SafeCast for uint256;

    enum ConfigurationStatus {NOT_CREATED, IN_PROGRESS, DONE}

    struct Configuration {
        ConfigurationStatus status;
        bytes32[] keys;
        uint256[] values;
    }

    mapping(uint64 => Configuration) public configurations;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function submitConfigurationProposal(
        DaoRegistry dao,
        bytes32[] calldata keys,
        uint256[] calldata values,
        bytes calldata data
    ) external override onlyMember(dao) returns (uint64) {
        require(
            keys.length == values.length,
            "configuration must have the same number of keys and values"
        );

        Configuration memory configuration =
            Configuration(ConfigurationStatus.IN_PROGRESS, keys, values);

        uint64 proposalId = dao.submitProposal();
        configurations[proposalId] = configuration;

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
        dao.sponsorProposal(proposalId, msg.sender);

        return proposalId;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 _proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);

        dao.sponsorProposal(proposalId, msg.sender);
    }

    function processProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        Configuration storage configuration = configurations[proposalId];

        // If status is empty or DONE we expect it to fail
        require(
            configuration.status == ConfigurationStatus.IN_PROGRESS,
            "reconfiguration already completed or does not exist"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        bytes32[] memory keys = configuration.keys;
        uint256[] memory values = configuration.values;
        for (uint256 i = 0; i < keys.length; i++) {
            dao.setConfiguration(keys[i], values[i]);
        }

        configuration.status = ConfigurationStatus.DONE;

        dao.processProposal(proposalId);
    }
}
//
contract FinancingContract is IFinancing, DaoConstants, MemberGuard {
    using SafeCast for uint256;

    struct ProposalDetails {
        address applicant;
        uint256 amount;
        address token;
        bytes32 details;
    }

    mapping(address => mapping(uint256 => ProposalDetails)) public proposals;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function createFinancingRequest(
        DaoRegistry dao,
        address applicant,
        address token,
        uint256 amount,
        bytes32 details
    ) external override returns (uint64) {
        require(amount > 0, "invalid requested amount");
        require(dao.isTokenAllowed(token), "token not allowed");
        require(
            dao.isNotReservedAddress(applicant),
            "applicant using reserved address"
        );

        uint64 proposalId = dao.submitProposal();

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        proposal.applicant = applicant;
        proposal.amount = amount;
        proposal.details = details;
        proposal.token = token;
        return proposalId;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 _proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
        dao.sponsorProposal(proposalId, msg.sender);
    }

    function processProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        ProposalDetails memory details = proposals[address(dao)][proposalId];

        require(
            !dao.getProposalFlag(proposalId, FlagHelper.Flag.PROCESSED),
            "proposal already processed"
        );
        require(
            dao.getProposalFlag(proposalId, FlagHelper.Flag.SPONSORED),
            "proposal not sponsored yet"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal needs to pass"
        );

        dao.subtractFromBalance(GUILD, details.token, details.amount);
        dao.addToBalance(details.applicant, details.token, details.amount);
        dao.processProposal(proposalId);
    }
}
//
contract GuildKickContract is IGuildKick, DaoConstants, MemberGuard {
    using SafeCast for uint256;

    enum GuildKickStatus {NOT_STARTED, IN_PROGRESS, DONE}

    struct GuildKick {
        address memberToKick;
        GuildKickStatus status;
        uint256 sharesToBurn;
        uint256 initialTotalShares;
        bytes data;
        uint256 currentIndex;
        uint256 blockNumber;
    }

    mapping(uint64 => GuildKick) public kicks;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function submitKickProposal(
        DaoRegistry dao,
        address memberToKick,
        bytes calldata data
    ) external override onlyMember(dao) returns (uint64) {
        // A kick proposal is created and needs to be voted
        uint64 proposalId = dao.submitProposal();
        kicks[proposalId] = GuildKick(
            memberToKick,
            GuildKickStatus.IN_PROGRESS,
            dao.balanceOf(memberToKick, SHARES),
            dao.balanceOf(TOTAL, SHARES),
            data,
            0,
            block.number
        );

        // start the voting process for the guild kick proposal
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);
        dao.sponsorProposal(proposalId, msg.sender);

        return proposalId;
    }

    function guildKick(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        GuildKick storage kick = kicks[proposalId];
        // If it does not exist or is not in progress we expect it to fail
        require(
            kick.status == GuildKickStatus.IN_PROGRESS,
            "guild kick already completed or does not exist"
        );

        // Only active members can be kicked out, which means the member is in jail already
        address memberToKick = kick.memberToKick;
        require(dao.isActiveMember(memberToKick), "memberToKick is not active");

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        // Member needs to have enough voting shares to be kicked
        uint256 sharesToLock = dao.balanceOf(memberToKick, SHARES);
        require(sharesToLock > 0, "insufficient shares");

        // send to jail and convert all voting shares into loot to remove the voting power
        dao.subtractFromBalance(memberToKick, SHARES, sharesToLock);
        dao.addToBalance(memberToKick, LOOT, sharesToLock);
        dao.jailMember(memberToKick);
        kick.status = GuildKickStatus.DONE;

        dao.processProposal(proposalId);
    }

    function rageKick(
        DaoRegistry dao,
        uint256 _proposalId,
        uint256 toIndex
    ) external override onlyMember(dao) {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        GuildKick storage kick = kicks[proposalId];
        // If does not exist or is not DONE we expect it to fail
        require(
            kick.status == GuildKickStatus.DONE,
            "guild kick not completed or does not exist"
        );

        // Check if the given index was already processed
        uint256 currentIndex = kick.currentIndex;
        require(currentIndex <= toIndex, "toIndex too low");

        // Set the max index supported
        uint256 tokenLength = dao.nbTokens();
        uint256 maxIndex = toIndex;
        if (maxIndex > tokenLength) {
            maxIndex = tokenLength;
        }

        //Update internal Guild and Member balances
        address kickedMember = kick.memberToKick;
        uint256 initialTotalShares = kick.initialTotalShares;
        for (uint256 i = currentIndex; i < maxIndex; i++) {
            address token = dao.getToken(i);
            uint256 amountToRagequit =
                FairShareHelper.calc(
                    dao.balanceOf(GUILD, token),
                    kick.sharesToBurn,
                    initialTotalShares
                );
            if (amountToRagequit > 0) {
                // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution
                // (which would break ragekicks) if a token overflows,
                // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                dao.internalTransfer(
                    GUILD,
                    kickedMember,
                    token,
                    amountToRagequit
                );
            }
        }

        kick.currentIndex = maxIndex;
        if (maxIndex == tokenLength) {
            dao.subtractFromBalance(kickedMember, LOOT, kick.sharesToBurn); //should we subtract at each iteration or only here at end?
            dao.unjailMember(kickedMember);
        }
    }
}
//
contract ManagingContract is IManaging, DaoConstants, MemberGuard {
    using SafeCast for uint256;

    struct ProposalDetails {
        address applicant;
        bytes32 moduleId;
        address moduleAddress;
        bytes32[] keys;
        uint256[] values;
        uint128 flags;
    }

    mapping(uint256 => ProposalDetails) public proposals;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function createModuleChangeRequest(
        DaoRegistry dao,
        bytes32 moduleId,
        address moduleAddress,
        bytes32[] calldata keys,
        uint256[] calldata values,
        uint256 _flags
    ) external override onlyMember(dao) returns (uint64) {
        require(
            keys.length == values.length,
            "must be an equal number of config keys and values"
        );
        require(moduleAddress != address(0x0), "invalid module address");
        require(_flags < type(uint128).max, "flags parameter overflow");
        uint128 flags = uint128(_flags);

        require(
            dao.isNotReservedAddress(moduleAddress),
            "module is using reserved address"
        );

        //is there a way to check if the new module implements the module interface properly?

        uint64 proposalId = dao.submitProposal();

        ProposalDetails storage proposal = proposals[proposalId];
        proposal.applicant = msg.sender;
        proposal.moduleId = moduleId;
        proposal.moduleAddress = moduleAddress;
        proposal.keys = keys;
        proposal.values = values;
        proposal.flags = flags;
        return proposalId;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 _proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);

        dao.sponsorProposal(proposalId, msg.sender);
    }

    function processProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        ProposalDetails memory proposal = proposals[proposalId];
        require(
            !dao.getProposalFlag(proposalId, FlagHelper.Flag.PROCESSED),
            "proposal already processed"
        );
        require(
            dao.getProposalFlag(proposalId, FlagHelper.Flag.SPONSORED),
            "proposal not sponsored yet"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        require(
            votingContract.voteResult(dao, proposalId) == 2,
            "proposal did not pass yet"
        );

        dao.removeAdapter(proposal.moduleId);

        bytes32[] memory keys = proposal.keys;
        uint256[] memory values = proposal.values;
        for (uint256 i = 0; i < keys.length; i++) {
            dao.setConfiguration(keys[i], values[i]);
        }

        dao.addAdapter(
            proposal.moduleId,
            proposal.moduleAddress,
            proposal.flags
        );
        dao.processProposal(proposalId);
    }
}
//
contract OnboardingContract is
    IOnboarding,
    DaoConstants,
    MemberGuard,
    AdapterGuard
{
    using SafeCast for uint256;

    bytes32 constant ChunkSize = keccak256("onboarding.chunkSize");
    bytes32 constant SharesPerChunk = keccak256("onboarding.sharesPerChunk");
    bytes32 constant TokenAddr = keccak256("onboarding.tokenAddr");
    bytes32 constant MaximumChunks = keccak256("onboarding.maximumChunks");

    struct ProposalDetails {
        uint64 id;
        address tokenToMint;
        uint256 amount;
        uint256 sharesRequested;
        address token;
        address payable applicant;
        address payable proposer;
    }

    struct OnboardingDetails {
        uint256 chunkSize;
        uint256 numberOfChunks;
        uint256 sharesPerChunk;
        uint256 amount;
        uint256 sharesRequested;
        uint256 totalShares;
    }

    mapping(address => mapping(uint256 => ProposalDetails)) public proposals;
    mapping(address => uint256) public shares;

    function configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(tokenAddrToMint, key));
    }

    function configureDao(
        DaoRegistry dao,
        address tokenAddrToMint,
        uint256 chunkSize,
        uint256 sharesPerChunk,
        uint256 maximumChunks,
        address tokenAddr
    ) external onlyAdapter(dao) {
        require(maximumChunks > 0, "maximumChunks must be higher than 0");
        require(chunkSize > 0, "chunkSize must be higher than 0");
        require(sharesPerChunk > 0, "sharesPerChunk must be higher than 0");

        dao.setConfiguration(
            configKey(tokenAddrToMint, MaximumChunks),
            maximumChunks
        );
        dao.setConfiguration(configKey(tokenAddrToMint, ChunkSize), chunkSize);
        dao.setConfiguration(
            configKey(tokenAddrToMint, SharesPerChunk),
            sharesPerChunk
        );
        dao.setAddressConfiguration(
            configKey(tokenAddrToMint, TokenAddr),
            tokenAddr
        );

        dao.registerPotentialNewInternalToken(tokenAddrToMint);
        dao.registerPotentialNewToken(ETH_TOKEN);
    }

    function _submitMembershipProposal(
        DaoRegistry dao,
        address tokenToMint,
        address payable applicant,
        address payable proposer,
        uint256 value,
        address token
    ) internal returns (uint256, uint64) {
        OnboardingDetails memory details;
        details.chunkSize = dao.getConfiguration(
            configKey(tokenToMint, ChunkSize)
        );
        require(details.chunkSize > 0, "config missing");

        details.numberOfChunks = value / details.chunkSize;
        require(details.numberOfChunks > 0, "not sufficient funds");

        details.sharesPerChunk = dao.getConfiguration(
            configKey(tokenToMint, SharesPerChunk)
        );
        details.amount = details.numberOfChunks * details.chunkSize;
        details.sharesRequested =
            details.numberOfChunks *
            details.sharesPerChunk;
        details.totalShares = shares[applicant] + details.sharesRequested;

        require(
            details.totalShares / details.sharesPerChunk <
                dao.getConfiguration(configKey(tokenToMint, MaximumChunks)),
            "total shares for this member must be lower than the maximum"
        );

        uint64 proposalId =
            _submitMembershipProposalInternal(
                dao,
                tokenToMint,
                applicant,
                proposer,
                details.sharesRequested,
                details.amount,
                token
            );

        return (details.amount, proposalId);
    }

    function onboardAndSponsor(
        DaoRegistry dao,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount,
        bytes calldata data
    ) external payable {
        uint64 proposalId = onboard(dao, applicant, tokenToMint, tokenAmount);
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        try
            votingContract.startNewVotingForProposal(dao, proposalId, data)
        {} catch Error(string memory reason) {
            revert(reason);
        } catch (
            bytes memory /*lowLevelData*/
        ) {
            revert("system error from voting");
        }

        address submittedBy =
            votingContract.getSenderAddress(
                dao,
                address(this),
                data,
                msg.sender
            );

        dao.sponsorProposal(proposalId, submittedBy);
    }

    function onboard(
        DaoRegistry dao,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount
    ) public payable override returns (uint64) {
        address tokenAddr =
            address(
                dao.getAddressConfiguration(configKey(tokenToMint, TokenAddr))
            );
        if (tokenAddr == ETH_TOKEN) {
            // ETH onboarding
            require(msg.value > 0, "not enough ETH");
            // If the applicant sends ETH to onboard, use the msg.value as default token amount
            tokenAmount = msg.value;
        } else {
            IERC20 token = IERC20(tokenAddr);
            // ERC20 onboarding
            require(
                token.allowance(msg.sender, address(this)) >= tokenAmount,
                "ERC20 transfer not allowed"
            );
            require(
                token.transferFrom(msg.sender, address(this), tokenAmount),
                "ERC20 failed transferFrom"
            );
        }

        (uint256 amountUsed, uint64 proposalId) =
            _submitMembershipProposal(
                dao,
                tokenToMint,
                applicant,
                payable(msg.sender),
                tokenAmount,
                tokenAddr
            );

        if (amountUsed < tokenAmount) {
            uint256 amount = tokenAmount - amountUsed;
            if (tokenAddr == ETH_TOKEN) {
                payable(msg.sender).transfer(amount);
            } else {
                IERC20 token = IERC20(tokenAddr);
                require(
                    token.transfer(msg.sender, amount),
                    "ERC20 failed transfer"
                );
            }
        }

        return proposalId;
    }

    function updateDelegateKey(DaoRegistry dao, address delegateKey) external {
        dao.updateDelegateKey(msg.sender, delegateKey);
    }

    function _submitMembershipProposalInternal(
        DaoRegistry dao,
        address tokenToMint,
        address payable newMember,
        address payable proposer,
        uint256 sharesRequested,
        uint256 amount,
        address token
    ) internal returns (uint64) {
        uint64 proposalId = dao.submitProposal();
        proposals[address(dao)][proposalId] = ProposalDetails(
            proposalId,
            tokenToMint,
            amount,
            sharesRequested,
            token,
            newMember,
            proposer
        );

        return proposalId;
    }

    function sponsorProposal(
        DaoRegistry dao,
        uint256 _proposalId,
        bytes calldata data
    ) external override onlyMember(dao) {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        votingContract.startNewVotingForProposal(dao, proposalId, data);

        dao.sponsorProposal(proposalId, msg.sender);
    }

    function cancelProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
        onlyMember(dao)
    {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );

        require(
            !dao.getProposalFlag(proposalId, FlagHelper.Flag.SPONSORED),
            "proposal already sponsored"
        );

        dao.processProposal(proposalId);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        _refundTribute(proposal.token, proposal.proposer, proposal.amount);
    }

    function processProposal(DaoRegistry dao, uint256 _proposalId)
        external
        override
    {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        require(
            proposals[address(dao)][proposalId].id == proposalId,
            "proposal does not exist"
        );
        require(
            !dao.getProposalFlag(proposalId, FlagHelper.Flag.PROCESSED),
            "proposal already processed"
        );

        IVoting votingContract = IVoting(dao.getAdapterAddress(VOTING));
        uint256 voteResult = votingContract.voteResult(dao, proposalId);

        ProposalDetails storage proposal = proposals[address(dao)][proposalId];
        if (voteResult == 2) {
            _mintTokensToMember(
                dao,
                proposal.tokenToMint,
                proposal.applicant,
                proposal.sharesRequested
            );

            dao.addToBalance(GUILD, ETH_TOKEN, proposal.amount);

            uint256 totalShares =
                shares[proposal.applicant] + proposal.sharesRequested;
            shares[proposal.applicant] = totalShares;
        } else if (voteResult == 3) {
            _refundTribute(proposal.token, proposal.proposer, proposal.amount);
        } else {
            revert("proposal has not been voted on yet");
        }

        dao.processProposal(proposalId);
    }

    function _refundTribute(
        address tokenAddr,
        address payable proposer,
        uint256 amount
    ) internal {
        if (tokenAddr == ETH_TOKEN) {
            proposer.transfer(amount);
        } else {
            IERC20 token = IERC20(tokenAddr);
            require(
                token.transferFrom(address(this), proposer, amount),
                "ERC20 failed transferFrom"
            );
        }
    }

    function _mintTokensToMember(
        DaoRegistry dao,
        address tokenToMint,
        address memberAddr,
        uint256 tokenAmount
    ) internal {
        require(
            dao.isInternalToken(tokenToMint),
            "it can only mint internal tokens"
        );

        dao.addToBalance(memberAddr, tokenToMint, tokenAmount);
    }
}
//
contract RagequitContract is IRagequit, DaoConstants, MemberGuard {
    enum RagequitStatus {NOT_STARTED, IN_PROGRESS, DONE}

    struct Ragequit {
        uint256 blockNumber;
        RagequitStatus status;
        uint256 initialTotalSharesAndLoot;
        uint256 sharesAndLootBurnt;
        uint256 currentIndex;
    }

    mapping(address => Ragequit) public ragequits;

    /*
     * default fallback function to prevent from sending ether to the contract
     */
    receive() external payable {
        revert("fallback revert");
    }

    function startRagequit(
        DaoRegistry dao,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) external override onlyMember(dao) {
        address memberAddr = msg.sender;

        require(
            ragequits[memberAddr].status != RagequitStatus.IN_PROGRESS,
            "rage quit already in progress"
        );
        //Burn if member has enough shares and loot
        require(
            dao.balanceOf(memberAddr, SHARES) >= sharesToBurn,
            "insufficient shares"
        );
        require(
            dao.balanceOf(memberAddr, LOOT) >= lootToBurn,
            "insufficient loot"
        );

        _prepareRagequit(dao, memberAddr, sharesToBurn, lootToBurn);
    }

    function _prepareRagequit(
        DaoRegistry dao,
        address memberAddr,
        uint256 sharesToBurn,
        uint256 lootToBurn
    ) internal {
        // burn shares and loot

        Ragequit storage ragequit = ragequits[memberAddr];

        ragequit.status = RagequitStatus.IN_PROGRESS;
        ragequit.blockNumber = block.number;
        //TODO: make this the sum of all the internal tokens
        ragequit.initialTotalSharesAndLoot =
            dao.balanceOf(TOTAL, SHARES) +
            dao.balanceOf(TOTAL, LOOT) +
            dao.balanceOf(TOTAL, LOCKED_LOOT);

        ragequit.sharesAndLootBurnt = sharesToBurn + lootToBurn;
        ragequit.currentIndex = 0;

        dao.subtractFromBalance(memberAddr, SHARES, sharesToBurn);
        dao.subtractFromBalance(memberAddr, LOOT, lootToBurn);

        dao.jailMember(memberAddr);
    }

    function burnShares(
        DaoRegistry dao,
        address memberAddr,
        uint256 toIndex
    ) external override {
        // burn shares and loot
        Ragequit storage ragequit = ragequits[memberAddr];
        require(
            ragequit.status == RagequitStatus.IN_PROGRESS,
            "ragequit not in progress"
        );
        uint256 currentIndex = ragequit.currentIndex;
        require(currentIndex <= toIndex, "toIndex too low");
        uint256 sharesAndLootToBurn = ragequit.sharesAndLootBurnt;
        uint256 initialTotalSharesAndLoot = ragequit.initialTotalSharesAndLoot;

        //Update internal Guild and Member balances
        uint256 tokenLength = dao.nbTokens();
        uint256 maxIndex = toIndex;
        if (maxIndex > tokenLength) {
            maxIndex = tokenLength;
        }
        uint256 blockNumber = ragequit.blockNumber;
        for (uint256 i = currentIndex; i < maxIndex; i++) {
            address token = dao.getToken(i);
            uint256 amountToRagequit =
                FairShareHelper.calc(
                    dao.getPriorAmount(GUILD, token, blockNumber),
                    sharesAndLootToBurn,
                    initialTotalSharesAndLoot
                );
            if (amountToRagequit > 0) {
                // gas optimization to allow a higher maximum token limit
                // deliberately not using safemath here to keep overflows from preventing the function execution
                // (which would break ragekicks) if a token overflows,
                // it is because the supply was artificially inflated to oblivion, so we probably don"t care about it anyways
                dao.internalTransfer(
                    GUILD,
                    memberAddr,
                    token,
                    amountToRagequit
                );
            }
        }

        ragequit.currentIndex = maxIndex;
        if (maxIndex == tokenLength) {
            ragequit.status = RagequitStatus.DONE;
            dao.unjailMember(memberAddr);
        }
    }
}
//
contract VotingContract is IVoting, DaoConstants, MemberGuard, AdapterGuard {
    using SafeCast for uint256;

    struct Voting {
        uint256 nbYes;
        uint256 nbNo;
        uint256 startingTime;
        uint256 blockNumber;
        mapping(address => uint256) votes;
    }

    bytes32 constant VotingPeriod = keccak256("voting.votingPeriod");
    bytes32 constant GracePeriod = keccak256("voting.gracePeriod");

    mapping(address => mapping(uint64 => Voting)) public votes;

    function configureDao(
        DaoRegistry dao,
        uint256 votingPeriod,
        uint256 gracePeriod
    ) external onlyAdapter(dao) {
        dao.setConfiguration(VotingPeriod, votingPeriod);
        dao.setConfiguration(GracePeriod, gracePeriod);
    }

    //voting  data is not used for pure onchain voting
    function startNewVotingForProposal(
        DaoRegistry dao,
        uint256 _proposalId,
        bytes calldata
    ) external override onlyAdapter(dao) {
        //it is called from Registry
        // compute startingPeriod for proposal
        uint64 proposalId = SafeCast.toUint64(_proposalId);

        Voting storage vote = votes[address(dao)][proposalId];
        vote.startingTime = block.timestamp;
        vote.blockNumber = block.number;
    }

    function getSenderAddress(
        DaoRegistry,
        address,
        bytes memory,
        address sender
    ) external pure override returns (address) {
        return sender;
    }

    function submitVote(
        DaoRegistry dao,
        uint256 _proposalId,
        uint256 voteValue
    ) external onlyMember(dao) {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        require(dao.isActiveMember(msg.sender), "only active members can vote");
        require(
            dao.getProposalFlag(proposalId, FlagHelper.Flag.SPONSORED),
            "the proposal has not been sponsored yet"
        );

        require(
            !dao.getProposalFlag(proposalId, FlagHelper.Flag.PROCESSED),
            "the proposal has already been processed"
        );

        require(
            voteValue < 3,
            "only blank (0), yes (1) and no (2) are possible values"
        );

        Voting storage vote = votes[address(dao)][proposalId];

        require(
            vote.startingTime > 0,
            "this proposalId has no vote going on at the moment"
        );
        require(
            block.timestamp <
                vote.startingTime + dao.getConfiguration(VotingPeriod),
            "vote has already ended"
        );

        address memberAddr = dao.getAddressIfDelegated(msg.sender);

        require(vote.votes[memberAddr] == 0, "member has already voted");

        uint256 correctWeight =
            dao.getPriorAmount(memberAddr, SHARES, vote.blockNumber);

        vote.votes[memberAddr] = voteValue;

        if (voteValue == 1) {
            vote.nbYes = vote.nbYes + correctWeight;
        } else if (voteValue == 2) {
            vote.nbNo = vote.nbNo + correctWeight;
        }
    }

    //Public Functions
    /**
    possible results here:
    0: has not started
    1: tie
    2: pass
    3: not pass
    4: in progress
     */
    function voteResult(DaoRegistry dao, uint256 _proposalId)
        external
        view
        override
        returns (uint256 state)
    {
        uint64 proposalId = SafeCast.toUint64(_proposalId);
        Voting storage vote = votes[address(dao)][proposalId];
        if (vote.startingTime == 0) {
            return 0;
        }

        if (
            block.timestamp <
            vote.startingTime + dao.getConfiguration(VotingPeriod)
        ) {
            return 4;
        }

        if (vote.nbYes > vote.nbNo) {
            return 2;
        } else if (vote.nbYes < vote.nbNo) {
            return 3;
        } else {
            return 1;
        }
    }
}
//




