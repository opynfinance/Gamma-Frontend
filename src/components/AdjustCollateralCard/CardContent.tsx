import React, { useMemo } from 'react';
import Box from '@material-ui/core/Box';
import BigNumber from 'bignumber.js';

import { Divider, TxItem } from '../ActionCard';
import { parseBigNumber } from '../../utils/parse';
import { ERC20 } from '../../types';
import { Action } from './';
import { useTxStyle } from '../../hooks/useTxStyle';

type AdjustCollateralCardContentProps = {
  redeemableCollateral: BigNumber;
  collateral: ERC20;
  collateralBalance: BigNumber;
  collateralAmount: BigNumber;
  action: Action;
  amount: BigNumber;
  ethBalance: BigNumber;
};

const AdjustCollateralCardContent = ({
  redeemableCollateral,
  collateral,
  collateralBalance,
  collateralAmount,
  action,
  amount,
  ethBalance,
}: AdjustCollateralCardContentProps) => {
  const total = useMemo(() => {
    if (collateral === null) return collateralAmount;
    if (action === Action.ADD) return collateralAmount.plus(amount);
    if (action === Action.REMOVE) return collateralAmount.minus(amount);
    return new BigNumber(0);
  }, [action, amount, collateral, collateralAmount]);

  const classes = useTxStyle();

  return (
    <>
      <Box className={classes.txBox}>
        <Box className={classes.txCard}>
          <TxItem
            label={'Redeemable Collateral'}
            value={parseBigNumber(redeemableCollateral, collateral.decimals)}
            symbol={collateral.symbol}
          />
          <Divider />
          <TxItem
            label={'Existing Collateral'}
            value={parseBigNumber(collateralAmount, collateral.decimals)}
            symbol={collateral.symbol}
          />
          <TxItem
            label={`Collateral you will ${action}`}
            value={parseBigNumber(amount, collateral.decimals)}
            symbol={collateral.symbol}
          />
        </Box>
        <Box className={classes.txConsolidated}>
          <TxItem label="Result" value={parseBigNumber(total, collateral.decimals)} symbol={collateral.symbol} />
        </Box>
      </Box>
    </>
  );
};

export default AdjustCollateralCardContent;
