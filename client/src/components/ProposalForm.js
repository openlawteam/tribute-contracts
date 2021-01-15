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

const ProposalForm = ({
  loading,
  addr,
  chainId,
  verifyingContract,
  onNewProposal,
  signature,
}) => {
  const classes = useStyles();
  const [proposal, setProposal] = useState({
    addr: addr,
    chainId: chainId,
    verifyingContract: verifyingContract,
    name: "",
    body: "",
    category: "",
    actionId: "0x4539Bac77398aF6d582842F174464b29cf3887ce",
    votingTime: 1,
    private: false,
    draft: false,
    type: "proposal",
    token: "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
    space: "thelao",
    snapshot: 1,
  });

  const contracts = JSON.parse(process.env.REACT_APP_DEPLOYED_CONTRACTS) || {};

  const handleChange = (e) => {
    e.preventDefault();
    setProposal({ ...proposal, [e.target.name]: e.target.value });
  };

  const handlePrivateToggle = (e) => {
    e.preventDefault();
    setProposal({ ...proposal, private: !proposal.private });
  };

  const handleDraftToggle = (e) => {
    e.preventDefault();
    setProposal({
      ...proposal,
      draft: !proposal.draft,
      type: !proposal.draft ? "draft" : "proposal",
    });
  };

  const handleNewProposal = () => {
    onNewProposal({ ...proposal });
    setProposal({
      addr: addr,
      chainId: chainId,
      verifyingContract: verifyingContract,
      name: "",
      body: "",
      category: "",
      actionId: "0x4539Bac77398aF6d582842F174464b29cf3887ce",
      votingTime: 1,
      private: false,
      type: proposal.draft ? "draft" : "proposal",
      token: "0x8f56682a50becb1df2fb8136954f2062871bc7fc",
      space: "thelao",
      snapshot: 1,
    });
  };

  return (
    <>
      <FormControl className={classes.formControl}>
        <InputLabel id="categLabel">Proposal Category</InputLabel>
        <Select
          labelId="categLabel"
          id="proposalCategorySelect"
          name="category"
          value={proposal.category}
          onChange={handleChange}
        >
          <MenuItem value={"general"}>General</MenuItem>
          <MenuItem value={"governance"}>Governance</MenuItem>
        </Select>
      </FormControl>

      <FormControl className={classes.formControl}>
        <TextField
          id="proposalTitleInput"
          name="name"
          label="Proposal Name"
          value={proposal.name}
          onChange={handleChange}
          variant="outlined"
        ></TextField>
      </FormControl>

      <FormControl className={classes.formControl}>
        <TextField
          id="proposalDescInput"
          multiline
          rows={10}
          name="body"
          label="Proposal Description"
          value={proposal.body}
          onChange={handleChange}
          variant="outlined"
        ></TextField>
      </FormControl>

      <FormControl className={classes.formControl}>
        <TextField
          id="proposalVotingInput"
          name="votingTime"
          label="Voting Grace Period (hours)"
          value={proposal.votingTime}
          onChange={handleChange}
          variant="outlined"
        ></TextField>
      </FormControl>

      <FormControl className={classes.formControl}>
        <TextField
          id="proposalActionId"
          name="actionId"
          label="Action Id (Project Proposal)"
          value={proposal.actionId}
          onChange={handleChange}
          variant="outlined"
          disabled
        ></TextField>
      </FormControl>

      <FormControl className={classes.formControl}>
        <FormGroup aria-label="position" row>
          <FormControlLabel
            control={
              <Switch
                checked={proposal.private}
                value={proposal.private}
                id="privateProposalSwitch"
                name="private"
                color="primary"
                onChange={handlePrivateToggle}
              />
            }
            label="Only The LAO members can view this proposal"
            labelPlacement="end"
          />
        </FormGroup>
      </FormControl>

      <FormControl className={classes.formControl}>
        <FormGroup aria-label="position" row>
          <FormControlLabel
            control={
              <Switch
                checked={proposal.draft}
                value={proposal.draft}
                id="draftProposalSwitch"
                name="draft"
                color="primary"
                onChange={handleDraftToggle}
              />
            }
            label="Create as DRAFT proposal"
            labelPlacement="end"
          />
        </FormGroup>
      </FormControl>

      <FormControl className={classes.formControl}>
        <Button
          id="submitBtn"
          onClick={handleNewProposal}
          color="primary"
          variant="contained"
          className={classes.submitButton}
          disabled={loading}
        >
          Submit
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
