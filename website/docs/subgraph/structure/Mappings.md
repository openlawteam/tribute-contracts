---
id: mappings
title: Mappings
---

## Core

Lorum ipsum ....

### Dao Factory

Lorum ipsum ....

- `handleDaoCreated(event: DAOCreated)`

### Dao Registry

Lorum ipsum ....

- `handleSubmittedProposal(event: SubmittedProposal)`
- `handleSponsoredProposal(event: SponsoredProposal)`
- `handleProcessedProposal(event: ProcessedProposal)`
- `handleAdapterAdded(event: AdapterAdded)`
- `handleAdapterRemoved(event: AdapterRemoved)`
- `handleExtensionAdded(event: ExtensionAdded)`
- `handleExtensionRemoved(event: ExtensionRemoved)`
- `handleUpdateDelegateKey(event: UpdateDelegateKey)`
- `handleConfigurationUpdated(event: ConfigurationUpdated)`
- `handleAddressConfigurationUpdated(event: AddressConfigurationUpdated)`

### Dao Constants

The following used constant values in the mappings are defined in `subgraph/core/dao-constants.ts`:

**Reserved internal addresses**

- `UNITS`
- `GUILD`
- `TOTAL`
- `MEMBER_COUNT`

**Adapter names hashed (lowercase)**

- `DISTRIBUTE_ID`
- `FINANCING_ID`
- `GUILDKICK_ID`
- `TRIBUTE_ID`
- `TRIBUTE_NFT_ID`
- `ONBOARDING_ID`
- `MANAGING_ID`
- `VOTING_ID`

**Extension names hashed (lowercase)**

- `BANK_EXTENSION_ID`
- `ERC20_EXTENSION_ID`
- `NFT_EXTENSION_ID`

## Adapters

Adapter events can be mapped separately, however only `generic` type adapters such as Coupon Onboarding are currently mapped. Type `proposal` adapters are handled by the DAO Registry mapping, see `dao-registry-mapping.ts` and it's helper file `proposal-details.ts`.

### Coupon Onboarding

This adapter is a `generic` type (see here for more details on adapter types [add link]), so if the parameters are added to the subgraph-config they will be included in the subgraph.yaml

- `handleCouponRedeemed(event: CouponRedeemed)`

## Extensions

Extensions are handled differently, as they have factory contracts that dynamically create contracts, so they utilize **[The Graph data source templates](https://thegraph.com/docs/define-a-subgraph#data-source-templates-for-dynamically-created-contracts)** to dynamically `create()` instance a new instance of an entity for each DAO.

### Bank

- `handleNewBalance(event: NewBalance)`
- `handleWithdraw(event: Withdraw)`

### NFT

- `handleCollectedNFT(event: CollectedNFT)`
- `handleTransferredNFT(event: TransferredNFT)`
- `handleWithdrawnNFT(event: WithdrawnNFT)`

## Helpers

These helper files help manage the data stored in the entities.

### Proposal Details

Type `proposal` adapters, are not mapped separately.

### Vote

### Extension Entities
