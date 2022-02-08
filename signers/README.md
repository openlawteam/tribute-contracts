# Signers

A Signer Provider can be used to sign transactions using a private key managed by an external service, so that transaction can be send to the network using any sort of Network Provider.

In this hardhat plugin we currently support two types of Signers: OZ Defender Signer and Google KMS Signer.

Both signers are acting as external signers only. We don't use them to forward transactions. The transactions are sent to the network using the regular http/ws providers defined in the hardhat networks configs.

In order to enable a signer for a particular network set the `signerId` to the network config in the `hardhat.config.ts` file:

```
rinkeby: {
    url: process.env.ETH_NODE_URL,
    network_id: 4,
    chainId: 4,
    skipDryRun: true,
    gas: 2100000,
    gasPrice: 4000000000,
    accounts: {
    mnemonic: process.env.WALLET_MNEMONIC,
    },
    signerId: process.env.SIGNER // googleKms or defender
},
```

With the `signerId` defined, you can set up the signer configs after the `networks` section in the `hardhat.config.ts` file:

```
signers: {
    defender: {
      enabled: false,
      apiKey: process.env.DEFENDER_API_KEY,
      apiSecret: process.env.DEFENDER_API_SECRET,
    },
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

If you want to use the `googleKms` signer provider, you also need to set the `GOOGLE_APPLICATION_CREDENTIALS` env var.
