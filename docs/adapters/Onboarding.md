## Adapter description and scope

The Onboarding adapter allows potential and existing DAO members to contribute Ether or ERC-20 tokens to the DAO in exchange for a fixed amount of internal tokens (e.g., UNITS or LOOT tokens already registered with the DAO Bank) based on the amount of assets contributed. If the proposal passes, the internal tokens are minted to the applicant (which effectively makes the applicant a member of the DAO if not already one) and the tokens provided as tribute are transferred to the Bank extension.

You can mint any internal tokens but it is usually to mint either UNITS or LOOT tokens. The onboarding process supports raw Ether and ERC-20 tokens as tribute. The ERC-20 token must be allowed/supported by the Bank.

## Adapter workflow

An onboarding proposal is made by a member first submitting a proposal specifying (1) the applicant who wishes to join the DAO (or increase his stake in the DAO), (2) the type of internal tokens the applicant desires (e.g., member UNITS), and (3) the amount of Ether or ERC-20 tokens that will transfer to the DAO in exchange for those internal tokens. The applicant and actual owner of the ERC-20 tokens can be separate accounts (e.g., the token owner is providing tribute on behalf of the applicant). The internal token type requested must be already registered with the DAO Bank and will usually be pre-defined UNITS or LOOT tokens in the DAO. The proposal submission does not actually transfer the Ether or ERC-20 tokens from its owner. That occurs only after the proposal passes and is processed.

The proposal is also sponsored in the same transaction when it is submitted. When a DAO member sponsors the proposal, the voting period begins allowing members to vote for or against the proposal. Only a member can sponsor the proposal.

After the voting period is done along with its subsequent grace period, the proposal can be processed. Any account can process a failed proposal. However, only the original proposer (owner of the assets being transferred to the DAO) can process a passed proposal. Prior to processing a passed proposal involving ERC-20 tribute tokens, the owner of those tokens must first separately `approve` the Onboarding adapter as spender of the tokens provided as tribute. Upon processing, if the vote has passed, the internal tokens are minted to the applicant (which effectively makes the applicant a member of the DAO if not already one). The amount of Ether or ERC-20 tokens provided as tribute are added to the Guild balance and transferred from the token owner to the Bank extension.

Upon processing, if the vote has failed (i.e., more NO votes then YES votes or a tie), no further action is taken (the owner of the Ether or ERC-20 tokens still retains ownership of the assets).

## Adapter configuration

Each configuration is done based on the token address that needs to be minted.

DAORegistry Access Flags: `SUBMIT_PROPOSAL`, `UPDATE_DELEGATE_KEY`, `NEW_MEMBER`.

Bank Extension Access Flags: `ADD_TO_BALANCE`.

## Adapter state

### onboarding.chunkSize

How many tokens need to be minted per chunk bought.

### onboarding.unitsPerChunk

How many units (tokens from tokenAddr) are being minted per chunk.

### onboarding.tokenAddr

In which currency (tokenAddr) should the onboarding take place.

### onboarding.maximumChunks

How many chunks can someone buy max. This helps force decentralization of token holders.

## Adapter state

Onboarding keeps track of every proposal that goes through it as well as the number of tokens that have been minted so far.

### ProposalDetails

For each proposal created through the adapter, we keep track of the following information:

#### id

The proposalId (provided offchain).

#### unitsToMint

Which token needs to be minted if the proposal passes.

#### amount

The amount sent by the proposer.

#### unitsRequested

The amount of internal tokens that needs to be minted to the applicant if the proposal passes.

#### token

What currency has been used in the onboarding process.

We keep this information even though it is part of the configuration to handle the case where the configuration changes while a proposal has been created but not processed yet.

#### applicant

The applicant address.

### proposals mapping

The proposals are organized by DAO address and then by proposal id.

### units

Accounting to see the amount of a particular internal token that has been minted for a particular applicant. This is then checked against the maxChunks configuration to determine if the onboarding proposal is allowed or not.

## Functions description and assumptions / checks

### function configKey(address tokenAddrToMint, bytes32 key) returns (bytes32)

This is the function to build the config key for a particular tokenAddrToMint.
It's a pure function.

### function configureDao(DaoRegistry dao, address unitsToMint, uint256 chunkSize, uint256 unitsPerChunk, uint256 maximumChunks, address tokenAddr)

This function configures the adapter for a particular DAO.
The modifier is adapterOnly which means that only if the sender is either a registered adapter of the DAO or if it is in creation mode can it be called.
The function checks that chunkSize, unitsPerChunks and maximumChunks cannot be 0.

**tokenAddr** is being whitelisted in the bank extension as an ERC-20 token
**unitsToMint** is being whitelisted in the bank extension as an internal token

#### dependency

The adapter also needs a Bank extension. So `confgureDao` will fail if no bank extension is found.

### function submitProposal(DaoRegistry dao, bytes32 proposalId, address payable applicant, address tokenToMint, uint256 tokenAmount, bytes memory data)

Submits and sponsors the proposal. Only members can call this function.

This function uses **\_submitMembershipProposal** to create the proposal.

This function uses **\_sponsorProposal** to sponsor the proposal.

### function \_sponsorProposal(DaoRegistry dao, bytes32 proposalId, bytes memory data)

This internal function starts a vote on the proposal to onboard a new member.

**dao.sponsorProposal(proposalId, sponsoredBy, address(votingContract))** checks already that the proposal has not been sponsored yet

**voting.startNewVotingForProposal(dao, proposalId, data)** starts the vote process

### function processProposal(DaoRegistry dao, bytes32 proposalId)

Once the vote on a proposal is finished, it is time to process it. Anybody can call this function.

The function checks that there is a vote in progress for this proposalId and that it has not been processed yet.
If the vote is a success (`PASS`), then we process it by minting the internal tokens and moving the tokens from the adapter to the bank extension.

If the vote is a tie (`TIE`) or failed (`NOT_PASS`), then the funds are returned to the proposer.

Otherwise, the state is invalid and the transaction is reverted (if the vote does not exist or if it is in progress).

### function \_submitMembershipProposal(DaoRegistry dao, bytes32 proposalId, address tokenToMint, address payable applicant, uint256 value, address token)

This function marks the proposalId as submitted in the DAO and saves the information in the internal adapter state.

### Events

No events are emitted from this adapter.
