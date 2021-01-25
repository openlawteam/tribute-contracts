## Adapter description and scope

## Adapter state
bool public initialized = false; // internally tracks deployment under eip-1167 proxy pattern
DaoRegistry public dao;

address[] public tokens;
address[] public internalTokens;
// tokenAddress => availability
mapping(address => bool) public availableTokens;
mapping(address => bool) public availableInternalTokens;
// tokenAddress => memberAddress => checkpointNum => Checkpoint
mapping(address => mapping(address => mapping(uint32 => Checkpoint)))
    public checkpoints;
// tokenAddress => memberAddress => numCheckpoints
mapping(address => mapping(address => uint32)) public numCheckpoints;

## Adapter workflow

## Adapter configuration

## Functions description, assumptions, checks, dependencies, interactions and access control
    

    function initialize(DaoRegistry _dao, address creator) external 

    function withdraw(
        address payable account,
        address tokenAddr,
        uint256 amount
    ) external 

    
    function isInternalToken(address token) external view returns (bool) 

    
    function isTokenAllowed(address token) external view returns (bool) 

    function registerPotentialNewToken(address token)
        external

    function registerPotentialNewInternalToken(address token)


    function isNotReservedAddress(address applicant)
        public
        pure
        returns (bool)


    function getToken(uint256 index) external view returns (address) 

    function nbTokens() external view returns (uint256) 

    function getInternalToken(uint256 index) external view returns (address) 

    function nbInternalTokens() external view returns (uint256) 

    function addToBalance(
        address user,
        address token,
        uint256 amount
    ) public payable 
    
    function subtractFromBalance(
        address user,
        address token,
        uint256 amount
    ) public 

    function internalTransfer(
        address from,
        address to,
        address token,
        uint256 amount
    ) public 

    function balanceOf(address account, address tokenAddr)
        public
        view
        returns (uint256)

    function getPriorAmount(
        address account,
        address tokenAddr,
        uint256 blockNumber
    ) external view returns (uint256) 

    function _createNewAmountCheckpoint(
        address member,
        address tokenAddr,
        uint256 amount
    ) 
    
    function _writeAmountCheckpoint(
        address member,
        address tokenAddr,
        uint32 nCheckpoints,
        uint256 _newAmount
    ) internal 
