import React from 'react';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import Icon from '../../img/icn-bullet.svg';
import { DashedCard } from '../Cards';
import { useWallet } from '../../hooks';

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(1.5),
      marginTop: theme.spacing(1),
      color: theme.palette.text.secondary,
    },
    header: {
      fontWeight: theme.typography.fontWeightBold,
      color: theme.palette.text.primary,
    },
    helpItem: {
      marginTop: theme.spacing(2),
      display: 'flex',
      alignItems: 'center',
    },
  }),
);

const RightNav: React.FC = () => {
  const classes = useStyles();
  const { connected } = useWallet();

  return (
    <Box className={classes.root}>
      <DashedCard variant="outlined">
        <Typography variant="caption">
          Select a bid or ask price, to populate your order card with the relevant details to acquire your position.
          <br />
          {!connected ? 'Note: you will need to connect your account to take action on an option.' : null}
        </Typography>
      </DashedCard>
      <Typography variant="caption" className={classes.helpItem}>
        Here are some definitions to help you explore which option is best for you:
      </Typography>
      <Typography variant="subtitle2" className={classes.helpItem}>
        <img src={Icon} alt="help-item" /> CALL
      </Typography>
      <Typography variant="caption">
        A call option gives the buyer the right but not the obligation to buy the underlying ERC20 at strike price.
      </Typography>
      <Typography variant="subtitle2" className={classes.helpItem}>
        <img src={Icon} alt="help-item" /> PUT
      </Typography>
      <Typography variant="caption">
        A put option gives the buyer the right but not the obligation to sell the underlying ERC20 at strike price.
      </Typography>
      <Typography variant="subtitle2" className={classes.helpItem}>
        <img src={Icon} alt="help-item" />
        BID
      </Typography>
      <Typography variant="caption">The maximum price that a buyer is willing to pay for an option.</Typography>
      <Typography variant="subtitle2" className={classes.helpItem}>
        <img src={Icon} alt="help-item" /> ASK
      </Typography>
      <Typography variant="caption">The minimum price that a seller is willing to take for a given option.</Typography>
      <Typography variant="subtitle2" className={classes.helpItem}>
        <img src={Icon} alt="help-item" /> SPREAD
      </Typography>
      <Typography variant="caption">
        Spreads enable long oTokens to collateralize short oTokens, enabling users to post the max loss of a structure
        as collateral.
      </Typography>
    </Box>
  );
};

export default RightNav;
