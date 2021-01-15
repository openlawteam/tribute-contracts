import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { Badge, Grid, Tooltip } from "@material-ui/core";
import { VoteChoices } from "@openlaw/snapshot-js-erc712";

const useStyles = makeStyles({
  root: {
    width: 270,
  },
  content: {
    height: 100,
  },
  pos: {
    marginBottom: 12,
  },
  votes: {
    margin: 10,
  },
});

const ProposalCard = ({ proposal, onNewVote }) => {
  console.log(proposal.votes);
  const classes = useStyles();
  return (
    <Card className={classes.root} variant="outlined">
      <CardContent className={classes.content}>
        <Tooltip title={"Signature: " + proposal.sig}>
          <Typography color="primary" variant="h6">
            {proposal.name}
          </Typography>
        </Tooltip>

        <Typography variant="body2" component="p">
          {proposal.body.length < 77
            ? proposal.body
            : proposal.body.substring(0, 77) + "..."}
        </Typography>
      </CardContent>
      <CardActions>
        <Grid container spacing={1}>
          <Grid item xs={3} alignItems="center" alignContent="center">
            <Badge
              badgeContent={
                proposal.votes
                  ? proposal.votes.filter((v) => v.payload.choice === 1).length
                  : 0
              }
              color="primary"
              showZero
            >
              <Button
                size="small"
                color="primary"
                onClick={() => onNewVote(VoteChoices.Yes, proposal)}
                variant="outlined"
              >
                Yes
              </Button>
            </Badge>
          </Grid>
          <Grid item xs={3}>
            <Badge
              badgeContent={
                proposal.votes
                  ? proposal.votes.filter((v) => v.payload.choice === 2).length
                  : 0
              }
              color="secondary"
              showZero
            >
              <Button
                size="small"
                color="secondary"
                onClick={() => onNewVote(VoteChoices.No, proposal)}
                variant="outlined"
              >
                No
              </Button>
            </Badge>
          </Grid>
        </Grid>
      </CardActions>
    </Card>
  );
};

export default ProposalCard;
