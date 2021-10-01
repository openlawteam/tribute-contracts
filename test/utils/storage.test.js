
describe("Storage", () => {
    it("should be possible to create a dao artifacts contract", async () => {
        const hre = require("hardhat");
        await hre.storageLayout.export();
    });
});