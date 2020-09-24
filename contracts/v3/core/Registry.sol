pragma solidity ^0.7.0;

// SPDX-License-Identifier: MIT

import "../utils/Ownable.sol";
import "../adapters/interfaces/IOnboarding.sol";
import "../helpers/FlagHelper.sol";
import "../utils/SafeMath.sol";
import "./Module.sol";
import "./interfaces/IMember.sol";
import "../adapters/interfaces/IVoting.sol";
import "../guards/ModuleGuard.sol";

contract Registry is Ownable, Module {
    
    /*
     * LIBRARIES
     */
    using FlagHelper for uint256;
    using SafeMath for uint256;

    /*
     * MODIFIERS
     */
    modifier onlyModule {
        require(
            inverseRegistry[msg.sender] != bytes32(0),
            "onlyModule"
        );
        _;
    }

    modifier onlyAdapter {
        require(
            inverseRegistry[msg.sender] != bytes32(0),
            "onlyAdapter"
        );
        _;
    }

    /*
     * EVENTS
     */
    /// @dev - Events for Proposals
    event SubmittedProposal(uint256 proposalId, uint256 proposalIndex, address applicant, uint256 flags);
    event SponsoredProposal(uint256 proposalId, uint256 proposalIndex, uint256 startingTime, uint256 flags);
    event ProcessedProposal(uint256 proposalId, uint256 processingTime, uint256 flags);

    /// @dev - Events for Members
    event UpdateMember(address member, uint256 shares);
    event UpdateDelegateKey(address indexed memberAddress, address newDelegateKey);

    /*
     * STRUCTURES
     */
    struct Proposal { // the structure to track all the proposals in the DAO
        address applicant; // the address of the sender that submitted the proposal
        bytes32 adapterId; // the adapter id that called the functions to change the DAO state
        address adapterAddress; // the adapter address that called the functions to change the DAO state
        uint256 flags; // flags to track the state of the proposal: exist, sponsored, processed, canceled, etc.
    }

    struct Member { // the structure to track all the members in the DAO
        uint256 flags; // flags to track the state of the member: exist, jailed, etc
        address delegateKey; // ?
        uint256 nbShares; // number of shares of the DAO member
    }

    struct Checkpoint { // A checkpoint for marking number of votes from a given block
        uint256 fromBlock;
        uint256 votes;
    }

    /*
     * PRIVATE VARIABLES
     */
    mapping(address => mapping(address => Member)) private members; // the map to track all members of the DAO
    mapping(address => mapping(address => address)) private memberAddresses; // the member address map
    mapping(address => mapping(address => address)) private memberAddressesByDelegatedKey; // ???

    /*
     * PUBLIC VARIABLES
     */
    /// @notice The total shares in the DAO, which has its maximum number at 2**256 - 1
    uint256 public totalShares = 1;
    /// @notice The number of proposals submitted to the DAO
    uint256 public proposalCount;
    /// @notice The map that keeps track of all proposasls submitted to the DAO
    mapping(uint256 => Proposal) public proposals;
    /// @notice The map that keeps track of all adapters registered in the DAO
    mapping(bytes32 => address) public registry;
    /// @notice The inverse map to get the adapter id based on its address
    mapping(address => bytes32) public inverseRegistry; 
    /// @notice A record of votes checkpoints for each account, by index
    mapping(address => mapping(uint32 => Checkpoint)) public checkpoints;
    /// @notice The number of checkpoints for each account
    mapping(address => uint32) public numCheckpoints;

    constructor() {
        bytes32 ownerId = keccak256("owner");
        registry[ownerId] = msg.sender;
        inverseRegistry[msg.sender] = ownerId;
    }

    /*
     * PUBLIC NON RESTRICTED FUNCTIONS
     */
    receive() external payable {
        if (!isModule(msg.sender)) {
            IOnboarding onboarding = IOnboarding(registry[ONBOARDING_MODULE]);
            uint256 amount = onboarding.processOnboarding(
                this,
                msg.sender,
                msg.value
            );
            if (msg.value > amount) {
                msg.sender.transfer(msg.value - amount);
            }
        }
    }

    function addModule(bytes32 moduleId, address moduleAddress)
        external
        onlyModule
    {
        require(moduleId != bytes32(0), "module id must not be empty");
        require(
            moduleAddress != address(0x0),
            "module address must not be empty"
        );
        require(registry[moduleId] == address(0x0), "module id already in use");
        registry[moduleId] = moduleAddress;
        inverseRegistry[moduleAddress] = moduleId;
    }

    function removeModule(bytes32 moduleId) external onlyModule {
        require(moduleId != bytes32(0), "module id must not be empty");
        require(registry[moduleId] != address(0x0), "module not registered");
        delete inverseRegistry[registry[moduleId]];
        delete registry[moduleId];
    }

    function isModule(address module) public view returns (bool) {
        return inverseRegistry[module] != bytes32(0);
    }

    function getAddress(bytes32 moduleId) external view returns (address) {
        return registry[moduleId];
    }

    function _getAdapter(bytes32 adapterId) internal view returns (address) {
        return registry[adapterId];
    }

    function execute(
        address _actionTo,
        uint256 _actionValue,
        bytes calldata _actionData
    ) external onlyModule returns (bytes memory) {
        (bool success, bytes memory retData) = _actionTo.call{
            value: _actionValue
        }(_actionData);

        if (!success) {
            string memory m = _getRevertMsg(retData);
            revert(m);
        }
        return retData;
    }

    /**
     * PROPOSALS
     */
    /// @dev - Proposal: submit proposals to the DAO registry
    function submitProposal(address applicant)
        external
        onlyAdapter
        returns (uint256)
    {
        Proposal memory p = Proposal(applicant, inverseRegistry[msg.sender], msg.sender, 1);
        proposals[proposalCount++] = p;
        uint256 proposalId = proposalCount - 1;

        emit SubmittedProposal(proposalId, proposalCount, applicant, p.flags);

        return proposalId;
    }

    /// @dev - Proposal: sponsor proposals that were submitted to the DAO registry
    function sponsorProposal(
        uint256 proposalId,
        address sponsoringMember,
        bytes calldata votingData
    ) external onlyAdapter {
        Proposal memory proposal = proposals[proposalId];
        require(
            proposal.flags.exists(),
            "proposal does not exist"
        );
        require(
            !proposal.flags.isSponsored(),
            "proposal must not be sponsored"
        );
        require(
            !proposal.flags.isCancelled(),
            "proposal must not be cancelled"
        );
        require(
            !proposal.flags.isProcessed(),
            "proposal must not be processed"
        );

        IMember memberContract = IMember(_getAdapter(MEMBER_MODULE));
        require(
            memberContract.isActiveMember(Registry(this), sponsoringMember),
            "only active members can sponsor proposals"
        );

        IVoting votingContract = IVoting(_getAdapter(VOTING_MODULE));
        uint256 votingId = votingContract.startNewVotingForProposal(
            Registry(this),
            proposalId,
            votingData
        );

        proposals[proposalId].flags = proposal.flags.setSponsored(true);

        emit SponsoredProposal(proposalId, votingId, block.timestamp, proposals[proposalCount].flags);
    }

    /// @dev - Proposal: mark a proposal as processed in the DAO registry
    function processProposal(
        uint256 proposalId
    ) external onlyAdapter {
        Proposal memory proposal = proposals[proposalId];
        require(
            proposal.flags.exists(),
            "proposal does not exist for this dao"
        );
        require(
            proposal.flags.isSponsored(),
            "proposal not sponsored"
        );
        require(
            !proposal.flags.isProcessed(),
            "proposal already processed"
        );

        proposals[proposalId].flags = proposal.flags.setProcessed(true);

        emit ProcessedProposal(proposalId, block.timestamp, proposals[proposalCount].flags);
    }

    /*
     * MEMBERS
     */
    function isActiveMember(address addr)
        external
        view
        returns (bool)
    {
        address memberAddr = memberAddressesByDelegatedKey[address(this)][addr];
        uint256 memberFlags = members[address(this)][memberAddr].flags;
        return
            memberFlags.exists() &&
            !memberFlags.isJailed() &&
            members[address(this)][memberAddr].nbShares > 0;
    }

    function memberAddress(address memberOrDelegateKey)
        external
        view
        returns (address)
    {
        return memberAddresses[address(this)][memberOrDelegateKey];
    }

    function updateMember(
        address memberAddr,
        uint256 shares
    ) external onlyModule {
        Member storage member = members[address(this)][memberAddr];
        if (member.delegateKey == address(0x0)) {
            member.flags = 1;
            member.delegateKey = memberAddr;
        }

        member.nbShares = shares;

        totalShares = totalShares.add(shares);

        memberAddressesByDelegatedKey[address(this)][member
            .delegateKey] = memberAddr;

        emit UpdateMember(memberAddr, shares);
    }

    function updateDelegateKey(
        address memberAddr,
        address newDelegateKey
    ) external onlyAdapter {
        require(newDelegateKey != address(0), "newDelegateKey cannot be 0");

        // skip checks if member is setting the delegate key to their member address
        if (newDelegateKey != memberAddr) {
            require(
                memberAddresses[address(this)][newDelegateKey] == address(0x0),
                "cannot overwrite existing members"
            );
            require(
                memberAddresses[address(
                    this
                )][memberAddressesByDelegatedKey[address(
                    this
                )][newDelegateKey]] == address(0x0),
                "cannot overwrite existing delegate keys"
            );
        }

        Member storage member = members[address(this)][memberAddr];
        require(member.flags.exists(), "member does not exist");
        memberAddressesByDelegatedKey[address(this)][member
            .delegateKey] = address(0x0);
        memberAddressesByDelegatedKey[address(
            this
        )][newDelegateKey] = memberAddr;
        member.delegateKey = newDelegateKey;

        emit UpdateDelegateKey(memberAddr, newDelegateKey);
    }

    function burnShares(
        address memberAddr,
        uint256 sharesToBurn
    ) external onlyAdapter {
        require(
            _enoughSharesToBurn(memberAddr, sharesToBurn),
            "insufficient shares"
        );

        Member storage member = members[address(this)][memberAddr];
        member.nbShares = member.nbShares.sub(sharesToBurn);
        totalShares = totalShares.sub(sharesToBurn);

        emit UpdateMember(memberAddr, member.nbShares);
    }

    function nbShares(address member)
        external
        view
        returns (uint256)
    {
        return members[address(this)][member].nbShares;
    }

    function getTotalShares() external view returns (uint256) {
        return totalShares;
    }

    /**
     * @notice Gets the current votes balance for `account`
     * @param account The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getCurrentVotes(address account)
        external
        view
        returns (uint256)
    {
        uint32 nCheckpoints = numCheckpoints[account];
        return
            nCheckpoints > 0 ? checkpoints[account][nCheckpoints - 1].votes : 0;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorVotes(address account, uint256 blockNumber)
        external
        view
        returns (uint256)
    {
        require(
            blockNumber < block.number,
            "Uni::getPriorVotes: not yet determined"
        );

        uint32 nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[account][nCheckpoints - 1].votes;
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
                return cp.votes;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[account][lower].votes;
    }

    function _moveDelegates(
        address srcRep,
        address dstRep,
        uint256 amount
    ) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                uint32 srcRepNum = numCheckpoints[srcRep];
                uint256 srcRepOld = srcRepNum > 0
                    ? checkpoints[srcRep][srcRepNum - 1].votes
                    : 0;
                uint256 srcRepNew = srcRepOld.sub(amount);
                _writeCheckpoint(srcRep, srcRepNum, srcRepNew);
            }

            if (dstRep != address(0)) {
                uint32 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0
                    ? checkpoints[dstRep][dstRepNum - 1].votes
                    : 0;
                uint256 dstRepNew = dstRepOld.add(amount);
                _writeCheckpoint(dstRep, dstRepNum, dstRepNew);
            }
        }
    }

    function _writeCheckpoint(
        address delegatee,
        uint32 nCheckpoints,
        uint256 newVotes
    ) internal {
        if (
            nCheckpoints > 0 &&
            checkpoints[delegatee][nCheckpoints - 1].fromBlock == block.number
        ) {
            checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
        } else {
            checkpoints[delegatee][nCheckpoints] = Checkpoint(
                block.number,
                newVotes
            );
            numCheckpoints[delegatee] = nCheckpoints + 1;
        }
    }

    /**
     * Internal Utility Functions
     */

    function _enoughSharesToBurn(
        address memberAddr,
        uint256 sharesToBurn
    ) internal view returns (bool) {
        return
            sharesToBurn > 0 &&
            members[address(this)][memberAddr].nbShares >= sharesToBurn;
    }

    /*
     * Internal Utility Functions
     */

    /// @dev Get the revert message from a call
    /// @notice This is needed in order to get the human-readable revert message from a call
    /// @param _res Response of the call
    /// @return Revert message string
    function _getRevertMsg(bytes memory _res)
        internal
        pure
        returns (string memory)
    {
        // If the _res length is less than 68, then the transaction failed silently (without a revert message)
        if (_res.length < 68) return "Transaction reverted silently";
        bytes memory revertData = slice(_res, 4, _res.length - 4); // Remove the selector which is the first 4 bytes
        return abi.decode(revertData, (string)); // All that remains is the revert string
    }

    function slice(
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
