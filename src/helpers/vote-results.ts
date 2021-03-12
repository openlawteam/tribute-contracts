import { Address, log, Bytes } from "@graphprotocol/graph-ts";

import { OffchainVotingContract } from "../../generated/templates/DaoRegistry/OffchainVotingContract";
import { VotingContract } from "../../generated/templates/DaoRegistry/VotingContract";
import { IVoting } from "../../generated/templates/DaoRegistry/IVoting";

import { Proposal, Adapter } from "../../generated/schema";

import { VOTING_ID } from "./constants";

export function loadProposalAndSaveVoteResults(
  daoAddress: Address,
  proposalId: Bytes
): Proposal | null {
  // load the existing proposal
  let maybeProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());
  let proposal = Proposal.load(maybeProposalId);

  // load the voting adapter data
  let votingAdapterId = daoAddress
    .toHex()
    .concat("-adapter-")
    .concat(VOTING_ID);

  let votingAdapter = Adapter.load(votingAdapterId);

  if (votingAdapter) {
    let votingIContract = IVoting.bind(
      Address.fromString(votingAdapter.adapterAddress.toHex())
    );
    let votingAdapterName = votingIContract.getAdapterName();

    if (votingAdapterName == "VotingContract") {
      log.info("=============== VotingContract, {}", [
        votingAdapterName.toString(),
      ]);

      let votingContract = VotingContract.bind(
        Address.fromHexString(
          votingAdapter.adapterAddress.toHexString()
        ) as Address
      );
      // get vote results
      let voteResults = votingContract.votes(daoAddress, proposalId);

      if (proposal) {
        proposal.nbYesVotes = voteResults.value0;
        proposal.nbNoVotes = voteResults.value1;
        proposal.startingTime = voteResults.value2;
        proposal.blockNumber = voteResults.value3;
      }
    } else if (votingAdapterName == "OffchainVotingContract") {
      log.info("=============== OffchainVotingContract, {}", [
        votingAdapterName.toString(),
      ]);

      let offchainVotingContract = OffchainVotingContract.bind(
        Address.fromHexString(
          votingAdapter.adapterAddress.toHexString()
        ) as Address
      );
      // get vote results
      let voteResults = offchainVotingContract.votes(daoAddress, proposalId);

      if (proposal) {
        proposal.snapshot = voteResults.value0;
        proposal.proposalHash = voteResults.value1;
        proposal.reporter = voteResults.value2;
        proposal.resultRoot = voteResults.value3;

        proposal.nbVoters = voteResults.value4;
        proposal.nbYesVotes = voteResults.value5;
        proposal.nbNoVotes = voteResults.value6;
        proposal.index = voteResults.value7;

        proposal.startingTime = voteResults.value8;
        proposal.gracePeriodStartingTime = voteResults.value9;
        proposal.isChallenged = voteResults.value10;
        proposal.fallbackVotesCount = voteResults.value11;
      }
    }
  }

  return proposal;
}
