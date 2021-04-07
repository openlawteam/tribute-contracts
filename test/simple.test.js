const { accounts, contract } = require("@openzeppelin/test-environment");
const [owner] = accounts;

const { expect } = require("chai");

const PixelNFT = contract.fromArtifact("PixelNFT");

describe("PixelNFT", () => {
  it("deployer is owner", async () => {
    const myContract = await PixelNFT.new(5, { from: owner });
    expect(await myContract.symbol()).to.equal("PIX");
  });
});
