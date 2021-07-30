import React from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import { ERC20 } from '../../types';
import LearnMore from '../LearnMore';
import {
  europeanDescription,
  autoExerciseDescription,
  longPutCashSettleDescription,
  buyPutDescription,
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

type BuyPutProps = {
  underlying: ERC20;
  expiry: number;
  collateral: ERC20;
  strike: BigNumber;
};

const BuyPut = ({ underlying, expiry, collateral, strike }: BuyPutProps) => {
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
      </Typography>
      <Typography className={classes.body} variant="body2">
        {longPutCashSettleDescription(underlying)}
      </Typography>
      <Typography className={classes.lowerSubheader} variant="subtitle2">
        {' '}
        Protective Put Options
      </Typography>
      <Typography className={classes.body} variant="body2">
        {buyPutDescription(underlying, strike)}
      </Typography>
      <Typography className={classes.body} variant="body2">
        You can <LearnMore /> here.
      </Typography>
    </div>
  );
};

export default BuyPut;
