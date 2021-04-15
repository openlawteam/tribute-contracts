module.exports = async () => {
  return {
    verbose: true, // https://jestjs.io/docs/configuration#verbose-boolean
    // maxConcurrency: 20, // https://jestjs.io/docs/configuration#maxconcurrency-number
    testTimeout: 25000, // https://jestjs.io/docs/configuration#testtimeout-number
    rootDir: "./test", // https://jestjs.io/docs/configuration#rootdir-string
    setupFiles: ["./jest.setup.js"],
  };
};
