import { Address, Bytes, log } from "@graphprotocol/graph-ts";

import { DistributeContract } from "../../generated/templates/DaoRegistry/DistributeContract";
import { OnboardingContract } from "../../generated/templates/DaoRegistry/OnboardingContract";
import { TributeContract } from "../../generated/templates/DaoRegistry/TributeContract";
import { ManagingContract } from "../../generated/templates/DaoRegistry/ManagingContract";
import { FinancingContract } from "../../generated/templates/DaoRegistry/FinancingContract";
import { GuildKickContract } from "../../generated/templates/DaoRegistry/GuildKickContract";
import { TributeNFTContract } from "../../generated/templates/DaoRegistry/TributeNFTContract";

import { Proposal } from "../../generated/schema";

import {
  DISTRIBUTE_ID,
  ONBOARDING_ID,
  TRIBUTE_ID,
  MANAGING_ID,
  FINANCING_ID,
  GUILDKICK_ID,
  TRIBUTE_NFT_ID,
} from "../core/dao-constants";

export function getProposalDetails(
  adapterId: Bytes,
  adapterAdddress: Address,
  daoAddress: Address,
  proposalId: Bytes
): void {
  if (ONBOARDING_ID.toString() == adapterId.toHexString()) {
    log.info("INFO ONBOARDING_ID, proposalId: {}", [proposalId.toHexString()]);
    onboarding(adapterAdddress, daoAddress, proposalId);
  } else if (DISTRIBUTE_ID.toString() == adapterId.toHexString()) {
    log.info("INFO DISTRIBUTE_ID, proposalId: {}", [proposalId.toHexString()]);
    distribute(adapterAdddress, daoAddress, proposalId);
  } else if (TRIBUTE_ID.toString() == adapterId.toHexString()) {
    log.info("INFO TRIBUTE_ID, proposalId: {}", [proposalId.toHexString()]);
    tribute(adapterAdddress, daoAddress, proposalId);
  } else if (MANAGING_ID.toString() == adapterId.toHexString()) {
    log.info("INFO MANAGING_ID, proposalId: {}", [proposalId.toHexString()]);
    managing(adapterAdddress, daoAddress, proposalId);
  } else if (FINANCING_ID.toString() == adapterId.toHexString()) {
    log.info("INFO FINANCING_ID, proposalId: {}", [proposalId.toHexString()]);
    financing(adapterAdddress, daoAddress, proposalId);
  } else if (GUILDKICK_ID.toString() == adapterId.toHexString()) {
    log.info("INFO GUILDKICK_ID, proposalId: {}", [proposalId.toHexString()]);
    guildkick(adapterAdddress, daoAddress, proposalId);
  } else if (TRIBUTE_NFT_ID.toString() == adapterId.toHexString()) {
    log.info("INFO TRIBUTE_NFT_ID, proposalId: {}", [proposalId.toHexString()]);
    tributeNFT(adapterAdddress, daoAddress, proposalId);
  }
}

function onboarding(
  adapterAdddress: Address,
  daoAddress: Address,
  proposalId: Bytes
): void {
  let onboarding = OnboardingContract.bind(adapterAdddress);

  let data = onboarding.proposals(
    Address.fromString(daoAddress.toHexString()),
    proposalId
  );

  let daoProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());

  let proposal = Proposal.load(daoProposalId);

  if (proposal) {
    proposal.unitsToMint = data.value1;
    proposal.amount = data.value2;
    proposal.unitsRequested = data.value3;
    proposal.token = data.value4;
    proposal.applicant = data.value5;

    proposal.adapterAddress = adapterAdddress;

    proposal.save();
  }
}

