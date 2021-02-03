## Adapter description and scope

The Configuration adapter manages storing and retrieving per-DAO settings required by shared adapters.

Some adapters have configurable settings which must be stored for each DAO instance that uses the shared adapter.

## Workflows

Submit proposal

- check that caller is valid member
- check that keys/values are same length
- check that proposalId is unique

- submit proposal to DAO
- create and store configuration structure

Sponsor module change request

- check that caller is valid member

- initiate vote

Process proposal

- check that caller is valid member
- check that proposalId exists
- check that status is in progress
- check that proposal passed

- for each key and value, set it in the configuration for this DAO
- set configuration status to done
- process proposal

## Adapter state

The adapter stores the proposed configuration changes.

### Configuration

DAORegistry Access Flags: `SUBMIT_PROPOSAL`, `PROCESS_PROPOSAL`, `SPONSOR_PROPOSAL`, `SET_CONFIGURATION`.

#### status

The status of this configuration change, an enum with values: NOT_CREATED, IN_PROGRESS, DONE

#### keys

The array of keys to set in the configuration

#### values

The array of values to set in the configuration

## Dependencies and interactions (internal / external)

## Functions description and assumptions / checks

### function submitConfigurationProposal(DaoRegistry dao, bytes32 proposalId, bytes32[] calldata keys, uint256[] calldata values)

Creates and submits a new configuration proposal on behalf of the member calling the function.

**dao** is the DAO instance to be configured
**proposalId** is the ID chosen for this configuration proposal, must be unique
**keys** the configuration keys to set
**values** the configuration values to set, must be same length as keys

### function processProposal(DaoRegistry dao, bytes32 proposalId)

Processes a previously created configuration proposal by applying the configuration to the DAO.

**dao** is the DAO instance to be configured
**proposalId** is the ID of a previously created configuration proposal which has not been sponsored
**data**

### function processProposal(DaoRegistry dao, bytes32 proposalId)

Processes a previously created configuration proposal by applying the configuration to the DAO.

**dao** is the DAO instance to be configured
**proposalId** is the ID of a previously created and sponsored configuration proposal which has passed the vote
