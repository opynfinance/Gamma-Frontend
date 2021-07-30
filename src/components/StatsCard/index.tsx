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
    minWidth: 275,
    maxWidth: 275,
    marginLeft: 24,
    marginTop: 16,
    maxHeight: 252,
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
  grayType: {
    marginRight: 12,
    color: '#BDBDBD',
  },
}));

export default function StatsCard() {
  const classes = useStyles();

  return (
    <Card className={classes.root} variant="outlined">
      <List disablePadding>
        <ListItem className={classes.listItem}>
          <ListItemText primary={<Typography className={classes.title}>Stats</Typography>} />
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.listItem}>
          <Tooltip title="Open Interest (OI) is the total number of available options" placement="top">
            <ListItemText primary={<Typography className={classes.listItemText}>Open Interest</Typography>} />
          </Tooltip>
          <Typography className={classes.typography} variant="body2">
            845 options
          </Typography>
          <Typography className={classes.grayType} variant="body2">
            $762k
          </Typography>
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.listItem}>
          <Tooltip
            title="Daily notional volume. Notional is (option * price of underlying asset at time of trade)."
            placement="top"
          >
            <ListItemText primary={<Typography className={classes.listItemText}>Volume</Typography>} />
          </Tooltip>
          <Typography className={classes.typography} variant="body2">
            425 options
          </Typography>
          <Typography className={classes.grayType} variant="body2">
            $356k
          </Typography>
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.listItem}>
          <Tooltip title="Implied Volatility (IV) is a market forecast of option price movement" placement="top">
            <ListItemText primary={<Typography className={classes.listItemText}>Implied Volatility</Typography>} />
          </Tooltip>
          <Typography className={classes.typography} variant="body2">
            56.72%
          </Typography>
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.listItem}>
          <ListItemText primary={<Typography className={classes.listItemText}>24hr High</Typography>} />
          <Typography className={classes.typography} variant="body2">
            $12.56
          </Typography>
        </ListItem>
        <Divider className={classes.divider} />
        <ListItem className={classes.bottom}>
          <ListItemText primary={<Typography className={classes.listItemText}>24hr Low</Typography>} />
          <Typography className={classes.typography} variant="body2">
            $9.13
          </Typography>
        </ListItem>
      </List>
    </Card>
  );
}
