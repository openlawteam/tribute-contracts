module.exports = {
  norpc: true,
  testCommand: "npm test",
  compileCommand: "npm run compile",
  providerOptions: {
    default_balance_ether: "10000000000000000000000000",
  },
  mocha: {
    fgrep: "[skip-on-coverage]", // tag to skip tests
    invert: true,
  },
};
