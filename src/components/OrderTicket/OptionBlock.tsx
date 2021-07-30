import React from 'react';
import BigNumber from 'bignumber.js';
import ReactGA from 'react-ga';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import ToggleSelect from '../ToggleSelect';
import { TradeAction } from '../../utils/constants';
import { toUTCDateString } from '../../utils/time';
import LearnMore from '../LearnMore';

const useStyles = makeStyles(theme => ({
  text: {
    marginTop: theme.spacing(1),
    fontWeight: theme.typography.fontWeightBold,
  },
  expiryText: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  box: {
    marginTop: theme.spacing(2),
  },
}));

type OptionBlockProps = {
  action: TradeAction;
  handleActionChange: any;
  index: number;
  strikePrice: BigNumber;
  expiry: number;
  isPut: boolean;
  showSpread?: boolean;
};

const OptionBlock = ({ strikePrice, index, handleActionChange, action, expiry, showSpread }: OptionBlockProps) => {
  const classes = useStyles();

  const handleChange = (value: TradeAction): void => {
    if (value != null) handleActionChange(value, index);
    ReactGA.event({
      category: 'Trade',
      action: `clicked${value.toUpperCase()}Button`,
    });
  };

  return (
    <Box className={classes.box}>
      <ToggleSelect
        compact={true}
        values={[TradeAction.BUY, TradeAction.SELL]}
        onChange={handleChange}
        value={action}
      />
      <Typography variant="subtitle2" className={classes.text}>
        {'$' + strikePrice.toNumber().toLocaleString()}
      </Typography>
      <Typography variant="caption" className={classes.expiryText} component="div">
        {`Expiry: ${toUTCDateString(expiry).toUpperCase()}`}
      </Typography>
      {showSpread ? (
        <Typography variant="caption" component={'div'} className={classes.expiryText}>
          To create a spread, select another option. <LearnMore h1={'spread'} highlight={false} />
        </Typography>
      ) : null}
    </Box>
  );
};

export default OptionBlock;
