// Whole-script strict mode syntax
"use strict";

/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

const { UNITS, LOOT, sha3, toBN } = require("./ContractUtil");

const deployDao = async (options) => {
  const {
    deployFunction,
    owner,
    deployTestTokens,
    finalize,
    DaoRegistry,
    BankExtension,
    BankFactory,
    NFTExtension,
    NFTCollectionFactory,
    ERC20Extension,
    ERC20TokenExtensionFactory,
    ExecutorExtension,
    ExecutorExtensionFactory,
    ERC1155TokenExtension,
    ERC1155TokenExtensionFactory,
    ERC1155TestToken,
    TestToken1,
    TestToken2,
    Multicall,
    PixelNFT,
    OLToken,
    ProxToken,
  } = options;

  const erc20TokenName = options.erc20TokenName
    ? options.erc20TokenName
    : "Unit Test Tokens";
  const erc20TokenSymbol = options.erc20TokenSymbol
    ? options.erc20TokenSymbol
    : "UTT";
  const erc20TokenDecimals = options.erc20TokenDecimals
    ? parseInt(options.erc20TokenDecimals) || 0
    : 0;

  const identityDao = await deployFunction(DaoRegistry);
  const identityBank = await deployFunction(BankExtension);
  const bankFactory = await deployFunction(BankFactory, [identityBank.address]);

  const identityNft = await deployFunction(NFTExtension);
  const nftFactory = await deployFunction(NFTCollectionFactory, [
    identityNft.address,
  ]);

  const identityERC20Ext = await deployFunction(ERC20Extension);
  const erc20TokenExtFactory = await deployFunction(
    ERC20TokenExtensionFactory,
    [identityERC20Ext.address]
  );

  const identityExecutorExt = await deployFunction(ExecutorExtension);
  const executorExtensionFactory = await deployFunction(
    ExecutorExtensionFactory,
    [identityExecutorExt.address]
  );

  const identityERC1155Ext = await deployFunction(ERC1155TokenExtension);
  const erc1155TokenExtFactory = await deployFunction(
    ERC1155TokenExtensionFactory,
    [identityERC1155Ext.address]
  );

  const { dao, daoFactory } = await cloneDao({
    ...options,
    identityDao,
    name: options.daoName || "test-dao",
  });

  const bankExtension = await createBankExtension(
    dao,
    owner,
    bankFactory,
    BankExtension,
    options.maxExternalTokens
  );

  const nftExtension = await createNFTExtension(
    dao,
    owner,
    nftFactory,
    NFTExtension
  );

  const erc20TokenExtension = await createERC20Extension(
    dao,
    owner,
    erc20TokenExtFactory,
    erc20TokenName,
    erc20TokenSymbol,
    erc20TokenDecimals,
    ERC20Extension
  );

  const executorExtension = await createExecutorExtension(
    dao,
    owner,
    executorExtensionFactory,
    ExecutorExtension
  );

  const erc1155TokenExtension = await createERC1155Extension(
    dao,
    owner,
    erc1155TokenExtFactory,
    ERC1155TokenExtension
  );

  const extensions = {
    bank: bankExtension,
    nft: nftExtension,
    erc20Ext: erc20TokenExtension,
    executorExt: executorExtension,
    erc1155Ext: erc1155TokenExtension,
  };

  const { adapters } = await addDefaultAdapters({
    dao,
    options,
    daoFactory,
  });

  const votingAddress = await dao.getAdapterAddress(sha3("voting"));
  const votingHelpers = {
    snapshotProposalContract: null,
    handleBadReporterAdapter: null,
    offchainVoting: null,
    batchVoting: null,
  };

  if (options.offchainVoting) {
    const {
      offchainVoting,
      handleBadReporterAdapter,
      snapshotProposalContract,
    } = await configureOffchainVoting({
      ...options,
      dao,
      daoFactory,
      votingAddress,
      bankAddress: extensions.bank.address,
    });
    votingHelpers.offchainVoting = offchainVoting;
    votingHelpers.handleBadReporterAdapter = handleBadReporterAdapter;
    votingHelpers.snapshotProposalContract = snapshotProposalContract;
  } else if (options.batchVoting) {
    const {
      batchVoting,
      snapshotProposalContract,
    } = await configureBatchVoting({
      ...options,
      dao,
      daoFactory,
    });

    votingHelpers.batchVoting = batchVoting;
    votingHelpers.snapshotProposalContract = snapshotProposalContract;
  }

  // deploy test token contracts (for testing convenience)
  const testContracts = {
    oltToken: null,
    testToken1: null,
    testToken2: null,
    multicall: null,
    pixelNFT: null,
    proxToken: null,
    erc1155TestToken: null,
  };

  if (deployTestTokens) {
    testContracts.testToken1 = await deployFunction(TestToken1, [1000000]);
    testContracts.testToken2 = await deployFunction(TestToken2, [1000000]);
    testContracts.multicall = await deployFunction(Multicall);
    testContracts.pixelNFT = await deployFunction(PixelNFT, [100]);
    testContracts.oltToken = await deployFunction(OLToken, [
      toBN("1000000000000000000000000"),
    ]);
    testContracts.proxToken = await deployFunction(ProxToken);
    testContracts.erc1155TestToken = await deployFunction(ERC1155TestToken, [
      "1155 test token",
    ]);
  }

  if (finalize) {
    await dao.finalizeDao({ from: owner });
  }

  return {
    dao: dao,
    adapters: adapters,
    extensions: extensions,
    testContracts: testContracts,
    votingHelpers: votingHelpers,
    factories: {
      daoFactory,
      bankFactory,
      nftFactory,
      erc20TokenExtFactory,
      executorExtensionFactory,
      erc1155TokenExtFactory,
    },
  };
};

