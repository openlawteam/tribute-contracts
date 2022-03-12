const fs = require('fs');
const ethers = require('ethers');

const generateDeployerMnemonic = () => {
  const mnemonicFilePath = './deployer-mnemonic.secret';
  let mnemonic = '';

  try {
    mnemonic = fs.readFileSync(mnemonicFilePath).toString().trim();
  } catch (err) {
    // Return if error is something other than mnemonic file not existing.
    if (err.code !== 'ENOENT') {
      console.log(`Error reading deployer mnemonic from file: ${err.message}`);
      return;
    }
  }

  if (mnemonic) {
    const deployerAddress = ethers.Wallet.fromMnemonic(mnemonic).address;
    console.log(`Mnemonic already generated at: ${mnemonicFilePath}\nDeployer address: ${deployerAddress}`);
    return;
  }
  
  const wallet = ethers.Wallet.createRandom();
  fs.writeFileSync(mnemonicFilePath, wallet.mnemonic.phrase);
  fs.writeFileSync('./deployer-address.secret', wallet.address); // Write deployer address to file for convenience.
  console.log(`Generated mnemonic at ./deployer-mnemonic.secret\nDeployer address: ${wallet.address}\nFund this address with ETH before deploying.`);
};

generateDeployerMnemonic();
