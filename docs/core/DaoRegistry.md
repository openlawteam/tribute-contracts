## Description and scope
The DAO Registry is the identity of the DAO. This is the contract address that is passed to every adapter.

The scope of th registry is to manage the folowing:
- The adapter registry, i.e. which adapter is being used by this DAO and which access it has
- The extension registry, i.e. which extension is part of the DAO and the adapter's access to it
- Memberes registry, whether they exist, their delegate key and their flags

Each non constant function in the DAO has an access control modifier linked to it, to make sure the caller has the right to call it.

## Registry state

### mapping(address => Member) public members;
Mapping of all the members. Member struct contains the flags uint

### address[] private _members
List of all the member addresses. Useful to iterate through members

### mapping(address => address) public memberAddressesByDelegatedKey
mapping of the member address by delegate key (think inverted mapping from members by delegate key)

### mapping(address => mapping(uint32 => DelegateCheckpoint)) checkpoints
Delegate key checkpoints. This is useful to know what the delegate key is at a certain point in time
    
### mapping(address => uint32) numCheckpoints
Checkpoint lengths per member address

### DaoState public state
Dao state. This is used to know if the DAO is currently being set up or if it is already running. Useful to configure it.

### mapping(bytes32 => Proposal) public proposals
Mapping of all the proposals for the DAO. Each proposal has an adapterAddress (which adapter created it) and flags to define its state.

### mapping(bytes32 => address) public adapters
Mapping of all the adatpers. bytes32 is the keccak256 of their name and address

### mapping(address => AdapterEntry) public inverseAdapters;
Mapping of adapter details. For each address, we can get its id (keccak256(name)) and its acl (access control, which function in the DAO it can access to)

### mapping(bytes32 => address) public extensions;
Mapping of each extension. Like for adapters, the key here is keccak256(name) (for ex: keccak256("bank"))

### mapping(address => ExtensionEntry) public inverseExtensions;
Mapping of extension details. For each extension address, you get its id (keccak256(name)) and a mapping from adapter address => access control
Access control for each extension is centralized in the DaoRegistry to avoid each extension implementing its own ACL system

### mapping(bytes32 => uint256) public mainConfiguration;
generic configuration mapping from key (keccak256(name)) to any type that can be encoded in 256 bytes (does not need to be uint, could be bytes32 too)

### mapping(bytes32 => address) public addressConfiguration;
Since addresses are not encoded in 256 bytes, we need a separte configuration mapping for this type.

## Functions description, assumptions, checks, dependencies, interactions and access control

### function initialize(address creator) external
Initializes the DAO by creating the first member being the creator passed to the function
        
### function finalizeDao() 
Mark the DAO as finalized and now changes can only be made through adapters

### function setConfiguration(bytes32 key, uint256 value)
Set a generic configuration entry for the DAO
Only adapters with access to this function can do it

### function setAddressConfiguration(bytes32 key, address value)
Set an address configuration entry for the DAO
Only adapters with access to this function can do it

### function potentialNewMember(address memberAddress)
This functions checks if the member exsits in the DAO, if he does not,
it creates the entry for it. 
That means creating an entry in the members mapping, setting the delegate key to be the same address as the new member and add the address to the members list    

### function getConfiguration(bytes32 key) external view returns (uint256) 
Get the generic config entry by passing the keccak256(config name)

### function getAddressConfiguration(bytes32 key)
Get the address config entry by passing the keccak256(config name)

### function addExtension(bytes32 extensionId, IExtension extension, address creator) external
Add a new extension to the registry. It first checks if the extension id is already used and reverts if it is the case.
It then adds the extension to the DAO and initializes it.

### function removeExtension(bytes32 extensionId)
Removes the extension by extension id. It reverts if no extension has been registered for that id (keccak256(name))

### function setAclToExtensionForAdapter(address extensionAddress, address adapterAddress, uint256 acl)
Set the access control for a particular adapter (by address) to a specifc extension
Both adapter and extesnion needs to be already registered to the DAO

### function addAdapter(bytes32 adapterId, address adapterAddress, uint256 acl) 
Adds an adapter to the DAO adapter registry. It also sets the access control.

The adapter can be added only if the adapter id it not already used

### function removeAdapter(bytes32 adapterId)
Remove an adapter from the DAO. Reverts if no adapter has been registered to the adapterId

### function isExtension(address extensionAddr) public view returns (bool) 
Checks whether the address is registered as an extension in the DAO


### function isAdapter(address adapterAddress) public view returns (bool)
Checks whether the address is registered as an adapter in the DAO
    
    /**
     * @notice Checks if an adapter has a given ACL flag
     * @return Whether or not the given adapter has the given flag set
     * @param adapterAddress The address to look up
     * @param flag The ACL flag to check against the given address
     */
### function hasAdapterAccess(address adapterAddress, AclFlag flag)    
Checks whether the adapter has access to a certain flag in the DAO

### function hasAdapterAccessToExtension(address adapterAddress, address extensionAddress, uint8 flag) returns (bool)
Checks whether a certain adapter has access to a certain extension in the DAO

