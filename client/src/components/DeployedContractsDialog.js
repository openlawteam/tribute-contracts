import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import { blue } from "@material-ui/core/colors";
import { AccountTree, FileCopy, InsertDriveFile } from "@material-ui/icons";
import { Tooltip, Typography } from "@material-ui/core";

const useStyles = makeStyles({
  avatar: {
    backgroundColor: blue[100],
    color: blue[600],
  },
});

const DeployedContractsDialog = ({ isOpen, onClose }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(isOpen);
  const contracts = JSON.parse(process.env.REACT_APP_DEPLOYED_CONTRACTS) || {
    daoFactory: "not deployed",
    identityDao: "not deployed",
    flagHelperLib: "not deployed",
    adapters: {
      voting: "not deployed",
      onboarding: "not deployed",
      financing: "not deployed",
      managing: "not deployed",
      ragequit: "not deployed",
      guildkick: "not deployed",
      configuration: "not deployed",
    },
  };
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleListItemClick = (value) => {
    setCopied(true);
    navigator.clipboard.writeText(value);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="simple-dialog-title"
      open={open}
    >
      <DialogTitle id="simple-dialog-title">Deployed Contracts</DialogTitle>
      <List>
        <ListItem
          button
          onClick={() => handleListItemClick(contracts.identityDao)}
          key={Math.random()}
        >
          <ListItemAvatar>
            <Avatar className={classes.avatar}>
              <InsertDriveFile />
            </Avatar>
          </ListItemAvatar>
          <Tooltip title="Click to copy the contract address">
            <ListItemText
              primary="Identity DAO"
              secondary={contracts.identityDao}
            />
          </Tooltip>
        </ListItem>

        <ListItem
          button
          onClick={() => handleListItemClick(contracts.daoFactory)}
          key={Math.random()}
        >
          <ListItemAvatar>
            <Avatar className={classes.avatar}>
              <FileCopy />
            </Avatar>
          </ListItemAvatar>
          <Tooltip title="Click to copy the contract address">
            <ListItemText
              primary="DAO Factory"
              secondary={contracts.daoFactory}
            />
          </Tooltip>
        </ListItem>

        {Object.keys(contracts.adapters).map((key) => (
          <ListItem
            button
            onClick={() => handleListItemClick(contracts.adapters[key])}
            key={Math.random()}
          >
            <ListItemAvatar>
              <Avatar className={classes.avatar}>
                <AccountTree />
              </Avatar>
            </ListItemAvatar>
            <Tooltip title="Click to copy the contract address">
              <ListItemText
                primary={key + " adapter"}
                secondary={contracts.adapters[key]}
              />
            </Tooltip>
          </ListItem>
        ))}
        <ListItem>
          <div style={{ textAlign: "center", width: "100%", height: 20 }}>
            {copied && <Typography variant="h6">Copied</Typography>}
          </div>
        </ListItem>
      </List>
    </Dialog>
  );
};
export default DeployedContractsDialog;
