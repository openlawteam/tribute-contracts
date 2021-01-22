import {
  ProcessedProposal,
  SponsoredProposal,
  SubmittedProposal,
  UpdateDelegateKey,
  AdapterAdded,
  AdapterRemoved,
  MemberJailed,
  MemberUnjailed,
} from "../generated/DaoRegistry/DaoRegistry";
import { Proposal, Adapter, Member } from "../generated/schema";
import { log, store } from "@graphprotocol/graph-ts";

export function handleSubmittedProposal(event: SubmittedProposal): void {
  let id = event.params.proposalId;
  let laoland = event.address.toHex();
  let newProposalId = laoland.concat("-proposal-").concat(id.toHex());

  let proposal = Proposal.load(newProposalId);

  log.info(
    "**************** handleSubmittedProposal event fired. proposalId: {}",
    [event.params.proposalId.toHexString()]
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
  let laoland = event.address.toHex();
  let newProposalId = laoland.concat("-proposal-").concat(id.toHex());

  let proposal = Proposal.load(newProposalId);
  let sponsoredAt = event.block.timestamp.toString();

  log.info(
    "**************** handleSponsoredProposal event fired. proposalId: {}",
    [event.params.proposalId.toHexString()]
  );

  if (proposal != null) {
    proposal.flags = event.params.flags;
    proposal.sponsoredAt = sponsoredAt;
    proposal.sponsored = true;

    proposal.save();
  }
}

export function handleProcessedProposal(event: ProcessedProposal): void {
  let id = event.params.proposalId;
  let laoland = event.address.toHex();
  let newProposalId = laoland.concat("-proposal-").concat(id.toHex());

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
  let adapter = Adapter.load(event.params.adapterId.toHex());

  log.info("**************** handleAdapterAdded event fired. adapterId: {}", [
    event.params.adapterId.toHexString(),
  ]);

  if (adapter == null) {
    adapter = new Adapter(event.params.adapterId.toHex());
    adapter.acl = event.params.flags;
    adapter.adapterAddress = event.params.adapterAddress;

    adapter.save();
  }
}

export function handleAdapterRemoved(event: AdapterRemoved): void {
  let adapter = Adapter.load(event.params.adapterId.toHex());

  log.info("**************** handleAdapterRemoved event fired. adapterId: {}", [
    event.params.adapterId.toHexString(),
  ]);

  if (adapter !== null) {
    store.remove("Adapter", event.params.adapterId.toHex());
  }
}

export function handleUpdateDelegateKey(event: UpdateDelegateKey): void {
  let laolandId = event.address.toHexString();
  let delegateKey = event.params.newDelegateKey;
  let memberId = laolandId
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
  let laolandId = event.address.toHexString();
  let memberId = laolandId
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
  let laolandId = event.address.toHexString();
  let memberId = laolandId
    .concat("-member-")
    .concat(event.params.memberAddr.toHex());

  let member = Member.load(memberId);
  member.jailed = false;

  log.info("**************** handleMemberUnjailed event fired. memberAddr {}", [
    event.params.memberAddr.toHexString(),
  ]);

  member.save();
}
