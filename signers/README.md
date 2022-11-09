# Signers

A Signer Provider can be used to sign transactions using a private key managed by an external service, so that transaction can be sent to the network using any sort of Network Provider.

In this hardhat plugin we currently support one type of Signer: Google KMS Signer.

The signer acts as external transaction signers only. We don't use it to forward transactions. The transactions are sent to the network using the regular http/ws providers defined in the hardhat networks configs.

In order to enable a signer for a particular network set the `signerId` to the network config in the `hardhat.config.ts` file:

```
goerli: {
    url: process.env.ETH_NODE_URL,
    network_id: 5,
    chainId: 5,
    skipDryRun: true,
    gas: 2100000,
    gasPrice: 4000000000,
    accounts: {
    mnemonic: process.env.WALLET_MNEMONIC,
    },
    signerId: "googleKms"
},
```

With the `signerId` defined, you can set up the signer configs after the `networks` section in the `hardhat.config.ts` file:

```
signers: {
    googleKms: {
      enabled: false,
      projectId: process.env.KMS_PROJECT_ID,
      locationId: process.env.KMS_LOCATION_ID,
      keyRingId: process.env.KMS_KEY_RING_ID,
      keyId: process.env.KMS_KEY_ID,
      keyVersion: process.env.KMS_KEY_VERSION,
    },
  },
```

Make sure you set the `enabled` to `true` for the signer that you want to use.

That's it. With the signer enabled, all transactions will be signed by the signer private key, and forwarded to the Ethereum network using the provider `url` defined for the chain config.

In order to use the `googleKms` signer, you also need to set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
