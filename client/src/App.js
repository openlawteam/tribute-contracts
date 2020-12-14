import React, { useEffect, useState } from "react";
import { Container, Typography } from "@material-ui/core";
import "./App.css";

import Web3 from "web3";
import Web3Modal from "web3modal";

import WalletConnectProvider from "@walletconnect/web3-provider";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
  },
};

const web3Modal = new Web3Modal({
  network: "rinkeby", // optional
  cacheProvider: true, // optional
  providerOptions, // required
});

const App = () => {
  const [provider, setProvider] = useState();
  const [web3, setWeb3] = useState();

  useEffect(() => {
    web3Modal
      .connect()
      .then((p) => {
        setProvider(p);
        setWeb3(new Web3(p));
      })
      .catch((e) => console.error(e));
  }, []);

  const [addr, setAddr] = useState();
  if (provider) {
    provider.on("accountsChanged", (accounts) => {
      console.log(accounts[0]);
      setAddr(accounts[0]);
    });
    provider.on("connect", (info) => console.log(info));
    provider.on("disconnect", (error) => console.log(error));
  }

  const getBalance = async () => {
    await web3.eth.getBalance(addr);
  };

  return (
    <Container className="App">
      <Typography variant="h6">
        {addr ? (
          <>
            Connected Account: {addr} - {getBalance()}
          </>
        ) : (
          <>Please connect to your MetaMask account</>
        )}
      </Typography>
    </Container>
  );
};

export default App;
