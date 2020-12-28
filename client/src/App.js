import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import Web3 from "web3";
import Web3Modal from "web3modal";

import WalletConnectProvider from "@walletconnect/web3-provider";
import ProposalForm from "./components/ProposalForm";
import ProposalCard from "./components/ProposalCard";
import DeployedContractsDialog from "./components/DeployedContractsDialog";

import { getApiStatus } from "./services/snapshot-hub";

import { getDomainDefinition, prepareMessage } from "./utils/erc712v2";
import {
  buildSnapshotHubProposalMessage,
  buildSnapshotHubVoteMessage,
} from "./utils/snapshot-hub";
import { submit } from "./services/snapshot-hub";

const useStyles = makeStyles((theme) => ({
  app: {
    flex: 1,
    display: "inline-grid",
    maxWidth: "100%",
    justifyItems: "center",
  },
  status: {
    position: "absolute",
    marginTop: 0,
    marginLeft: 0,
  },
  header: {
    padding: theme.spacing(2),
    textAlign: "center",
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

const Header = ({ apiStatus, addr, onConnect, showContracts }) => {
  const classes = useStyles();

  return (
    <>
      <Paper elevation={3} className={classes.header}>
        {addr ? (
          <div style={{ textAlign: "center" }}>
            <Typography id="addrLabel" variant="body1" color="primary">
              Connected Account: {addr}
            </Typography>
            <Typography id="addrLabel" variant="body2">
              Snapshot Hub API:{" "}
              {apiStatus ? JSON.stringify(apiStatus) : "api is down"}
            </Typography>
            <Button color="primary" variant="outlined" onClick={showContracts}>
              Deployed Contracts
            </Button>
          </div>
        ) : (
          <>
            <Typography id="addrLabel" variant="h6" color="secondary">
              Please connect to your MetaMask and select an account
            </Typography>
            <Button color="primary" onClick={onConnect}>
              Connect
            </Button>
          </>
        )}
      </Paper>
    </>
  );
};

const App = () => {
  const classes = useStyles();
  const [provider, setProvider] = useState();
  const [web3, setWeb3] = useState(null);
  const [addr, setAddr] = useState("");
  const [apiStatus, setApiStatus] = useState();
  const [chainId, setChainId] = useState();
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [showContracts, setShowContracts] = useState(false);
  const [votes, setVotes] = useState({});
  const [verifyingContract, setVerifyingContract] = useState(
    "0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05" //TODO load it from the deployed test contract
  );

  const connect = async () => {
    const p = await web3Modal.connect();
    setProvider(p);
    const w3 = new Web3(p);
    setWeb3(w3);
    const accounts = await w3.eth.getAccounts();
    setAddr(accounts[0]);
  };

  const checkApiStatus = async () => {
    const resp = await getApiStatus();
    const data = resp.data;
    console.log(data);
    setApiStatus(data);
  };

  useEffect(() => {
    checkApiStatus();
    setInterval(checkApiStatus, 50000);
  }, []);

  if (provider) {
    provider.on("accountsChanged", (accounts) => setAddr(accounts[0]));
    provider.on("connect", (info) => setChainId(info.chainId));
    provider.on("chainChanged", (chainId) => setChainId(chainId));
    provider.on("disconnect", (error) => console.log(error));
    provider
      .enable()
      .catch((e) => alert("Please unlock your MetaMask Account"));
  }

  const handleProposalSubmit = async (proposal) => {
    if (!web3) return;

    const cid = await web3.eth.net.getId();

    const preparedMessage = prepareMessage(
      buildSnapshotHubProposalMessage(proposal, cid).msg
    );

    const signer = Web3.utils.toChecksumAddress(addr);

    const { domain, types } = getDomainDefinition(
      preparedMessage,
      verifyingContract,
      proposal.actionId,
      cid
    );

    const data = JSON.stringify({
      types: types,
      domain: domain,
      primaryType: "Message",
      message: preparedMessage,
    });

    provider.sendAsync(
      {
        method: "eth_signTypedData_v4",
        params: [signer, data],
        from: signer,
      },
      (err, result) => {
        if (err || result.error) {
          console.error(err);
          return alert(result.error.message);
        }
        const newSignature = result.result;
        setSignature(newSignature);
        setLoading(true);
        submit(addr, preparedMessage, newSignature)
          .then((resp) => {
            const ipfsHash = resp.data.ipfsHash;
            proposal["ipfsHash"] = ipfsHash;
            proposal["sig"] = newSignature;
            setProposals([...proposals, proposal]);
            setLoading(false);
            setSignature("");
          })
          .catch((e) => {
            setLoading(false);
            if (e.response && e.response.data) {
              alert(
                e.response.data.error + ": " + e.response.data.error_description
              );
            }
          });
      }
    );
  };

  const handleVoteSubmit = async (vote, proposal) => {
    if (!web3) return;

    const cid = await web3.eth.net.getId();

    const preparedMessage = prepareMessage(
      buildSnapshotHubVoteMessage(vote, proposal, addr, cid).msg
    );

    const signer = Web3.utils.toChecksumAddress(addr);

    const { domain, types } = getDomainDefinition(
      preparedMessage,
      verifyingContract,
      proposal.actionId,
      cid
    );

    const data = JSON.stringify({
      types: types,
      domain: domain,
      primaryType: "Message",
      message: preparedMessage,
    });

    provider.sendAsync(
      {
        method: "eth_signTypedData_v4",
        params: [signer, data],
        from: signer,
      },
      (err, result) => {
        if (err || result.error) {
          console.error(err);
          alert(err);
          return alert(result.error.message);
        }
        const newSignature = result.result;
        setSignature(newSignature);
        setLoading(true);
        submit(addr, preparedMessage, newSignature)
          .then((resp) => {
            const v = {
              ...preparedMessage,
              ipfsHash: resp.data.ipfsHash,
              proposalId: proposal.ipfsHash,
              proposalTitle: proposal.title,
              sig: newSignature,
            };
            setProposals(
              proposals
                .filter((p) => p.ipfsHash === proposal.ipfsHash)
                .map((p) => {
                  return { ...p, votes: p.votes ? [...p.votes, v] : [v] };
                })
            );
            setLoading(false);
            setSignature("");
          })
          .catch((e) => {
            setLoading(false);
            if (e.response && e.response.data) {
              alert(
                e.response.data.error + ": " + e.response.data.error_description
              );
            }
          });
      }
    );
  };

  return (
    <Container className={classes.app}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {loading && <LinearProgress />}
          <Header
            addr={addr}
            onConnect={connect}
            apiStatus={apiStatus}
            loading={loading}
            showContracts={() => setShowContracts(true)}
          />
        </Grid>
        <Grid item xs={3}>
          {addr && (
            <>
              <ProposalForm
                loading={loading}
                provider={provider}
                chainId={chainId}
                verifyingContract={verifyingContract}
                onNewProposal={handleProposalSubmit}
                signature={signature}
              />
              <Grid container direction="row">
                {proposals.map((p) => (
                  <Grid item xs={3} key={Math.random()}>
                    <ProposalCard proposal={p} onNewVote={handleVoteSubmit} />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
      {showContracts && (
        <DeployedContractsDialog
          isOpen={showContracts}
          onClose={() => setShowContracts(false)}
        />
      )}
    </Container>
  );
};

export default App;
