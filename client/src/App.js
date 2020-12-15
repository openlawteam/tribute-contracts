import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  Paper,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import Web3 from "web3";
import Web3Modal from "web3modal";

import WalletConnectProvider from "@walletconnect/web3-provider";
import { getDomainType, prepareMessage } from "./utils/erc712";

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
  formControl: {
    margin: theme.spacing(1),
    minWidth: 450,
  },
  votingTimeSlider: {
    maringTop: theme.spacing(3),
    marginLeft: 10,
    marginRight: -15,
  },
  signButton: {
    padding: theme.spacing(1),
  },
  signature: {
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

const buildSnapshotHubMessage = (message) => {
  const addHours = (ts, hours) => {
    let date = new Date(ts * 1e3);
    date.setHours(date.getHours() + hours);
    return (date.getTime() / 1e3).toFixed();
  };
  const currentDate = new Date();
  const timestamp = (currentDate.getTime() / 1e3).toFixed();
  return {
    msg: {
      payload: {
        name: message.title,
        body: message.desc,
        choices: ["Yes", "No"],
        start: timestamp,
        end: addHours(timestamp, message.votingTime),
        snapshot: 1, //FIXME: how to we get that?
        metadata: {
          uuid: message.addr,
          private: message.private ? 1 : 0,
          type: message.category,
          subType: message.category,
        },
      },
      timestamp: timestamp,
      token: "0x8f56682a50becb1df2fb8136954f2062871bc7fc", //FIXME: what is this token?
      space: "test-space", //needs to be registered in snapshot-hub api
      type: message.type,
      version: "0.2.0", //needs to match snapshot-hub api version
      chainId: message.chainId,
      verifyingContract: message.verifyingContract,
    },
  };
};

const ProposalForm = ({ provider, web3, addr, chainId, verifyingContract }) => {
  const classes = useStyles();
  const [signature, setSignature] = useState("");
  const [message, setMessage] = useState({
    addr: addr,
    chainId: chainId,
    verifyingContract: verifyingContract,
    title: "",
    desc: "",
    category: "",
    votingTime: 1,
    private: false,
    type: "proposal",
  });

  const handleChange = (event) => {
    setMessage({ ...message, [event.target.name]: event.target.value });
  };

  const handleToggle = () => {
    setMessage({ ...message, private: !message.private });
  };

  const handleSubmit = () => {
    if (!web3) return;

    const preparedMessage = prepareMessage(
      buildSnapshotHubMessage(message, addr).msg
    );

    const signer = Web3.utils.toChecksumAddress(addr);

    const chainId = parseInt(web3.version.network, 10);

    const { DomainType, MessageType } = getDomainType(
      preparedMessage,
      verifyingContract,
      chainId
    );

    const data = JSON.stringify({
      types: MessageType,
      domain: DomainType,
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
        setSignature(result.result);
      }
    );
  };

  return (
    <div className={classes.content}>
      <FormControl className={classes.formControl}>
        <InputLabel id="categLabel">Proposal Category</InputLabel>
        <Select
          labelId="categLabel"
          id="proposalCategorySelect"
          name="category"
          value={message.category}
          onChange={handleChange}
        >
          <MenuItem value={"general"}>General</MenuItem>
          <MenuItem value={"governance"}>Governance</MenuItem>
        </Select>
      </FormControl>

      <FormControl className={classes.formControl}>
        <TextField
          id="proposalTitleInput"
          name="title"
          label="Proposal Title"
          value={message.title}
          onChange={handleChange}
          variant="outlined"
        ></TextField>
      </FormControl>

      <FormControl className={classes.formControl}>
        <TextField
          id="proposalDescInput"
          multiline
          rows={10}
          name="desc"
          label="Proposal Description"
          value={message.desc}
          onChange={handleChange}
          variant="outlined"
        ></TextField>
      </FormControl>

      <FormControl className={classes.formControl}>
        <TextField
          id="proposalVotingInput"
          name="votingTime"
          label="Voting Grace Period (hours)"
          value={message.votingTime}
          onChange={handleChange}
          variant="outlined"
        ></TextField>
      </FormControl>

      <FormControl className={classes.formControl}>
        <FormGroup aria-label="position" row>
          <FormControlLabel
            control={
              <Switch
                checked={message.private}
                value={message.private}
                id="privateProposalSwitch"
                name="private"
                color="primary"
                onChange={handleToggle}
              />
            }
            label="Only The LAO members can view this proposal"
            labelPlacement="start"
          />
        </FormGroup>
      </FormControl>

      <FormControl className={classes.formControl}>
        <Button
          id="submitBtn"
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          className={classes.submitButton}
        >
          Submit Proposal
        </Button>
      </FormControl>

      <FormControl className={classes.formControl}>
        {signature && (
          <TextField
            id="signatureLabel"
            multiline={10}
            variant="outlined"
            label="Signature"
            value={signature}
            color="primary"
            disabled
          ></TextField>
        )}
      </FormControl>
    </div>
  );
};

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
      {addr ? (
        <Paper elevation={3} className={classes.header}>
          <Typography id="addrLabel" variant="h6" color="primary">
            Connected Account: {addr}
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={3} className={classes.header}>
          <Typography id="addrLabel" variant="h6" color="secondary">
            Please connect to your MetaMask account and select an account
          </Typography>
        </Paper>
      )}
      {addr && <ProposalForm addr={addr} web3={web3} provider={provider} />}
    </Container>
  );
};

export default App;
