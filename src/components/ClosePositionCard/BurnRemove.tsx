import React from 'react';
import BigNumber from 'bignumber.js';
import Box from '@material-ui/core/Box';

import { OToken } from '../../types';
import { toTokenAmount } from '../../utils/calculations';
import { TxItem } from '../ActionCard';
import { useTxStyle } from '../../hooks/useTxStyle';

type BurnRemoveProps = {
  otoken: OToken;
  amount: BigNumber;
  amountCollateralToWithdraw: BigNumber;
  amountLongToWithdraw: BigNumber;
};

const BurnRemove = ({ otoken, amount, amountCollateralToWithdraw, amountLongToWithdraw }: BurnRemoveProps) => {
  const classes = useTxStyle();

  return (
    <Box className={classes.txBox}>
      <Box className={classes.txCard}>
        <TxItem label="oTokens to burn" value={toTokenAmount(amount, 8).toFixed(4)} symbol="oTokens" />
        <TxItem
          label="Collateral to redeem"
          value={toTokenAmount(amountCollateralToWithdraw, otoken.collateralAsset.decimals).toFixed(4)}
          symbol={otoken.collateralAsset.symbol}
        />
        {amountLongToWithdraw.gt(0) ? (
          <TxItem label="Long to redeem" value={toTokenAmount(amountLongToWithdraw, 8).toFixed(4)} symbol="oTokens" />
        ) : null}
      </Box>
    </Box>
  );
};

export default BurnRemove;
