## Adapter description and scope
Onboarding is the process of bringing members into the DAO.

## Adapter configuration
bytes32 constant ChunkSize = keccak256("onboarding.chunkSize");
    bytes32 constant SharesPerChunk = keccak256("onboarding.sharesPerChunk");
    bytes32 constant TokenAddr = keccak256("onboarding.tokenAddr");
    bytes32 constant MaximumChunks = keccak256("onboarding.maximumChunks");

## Aapter state
struct ProposalDetails {
        bytes32 id;
        address tokenToMint;
        uint256 amount;
        uint256 sharesRequested;
        address token;
        address payable applicant;
        address payable proposer;
    }

    mapping(address => mapping(bytes32 => ProposalDetails)) public proposals;
    mapping(address => uint256) public shares;

## Dependencies and interactions (internal / external)

## Functions description and assumptions / checks
    function configKey(address tokenAddrToMint, bytes32 key)
        internal
        pure
        returns (bytes32)

    function configureDao(
        DaoRegistry dao,
        address tokenAddrToMint,
        uint256 chunkSize,
        uint256 sharesPerChunk,
        uint256 maximumChunks,
        address tokenAddr
    ) external onlyAdapter(dao)

    function onboardAndSponsor(
        DaoRegistry dao,
        bytes32 proposalId,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount,
        bytes calldata data
    ) external payable 

    function onboard(
        DaoRegistry dao,
        bytes32 proposalId,
        address payable applicant,
        address tokenToMint,
        uint256 tokenAmount
    ) public payable 

    function updateDelegateKey(DaoRegistry dao, address delegateKey) external {
        dao.updateDelegateKey(msg.sender, delegateKey);
    }

    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes calldata data
    ) external override onlyMember(dao) 

    function cancelProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
        onlyMember(dao)
    

    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
        override
