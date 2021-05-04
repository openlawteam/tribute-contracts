import fs from "fs";
import { Signer } from "@ethersproject/abstract-signer";
import { ethers, waffle } from "hardhat";
import { expect } from "chai";
import { ApolloFetch, FetchResult } from "apollo-fetch";

import { config as dotenvConfig } from "dotenv";
import path, { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "./.env") });

// Contract Artifacts
import DaoRegistryArtifact from "./artifacts/contracts/core/DaoRegistry.sol/DaoRegistry.json";
import DaoFactoryArtifact from "./artifacts/contracts/core/DaoFactory.sol/DaoFactory.json";

// Contract Types
import { DaoRegistry } from "../../typechain/DaoRegistry";
import { DaoFactory } from "../../typechain/DaoFactory";

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
// const srcDir = path.join(__dirname, "..");

// Subgraph Name
const subgraphUser = "openlawteam";
const subgraphName = "tribute";

// Yaml Creator
import { getYAML } from "./helpers/YAML";

// Test
describe("Dao and Bank Creation", function () {
  let daoRegistry: DaoRegistry;
  let daoFactory: DaoFactory;

  let subgraph: ApolloFetch;
  let signers: Signer[];

  let syncDelay = 2000;

  before(async function (done) {
    this.timeout(0); // sometimes it takes a long time

    signers = await ethers.getSigners();

    console.log("============= signers", await signers[0].getAddress());

    // Deploy contracts
    daoRegistry = (await deployContract(
      signers[0],
      DaoRegistryArtifact,
      []
    )) as DaoRegistry;

    console.log(
      "============= deployed daoRegistry.address",
      daoRegistry.address
    );

    daoFactory = (await deployContract(signers[0], DaoFactoryArtifact, [
      daoRegistry.address,
    ])) as DaoFactory;

    console.log(
      "============= deployed daoFactory.address",
      daoFactory.address
    );

    // Write YAML file
    fs.writeFileSync(
      "subgraph.yaml",
      getYAML({
        daoFactoryAddress: daoFactory.address,
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

    // exec(`yarn remove-local`);

    process.stdout.write("Clean up complete.");

    done();
  });

  it("indexes dao creation", async function (done) {
    const daoName = "test-dao";
    const creator = (await signers[1].getAddress()).toLocaleLowerCase();

    // Create a Dao
    await daoFactory.createDao(daoName, creator);

    await waitForSubgraphToBeSynced(syncDelay); //.catch();

    const query = await queryDaoByName(daoName);
    const response = (await subgraph({ query })) as FetchResult;
    const result = response.data as SubgraphResponseDaoType;

    console.log("======== result", result);
    expect(result.tributes.name).to.be.equal(daoName.toString());

    done();
  });
});
