import { crypto, log, store } from "@graphprotocol/graph-ts";

import {
  ProcessedProposal,
  SponsoredProposal,
  SubmittedProposal,
  UpdateDelegateKey,
  AdapterAdded,
  AdapterRemoved,
  MemberJailed,
  MemberUnjailed,
  ExtensionAdded,
  ExtensionRemoved,
  ConfigurationUpdated,
  AddressConfigurationUpdated,
} from "../generated/templates/DaoRegistry/DaoRegistry";
import {
  Adapter,
  Extension,
  Proposal,
  Member,
  Molochv3,
} from "../generated/schema";
import { BANK_EXTENSION_ID } from "./constants";

export function handleSubmittedProposal(event: SubmittedProposal): void {
  let submittedBy = event.transaction.from;
  let id = event.params.proposalId;
  let daoAddress = event.address.toHex(); // dao contract address
  let newProposalId = daoAddress.concat("-proposal-").concat(id.toHex());

  let proposal = Proposal.load(newProposalId);

  log.info(
    "**************** handleSubmittedProposal event fired. daoAddress: {}, proposalId: {}",
    [event.address.toHexString(), event.params.proposalId.toHexString()]
  );

  if (proposal == null) {
    proposal = new Proposal(newProposalId);
    proposal.submittedBy = submittedBy;
    proposal.flags = event.params.flags;
    proposal.proposalId = id;
    proposal.sponsored = false;
    proposal.processed = false;
    proposal.member = submittedBy.toHex();

    proposal.save();
  }
}

export function handleSponsoredProposal(event: SponsoredProposal): void {
  let id = event.params.proposalId;
  let daoAddress = event.address.toHex(); // dao contract address
  let newProposalId = daoAddress.concat("-proposal-").concat(id.toHex());

  let proposal = Proposal.load(newProposalId);
  let sponsoredAt = event.block.timestamp.toString();

  log.info(
    "**************** handleSponsoredProposal event fired. proposalId: {}",
    [event.params.proposalId.toHexString()]
  );

  proposal.flags = event.params.flags;
  proposal.sponsoredAt = sponsoredAt;
  proposal.sponsored = true;
  proposal.sponsoredBy = event.transaction.from;

  proposal.save();
}

export function handleProcessedProposal(event: ProcessedProposal): void {
  let id = event.params.proposalId;
  let daoAddress = event.address.toHex(); // dao contract address
  let newProposalId = daoAddress.concat("-proposal-").concat(id.toHex());

  let proposal = Proposal.load(newProposalId);
  let processedAt = event.block.timestamp.toString();

  log.info(
    "**************** handleProcessedProposal event fired. proposalId: {}",
    [event.params.proposalId.toHexString()]
  );

  if (proposal != null) {
    proposal.flags = event.params.flags;
    proposal.processedAt = processedAt;
    proposal.processed = true;
    proposal.processedBy = event.transaction.from;

    proposal.save();
  }
}

export function handleUpdateDelegateKey(event: UpdateDelegateKey): void {
  let daoAddress = event.address.toHexString();
  let delegateKey = event.params.newDelegateKey;
  let memberId = daoAddress
    .concat("-member-")
    .concat(event.params.memberAddress.toHex());

  let member = Member.load(memberId);
  member.delegateKey = delegateKey;

  log.info(
    "**************** handleUpdateDelegateKey event fired. memberAddress {}, newDelegateKey {}",
    [
      event.params.memberAddress.toHexString(),
      event.params.newDelegateKey.toHexString(),
    ]
  );

  member.save();
}

export function handleMemberJailed(event: MemberJailed): void {
  let daoAddress = event.address.toHexString();
  let memberId = daoAddress
    .concat("-member-")
    .concat(event.params.memberAddr.toHex());

  let member = Member.load(memberId);
  member.jailed = true;

  log.info("**************** handleMemberJailed event fired. memberAddr {}", [
    event.params.memberAddr.toHexString(),
  ]);

  member.save();
}

export function handleMemberUnjailed(event: MemberUnjailed): void {
  let daoAddress = event.address.toHexString();
  let memberId = daoAddress
    .concat("-member-")
    .concat(event.params.memberAddr.toHex());

  let member = Member.load(memberId);
  member.jailed = false;

  log.info("**************** handleMemberUnjailed event fired. memberAddr {}", [
    event.params.memberAddr.toHexString(),
  ]);

  member.save();
}

