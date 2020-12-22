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
    title: "",
    desc: "",
    category: "",
    votingTime: 1,
    private: false,
    type: "proposal",
  });

  const handleChange = (event) => {
    setProposal({ ...proposal, [event.target.name]: event.target.value });
  };

  const handleToggle = () => {
    setProposal({ ...proposal, private: !proposal.private });
  };

  const handleNewProposal = () => {
    onNewProposal({ ...proposal });
    setProposal({
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
          name="title"
          label="Proposal Title"
          value={proposal.title}
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
          value={proposal.desc}
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
        <FormGroup aria-label="position" row>
          <FormControlLabel
            control={
              <Switch
                checked={proposal.private}
                value={proposal.private}
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
          onClick={handleNewProposal}
          color="primary"
          variant="contained"
          className={classes.submitButton}
          disabled={loading}
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
