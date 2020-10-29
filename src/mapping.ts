import { ProcessedProposal, SponsoredProposal, SubmittedProposal, UpdateDelegateKey, AdapterAdded, AdapterRemoved, MemberJailed, MemberUnjailed, NewBalance } from '../generated/Laoland/DaoRegistry'
import { Proposal, Adapter } from '../generated/schema'

export function handleSubmittedProposal(event: SubmittedProposal): void {
  const id = event.params.proposalId;
  let proposal = Proposal.load(id);
  if(proposal == null) {
      proposal = new Proposal(id);
      proposal.createdAt = event.block.timestamp.toString();
      proposal.flags = event.params.flags;
      proposal.save();
  }
}

export function handleProcessedProposal(event: ProcessedProposal): void {
  const id = event.params.proposalId;
  let proposal = Proposal.load(id);
  if(proposal != null) {
      proposal.flags = event.params.flags;
      proposal.save();
  }
}

export function handleSponsoredProposal(event: SponsoredProposal): void {
  const id = event.params.proposalId;
  let proposal = Proposal.load(id);
  if(proposal != null) {
      proposal.flags = event.params.flags;
      proposal.save();
  }
}

export function  handleAdapterAdded(event: AdapterAdded): void {
  const adapter = Adapter.load(event.params.adapterId);
}

export function  handleAdapterRemoved(event: AdapterRemoved): void {}

export function  handleUpdateDelegateKey(event: UpdateDelegateKey): void {}

export function  handleMemberJailed(event: MemberJailed): void {}

export function  handleMemberUnjailed(event: MemberUnjailed): void {}

export function  handleNewBalance(event: NewBalance): void {}