export function handleAdapterAdded(event: AdapterAdded): void {
  let daoAddress = event.address.toHexString();
  let adapterId = event.params.adapterId.toHex();
  let daoAdapterId = daoAddress.concat("-adapter-").concat(adapterId);

  let adapter = Adapter.load(daoAdapterId);

  log.info("**************** handleAdapterAdded event fired. adapterId: {}", [
    event.params.adapterId.toHexString(),
  ]);

  if (adapter == null) {
    adapter = new Adapter(daoAdapterId);
    adapter.adapterId = event.params.adapterId;
    adapter.acl = event.params.flags;
    adapter.adapterAddress = event.params.adapterAddress;

    // create 1-1 relationship with adapter and its dao
    adapter.molochv3 = daoAddress;

    adapter.save();
  }
}

export function handleAdapterRemoved(event: AdapterRemoved): void {
  let daoAddress = event.address.toHexString();
  let adapterId = event.params.adapterId.toHex();
  let daoAdapterId = daoAddress.concat("-adapter-").concat(adapterId);

  let adapter = Adapter.load(daoAdapterId);

  log.info("**************** handleAdapterRemoved event fired. adapterId: {}", [
    event.params.adapterId.toHexString(),
  ]);

  if (adapter !== null) {
    store.remove("Adapter", daoAdapterId);
  }
}

export function handleExtensionAdded(event: ExtensionAdded): void {
  let daoAddress = event.address.toHexString();
  let extensionId = event.params.extensionId;

  let daoExtensionId = daoAddress
    .concat("-extension-")
    .concat(extensionId.toHex());

  log.info(
    "**************** handleExtensionAdded event fired. extensionAddress {}, extensionId {}, daoAddress {}",
    [
      event.params.extensionAddress.toHexString(),
      event.params.extensionId.toHexString(),
      daoAddress,
    ]
  );

  let extension = Extension.load(daoExtensionId);

  // https://thegraph.com/docs/define-a-subgraph#code-generation
  // 1. `BankFactory` ... `identifyAddress` returns `BankExtension`
  // 2. check the `BankExtension` addr against the `extensionAddress`
  // 3. if it matches then create a `bank` entity with the `daoAddress`
  // let bankFactory =   BankFactory.bind()

  log.info("====== bankExtensionId, {}, extensionId {}", [
    BANK_EXTENSION_ID.toString(),
    extensionId.toString(),
  ]);
  // if extension is `bank` the assign to its dao
  if (
    "0xea0ca03c7adbe41dc655fec28a9209dc8e6e042f3d991a67765ba285b9cf73a0" ==
    event.params.extensionId.toHexString()
  ) {
    log.info("====== add dao bankExtensionId, {}", [
      BANK_EXTENSION_ID.toString(),
    ]);

    let dao = Molochv3.load(event.address.toHexString());
    // let dao = loadOrCreateDao(event.params._address.toHexString());

    // create 1-to-1 relationship between the bank and its dao
    // bank.Molochv3 = event.params.bankAddress.toHexString();
    if (dao != null) {
      log.info("is bank extension", []);
      // create 1-to-1 relationship between the dao and its bank
      dao.bank = event.address.toHexString();
      dao.save();
    }
  }

  if (extension == null) {
    extension = new Extension(daoExtensionId);
  }

  extension.extensionAddress = event.params.extensionAddress;
  extension.extensionId = event.params.extensionId;

  // create 1-1 relationship with extensions and its dao
  extension.molochv3 = daoAddress;
  extension.save();
}

export function handleExtensionRemoved(event: ExtensionRemoved): void {
  let daoAddress = event.address.toHexString();
  let extensionId = event.params.extensionId;
  let daoExtensionId = daoAddress
    .concat("-extension-")
    .concat(extensionId.toHex());

  log.info(
    "**************** handleExtensionRemoved event fired. extensionId {}",
    [event.params.extensionId.toHexString()]
  );
  let extension = Extension.load(daoExtensionId);

  if (extension !== null) {
    store.remove("Extension", daoExtensionId);
  }
}

export function handleConfigurationUpdated(event: ConfigurationUpdated): void {
  log.info(
    "**************** handleConfigurationUpdated event fired. key {}, value {}",
    [event.params.key.toHexString(), event.params.value.toHexString()]
  );
}

export function handleAddressConfigurationUpdated(
  event: AddressConfigurationUpdated
): void {
  log.info(
    "**************** handleAddressConfigurationUpdated event fired. key {}, value {}",
    [event.params.key.toHexString(), event.params.value.toHexString()]
  );
}
