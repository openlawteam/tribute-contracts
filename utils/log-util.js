const isDebug = process.env.DEBUG === "true";
const isTest = process.env.TEST === "true";
const isCoverage = process.env.DISABLE_SOLC_OPTIMIZER === "true";

const debug = (...data) => {
  if (isDebug) console.log(data.join(""));
};

const log = (data) => {
  console.log(data);
};

const info = (data) => {
  if (!isTest && !isCoverage) console.error(data.replace(/^ {8}/gm, "    "));
};

const error = (...data) => {
  console.error(data.join(""));
};

module.exports = {
  debug,
  info,
  error,
  log,
};
