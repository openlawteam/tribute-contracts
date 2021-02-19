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
  Laoland,
  Proposal,
  Member,
} from "../generated/schema";
import { log, store, crypto } from "@graphprotocol/graph-ts";

// const bankAdapterId = Web3.sha3(DaoConstants.BANK);

export function handleSubmittedProposal(event: SubmittedProposal): void {
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
    proposal.flags = event.params.flags;
    proposal.proposalId = id;

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

    proposal.save();
  }
}

export function handleAdapterAdded(event: AdapterAdded): void {
  let daoAddress = event.address.toHexString();
  let adapterId = daoAddress
    .concat("-adapter-")
    .concat(event.params.adapterId.toHex());

  let adapter = Adapter.load(adapterId);

  log.info("**************** handleAdapterAdded event fired. adapterId: {}", [
    event.params.adapterId.toHexString(),
  ]);

  if (adapter == null) {
    adapter = new Adapter(adapterId);
    adapter.adapterId = event.params.adapterId;
    adapter.acl = event.params.flags;
    adapter.adapterAddress = event.params.adapterAddress;

    adapter.save();
  }
}

export function handleAdapterRemoved(event: AdapterRemoved): void {
  let daoAddress = event.address.toHexString();
  let adapterId = daoAddress
    .concat("-adapter-")
    .concat(event.params.adapterId.toHex());

  let adapter = Adapter.load(adapterId);

  log.info("**************** handleAdapterRemoved event fired. adapterId: {}", [
    event.params.adapterId.toHexString(),
  ]);

  if (adapter !== null) {
    store.remove("Adapter", adapterId);
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

export function handleExtensionAdded(event: ExtensionAdded): void {
  log.info(
    "**************** handleExtensionAdded event fired. extensionAddress {}, extensionId {}",
    [
      event.params.extensionAddress.toHexString(),
      event.params.extensionId.toHexString(),
    ]
  );

  let extension = Extension.load(event.params.extensionId.toHex());

  // let bankAdapterId = crypto.keccak256("0xea0ca03c7adbe41dc655fec28a9209dc8e6e042f3d991a67765ba285b9cf73a0").toHexString()
  // // if extension is `bank` the BankExtension
  // if (
  //   bankAdapterId == event.params.extensionId.toHexString() &&
  //   extension == null
  // ) {
  //   let dao = Laoland.load(event.address.toHexString());
  //   // let dao = loadOrCreateDao(event.params._address.toHexString());

  //   // create 1-to-1 relationship between the bank and its dao
  //   // bank.laoland = event.params.bankAddress.toHexString();

  //   // create 1-to-1 relationship between the dao and its bank
  //   dao.bank = event.address.toHexString();
  //   dao.save();
  // } else

  if (extension == null) {
    extension = new Extension(event.params.extensionId.toHex());
    extension.extensionAddress = event.params.extensionAddress;
    extension.extensionId = event.params.extensionId;

    extension.save();
  }
}

export function handleExtensionRemoved(event: ExtensionRemoved): void {
  log.info(
    "**************** handleExtensionRemoved event fired. extensionId {}",
    [event.params.extensionId.toHexString()]
  );

  let extension = Extension.load(event.params.extensionId.toHex());

  if (extension !== null) {
    store.remove("Extension", event.params.extensionId.toHex());
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
