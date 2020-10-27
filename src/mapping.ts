import { ProcessedProposal, SponsoredProposal, SubmittedProposal } from '../generated/Laoland/DaoRegistry'
import { Proposal } from '../generated/schema'

export function handleSubmittedProposal(event: SubmittedProposal): void {
  /*
  let gravatar = new Gravatar(event.params.id.toHex())
  gravatar.owner = event.params.owner
  gravatar.displayName = event.params.displayName
  gravatar.imageUrl = event.params.imageUrl
  gravatar.save()
  */
}

export function handleProcessedProposal(event: ProcessedProposal): void {
  /*
  let gravatar = new Gravatar(event.params.id.toHex())
  gravatar.owner = event.params.owner
  gravatar.displayName = event.params.displayName
  gravatar.imageUrl = event.params.imageUrl
  gravatar.save()
  */
}

export function handleSponsoredProposal(event: SponsoredProposal): void {
  /*
  let id = event.params.id.toHex()
  let gravatar = Gravatar.load(id)
  if (gravatar == null) {
    gravatar = new Gravatar(id)
  }
  gravatar.owner = event.params.owner
  gravatar.displayName = event.params.displayName
  gravatar.imageUrl = event.params.imageUrl
  gravatar.save()
  */
}
