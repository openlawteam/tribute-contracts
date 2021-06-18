---
id: configuration
title: Configuration
---

Docusaurus is essentially a set of npm [packages](https://github.com/facebook/docusaurus/tree/master/packages).

:::tip

Use the **[Fast Track]** to understand Docusaurus in **5 minutes ⏱**!

Use **[new.docusaurus.io](https://new.docusaurus.io)** to test Docusaurus immediately in your browser!

:::

## Requirements {#requirements}

## Usage

### Environment Variables

Added the following environment variables to your local .env file:

- `DAO_NAME`: The name of the DAO.
- `DAO_OWNER_ADDR`: The DAO Owner ETH Address (0x...) in the target network.
- `INFURA_KEY`: The Infura API Key is used to communicate with the Ethereum blockchain.
- `TRUFFLE_MNEMONIC`: The truffle mnemonic string containing the 12 keywords.
- `ETHERSCAN_API_KEY`: The Ether Scan API Key to verify the contracts after the deployment.
- `DEBUG_CONTRACT_VERIFICATION`: Debug the Ether Scan contract verification calls (`true`|`false`).
- `COUPON_CREATOR_ADDR`: The public eth (0x...) address of the creator of the onboarding coupons.
- `ERC20_TOKEN_NAME`: The ERC20 Token Name used by the ERC20 Token Extension.
- `ERC20_TOKEN_SYMBOL`: Token Symbol used by the ERC20 Token Extension.
- `ERC20_TOKEN_DECIMALS`: The ERC20 Token Decimals to display in MetaMask.

Checkout the [sample .env file](https://github.com/openlawteam/tribute-contracts/.sample.env).

**Required env vars per deployment type**

- Ganache deployment: `DAO_NAME`, `ERC20_TOKEN_NAME`, `ERC20_TOKEN_SYMBOL`, `ERC20_TOKEN_DECIMALS`, `COUPON_CREATOR_ADDR`.

- Rinkeby deployment: `DAO_NAME`, `DAO_OWNER_ADDR`, `ERC20_TOKEN_NAME`, `ERC20_TOKEN_SYMBOL`, `ERC20_TOKEN_DECIMALS`, `COUPON_CREATOR_ADDR`.

- Test deployment: `DAO_NAME`, `ERC20_TOKEN_NAME`, `ERC20_TOKEN_SYMBOL`, `ERC20_TOKEN_DECIMALS`.

### Run Tests

This project uses truffle. To run the tests, simply run:

> npm run test

### Code Format

To fix the Solidity code and documentation with the linter hints, simply run:

> npm run lint:fix

### Running with Ganache

...

> npm run ganache

### Deploying the contracts

> npm run deploy:ganache

or

> npm run deploy:rinkeby

### Verifying Contracts

To verify the contract using Etherscan you need to create an API key and update the .env file with your API key.
Then execute the following script:

> npm run verify rinkeby

## Contribute

Tribute exists thanks to its contributors. There are many ways you can participate and help build high quality software. Check out the [contribution guide]!

## Problems? {#problems}

Ask for help on [Stack Overflow](https://stackoverflow.com/questions/tagged/docusaurus), on our [GitHub repository](https://github.com/facebook/docusaurus) or [Twitter](https://twitter.com/docusaurus).