const configureOffchainVoting = async ({
  dao,
  daoFactory,
  chainId,
  owner,
  offchainAdmin,
  votingAddress,
  bankAddress,
  votingPeriod,
  gracePeriod,
  SnapshotProposalContract,
  KickBadReporterAdapter,
  OffchainVotingContract,
  OffchainVotingHashContract,
  deployFunction,
}) => {
  let snapshotProposalContract = await deployFunction(
    SnapshotProposalContract,
    [chainId]
  );

  let offchainVotingHashContract = await deployFunction(
    OffchainVotingHashContract,
    [snapshotProposalContract.address]
  );

  let handleBadReporterAdapter = await deployFunction(KickBadReporterAdapter);
  let offchainVoting = await deployFunction(OffchainVotingContract, [
    votingAddress,
    offchainVotingHashContract.address,
    snapshotProposalContract.address,
    handleBadReporterAdapter.address,
    offchainAdmin,
  ]);

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", offchainVoting, {}),
    { from: owner }
  );

  await dao.setAclToExtensionForAdapter(
    bankAddress,
    offchainVoting.address,
    entryBank(offchainVoting, {
      ADD_TO_BALANCE: true,
      SUB_FROM_BALANCE: true,
      INTERNAL_TRANSFER: true,
    }).flags,
    { from: owner }
  );
  await offchainVoting.configureDao(
    dao.address,
    votingPeriod,
    gracePeriod,
    10,
    { from: owner }
  );

  return { offchainVoting, snapshotProposalContract, handleBadReporterAdapter };
};

const configureBatchVoting = async ({
  owner,
  dao,
  daoFactory,
  chainId,
  votingPeriod,
  gracePeriod,
  SnapshotProposalContract,
  BatchVotingContract,
  deployFunction,
}) => {
  let snapshotProposalContract, batchVoting;

  snapshotProposalContract = await deployFunction(SnapshotProposalContract, [
    chainId,
  ]);
  batchVoting = await deployFunction(BatchVotingContract, [
    snapshotProposalContract.address,
  ]);

  await daoFactory.updateAdapter(
    dao.address,
    entryDao("voting", batchVoting, {}),
    { from: owner }
  );

  await batchVoting.configureDao(dao.address, votingPeriod, gracePeriod, {
    from: owner,
  });

  return { batchVoting, snapshotProposalContract };
};