function distribute(
  adapterAdddress: Address,
  daoAddress: Address,
  proposalId: Bytes
): void {
  let distribute = DistributeContract.bind(adapterAdddress);

  let data = distribute.distributions(
    Address.fromString(daoAddress.toHexString()),
    proposalId
  );

  let daoProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());

  let proposal = Proposal.load(daoProposalId);

  if (proposal) {
    proposal.token = data.value0;
    proposal.amount = data.value1;
    proposal.unitHolderAddr = data.value2;
    proposal.status = data.value3.toString();
    proposal.currentIndex = data.value4;
    proposal.blockNumber = data.value5;

    proposal.adapterAddress = adapterAdddress;

    proposal.save();
  }
}

function tribute(
  adapterAdddress: Address,
  daoAddress: Address,
  proposalId: Bytes
): void {
  let tribute = TributeContract.bind(adapterAdddress);

  let data = tribute.proposals(
    Address.fromString(daoAddress.toHexString()),
    proposalId
  );

  let daoProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());

  let proposal = Proposal.load(daoProposalId);

  if (proposal) {
    proposal.applicant = data.value1;
    proposal.tokenToMint = data.value2;
    proposal.requestAmount = data.value3;
    proposal.token = data.value4;
    proposal.tributeAmount = data.value5;
    proposal.tributeTokenOwner = data.value6;

    proposal.adapterAddress = adapterAdddress;

    proposal.save();
  }
}

function managing(
  adapterAdddress: Address,
  daoAddress: Address,
  proposalId: Bytes
): void {
  let managing = ManagingContract.bind(adapterAdddress);

  let data = managing.proposals(
    Address.fromString(daoAddress.toHexString()),
    proposalId
  );

  let daoProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());

  let proposal = Proposal.load(daoProposalId);

  if (proposal) {
    proposal.adapterOrExtensionId = data.value0;
    proposal.adapterOrExtensionAddr = data.value1;

    proposal.adapterOrExtensionAddr = adapterAdddress;

    // @todo
    // let keys: Bytes[] = [];
    // for (let i = 0; i < data.value2.length; i++) {
    //   keys.push(data.value2[i]);
    // }
    // proposal.keys = keys; //data.value2;

    // @todo
    // let values = [];
    // for (let i = 0; i < data.value3.length; i++) {
    //   values.push(data.value3[i]);
    // }

    // proposal.values = values; //data.value3;
    // @todo
    // proposal.flags = data.value4;

    proposal.save();
  }
}

function financing(
  adapterAdddress: Address,
  daoAddress: Address,
  proposalId: Bytes
): void {
  let financing = FinancingContract.bind(adapterAdddress);

  let data = financing.proposals(
    Address.fromString(daoAddress.toHexString()),
    proposalId
  );

  let daoProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());

  let proposal = Proposal.load(daoProposalId);

  if (proposal) {
    proposal.applicant = data.value0;
    proposal.amount = data.value1;
    proposal.token = data.value2;

    proposal.adapterAddress = adapterAdddress;

    proposal.save();
  }
}

function guildkick(
  adapterAdddress: Address,
  daoAddress: Address,
  proposalId: Bytes
): void {
  let guildkick = GuildKickContract.bind(adapterAdddress);

  let data = guildkick.kicks(
    Address.fromString(daoAddress.toHexString()),
    proposalId
  );

  let daoProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());

  let proposal = Proposal.load(daoProposalId);

  if (proposal) {
    proposal.memberToKick = data;
    proposal.adapterAddress = adapterAdddress;

    proposal.save();
  }
}

function tributeNFT(
  adapterAdddress: Address,
  daoAddress: Address,
  proposalId: Bytes
): void {
  let tributeNFT = TributeNFTContract.bind(adapterAdddress);

  let data = tributeNFT.proposals(
    Address.fromString(daoAddress.toHexString()),
    proposalId
  );

  let daoProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());

  let proposal = Proposal.load(daoProposalId);

  if (proposal) {
    proposal.applicant = data.value1;
    proposal.nftAddr = data.value2;
    proposal.nftTokenId = data.value3;
    proposal.requestAmount = data.value4;

    proposal.adapterAddress = adapterAdddress;

    proposal.save();
  }
}
