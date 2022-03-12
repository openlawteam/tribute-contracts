const fs = require('fs');
const ethers = require('ethers');
require("dotenv").config();

const generateDeployerMnemonic = () => {
  let mnemonicFromFile = '';
  try {
    mnemonicFromFile = fs.readFileSync('./deployer-mnemonic.secret').toString().trim();
  } catch (err) {
    // Return if error is something other than mnemonic file not existing.
    if (err.code !== 'ENOENT') {
      console.log(`Error reading deployer mnemonic: ${err.message}`);
      return;
    }
  }
  
  const mnemonic = process.env.WALLET_MNEMONIC || mnemonicFromFile;
  if (mnemonic) {
    const mnemonicFileLocation = process.env.WALLET_MNEMONIC ? './.env' : './deployer-mnemonic.secret';
    const deployerAddress = ethers.Wallet.fromMnemonic(mnemonic).address;
    console.log(`Mnemonic already specified in ${mnemonicFileLocation}\nDeployer address: ${deployerAddress}`);
    return;
  }
  
  const wallet = ethers.Wallet.createRandom();
  fs.writeFileSync('./deployer-mnemonic.secret', wallet.mnemonic.phrase);
  fs.writeFileSync('./deployer-address.secret', wallet.address);
  console.log(`Generated mnemonic at ./deployer-mnemonic.secret\nDeployer address: ${wallet.address}\nFund this address before deploying.`);
};

generateDeployerMnemonic();