const prepareAdapters = async ({
  deployFunction,
  VotingContract,
  ConfigurationContract,
  TributeContract,
  TributeNFTContract,
  DistributeContract,
  RagequitContract,
  ManagingContract,
  FinancingContract,
  OnboardingContract,
  GuildKickContract,
  DaoRegistryAdapterContract,
  BankAdapterContract,
  NFTAdapterContract,
  CouponOnboardingContract,
  ERC1155AdapterContract,
}) => {
  let voting,
    configuration,
    ragequit,
    managing,
    financing,
    onboarding,
    guildkick,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    erc1155Adapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT;

  voting = await deployFunction(VotingContract);
  configuration = await deployFunction(ConfigurationContract);
  ragequit = await deployFunction(RagequitContract);
  managing = await deployFunction(ManagingContract);
  financing = await deployFunction(FinancingContract);
  onboarding = await deployFunction(OnboardingContract);
  guildkick = await deployFunction(GuildKickContract);
  daoRegistryAdapter = await deployFunction(DaoRegistryAdapterContract);
  bankAdapter = await deployFunction(BankAdapterContract);
  nftAdapter = await deployFunction(NFTAdapterContract);
  couponOnboarding = await deployFunction(CouponOnboardingContract, [1]);
  tribute = await deployFunction(TributeContract);
  distribute = await deployFunction(DistributeContract);
  tributeNFT = await deployFunction(TributeNFTContract);
  erc1155Adapter = await deployFunction(ERC1155AdapterContract);
  return {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
    erc1155Adapter,
  };
};

const createIdentityDao = async (options) => {
  let { DaoRegistry } = options;

  return await DaoRegistry.new({
    from: options.owner,
    gasPrice: toBN("0"),
  });
};

const addDefaultAdapters = async ({ dao, options, daoFactory, nftAddr }) => {
  const {
    voting,
    configuration,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
    erc1155Adapter,
  } = await prepareAdapters(options);

  const {
    BankExtension,
    NFTExtension,
    ERC20Extension,
    ERC1155TokenExtension,
  } = options;

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bankExtension = await BankExtension.at(bankAddress);

  const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
  const nftExtension = await NFTExtension.at(nftExtAddr);

  const unitTokenExtAddr = await dao.getExtensionAddress(sha3("erc20-ext"));
  const erc20TokenExtension = await ERC20Extension.at(unitTokenExtAddr);

  const erc1155TokenExtAddr = await dao.getExtensionAddress(
    sha3("erc1155-ext")
  );
  const erc1155TokenExtension = await ERC1155TokenExtension.at(
    erc1155TokenExtAddr
  );

  await configureDao({
    owner: options.owner,
    daoFactory,
    dao,
    ragequit,
    guildkick,
    managing,
    financing,
    onboarding,
    daoRegistryAdapter,
    bankAdapter,
    nftAdapter,
    erc1155Adapter,
    voting,
    configuration,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
    nftAddr,
    bankExtension,
    nftExtension,
    erc20TokenExtension,
    erc1155TokenExtension,
    ...options,
  });

  return {
    dao,
    adapters: {
      voting,
      configuration,
      ragequit,
      guildkick,
      managing,
      financing,
      onboarding,
      daoRegistryAdapter,
      bankAdapter,
      nftAdapter,
      couponOnboarding,
      tribute,
      distribute,
      tributeNFT,
      erc1155Adapter,
    },
  };
};

