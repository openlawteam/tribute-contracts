const { contracts } = require("./contracts.config");

const disabled = [];

const testContracts = contracts.map((c) => {
  if (disabled.find((e) => e === c.name)) {
    return { ...c, enabled: false };
  }
  return c;
});

module.exports = { contracts: testContracts };
