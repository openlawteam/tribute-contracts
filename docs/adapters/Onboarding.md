## Adapter description and scope
Onboarding adapter is the process of minting internal tokens in exchange of a specific token at a fixed price.
Each tokens sent are then converted into a proposal that the community votes on. If it passes, the tokens are moved to the 
guild bank and internal tokens minted, otherwise the proposer can withdraw back his tokens.

You can mint any internal tokens but it is usually to mint either SHARE or LOOT tokens.

## Adapter configuration
Each configuration is done based on the token address that needs to be minted.
### {tokenAddrToMint}.onboarding.chunkSize
How many tokens need to be minted per chunk bought. 

### {tokenAddrToMint}.onboarding.sharesPerChunk
How many shares (tokens from tokenAddr) are being minted per chunk
    
### {tokenAddrToMint}.onboarding.tokenAddr
In which currency (tokenAddr) should the onboarding take place

### {tokenAddrToMint}.onboarding.maximumChunks
How many chunks can someone buy max. This helps force decentralization of token holders.
## Aapter state
Onboarding keeps track of every proposal that goes through it as well as the number of tokens that have been minted so far
### ProposalDetails
For each proposal created through the adapter, we keep track of the following information
#### id
The proposalId (provided offchain) 
#### tokenToMint
Which token needs to be minted if the proposal passes
#### amount
The amount sent by the applicant
#### sharesRequested
The amount of internal tokens that needs to be minted if the proposal passes
#### token
What currency has been used in the onboarding process. 

We keep this information even though it is part of the configuration to handle the case where the configuration changes while a proposal has been created but not processed yet.
#### applicant
The applicant address
#### proposer
The proposer address

### proposals mapping
The proposals are organized by dao address and then by proposal id

### shares
Accounting to see the amount of a particular internal token that has been minted for a particular applicant. This is then checked against the maxChunks configuration to make sure the onboarding proposal is allowed or not

## Functions description, assumptions, checks, dependencies, interactions and access control
Here is the list of all the functions in onboarding, what they are for, the checks and assumptions.
### function configKey(address tokenAddrToMint, bytes32 key) returns (bytes32)
This is the function to buil the config key for a particular tokenAddrToMint.
it's a pure function
### function configureDao(DaoRegistry dao, address tokenAddrToMint, uint256 chunkSize, uint256 sharesPerChunk, uint256 maximumChunks, address tokenAddr)
This function configures the adapter for a particular dao.
The modifier is adapterOnly which means that only if the sender is either a registered adapter of the DAO or if it is in creation mode can it be called.
The function checks that chunkSize, sharesPerChunks and maximumChunks cannot be 0

**tokenAddr** is being whitelisted in the bank extension as an ERC-20 token
**tokenAddrToMint** is being whitelisted in the bank extension as an internal token
#### dependency
The adapter also needs a Bank extension. So confgureDao will fail if no bank extension is found.
### function onboard(DaoRegistry dao, bytes32 proposalId, address payable applicant, address tokenToMint, uint256 tokenAmount)
Onboard submits the proposal but does not sponsor it yet. This is why anyone can call this function.


### function sponsorProposal(DaoRegistry dao, bytes32 proposalId, bytes calldata data)
### function onboardAndSponsor(DaoRegistry dao, bytes32 proposalId, address payable applicant, address tokenToMint, uint256 tokenAmount, bytes calldata data)

### function cancelProposal(DaoRegistry dao, bytes32 proposalId)
    
### function processProposal(DaoRegistry dao, bytes32 proposalId)

### function _submitMembershipProposal(DaoRegistry dao, bytes32 proposalId, address tokenToMint, address payable applicant, address payable proposer, uint256 value, address token)

### function _submitMembershipProposalInternal(DaoRegistry dao, bytes32 proposalId, address tokenToMint, address payable newMember, address payable proposer, uint256 sharesRequested, uint256 amount, address token)

### function _refundTribute(address tokenAddr, address payable proposer, uint256 amount)

### function _mintTokensToMember(DaoRegistry dao, address tokenToMint, address memberAddr, uint256 tokenAmount)