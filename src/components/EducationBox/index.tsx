import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import BuyPut from './buyput';
import SellPut from './sellput';
import BuyCall from './buycall';
import SellCall from './sellcall';
import PutDebit from './putdebit';
import PutCredit from './putcredit';
import CallDebit from './calldebit';
import CallCredit from './callcredit';
import { ERC20, OToken } from '../../types';
import { TradeAction } from '../../utils/constants/enums';

const useStyles = makeStyles(theme => ({
  root: {
    minWidth: 300,
    maxWidth: 300,
    minHeight: 500,
  },
  title: {
    fontSize: '1em',
    marginTop: 12,
    marginLeft: 12,
    marginBottom: 4,
    fontWeight: 600,
  },
  body: {
    maxWidth: 275,
    marginTop: 16,
    color: '#828282',
    fontSize: 14,
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
}));

type EducationBoxProps = {
  underlying: ERC20;
  collateral: ERC20;
  expiry: number;
  type: any;
  action: any;
  selectedOTokens: OToken[];
};

const EducationBox = ({ underlying, collateral, expiry, type, action, selectedOTokens }: EducationBoxProps) => {
  const classes = useStyles();

  function showPosition(): any {
    if (selectedOTokens.length === 1 && type && action === TradeAction.BUY) {
      return (
        <BuyPut
          underlying={underlying}
          expiry={expiry}
          collateral={collateral}
          strike={selectedOTokens[0].strikePrice}
        />
      );
    } else if (selectedOTokens.length === 1 && type && action === TradeAction.SELL) {
      return (
        <SellPut
          underlying={underlying}
          expiry={expiry}
          collateral={collateral}
          strike={selectedOTokens[0].strikePrice}
        />
      );
    } else if (selectedOTokens.length === 1 && !type && action === TradeAction.BUY) {
      return (
        <BuyCall
          underlying={underlying}
          expiry={expiry}
          collateral={collateral}
          strike={selectedOTokens[0].strikePrice}
        />
      );
    } else if (selectedOTokens.length === 1 && !type && action === TradeAction.SELL) {
      return (
        <SellCall
          underlying={underlying}
          expiry={expiry}
          collateral={collateral}
          strike={selectedOTokens[0].strikePrice}
        />
      );
    } else if (selectedOTokens.length === 2 && type && action === TradeAction.SELL) {
      return <PutDebit underlying={underlying} expiry={expiry} />;
    } else if (selectedOTokens.length === 2 && type && action === TradeAction.BUY) {
      return <PutCredit underlying={underlying} expiry={expiry} />;
    } else if (selectedOTokens.length === 2 && !type && action === TradeAction.BUY) {
      return <CallDebit underlying={underlying} expiry={expiry} />;
    } else if (selectedOTokens.length === 2 && !type && action === TradeAction.SELL) {
      return <CallCredit underlying={underlying} expiry={expiry} />;
    }
  }

  return (
    <Card className={classes.root} variant="outlined">
      {/* <Grid container alignItems={'stretch'} direction="row"> */}
      <Typography className={classes.title}>Details</Typography> <Divider />
      <CardContent>
        {selectedOTokens.length > 0 ? (
          showPosition()
        ) : (
          <Typography className={classes.body}> Please select an option</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default EducationBox;
