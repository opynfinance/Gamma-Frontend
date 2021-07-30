import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import LearnMore from '../LearnMore';
import {
  europeanDescription,
  autoExerciseDescription,
  longPutCashSettleDescription,
  putCreditDescription,
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

type PutCreditProps = {
  underlying: any;
  expiry: any;
};

const PutCredit = ({ underlying, expiry }: PutCreditProps) => {
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
        Put Credit Spread
      </Typography>
      <Typography className={classes.body} variant="body2">
        {putCreditDescription}
      </Typography>
      <Typography className={classes.body} variant="body2">
        You can <LearnMore /> here.
      </Typography>
    </div>
  );
};

export default PutCredit;
