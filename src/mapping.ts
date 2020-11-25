import { ProcessedProposal, SponsoredProposal, SubmittedProposal, UpdateDelegateKey, AdapterAdded, AdapterRemoved, MemberJailed, MemberUnjailed, NewBalance } from '../generated/Laoland/DaoRegistry'
import { Proposal, Adapter, Member, Token, TokenBalance } from '../generated/schema'
import { Bytes, store } from '@graphprotocol/graph-ts'

export function handleSubmittedProposal(event: SubmittedProposal): void {
  const id = event.params.proposalId;
  let proposal = Proposal.load(id.toHex());
  if(proposal == null) {
      proposal = new Proposal(id.toHex());
      proposal.flags = event.params.flags;
      proposal.save();
  }
}

export function handleProcessedProposal(event: ProcessedProposal): void {
  const id = event.params.proposalId;
  let proposal = Proposal.load(id.toHex());
  if(proposal != null) {
      proposal.flags = event.params.flags;
      proposal.save();
  }
}

export function handleSponsoredProposal(event: SponsoredProposal): void {
  const id = event.params.proposalId;
  let proposal = Proposal.load(id.toHex());
  if(proposal != null) {
      proposal.flags = event.params.flags;
      proposal.save();
  }
}

export function  handleAdapterAdded(event: AdapterAdded): void {
  let adapter = Adapter.load(event.params.adapterId.toHex());
  if(adapter == null) {
    adapter = new Adapter(event.params.adapterId.toHex());
    adapter.acl = event.params.flags;
    adapter.adapterAddress = event.params.adapterAddress;
    adapter.save();
  }
}

export function  handleAdapterRemoved(event: AdapterRemoved): void {
  const adapter = Adapter.load(event.params.adapterId.toHex());
  if(adapter !== null) {
    store.remove('Adapter', event.params.adapterId.toHex());
  }
}

export function  handleUpdateDelegateKey(event: UpdateDelegateKey): void {}

export function  handleMemberJailed(event: MemberJailed): void {}

export function  handleMemberUnjailed(event: MemberUnjailed): void {}

export function  handleNewBalance(event: NewBalance): void {
  const memberId = event.params.member.toHex();
  const tokenId = event.params.tokenAddr.toHex();
  const tokenBalanceId = memberId + ":" + tokenId;
  let member = Member.load(memberId);
  let token = Token.load(tokenId);
  let tokenBalance = TokenBalance.load(tokenBalanceId);

  if(member == null) {
    member = new Member(memberId);
  }

  if(token == null) {
    token = new Token(tokenId);
  }

  if(tokenBalance == null) {
    tokenBalance = new TokenBalance(tokenBalanceId);
  }

  tokenBalance.token = tokenId;
  tokenBalance.tokenBalance = event.params.amount;
  
  member.save();
  token.save();
  tokenBalance.save();

}