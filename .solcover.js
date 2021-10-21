module.exports = {
  norpc: true,
  measureStatementCoverage: true,
  measureFunctionCoverage: true,
  testCommand: "npm run test",
  compileCommand: "npm run compile",
  providerOptions: {
    default_balance_ether: "10000000000000000000000000",
    allowUnlimitedContractSize: true,
    gasLimit: 0xfffffffffff,
    gasPrice: 0x0,
  },
  mocha: {
    timeout: 2000000,
    useColors: true,
  },
};
