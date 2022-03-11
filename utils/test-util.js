// Whole-script strict mode syntax
"use strict";
const { toBN, UNITS, ERC1155 } = require("./contract-util");
const { toNumber } = require("web3-utils");
const {
  expect,
  advanceTime,
  web3,
  encodeProposalData,
} = require("./hardhat-test-util");

const checkLastEvent = async (dao, testObject) => {
  let pastEvents = await dao.getPastEvents();
  let returnValues = pastEvents[0].returnValues;

  Object.keys(testObject).forEach((key) =>
    expect(testObject[key], "value mismatch for key " + key).equal(
      returnValues[key]
    )
  );
};

const checkBalance = async (bank, address, token, expectedBalance) => {
  const balance = await bank.balanceOf(address, token);

  expect(balance.toString()).equal(expectedBalance.toString());
};

const checkSignature = async (
  signatureExtension,
  permissionHash,
  signature,
  magicValue
) => {
  const returnedValue = await signatureExtension.isValidSignature(
    permissionHash,
    signature
  );

  expect(returnedValue).equal(magicValue);
};

const encodeDaoInfo = (daoAddress) =>
  web3.eth.abi.encodeParameter(
    {
      DaoInfo: {
        dao: "address",
      },
    },
    {
      dao: daoAddress,
    }
  );

const isMember = async (bank, member) => {
  const units = await bank.balanceOf(member, UNITS);

  return units > toBN("0");
};

const submitNewMemberProposal = async (
  proposalId,
  member,
  onboarding,
  dao,
  newMember,
  unitPrice,
  token,
  desiredUnits = toBN("10")
) => {
  await onboarding.submitProposal(
    dao.address,
    proposalId,
    newMember,
    token,
    unitPrice.mul(desiredUnits),
    [],
    {
      from: member,
      gasPrice: toBN("0"),
    }
  );
};

const onboardingNewMember = async (
  proposalId,
  dao,
  onboarding,
  voting,
  newMember,
  sponsor,
  unitPrice,
  token,
  desiredUnits = toBN("10")
) => {
  await submitNewMemberProposal(
    proposalId,
    sponsor,
    onboarding,
    dao,
    newMember,
    unitPrice,
    token,
    desiredUnits
  );

  //vote and process it
  await voting.submitVote(dao.address, proposalId, 1, {
    from: sponsor,
    gasPrice: toBN("0"),
  });
  await advanceTime(10000);

  await onboarding.processProposal(dao.address, proposalId, {
    from: sponsor,
    value: unitPrice.mul(desiredUnits),
    gasPrice: toBN("0"),
  });
};

const guildKickProposal = async (
  dao,
  guildkickContract,
  memberToKick,
  sender,
  proposalId
) => {
  await guildkickContract.submitProposal(
    dao.address,
    proposalId,
    memberToKick,
    [],
    {
      from: sender,
      gasPrice: toBN("0"),
    }
  );
};

const submitConfigProposal = async (
  dao,
  proposalId,
  sender,
  configuration,
  voting,
  configs
) => {
  //Submit a new configuration proposal
  await configuration.submitProposal(dao.address, proposalId, configs, [], {
    from: sender,
    gasPrice: toBN("0"),
  });

  await voting.submitVote(dao.address, proposalId, 1, {
    from: sender,
    gasPrice: toBN("0"),
  });

  await advanceTime(10000);
  await configuration.processProposal(dao.address, proposalId, {
    from: sender,
    gasPrice: toBN("0"),
  });
};

const lendERC721NFT = async (
  dao,
  proposalId,
  pixelNFT,
  voting,
  lendNFT,
  nftExtension,
  bank,
  daoOwner,
  nftOwner,
  lendingPeriod = 10000
) => {
  // Mint the ERC721 NFT
  await pixelNFT.mintPixel(nftOwner, 1, 1, { from: daoOwner });

  let pastEvents = await pixelNFT.getPastEvents();
  const { tokenId } = pastEvents[1].returnValues;

  // Create the Lend Proposal
  await lendNFT.submitProposal(
    dao.address,
    proposalId,
    nftOwner,
    pixelNFT.address,
    tokenId,
    10000, // requested units
    lendingPeriod, // lending period (10 seconds)
    [],
    { from: daoOwner, gasPrice: toBN("0") }
  );

  // Vote Yes on the proposal
  await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });
  await advanceTime(10000);

  // Approve the NFT to move to the NFT extension
  await pixelNFT.methods["safeTransferFrom(address,address,uint256,bytes)"](
    nftOwner,
    lendNFT.address,
    tokenId,
    encodeProposalData(dao, proposalId),
    {
      from: nftOwner,
    }
  );

  let unitBalance = await bank.balanceOf(nftOwner, UNITS);
  expect(unitBalance.toString()).equal("10000");
  expect(await pixelNFT.ownerOf(tokenId)).equal(nftExtension.address);

  return { proposalId };
};

const lendERC1155NFT = async (
  dao,
  proposalId,
  tokenId,
  erc1155Token,
  voting,
  lendNFT,
  bank,
  daoOwner,
  nftOwner
) => {
  // Mint the ERC1155 NFT
  await erc1155Token.mint(nftOwner, tokenId, 1, [], { from: daoOwner });

  // Create a proposal
  await lendNFT.submitProposal(
    dao.address,
    proposalId,
    nftOwner,
    erc1155Token.address,
    tokenId,
    25000, // requested units
    10000, // lending period
    [],
    { from: daoOwner, gasPrice: toBN("0") }
  );

  // Submit a vote (YES)
  await voting.submitVote(dao.address, proposalId, 1, { from: daoOwner });

  await advanceTime(10000);

  // Send the ERC1155 NFT to the LendNFT adapter
  await erc1155Token.safeTransferFrom(
    nftOwner,
    lendNFT.address,
    tokenId,
    1,
    encodeProposalData(dao, proposalId),
    { from: nftOwner }
  );

  const erc1155ExtAddr = await dao.getExtensionAddress(ERC1155);
  const balanceOf = await erc1155Token.balanceOf(erc1155ExtAddr, tokenId);
  expect(balanceOf.toString()).equal("1");

  let unitBalance = await bank.balanceOf(nftOwner, UNITS);
  expect(toNumber(unitBalance.toString())).to.be.closeTo(25000, 5);
};

module.exports = {
  checkLastEvent,
  checkBalance,
  checkSignature,
  submitNewMemberProposal,
  onboardingNewMember,
  guildKickProposal,
  submitConfigProposal,
  lendERC721NFT,
  lendERC1155NFT,
  isMember,
  encodeDaoInfo,
};
