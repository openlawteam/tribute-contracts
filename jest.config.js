module.exports = async () => {
  return {
    setupFiles: ["./jest.setup.js"], // https://jestjs.io/pt-BR/docs/configuration#setupfiles-array
    verbose: true, // https://jestjs.io/docs/configuration#verbose-boolean
    testTimeout: 25000, // https://jestjs.io/docs/configuration#testtimeout-number
    rootDir: "./test", // https://jestjs.io/docs/configuration#rootdir-string
    // maxConcurrency: 5, // https://jestjs.io/pt-BR/docs/configuration#maxconcurrency-number
    maxWorkers: 3, // https://jestjs.io/pt-BR/docs/configuration#maxworkers-number--string
  };
};
