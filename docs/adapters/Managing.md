## Adapter description and scope

The Managing adapter manages proposal creation, sponsorship and processing of a new adapter including its initial configuration.

In order to remove an adapter one must pass the address 0x0 with the adapter id that needs to be removed.

## Adapter workflow

Create adapter change request

- check that caller is valid member
- check that keys and values are equal length
- check that adapter address is valid
- check that flags don't overflow
- check that the adapter address is not reserved
- submit proposal
- store adapter data

Sponsor adapter change request

- check that caller is valid member
- sponsor proposal
- initiate vote

Process adapter change proposal

- check that caller is valid member
- check that proposal has not been processed
- check that proposal has been sponsored
- check that proposal has passed
- remove existing adapter
- for each key and value, set it in the configuration for this DAO
- add the adapter to the DAO
- process proposal

## Adapter configuration

DAORegistry Access Flags: `SUBMIT_PROPOSAL`, `PROCESS_PROPOSAL`, `SPONSOR_PROPOSAL`, `REMOVE_ADAPTER`, `ADD_ADAPTER`.

## Adapter state

### ProposalDetails

For each proposal created through the adapter, we keep track of the following information:

#### adapterId

The ID of the adapter to add or replace.

#### adapterAddress

The address of the new adapter contract.

#### keys

The configuration keys for the adapter.

#### values

The values to set for the adapter configuration.

#### flags

The ACL for the new adapter.

## Dependencies and interactions (internal / external)

## Functions description and assumptions / checks

### function createAdapterChangeRequest(DaoRegistry dao, bytes32 proposalId, bytes32 adapterId, address adapterAddress, bytes32[] calldata keys, uint256[] calldata values, uint256 \_flags)

Creates a proposal to add/replace/remove the given adapter with a new version including configuration and flags.

**dao** is the DAO instance to be configured
**proposalId** is the ID chosen for this adapter proposal, must be unique
**adapterId** the ID of the new adapter
**adapterAddress** the contract address of the new adapter. If the address equals `0x0`, it means the adapterId needs to be removed.
**keys** the configuration keys to set
**values** the configuration values to set, must be same length as keys
**flags** the ACL for the new adapter

### function sponsorProposal(DaoRegistry dao, bytes32 proposalId, bytes calldata data)

Sponsors a proposal to add/replace a adapter.

**dao** is the DAO instance to be configured
**proposalId** is the ID of a previously created adapter proposal which has not been sponsored
**data**

### function processProposal(DaoRegistry dao, bytes32 proposalId)

Processes a proposal to add/replace a adapter.

**dao** is the DAO instance to be configured
**proposalId** is the ID of a previously created configuration proposal which has passed the vote