const configureDao = async ({
  owner,
  daoFactory,
  dao,
  ragequit,
  guildkick,
  managing,
  financing,
  onboarding,
  daoRegistryAdapter,
  bankAdapter,
  bankExtension,
  nftAdapter,
  nftExtension,
  erc20TokenExtension,
  erc1155Adapter,
  erc1155TokenExtension,
  voting,
  configuration,
  couponOnboarding,
  tribute,
  distribute,
  tributeNFT,
  unitPrice,
  maxChunks,
  nbUnits,
  tokenAddr,
  votingPeriod,
  gracePeriod,
  couponCreatorAddress,
}) => {
  const adapters = [];
  if (voting) adapters.push(entryDao("voting", voting, {}));

  if (configuration)
    adapters.push(
      entryDao("configuration", configuration, {
        SUBMIT_PROPOSAL: true,
        SET_CONFIGURATION: true,
      })
    );

  if (ragequit) adapters.push(entryDao("ragequit", ragequit, {}));

  if (guildkick)
    adapters.push(
      entryDao("guildkick", guildkick, {
        SUBMIT_PROPOSAL: true,
      })
    );

  if (managing)
    adapters.push(
      entryDao("managing", managing, {
        SUBMIT_PROPOSAL: true,
        REPLACE_ADAPTER: true,
      })
    );

  if (financing)
    adapters.push(
      entryDao("financing", financing, {
        SUBMIT_PROPOSAL: true,
      })
    );

  if (onboarding)
    adapters.push(
      entryDao("onboarding", onboarding, {
        SUBMIT_PROPOSAL: true,
        UPDATE_DELEGATE_KEY: true,
        NEW_MEMBER: true,
      })
    );

  if (couponOnboarding)
    adapters.push(
      entryDao("coupon-onboarding", couponOnboarding, {
        NEW_MEMBER: true,
      })
    );

  if (daoRegistryAdapter)
    adapters.push(
      entryDao("daoRegistry", daoRegistryAdapter, {
        UPDATE_DELEGATE_KEY: true,
      })
    );

  if (tribute)
    adapters.push(
      entryDao("tribute", tribute, {
        SUBMIT_PROPOSAL: true,
        NEW_MEMBER: true,
      })
    );

  if (tributeNFT)
    adapters.push(
      entryDao("tribute-nft", tributeNFT, {
        SUBMIT_PROPOSAL: true,
        NEW_MEMBER: true,
      })
    );

  if (distribute)
    adapters.push(
      entryDao("distribute", distribute, {
        SUBMIT_PROPOSAL: true,
      })
    );

  // Adapters to access the extensions directly
  if (nftAdapter) adapters.push(entryDao("nft", nftAdapter, {}));

  if (bankAdapter) adapters.push(entryDao("bank", bankAdapter, {}));

  if (erc1155Adapter)
    adapters.push(entryDao("erc1155-adpt", erc1155Adapter, {}));

  // Declare the erc20 token extension as an adapter to be able to call the bank extension
  if (erc20TokenExtension)
    adapters.push(
      entryDao("erc20-ext", erc20TokenExtension, {
        NEW_MEMBER: true,
      })
    );

  await daoFactory.addAdapters(dao.address, adapters, { from: owner });

  const adaptersWithBankAccess = [];

  if (ragequit)
    adaptersWithBankAccess.push(
      entryBank(ragequit, {
        INTERNAL_TRANSFER: true,
        SUB_FROM_BALANCE: true,
        ADD_TO_BALANCE: true,
      })
    );

  if (guildkick)
    adaptersWithBankAccess.push(
      entryBank(guildkick, {
        INTERNAL_TRANSFER: true,
        SUB_FROM_BALANCE: true,
        ADD_TO_BALANCE: true,
      })
    );

  if (bankAdapter)
    adaptersWithBankAccess.push(
      entryBank(bankAdapter, {
        WITHDRAW: true,
        SUB_FROM_BALANCE: true,
        UPDATE_TOKEN: true,
      })
    );

  if (onboarding)
    adaptersWithBankAccess.push(
      entryBank(onboarding, {
        ADD_TO_BALANCE: true,
      })
    );

  if (couponOnboarding)
    adaptersWithBankAccess.push(
      entryBank(couponOnboarding, {
        ADD_TO_BALANCE: true,
      })
    );

  if (financing)
    adaptersWithBankAccess.push(
      entryBank(financing, {
        ADD_TO_BALANCE: true,
        SUB_FROM_BALANCE: true,
      })
    );

  if (tribute)
    adaptersWithBankAccess.push(
      entryBank(tribute, {
        ADD_TO_BALANCE: true,
        REGISTER_NEW_TOKEN: true,
      })
    );

  if (distribute)
    adaptersWithBankAccess.push(
      entryBank(distribute, {
        INTERNAL_TRANSFER: true,
      })
    );

  if (tributeNFT)
    adaptersWithBankAccess.push(
      entryBank(tributeNFT, {
        ADD_TO_BALANCE: true,
      })
    );

  if (erc20TokenExtension)
    // Let the unit-token extension to execute internal transfers in the bank as an adapter
    adaptersWithBankAccess.push(
      entryBank(erc20TokenExtension, {
        INTERNAL_TRANSFER: true,
      })
    );

  await daoFactory.configureExtension(
    dao.address,
    bankExtension.address,
    adaptersWithBankAccess,
    { from: owner }
  );

  const adaptersWithNFTAccess = [];
  if (tributeNFT)
    adaptersWithNFTAccess.push(
      entryNft(tributeNFT, {
        COLLECT_NFT: true,
      })
    );

  if (nftAdapter)
    adaptersWithNFTAccess.push(
      entryNft(nftAdapter, {
        COLLECT_NFT: true,
      })
    );

  if (erc1155Adapter)
    adaptersWithNFTAccess.push(
      entryNft(erc1155Adapter, {
        WITHDRAW_NFT: true,
        COLLECT_NFT: true,
        INTERNAL_TRANSFER: true,
      })
    );

  await daoFactory.configureExtension(
    dao.address,
    nftExtension.address,
    adaptersWithNFTAccess,
    {
      from: owner,
    }
  );

  await daoFactory.configureExtension(
    dao.address,
    erc1155TokenExtension.address,
    adaptersWithNFTAccess,
    //[],
    {
      from: owner,
    }
  );

  await daoFactory.configureExtension(
    dao.address,
    erc20TokenExtension.address,
    [],
    { from: owner }
  );

  if (onboarding) {
    await onboarding.configureDao(
      dao.address,
      UNITS,
      unitPrice,
      nbUnits,
      maxChunks,
      tokenAddr,
      {
        from: owner,
      }
    );

    await onboarding.configureDao(
      dao.address,
      LOOT,
      unitPrice,
      nbUnits,
      maxChunks,
      tokenAddr,
      {
        from: owner,
      }
    );
  }
  if (couponOnboarding)
    await couponOnboarding.configureDao(
      dao.address,
      couponCreatorAddress,
      UNITS,
      {
        from: owner,
      }
    );

  if (voting)
    await voting.configureDao(dao.address, votingPeriod, gracePeriod, {
      from: owner,
    });

  if (tribute) {
    await tribute.configureDao(dao.address, UNITS, {
      from: owner,
    });
    await tribute.configureDao(dao.address, LOOT, {
      from: owner,
    });
  }

  if (tributeNFT)
    await tributeNFT.configureDao(dao.address, {
      from: owner,
    });
};

