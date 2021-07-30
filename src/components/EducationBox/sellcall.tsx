import React from 'react';
import { BigNumber } from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import LearnMore from '../LearnMore';
import { ERC20 } from '../../types';
import {
  europeanDescription,
  autoExerciseDescription,
  shortCashSettleDescription,
  sellCallDescription,
} from '../../utils/constants/description';

const useStyles = makeStyles(theme => ({
  subheader: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  lowerSubheader: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 12,
  },
  body: {
    maxWidth: 275,
    marginTop: 12,
    color: '#828282',
    fontSize: 14,
  },
}));

type SellCallProps = {
  underlying: ERC20;
  expiry: any;
  collateral: ERC20;
  strike: BigNumber;
};

const SellCall = ({ underlying, expiry, collateral, strike }: SellCallProps) => {
  const classes = useStyles();

  return (
    <div>
      <Typography className={classes.subheader} variant="subtitle2">
        Exercise
      </Typography>
      <Typography className={classes.body} variant="body2">
        {europeanDescription}
      </Typography>
      <Typography className={classes.body} variant="body2">
        {autoExerciseDescription}
        <LearnMore />
      </Typography>
      <Typography className={classes.body} variant="body2">
        {shortCashSettleDescription(collateral, underlying)}
      </Typography>
      <Typography className={classes.lowerSubheader} variant="subtitle2">
        {' '}
        Sell Call Option
      </Typography>
      <Typography className={classes.body} variant="body2">
        {sellCallDescription(underlying, collateral, strike)}
      </Typography>
      <Typography className={classes.body} variant="body2">
        You can <LearnMore /> here.
      </Typography>
    </div>
  );
};

export default SellCall;
