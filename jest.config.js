module.exports = async () => {
  return {
    verbose: true, // https://jestjs.io/docs/configuration#verbose-boolean
    maxConcurrency: 10, // https://jestjs.io/docs/configuration#maxconcurrency-number
    maxWorkers: "50%", // https://jestjs.io/docs/configuration#maxworkers-number--string
    testTimeout: 7000, // https://jestjs.io/docs/configuration#testtimeout-number
    rootDir: "test/", // https://jestjs.io/docs/configuration#rootdir-string
  };
};
