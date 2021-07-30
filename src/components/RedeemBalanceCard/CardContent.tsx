import React from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import { ListItem, Divider } from '../ActionCard';
import { parseBigNumber } from '../../utils/parse';
import { ERC20 } from '../../types';
import { redeemDescription } from '../../utils/constants/description';
import LearnMore from '../LearnMore';

const useStyles = makeStyles(theme => ({
  warning: {
    marginTop: 12,
    fontWeight: 500,
    marginBottom: 16,
  },
}));

type RedeemBalanceCardContentProps = {
  redeemableCollateral: BigNumber;
  collateral: ERC20;
  isWaitingPeriod: boolean;
};

const RedeemBalanceCardContent = ({
  redeemableCollateral,
  collateral,
  isWaitingPeriod,
}: RedeemBalanceCardContentProps) => {
  const classes = useStyles();
  return (
    <>
      {isWaitingPeriod ? (
        <>
          <Typography className={classes.warning}>
            {redeemDescription} <LearnMore h1="operations" />
          </Typography>
          <Divider />
        </>
      ) : null}
      <ListItem
        label={'Redeemable Balance'}
        value={parseBigNumber(redeemableCollateral, collateral.decimals) + ' ' + collateral.symbol}
      />
    </>
  );
};

export default RedeemBalanceCardContent;
