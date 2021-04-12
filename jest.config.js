module.exports = async () => {
  return {
    verbose: false, // https://jestjs.io/docs/configuration#verbose-boolean
    maxConcurrency: 20, // https://jestjs.io/docs/configuration#maxconcurrency-number
    testTimeout: 15000, // https://jestjs.io/docs/configuration#testtimeout-number
    rootDir: "test/", // https://jestjs.io/docs/configuration#rootdir-string
  };
};
