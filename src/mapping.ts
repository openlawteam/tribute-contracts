import { ProcessedProposal, SponsoredProposal, SubmittedProposal, UpdateDelegateKey, AdapterAdded, AdapterRemoved, MemberJailed, MemberUnjailed, NewBalance } from '../generated/Laoland/DaoRegistry'
import { Proposal } from '../generated/schema'

export function handleSubmittedProposal(event: SubmittedProposal): void {
}

export function handleProcessedProposal(event: ProcessedProposal): void {
}

export function handleSponsoredProposal(event: SponsoredProposal): void {
}

        
export function  handleAdapterAdded(event: AdapterAdded): void {}
export function  handleAdapterRemoved(event: AdapterRemoved): void {}        
export function  handleUpdateDelegateKey(event: UpdateDelegateKey): void {}        
export function  handleMemberJailed(event: MemberJailed): void {}
export function  handleMemberUnjailed(event: MemberUnjailed): void {}
export function  handleNewBalance(event: NewBalance): void {}
