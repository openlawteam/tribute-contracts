import React, { useEffect, useState } from "react";
import { Container, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import Web3 from "web3";
import Web3Modal from "web3modal";

import WalletConnectProvider from "@walletconnect/web3-provider";
import ProposalForm from "./components/ProposalForm";

const useStyles = makeStyles((theme) => ({
  app: {
    flex: 1,
    display: "inline-grid",
    maxWidth: "100%",
    justifyItems: "center",
  },
  header: {
    padding: theme.spacing(2),
  },
  content: {
    display: "inline-grid",
    maxWidth: 500,
  },
}));

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
  const classes = useStyles();
  const [provider, setProvider] = useState();
  const [web3, setWeb3] = useState(null);
  const [addr, setAddr] = useState("");

  useEffect(() => {
    web3Modal
      .connect()
      .then((p) => {
        setProvider(p);
        setWeb3(new Web3(p));
      })
      .catch((e) => console.error(e));
  }, []);

  if (provider) {
    provider.on("accountsChanged", (accounts) => setAddr(accounts[0]));
    provider.on("connect", (info) => console.log(info));
    provider.on("disconnect", (error) => console.log(error));
    provider
      .enable()
      .catch((e) => alert("Please unlock your MetaMask Account"));
  }

  return (
    <Container className={classes.app}>
      <Paper elevation={3} className={classes.header}>
        {addr ? (
          <Typography id="addrLabel" variant="h6" color="primary">
            Connected Account: {addr}
          </Typography>
        ) : (
          <Typography id="addrLabel" variant="h6" color="secondary">
            Please connect to your MetaMask account and select an account
          </Typography>
        )}
      </Paper>
      <div className={classes.content}>
        {addr && <ProposalForm addr={addr} web3={web3} provider={provider} />}
      </div>
    </Container>
  );
};

export default App;
