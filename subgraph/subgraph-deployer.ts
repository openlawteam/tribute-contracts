import fs from "fs";
import path, { resolve } from "path";
import { execSync } from "child_process";
import { config as dotenvConfig } from "dotenv";

import subgraphConfig from "./config/subgraph-config.json";

dotenvConfig({ path: resolve(__dirname, "./.env") });

type DeploySettings = {
  GITHUB_USERNAME: string;
  SUBGRAPH_NAME: string;
};

type YAMLSettings = {
  daoFactoryAddress: string;
  daoFactoryStartBlock: number;
  network: string;
};

type SubgraphSettings = DeploySettings & YAMLSettings;

// Execute Child Processes
const srcDir = path.join(__dirname);
export const exec = (cmd: string) => {
  try {
    return execSync(cmd, { cwd: srcDir, stdio: "inherit" });
  } catch (e) {
    throw new Error(`Failed to run command \`${cmd}\``);
  }
};

const getYAML = ({
  daoFactoryAddress,
  daoFactoryStartBlock,
  network,
}: YAMLSettings): string => {
  return ` 
  specVersion: 0.0.2
  description: Tribute DAO Framework Subgraph
  repository: https://github.com/openlawteam/tribute-contracts
  schema:
    file: ./schema.graphql
  dataSources:
    # ====================================== DaoFactory ====================================
    - kind: ethereum/contract
      name: DaoFactory
      network: ${network}
      source:
        address: "${daoFactoryAddress}"
        abi: DaoFactory
        startBlock: ${daoFactoryStartBlock}
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - TributeDao
        abis:
          - name: DaoFactory
            file: ../build/contracts/DaoFactory.json
        eventHandlers:
          - event: DAOCreated(address,string)
            handler: handleDaoCreated
        file: ./mappings/dao-factory-mapping.ts

  templates:
    # ====================================== DaoRegistry ====================================
    - kind: ethereum/contract
      name: DaoRegistry
      network: ${network}
      source:
        abi: DaoRegistry
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - Adapter
          - Extension
          - Proposal
          - Member
          - Vote
        abis:
          - name: DaoRegistry
            file: ../build/contracts/DaoRegistry.json
        # - name: OnboardingContract
        #   file: ../build/contracts/OnboardingContract.json
        # - name: DistributeContract
        #   file: ../build/contracts/DistributeContract.json
        # - name: TributeContract
        #   file: ../build/contracts/TributeContract.json
          - name: TributeNFTContract
            file: ../build/contracts/TributeNFTContract.json
          - name: ManagingContract
            file: ../build/contracts/ManagingContract.json
          - name: GuildKickContract
            file: ../build/contracts/GuildKickContract.json
        # - name: FinancingContract
        #   file: ../build/contracts/FinancingContract.json
          - name: OffchainVotingContract
            file: ../build/contracts/OffchainVotingContract.json
          - name: VotingContract
            file: ../build/contracts/VotingContract.json
          - name: IVoting
            file: ../build/contracts/IVoting.json
        eventHandlers:
          - event: SubmittedProposal(bytes32,uint256)
            handler: handleSubmittedProposal
          - event: SponsoredProposal(bytes32,uint256,address)
            handler: handleSponsoredProposal
          - event: ProcessedProposal(bytes32,uint256)
            handler: handleProcessedProposal
          - event: AdapterAdded(bytes32,address,uint256)
            handler: handleAdapterAdded
          - event: AdapterRemoved(bytes32)
            handler: handleAdapterRemoved
          - event: ExtensionAdded(bytes32,address)
            handler: handleExtensionAdded
          - event: ExtensionRemoved(bytes32)
            handler: handleExtensionRemoved
          - event: UpdateDelegateKey(address,address)
            handler: handleUpdateDelegateKey
          - event: ConfigurationUpdated(bytes32,uint256)
            handler: handleConfigurationUpdated
          - event: AddressConfigurationUpdated(bytes32,address)
            handler: handleAddressConfigurationUpdated
        file: ./mappings/dao-registry-mapping.ts
    # ====================================== BankExtension ====================================
    - kind: ethereum/contract
      name: BankExtension
      network: ${network}
      source:
        abi: BankExtension
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - TokenBalance
          - Token
          - Member
        abis:
          - name: BankExtension
            file: ../build/contracts/BankExtension.json
          - name: ERC20
            file: ../build/contracts/ERC20.json
        eventHandlers:
          - event: NewBalance(address,address,uint160)
            handler: handleNewBalance
          - event: Withdraw(address,address,uint160)
            handler: handleWithdraw
        file: ./mappings/extensions/bank-extension-mapping.ts
    # ====================================== NFTExtension ====================================
    - kind: ethereum/contract
      name: NFTExtension
      network: ${network}
      source:
        abi: NFTExtension
      mapping:
        kind: ethereum/events
        apiVersion: 0.0.4
        language: wasm/assemblyscript
        entities:
          - NFTCollection
          - NFT
        abis:
          - name: NFTExtension
            file: ../build/contracts/NFTExtension.json
        eventHandlers:
          - event: CollectedNFT(address,uint256)
            handler: handleCollectedNFT
          - event: TransferredNFT(address,uint256,address,address)
            handler: handleTransferredNFT
          - event: WithdrawnNFT(address,uint256,address)
            handler: handleWithdrawnNFT
        file: ./mappings/extensions/nft-extension-mapping.ts

        
`;
};

(function () {
  // Compile the solidity contracts
  console.log("📦 ### 1/3 Compiling the smart contracts...");
  exec(`cd .. && truffle compile`);

  // Create the graph code generation files
  console.log("📦 ### 2/3 Creating the graph scheme...");
  exec(`graph codegen`);

  // Building the graph scheme
  console.log("📦 ### 3/3 Building the graph scheme...");
  exec(`graph build`);

  console.log("📦 ### Build complete, preparing deployment...");

  let executedDeployments: number = 0;

  subgraphConfig.forEach((subgraph: SubgraphSettings, index: number) => {
    console.log(`📦 ### DEPLOYMENT ${index + 1}/${subgraphConfig.length}...
    
    `);

    console.log("🛠 ### Preparing subgraph template for...");
    console.log(`
    GITHUB_USERNAME: ${subgraph.GITHUB_USERNAME}
    SUBGRAPH_NAME: ${subgraph.SUBGRAPH_NAME}
    Network: ${subgraph.network}
    Address: ${subgraph.daoFactoryAddress}
    Start Block: ${subgraph.daoFactoryStartBlock}
    `);

    // Write YAML file
    fs.writeFileSync(
      "subgraph.yaml",
      getYAML({
        daoFactoryAddress: subgraph.daoFactoryAddress,
        daoFactoryStartBlock: subgraph.daoFactoryStartBlock,
        network: subgraph.network,
      })
    );

    // Deploy subgraph <GITHUB_USERNAME/SUBGRAPH_NAME>
    console.log("🚗 ### Deploying subgraph...");
    exec(
      `graph deploy --access-token ${process.env.GRAPH_ACCESS_TOKEN} --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ ${subgraph.GITHUB_USERNAME}/${subgraph.SUBGRAPH_NAME}`
    );

    console.log("👏 ### Done.");

    // Increment deployment counter
    executedDeployments++;
  });

  console.log(`🎉 ### ${executedDeployments} Deployment(s) Successful!`);
})();