const cloneDao = async ({
  identityDao,
  owner,
  creator,
  deployFunction,
  DaoRegistry,
  DaoFactory,
  name,
}) => {
  let daoFactory = await deployFunction(
    DaoFactory,
    [identityDao.address],
    owner
  );

  await daoFactory.createDao(name, creator ? creator : owner, { from: owner });

  // checking the gas usaged to clone a contract
  let _address = await daoFactory.getDaoAddress(name);
  let newDao = await DaoRegistry.at(_address);
  return { dao: newDao, daoFactory, daoName: name };
};

const createBankExtension = async (
  dao,
  owner,
  bankFactory,
  BankExtension,
  maxExternalTokens
) => {
  await bankFactory.createBank(maxExternalTokens);
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await bankFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { bankAddress } = pastEvent.returnValues;
  const bankExtension = await BankExtension.at(bankAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("bank"), bankExtension.address, owner, {
    from: owner,
  });
  return bankExtension;
};

const createNFTExtension = async (dao, owner, nftFactory, NFTExtension) => {
  await nftFactory.createNFTCollection();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await nftFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { nftCollAddress } = pastEvent.returnValues;
  const nftExtension = await NFTExtension.at(nftCollAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("nft"), nftCollAddress, owner, {
    from: owner,
  });
  return nftExtension;
};

