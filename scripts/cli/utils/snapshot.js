const {
  buildDraftMessage,
  buildProposalMessage,
  getDomainDefinition,
  getSpace,
  prepareDraftMessage,
  prepareProposalMessage,
  SnapshotMessageBase,
  SnapshotMessageProposal,
  SnapshotProposalData,
  SnapshotSubmitBaseReturn,
  SnapshotSubmitProposalReturn,
  SnapshotType,
  submitMessage,
} = require("@openlaw/snapshot-js-erc712");
const { signTypedData_v4 } = require("eth-sig-util");
const { toBuffer } = require("ethereumjs-util");
const { getDAOConfig } = require("../core/dao-registry");

const ContractDAOConfigKeys = {
  offchainVotingGracePeriod: "offchainvoting.gracePeriod",
  offchainVotingStakingAmount: "offchainvoting.stakingAmount",
  offchainVotingVotingPeriod: "offchainvoting.votingPeriod",
  onboardingChunkSize: "onboarding.chunkSize",
  onboardingMaximumChunks: "onboarding.maximumChunks",
  onboardingUnitsPerChunk: "onboarding.unitsPerChunk",
  onboardingTokenAddr: "onboarding.tokenAddr",
  votingGracePeriod: "voting.gracePeriod",
  votingStakingAmount: "voting.stakingAmount",
  votingVotingPeriod: "voting.votingPeriod",
};

if (!process.env.SNAPSHOT_HUB_API_URL)
  throw Error("Missing env var: <SNAPSHOT_HUB_API_URL>");

const buildProposalMessageHelper = async (
  commonData,
  network,
  daoRegistry,
  provider
) => {
  const snapshot = await provider.getBlockNumber();

  const votingTimeSeconds = parseInt(
    await getDAOConfig(
      ContractDAOConfigKeys.offchainVotingVotingPeriod,
      daoRegistry,
      network
    )
  );

  return await buildProposalMessage(
    {
      ...commonData,
      votingTimeSeconds,
      snapshot,
    },
    process.env.SNAPSHOT_HUB_API_URL
  );
};

const signAndSendProposal = async (proposal, provider, wallet) => {
  const {
    partialProposalData,
    adapterAddress,
    type,
    network,
    dao,
    space,
  } = proposal;

  // When using ganache, the getNetwork call always returns UNKNOWN, so we ignore that.
  const { chainId } = await provider.getNetwork();

  const actionId = adapterAddress;

  const { body, name, metadata, timestamp } = partialProposalData;

  let { data } = await getSpace(process.env.SNAPSHOT_HUB_API_URL, space);

  const commonData = {
    name,
    body,
    metadata,
    token: data.token,
    space: space,
  };

  // 1. Check proposal type and prepare appropriate message
  const message = await buildProposalMessageHelper(
    {
      ...commonData,
      timestamp,
    },
    network,
    dao,
    provider
  );

  // 2. Prepare signing data. Snapshot and the contracts will verify this same data against the signature.
  const erc712Message = prepareProposalMessage(message);

  const { domain, types } = getDomainDefinition(
    { ...erc712Message, type },
    dao,
    actionId,
    chainId
  );

  // 3. Sign data
  const signature = signTypedData_v4(toBuffer(wallet.privateKey), {
    data: {
      types,
      primaryType: "Message",
      domain,
      message: erc712Message,
    },
  });

  // 4. Send data to snapshot-hub
  const resp = await submitMessage(
    process.env.SNAPSHOT_HUB_API_URL,
    wallet.address,
    message,
    signature,
    {
      actionId: domain.actionId,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
      message: erc712Message,
    }
  );

  return {
    data: message,
    erc712Message: {
      ...erc712Message,
      submitter: wallet.address,
      sig: signature,
    },
    uniqueId: resp.data.uniqueId,
    uniqueIdDraft: resp.data.uniqueIdDraft || "",
  };
};

const newProposal = (
  title,
  description,
  network,
  dao,
  space,
  adapter,
  provider,
  wallet
) => {
  // Sign and submit proposal for Snapshot Hub
  return signAndSendProposal(
    {
      partialProposalData: {
        name: title,
        body: description,
        metadata: {
          type: "Governance",
        },
      },
      type: SnapshotType.proposal,
      space,
      adapterAddress: adapter,
      network,
      dao,
    },
    provider,
    wallet
  )
    .then((res) => {
      console.log(`New snapshot proposal: ${res.uniqueId}`);
      return res;
    })
    .catch((err) => {
      const resp = err.response;
      if (resp && resp.data && resp.data.error_description) {
        console.error(`ERROR: ${resp.data.error_description}`);
      } else {
        throw err;
      }
    });
};

module.exports = { newProposal };
