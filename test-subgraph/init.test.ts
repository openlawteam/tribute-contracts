import { Signer } from "@ethersproject/abstract-signer";
import fs from "fs";
import path from "path";
import { ethers, waffle } from "hardhat";
import { expect } from "chai";
import { ApolloFetch, FetchResult } from "apollo-fetch";

// Contract Artifacts
import DaoRegistryArtifact from "../artifacts/contracts/core/DaoRegistry.sol/DaoRegistry.json";
import DaoFactoryArtifact from "../artifacts/contracts/core/DaoFactory.sol/DaoFactory.json";
import BankFactoryArtifact from "../artifacts/contracts/extensions/BankFactory.sol/BankFactory.json";

// Contract Types
import { DaoRegistry } from "../typechain/DaoRegistry";
import { DaoFactory } from "../typechain/DaoFactory";
import { BankFactory } from "../typechain/BankFactory";

// Utils
import {
  waitForSubgraphToBeSynced,
  fetchSubgraph,
  exec,
} from "./helpers/utils";

// Subgraph Types
import { SubgraphResponseType, SubgraphResponseDaoType } from "./helpers/types";

// Queries
import { queryProposalById, queryDaoByName } from "./helpers/queries";

// misc
const { deployContract, deployMockContract } = waffle;
const srcDir = path.join(__dirname, "..");

// Subgraph Name
const subgraphUser = "openlawteam";
const subgraphName = "moloch-v3";

// Yaml Creator
import { getYAML } from "./helpers/YAML";

// Test
describe("Dao/Bank Creation", function () {
  let daoRegistry: DaoRegistry;
  let daoFactory: DaoFactory;
  let bankFactory: BankFactory;

  let subgraph: ApolloFetch;
  let signers: Signer[];

  let syncDelay = 2000;

  before(async function (done) {
    this.timeout(50000); // sometimes it takes a long time

    signers = await ethers.getSigners();

    console.log("====== signers", await signers[0].getAddress());

    // Deploy contracts
    daoRegistry = (await deployContract(
      signers[0],
      DaoRegistryArtifact
    )) as DaoRegistry;

    daoFactory = (await deployContract(signers[0], DaoFactoryArtifact, [
      await signers[0].getAddress(),
    ])) as DaoFactory;

    bankFactory = (await deployContract(signers[0], BankFactoryArtifact, [
      await signers[0].getAddress(),
    ])) as BankFactory;

    // Write YAML file
    fs.writeFileSync(
      "subgraph.yaml",
      getYAML({
        daoFactoryAddress: daoFactory.address,
        bankFactoryAddress: bankFactory.address,
      })
    );

    // Create Subgraph Connection
    subgraph = fetchSubgraph(subgraphUser, subgraphName);

    // Build and Deploy Subgraph
    console.log("Build and deploy subgraph...");
    exec(`npx hardhat compile`);
    exec(`yarn codegen`);
    exec(`yarn build`);
    exec(`yarn create-local`);
    exec(`yarn deploy-local`);

    await waitForSubgraphToBeSynced(syncDelay);

    done();
  });

  after(async function (done) {
    process.stdout.write("Clean up, removing subgraph....");

    exec(`yarn remove-local`);

    process.stdout.write("Clean up complete.");

    done();
  });

  it("indexes dao creation", async function (done) {
    const daoName = "test-dao";
    const creator = (await signers[1].getAddress()).toLocaleLowerCase();

    // Create a Dao
    await daoFactory.createDao(daoName, creator);

    await waitForSubgraphToBeSynced(syncDelay);

    const query = await queryDaoByName(daoName);
    const response = (await subgraph({ query })) as FetchResult;
    const result = response.data as SubgraphResponseDaoType;

    // expect(result.molochv3S.id).to.be.equal(daoAddress);
    expect(result.molochv3S.name).to.be.equal(daoName.toString());

    done();
  });
});