const createERC20Extension = async (
  dao,
  owner,
  erc20TokenExtFactory,
  erc20TokenName,
  erc20TokenSymbol,
  erc20TokenDecimals,
  ERC20Extension
) => {
  await erc20TokenExtFactory.create(
    erc20TokenName,
    UNITS,
    erc20TokenSymbol,
    erc20TokenDecimals
  );
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await erc20TokenExtFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { erc20ExtTokenAddress } = pastEvent.returnValues;
  const erc20TokenExtension = await ERC20Extension.at(erc20ExtTokenAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("erc20-ext"), erc20ExtTokenAddress, owner, {
    from: owner,
  });
  return erc20TokenExtension;
};

const createExecutorExtension = async (
  dao,
  owner,
  executorExtensionFactory,
  ExecutorExtension
) => {
  await executorExtensionFactory.create();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await executorExtensionFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { executorAddress } = pastEvent.returnValues;
  const executorExtension = await ExecutorExtension.at(executorAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("executor-ext"), executorAddress, owner, {
    from: owner,
  });
  return executorExtension;
};

//
const createERC1155Extension = async (
  dao,
  owner,
  erc1155TokenExtFactory,
  ERC1155TokenExtension
) => {
  await erc1155TokenExtFactory.createERC1155Collection();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await erc1155TokenExtFactory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { nftCollAddress } = pastEvent.returnValues;
  const erc1155TokenExtension = await ERC1155TokenExtension.at(nftCollAddress);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("erc1155-ext"), nftCollAddress, owner, {
    from: owner,
  });
  return erc1155TokenExtension;
};
//
const entryNft = (contract, flags) => {
  const values = [
    flags.WITHDRAW_NFT,
    flags.COLLECT_NFT,
    flags.INTERNAL_TRANSFER,
  ];

  const acl = entry(values);

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: acl,
  };
};

const entryBank = (contract, flags) => {
  const values = [
    flags.ADD_TO_BALANCE,
    flags.SUB_FROM_BALANCE,
    flags.INTERNAL_TRANSFER,
    flags.WITHDRAW,
    flags.REGISTER_NEW_TOKEN,
    flags.REGISTER_NEW_INTERNAL_TOKEN,
    flags.UPDATE_TOKEN,
  ];

  const acl = entry(values);

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: acl,
  };
};

const entryExecutor = (contract, flags) => {
  const values = [flags.EXECUTE];

  const acl = entry(values);

  return {
    id: sha3("n/a"),
    addr: contract.address,
    flags: acl,
  };
};

const entryDao = (name, contract, flags) => {
  const values = [
    flags.REPLACE_ADAPTER,
    flags.SUBMIT_PROPOSAL,
    flags.UPDATE_DELEGATE_KEY,
    flags.SET_CONFIGURATION,
    flags.ADD_EXTENSION,
    flags.REMOVE_EXTENSION,
    flags.NEW_MEMBER,
  ];

  const acl = entry(values);

  return {
    id: sha3(name),
    addr: contract.address,
    flags: acl,
  };
};

const entry = (values) => {
  return values
    .map((v, idx) => (v === true ? 2 ** idx : 0))
    .reduce((a, b) => a + b);
};

const networks = [
  {
    name: "ganache",
    chainId: 1337,
  },
  {
    name: "rinkeby",
    chainId: 4,
  },
  {
    name: "rinkeby-fork",
    chainId: 4,
  },
  {
    name: "test",
    chainId: 1,
  },
  {
    name: "coverage",
    chainId: 1,
  },
  {
    name: "mainnet",
    chainId: 1,
  },
];

const getNetworkDetails = (name) => {
  return networks.find((n) => n.name === name);
};

module.exports = {
  deployDao,
  createIdentityDao,
  cloneDao,
  prepareAdapters,
  addDefaultAdapters,
  entry,
  entryBank,
  entryDao,
  entryExecutor,
  getNetworkDetails,
};
