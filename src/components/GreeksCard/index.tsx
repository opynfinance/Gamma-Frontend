import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';

const useStyles = makeStyles(theme => ({
  root: {
    minWidth: 180,
    maxWidth: 275,
    marginLeft: 24,
    marginTop: 16,
    maxHeight: 208,
  },
  listItem: {
    padding: theme.spacing(0, 0),
    fontSize: 14,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: 500,
    marginLeft: 12,
  },
  typography: {
    marginRight: 12,
  },
  total: {
    fontWeight: 700,
    fontSize: 14,
  },
  divider: {
    marginTop: 6,
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    marginLeft: 12,
    marginTop: 6,
  },
  bottom: {
    padding: theme.spacing(0, 0),
    fontSize: 14,
    marginBottom: 6,
  },
}));

export default function GreeksCard() {
  const classes = useStyles();

  return (
    <Card className={classes.root} variant="outlined">
      <List disablePadding>
        <ListItem className={classes.listItem}>
          <ListItemText primary={<Typography className={classes.title}>Greeks</Typography>} />
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.listItem}>
          <Tooltip title="$ change in option premium for a $1 change in the underlying" placement="top">
            <ListItemText primary={<Typography className={classes.listItemText}>Delta</Typography>} />
          </Tooltip>
          <Typography className={classes.typography} variant="body2">
            -0.981
          </Typography>
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.listItem}>
          <Tooltip title="Change in the option delta for a $1 move in the underlying price" placement="top">
            <ListItemText primary={<Typography className={classes.listItemText}>Gamma</Typography>} />
          </Tooltip>
          <Typography className={classes.typography} variant="body2">
            -0.0017
          </Typography>
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.listItem}>
          <Tooltip title="$ change in option premium for a 1% move higher in implied volatility" placement="top">
            <ListItemText primary={<Typography className={classes.listItemText}>Vega</Typography>} />
          </Tooltip>
          <Typography className={classes.typography} variant="body2">
            {' '}
            0.0044
          </Typography>
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.listItem}>
          <Tooltip title="$ change in option premium each day" placement="top">
            <ListItemText primary={<Typography className={classes.listItemText}>Theta</Typography>} />
          </Tooltip>
          <Typography className={classes.typography} variant="body2">
            -0.1510
          </Typography>
        </ListItem>
      </List>
    </Card>
  );
}
