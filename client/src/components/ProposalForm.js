import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
} from "@material-ui/core";
import { getDomainType, prepareMessage } from "../utils/erc712";
import Web3 from "web3";

const useStyles = makeStyles((theme) => ({
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
    <>
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
    </>
  );
};

export default ProposalForm;
