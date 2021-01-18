import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { Grid, Tooltip } from "@material-ui/core";

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

const DraftCard = ({ draft, onSponsor }) => {
  const classes = useStyles();
  return (
    <Card className={classes.root} variant="outlined">
      <CardContent className={classes.content}>
        <Tooltip title={"Signature: " + draft.sig}>
          <Typography color="primary" variant="h6">
            Draft: {draft.name}
          </Typography>
        </Tooltip>

        <Typography variant="body2" component="p">
          {draft.body.length < 77
            ? draft.body
            : draft.body.substring(0, 77) + "..."}
        </Typography>
      </CardContent>
      <CardActions>
        <Grid container spacing={1}>
          <Grid item xs={3} alignItems="center" alignContent="center">
            <Button
              size="small"
              color="primary"
              onClick={() => onSponsor(draft)}
              variant="outlined"
            >
              Sponsor
            </Button>
          </Grid>
        </Grid>
      </CardActions>
    </Card>
  );
};

export default DraftCard;
