## Adapter description and scope

The Tribute NFT adapter allows potential and existing DAO members to contribute any ERC-721 tokens to the DAO in exchange for any amount of DAO internal tokens (in this case it mints SHARES always). If the proposal passes, the requested internal tokens are minted to the applicant, and the ERC-721 asset provided as tribute is transferred to the NFT Extension. In addition, the applicant becomes a member of the DAO (if not already one).

The Tribute NFT adapter is similar to the Onboarding adapter in that both allow for joining the DAO (or increasing a stake in the DAO) through the exchange of contributed assets for DAO internal tokens. However, there are key differences:

- The Tribute NFT adapter accepts only ERC-721 tokens.

- The Tribute NFT adapter has more open-ended proposal parameters. The proposer can request any amount of internal tokens to be minted in exchange for any amount of the ERC-721 tokens contributed. The worthiness of that transfer proposal for the DAO is left to the vote of its members.

## Adapter workflow

A tribute is made by first submitting a proposal specifying (1) the applicant who wishes to join the DAO (or increase his stake in the DAO), (2) the amount of internal tokens (SHARES) the applicant desires, and (3) the ERC-721 NFT address, and token id the applicant will transfer to the DAO in exchange for those internal tokens. Prior to submitting the proposal, the applicant must first separately `approve` the adapter as spender of the ERC-721 token provided as tribute. The proposal submission will transfer the tribute token from the applicant to the adapter to be held in escrow.

If the proposal has not been sponsored yet, the applicant can cancel the proposal. Upon cancellation, the proposal is marked as processed and the tribute token is returned to the proposer. Only the applicant can cancel the proposal.

When a DAO member sponsors the proposal, the voting period begins allowing members to vote for or against the proposal. Only a member can sponsor the proposal.

After the voting period is done along with its subsequent grace period, the proposal can be processed. Any account can process the proposal. Upon processing, if the vote has passed, the requested internal tokens are minted to the applicant and the applicant is added as a DAO member (if not already one). The tribute token is transferred out of escrow from the adapter to the NFT extension.

Upon processing, if the vote has failed (i.e., more NO votes then YES votes or a tie), the tribute token is returned to the proposer.

## Adapter configuration

A DAO NFT extension must exist and be configured with proper access for this adapter.

The DAO internal tokens (in this case SHARES) to be minted to the applicant must be registered with the DAO Bank.

DAORegistry Access Flags: `SUBMIT_PROPOSAL`, `NEW_MEMBER`.

NFT Extension Access Flags: `COLLECT_NFT`.

Bank Extension Access Flags: `ADD_TO_BALANCE`.

## Adapter state

- `proposals`: All tribute NFT proposals handled by each DAO.
- `ProposalDetails`:
  - `id`: The proposal id.
  - `applicant`: The applicant address (who will receive the DAO internal tokens and become a member).
  - `nftAddr`: The address of the NFT in ERC-721 standard to be locked in the DAO in exchange for voting power.
  - `nftTokenId`: The nft token identifier.
  - `requestedShares`: The amount of shares requested to lock the NFT in exchange of DAO internal tokens.

## Dependencies and interactions (internal / external)

- BankExtension

  - Registers DAO internal token (in this case SHARES) to be minted to the applicant in adapter configuration.
  - Adds to the applicant balance the amount of requested DAO internal tokens.

- NFTExtension

  - Transfers the NFT asset from the adapter escrow to the extension collection.

- DaoRegistry

  - Gets Bank extension address.
  - Checks if applicant address is not reserved.
  - Gets Voting adapter address.
  - Submits/sponsors/processes the tribute proposal.
  - Checks if proposal flag is `SPONSORED`, `PROCESSED`.
  - Creates a new member entry (if applicant is not already a member).

- Voting

  - Gets address that sent the sponsorProposal transaction.
  - Starts new voting for the tribute proposal.
  - Checks the voting results.

## Functions description and assumptions / checks

### receive() external payable

```solidity
    /**
     * @notice default fallback function to prevent from sending ether to the contract.
     */
    receive() external payable
```

### function provideTribute

Not implemented because the adapter does not handle ERC20 tokens.

```solidity
function provideTribute(
  DaoRegistry,
  bytes32,
  address,
  address,
  uint256,
  address,
  uint256
) external pure override
```

### function provideTributeNFT

```solidity
   /**
     * @notice Creates a tribute proposal and escrows received token into the adapter.
     * @dev Applicant address must not be reserved.
     * @dev The proposer must first separately `approve` the adapter as spender of the ERC-721 token provided as tribute.
     * @param dao The DAO address.
     * @param proposalId The proposal id (managed by the client).
     * @param nftAddr The address of the ERC-721 token that will be locked in the DAO in exchange for Shares.
     * @param nftTokenId The NFT token id.
     * @param requestedShares The amount of Shares requested of DAO as voting power.
     */
    function provideTributeNFT(
        DaoRegistry dao,
        bytes32 proposalId,
        address nftAddr,
        uint256 nftTokenId,
        uint256 requestedShares
    ) external
```

### function sponsorProposal

```solidity
    /**
     * @notice Sponsors a tribute proposal to start the voting process.
     * @dev Only members of the DAO can sponsor a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     * @param data Additional details about the proposal.
     */
    function sponsorProposal(
        DaoRegistry dao,
        bytes32 proposalId,
        bytes memory data
    ) external
```

### function cancelProposal

```solidity
    /**
     * @notice Cancels a tribute proposal which marks it as processed and returns the NFT to the original owner.
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been sponsored can be cancelled.
     * @dev Only proposer can cancel a tribute proposal.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function cancelProposal(DaoRegistry dao, bytes32 proposalId)
        external
```

### function processProposal

```solidity
   /**
     * @notice Processes the proposal to handle minting and exchange of DAO internal tokens for tribute token (passed vote) or the return of the NFT to the original owner (failed vote).
     * @dev Proposal id must exist.
     * @dev Only proposals that have not already been processed are accepted.
     * @dev Only sponsored proposals with completed voting are accepted.
     * @param dao The DAO address.
     * @param proposalId The proposal id.
     */
    function processProposal(DaoRegistry dao, bytes32 proposalId)
        external
```

### function \_mintSharesToNewMember

```solidity
    /**
     * @notice Adds DAO internal tokens (SHARES) to applicant's balance and creates a new member entry (if applicant is not already a member).
     * @dev Internal tokens to be minted to the applicant must be registered with the DAO Bank.
     * @param dao The DAO address.
     * @param applicant The applicant address (who will receive the DAO internal tokens and become a member).
     * @param nftAddr The address of the ERC-721 tribute token.
     * @param nftTokenId The NFT token id.
     * @param requestedShares The amount requested of DAO internal tokens (SHARES).
     */
    function _mintSharesToNewMember(
        DaoRegistry dao,
        address applicant,
        address nftAddr,
        uint256 nftTokenId,
        uint256 requestedShares
    ) internal
```

### function onERC721Received

```solidity
   /**
     * @notice Required function from IERC721 standard to be able to receive assets to this contract address.
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4)
```

## Events

No events are emitted from this adapter.
