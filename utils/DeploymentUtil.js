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
    ERC1271Extension,
    ERC1271ExtensionFactory,
    NFTExtension,
    NFTCollectionFactory,
    ERC20Extension,
    ERC20TokenExtensionFactory,
    ExecutorExtension,
    ExecutorExtensionFactory,
    InternalTokenVestingExtensionFactory,
    InternalTokenVestingExtension,
    ERC1155TokenExtension,
    ERC1155TokenCollectionFactory,
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

  const bankFactory = await deployFunction(BankFactory, [BankExtension]);

  const erc1271Factory = await deployFunction(ERC1271ExtensionFactory, [
    ERC1271Extension,
  ]);

  const nftFactory = await deployFunction(NFTCollectionFactory, [NFTExtension]);

  const erc20TokenExtFactory = await deployFunction(
    ERC20TokenExtensionFactory,
    [ERC20Extension]
  );

  const executorExtensionFactory = await deployFunction(
    ExecutorExtensionFactory,
    [ExecutorExtension]
  );

  const erc1155TokenExtFactory = await deployFunction(
    ERC1155TokenCollectionFactory,
    [ERC1155TokenExtension]
  );

  const { dao, daoFactory } = await cloneDao({
    ...options,
    name: options.daoName || "test-dao",
  });

  const bankExtension = await createBankExtension(
    dao,
    owner,
    bankFactory,
    BankExtension,
    options.maxExternalTokens
  );

  const erc1271Extension = await createERC1271Extension(
    dao,
    owner,
    erc1271Factory,
    ERC1271Extension
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

  const internalTokenVestingExtensionFactory = await deployFunction(
    InternalTokenVestingExtensionFactory,
    [InternalTokenVestingExtension]
  );

  const internalTokenVestingExtension = await createInternalTokenVestingExtension(
    dao,
    owner,
    internalTokenVestingExtensionFactory,
    InternalTokenVestingExtension
  );

  const erc1155TokenExtension = await createERC1155Extension(
    dao,
    owner,
    erc1155TokenExtFactory,
    ERC1155TokenExtension
  );

  const extensions = {
    bank: bankExtension,
    erc1271: erc1271Extension,
    nft: nftExtension,
    erc20Ext: erc20TokenExtension,
    executorExt: executorExtension,
    vestingExtension: internalTokenVestingExtension,
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
      erc1271Factory,
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

const prepareAdapters = async ({
  deployFunction,
  VotingContract,
  ConfigurationContract,
  TributeContract,
  TributeNFTContract,
  LendNFTContract,
  ERC20TransferStrategy,
  DistributeContract,
  RagequitContract,
  ManagingContract,
  FinancingContract,
  OnboardingContract,
  GuildKickContract,
  DaoRegistryAdapterContract,
  BankAdapterContract,
  SignaturesContract,
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
    signatures,
    nftAdapter,
    erc1155Adapter,
    couponOnboarding,
    tribute,
    distribute,
    lendNFT,
    erc20TransferStrategy,
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
  signatures = await deployFunction(SignaturesContract);
  nftAdapter = await deployFunction(NFTAdapterContract);
  couponOnboarding = await deployFunction(CouponOnboardingContract, [1]);
  tribute = await deployFunction(TributeContract);
  distribute = await deployFunction(DistributeContract);
  tributeNFT = await deployFunction(TributeNFTContract);

  lendNFT = await deployFunction(LendNFTContract);
  erc20TransferStrategy = await deployFunction(ERC20TransferStrategy);
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
    signatures,
    nftAdapter,
    couponOnboarding,
    tribute,
    distribute,
    tributeNFT,
    lendNFT,
    erc20TransferStrategy,
    erc1155Adapter,
  };
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
    signatures,
    tribute,
    distribute,
    tributeNFT,
    lendNFT,
    erc20TransferStrategy,
    erc1155Adapter,
  } = await prepareAdapters(options);

  const {
    BankExtension,
    NFTExtension,
    ERC20Extension,
    ERC1271Extension,
    ERC1155TokenExtension,
    InternalTokenVestingExtension,
  } = options;

  const bankAddress = await dao.getExtensionAddress(sha3("bank"));
  const bankExtension = await BankExtension.at(bankAddress);

  const nftExtAddr = await dao.getExtensionAddress(sha3("nft"));
  const nftExtension = await NFTExtension.at(nftExtAddr);

  const erc1271ExtAddr = await dao.getExtensionAddress(sha3("erc1271"));
  const erc1271Extension = await ERC1271Extension.at(erc1271ExtAddr);

  const unitTokenExtAddr = await dao.getExtensionAddress(sha3("erc20-ext"));
  const erc20TokenExtension = await ERC20Extension.at(unitTokenExtAddr);

  const erc1155TokenExtAddr = await dao.getExtensionAddress(
    sha3("erc1155-ext")
  );
  const erc1155TokenExtension = await ERC1155TokenExtension.at(
    erc1155TokenExtAddr
  );

  const vestingExtensionAddr = await dao.getExtensionAddress(
    sha3("internal-token-vesting-ext")
  );
  const vestingExtension = await InternalTokenVestingExtension.at(
    vestingExtensionAddr
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
    signatures,
    tribute,
    distribute,
    tributeNFT,
    lendNFT,
    nftAddr,
    erc20TransferStrategy,
    bankExtension,
    nftExtension,
    erc1271Extension,
    erc20TokenExtension,
    erc1155TokenExtension,
    vestingExtension,
    ...options,
  });

  return {
    dao,
    adapters: {
      lendNFT,
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
      signatures,
      tribute,
      distribute,
      tributeNFT,
      erc20TransferStrategy,
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
  erc1271Extension,
  nftAdapter,
  nftExtension,
  erc20TokenExtension,
  erc1155Adapter,
  erc1155TokenExtension,
  vestingExtension,
  voting,
  configuration,
  couponOnboarding,
  signatures,
  tribute,
  distribute,
  erc20TransferStrategy,
  tributeNFT,
  lendNFT,
  unitPrice,
  maxChunks,
  nbUnits,
  tokenAddr,
  votingPeriod,
  gracePeriod,
  maxAmount,
  couponCreatorAddress,
}) => {
  const configureAdaptersWithDAOAccess = async () => {
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
          ADD_EXTENSION: true,
          REMOVE_EXTENSION: true,
        })
      );

    if (financing)
      adapters.push(
        entryDao("financing", financing, {
          SUBMIT_PROPOSAL: true,
        })
      );

    if (signatures)
      adapters.push(
        entryDao("signatures", signatures, {
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

    if (lendNFT)
      adapters.push(
        entryDao("lend-nft", lendNFT, {
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
    if (erc20TokenExtension) {
      adapters.push(
        entryDao("erc20-ext", erc20TokenExtension, {
          NEW_MEMBER: true,
        })
      );

      adapters.push(
        entryDao("erc20-transfer-strategy", erc20TransferStrategy, {})
      );
    }
    await daoFactory.addAdapters(dao.address, adapters, { from: owner });
  };

  const configureAdaptersWithBankAccess = async () => {
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
          REGISTER_NEW_TOKEN: true,
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
          INTERNAL_TRANSFER: true,
        })
      );

    if (couponOnboarding)
      adaptersWithBankAccess.push(
        entryBank(couponOnboarding, {
          ADD_TO_BALANCE: true,
          INTERNAL_TRANSFER: true,
        })
      );

    if (financing)
      adaptersWithBankAccess.push(
        entryBank(financing, {
          ADD_TO_BALANCE: true,
          SUB_FROM_BALANCE: true,
          INTERNAL_TRANSFER: true,
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

    if (lendNFT)
      adaptersWithBankAccess.push(
        entryBank(lendNFT, {
          ADD_TO_BALANCE: true,
          SUB_FROM_BALANCE: true,
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
  };

  const configureAdaptersWithERC20Access = async () => {
    await daoFactory.configureExtension(
      dao.address,
      erc20TokenExtension.address,
      [],
      { from: owner }
    );
  };

  const configureAdaptersWithNFTAccess = async () => {
    const adaptersWithNFTAccess = [];
    if (tributeNFT)
      adaptersWithNFTAccess.push(
        entryNft(tributeNFT, {
          COLLECT_NFT: true,
        })
      );

    if (lendNFT)
      adaptersWithNFTAccess.push(
        entryNft(lendNFT, {
          COLLECT_NFT: true,
          WITHDRAW_NFT: true,
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
  };

  const configureAdaptersWithSignatureAccess = async () => {
    const adaptersWithSignatureAccess = [];

    if (signatures)
      adaptersWithSignatureAccess.push(
        entryERC1271(signatures, {
          SIGN: true,
        })
      );

    await daoFactory.configureExtension(
      dao.address,
      erc1271Extension.address,
      adaptersWithSignatureAccess,
      { from: owner }
    );
  };

  const configureAdaptersWithVestingAccess = async () => {
    const adaptersWithVestingAccess = [];

    if (lendNFT)
      adaptersWithVestingAccess.push(
        entryVesting(lendNFT, {
          NEW_VESTING: true,
          REMOVE_VESTING: true,
        })
      );

    await daoFactory.configureExtension(
      dao.address,
      vestingExtension.address,
      adaptersWithVestingAccess,
      { from: owner }
    );
  };

  const configureAdaptersWithDAOParameters = async () => {
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
        erc20TokenExtension.address,
        UNITS,
        maxAmount,
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

    if (tributeNFT) {
      await tributeNFT.configureDao(dao.address, {
        from: owner,
      });
    }
  };

  await configureAdaptersWithDAOAccess();
  await configureAdaptersWithSignatureAccess();
  await configureAdaptersWithBankAccess();
  await configureAdaptersWithNFTAccess();
  await configureAdaptersWithERC20Access();
  await configureAdaptersWithVestingAccess();
  await configureAdaptersWithDAOParameters();
};

const cloneDao = async ({
  owner,
  creator,
  deployFunction,
  DaoRegistry,
  DaoFactory,
  name,
}) => {
  let daoFactory = await deployFunction(DaoFactory, [DaoRegistry], owner);

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

const createERC1271Extension = async (
  dao,
  owner,
  erc1271Factory,
  ERC1271Extension
) => {
  await erc1271Factory.create();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await erc1271Factory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { erc1271Address } = pastEvent.returnValues;
  const erc1271Extension = await ERC1271Extension.at(erc1271Address);

  // Adds the new extension to the DAO
  await dao.addExtension(sha3("erc1271"), erc1271Extension.address, owner, {
    from: owner,
  });
  return erc1271Extension;
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

const createInternalTokenVestingExtension = async (
  dao,
  owner,
  factory,
  contract
) => {
  await factory.create();
  let pastEvent;
  while (pastEvent === undefined) {
    let pastEvents = await factory.getPastEvents();
    pastEvent = pastEvents[0];
  }
  const { addr } = pastEvent.returnValues;
  const extension = await contract.at(addr);

  // Adds the new extension to the DAO
  await dao.addExtension(
    sha3("internal-token-vesting-ext"),
    extension.address,
    owner,
    {
      from: owner,
    }
  );

  return extension;
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

const entryERC1271 = (contract, flags) => {
  const values = [flags.SIGN];

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

const entryVesting = (contract, flags) => {
  const values = [flags.NEW_VESTING, flags.REMOVE_VESTING];

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
  cloneDao,
  prepareAdapters,
  addDefaultAdapters,
  entry,
  entryBank,
  entryNft,
  entryERC1271,
  entryDao,
  entryExecutor,
  entryVesting,
  getNetworkDetails,
};
