module.exports = {
  deployConfigs: {
    /**
     * Directory where the deployment script stores the metadata
     * about the created contracts for failure recover.
     */
    checkpointDir: "./build",
    /**
     * Directory where the deployment logs will be stored in plain text format.
     */
    deployLogsDir: "./logs",
    /**
     * Directory where the addresses and names of all deployed contracts will
     * be stored in json format.
     */
    deployedContractsDir: "./build",
  },
};
