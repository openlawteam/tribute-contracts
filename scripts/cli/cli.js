#!/usr/bin/env node

require("dotenv").config({ path: ".env" });

const { newManagingProposal } = require("./adapters/managing-adapter");

const { Command } = require("commander");
const program = new Command();
program.version("0.0.1");

const supportedContracts = ["ManagingContract"];

const main = () => {
  program.option(
    "-N, --network <mainnet|rinkeby|ropsten|ganache>",
    "The Ethereum Network which CLI should interact with."
  );
  program.option(
    "-D, --dao <0x>",
    "The DAO address which CLI should interact with."
  );
  program.option(
    "-S, --space <space>",
    "The space name defined in the Snapshot Hub API."
  );
  program.option(
    "-C, --contract <contract>",
    "The 42 digits startign with 0x contract address which CLI should interact with."
  );

  program
    .command("list")
    .description("List all contracts to interact with.")
    .action(() => supportedContracts.map((c) => console.log(c)));

  program
    .command(
      "adapter-add <adapterId> <adapterAddress> <keys> <values> <aclFlags> [data]"
    )
    .description("Submit a new managing proposal.")
    .action(async (adapterName, adapterAddress, keys, values, aclFlags, data) =>
      newManagingProposal(
        adapterName,
        adapterAddress,
        keys,
        values,
        aclFlags,
        data,
        program.opts()
      )
    );

  program
    .parseAsync(process.argv)
    .then(() => process.exit(0))
    .catch((e) => {
      console.log("Error:", e);
      process.exit(1);
    });
};

main();
