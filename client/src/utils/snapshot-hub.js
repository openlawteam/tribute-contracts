export const buildSnapshotHubProposalMessage = (message, chainId) => {
  const addHours = (ts, hours) => {
    let date = new Date(ts * 1e3);
    date.setHours(date.getHours() + hours);
    return (date.getTime() / 1e3).toFixed();
  };
  const currentDate = new Date();
  const timestamp = (currentDate.getTime() / 1e3).toFixed();
  return {
    msg: {
      payload: {
        name: message.title,
        body: message.desc,
        choices: ["Yes", "No"],
        start: timestamp,
        end: addHours(timestamp, message.votingTime),
        snapshot: 1, //FIXME: how to we get that?
        metadata: {
          uuid: message.addr,
          private: message.private ? 1 : 0,
          type: message.category,
          subType: message.category,
        },
      },
      timestamp: timestamp,
      token: "0x8f56682a50becb1df2fb8136954f2062871bc7fc", //this token represents the space token registered in snapshot-hub
      space: "thelao", //needs to be registered in snapshot-hub api
      type: message.type,
      actionId: message.actionId,
      version: "0.2.0", //needs to match snapshot-hub api version
      chainId: chainId,
      verifyingContract: message.verifyingContract,
    },
  };
};

export const buildSnapshotHubVoteMessage = (vote, proposal, addr, chainId) => {
  const currentDate = new Date();
  const timestamp = (currentDate.getTime() / 1e3).toFixed();
  return {
    address: addr,
    msg: {
      payload: {
        choice: vote,
        proposalIpfsHash: proposal.ipfsHash,
        metadata: {
          memberAddress: addr,
        },
      },
      timestamp: timestamp,
      token: "0x8f56682a50becb1df2fb8136954f2062871bc7fc", //this token represents the space token registered in snapshot-hub
      space: "thelao",
      type: "vote",
      version: "0.2.0",
      actionId: proposal.actionId,
      chainId: chainId,
      verifyingContract: proposal.verifyingContract,
    },
  };
};