### function getAdapterAddress(bytes32 adapterId) returns (address)
return the adapter address registered for this adapterId and reverts if not found.

The reason we revert here is to avoid the need to check everywhere that the return value is 0x0 when we want to use an adapter

### function getExtensionAddress(bytes32 extensionId) external view returns (address)
return the extension address registered for this extensionId and reverts if not found.

The reason we revert here is to avoid the need to check everywhere that the return value is 0x0 when we want to use an extension

### function jailMember(address memberAddr)
marks the member as jailed. 
reverts if the member does not exist.
The call can be done multiple times but if the member is already jailed, nothing happens
    

### function unjailMember(address memberAddr)
Unmark a member as jailed.
Reverts if the member does not exist, does nothing if the member is not jailed
    
### function submitProposal(bytes32 proposalId)        
Creates a proposal entry for the DAO.
It checks that the proposal was not previouls y created

### function sponsorProposal(bytes32 proposalId, address sponsoringMember)
Marks an existing proposal as sponsored.
Checks that the proposal has not been sponsored yet
Checks that the proposal exists
Checks that the adapter that sponsors the proposal is the one that submitted it
Checks that it has not been processed yet
Checks that the member sponsoring it is an active member

    /**
     * @notice Mark a proposal as processed in the DAO registry
     * @param proposalId The ID of the proposal that is being processed
     */
### function processProposal(bytes32 proposalId)
    {
        Proposal storage proposal =
            _setProposalFlag(proposalId, ProposalFlag.PROCESSED);
        uint256 flags = proposal.flags;

        emit ProcessedProposal(proposalId, flags);
    }

    /**
     * @notice Sets a flag of a proposal
     * @dev Reverts if the proposal is already processed
     * @param proposalId The ID of the proposal to be changed
     * @param flag The flag that will be set on the proposal
     */
### function _setProposalFlag(bytes32 proposalId, ProposalFlag flag)     
    {
        Proposal storage proposal = proposals[proposalId];

        uint256 flags = proposal.flags;
        require(
            getFlag(flags, uint8(ProposalFlag.EXISTS)),
            "proposal does not exist for this dao"
        );

        require(
            proposal.adapterAddress == msg.sender,
            "only the adapter that submitted the proposal can set its flag"
        );

        require(!getFlag(flags, uint8(flag)), "flag already set");

        require(
            !getFlag(flags, uint8(ProposalFlag.PROCESSED)),
            "proposal already processed"
        );
        flags = setFlag(flags, uint8(flag), true);
        proposals[proposalId].flags = flags;

        return proposals[proposalId];
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
### function isActiveMember(address addr) public view returns (bool) {
        address memberAddr = memberAddressesByDelegatedKey[addr];
        uint256 memberFlags = members[memberAddr].flags;
        return
            getFlag(memberFlags, uint8(MemberFlag.EXISTS)) &&
            !getFlag(memberFlags, uint8(MemberFlag.JAILED));
    }

    /**
     * @return Whether or not a flag is set for a given proposal
     * @param proposalId The proposal to check against flag
     * @param flag The flag to check in the proposal
     */
### function getProposalFlag(bytes32 proposalId, ProposalFlag flag)
        public
        view
        returns (bool)
    {
        return getFlag(proposals[proposalId].flags, uint8(flag));
    }

    /**
     * @return Whether or not a flag is set for a given member
     * @param memberAddress The member to check against flag
     * @param flag The flag to check in the member
     */
### function getMemberFlag(address memberAddress, MemberFlag flag)
        external
        view
        returns (bool)
    {
        return getFlag(members[memberAddress].flags, uint8(flag));
    }

### function getNbMember() public view returns (uint256) {
        return _members.length;
    }

### function getMemberAddress(uint256 index) public view returns (address) {
        return _members[index];
    }

    /**
     * @notice Updates the delegate key of a member
     * @param memberAddr The member doing the delegation
     * @param newDelegateKey The member who is being delegated to
     */
### function updateDelegateKey(address memberAddr, address newDelegateKey) 
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
            getFlag(member.flags, uint8(MemberFlag.EXISTS)),
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

    /**
     * Public read-only functions
     */

    /**
     * @return Whether or not a given address is reserved
     * @dev Returns false if applicant address is one of the constants GUILD or TOTAL
     * @param applicant The address to check
     */
### function isNotReservedAddress(address applicant)
    {
        return applicant != GUILD && applicant != TOTAL;
    }

    /**
     * @param checkAddr The address to check for a delegate
     * @return the delegated address or the checked address if it is not a delegate
     */
### function getAddressIfDelegated(address checkAddr)
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
### function getCurrentDelegateKey(address memberAddr)    
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
### function getPreviousDelegateKey(address memberAddr)
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
### function getPriorDelegateKey(address memberAddr, uint256 blockNumber)
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
     * @notice Creates a new delegate checkpoint of a certain member
     * @param member The member whose delegate checkpoints will be added to
     * @param newDelegateKey The delegate key that will be written into the new checkpoint
     */
### function _createNewDelegateCheckpoint(
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
### function _writeDelegateCheckpoint(
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
