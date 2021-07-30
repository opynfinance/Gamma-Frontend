import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import { parseBigNumber } from '../../utils/parse';
import { OToken, ERC20 } from '../../types';
import { TxItem } from '../ActionCard';
import { redeemDescription } from '../../utils/constants/description';
import WarningCard from '../WarningCard';
import { useTxStyle } from '../../hooks/useTxStyle';

type RedeemCardContentProps = {
  payoutPerOToken: BigNumber;
  longAmount: BigNumber;
  totalPayout: BigNumber;
  otoken: OToken;
  collateralAsset: ERC20;
  isWaitingPeriod: boolean;
};

const RedeemCardContent = ({
  payoutPerOToken,
  longAmount,
  totalPayout,
  otoken,
  collateralAsset,
  isWaitingPeriod,
}: RedeemCardContentProps) => {
  const collateralAssetSymbol = useMemo(() => collateralAsset.symbol, [collateralAsset]);
  const classes = useTxStyle();

  return (
    <>
      {isWaitingPeriod ? <WarningCard warning={redeemDescription} learnMore="operations" /> : null}
      <Box className={classes.txBox}>
        <Box className={classes.txCard}>
          <Typography variant="subtitle2">TX Summary</Typography>
          <TxItem label={'oToken Balance'} value={parseBigNumber(longAmount, otoken.decimals)} symbol="oTokens" />
          <TxItem
            label={'Payout per oToken'}
            value={parseBigNumber(payoutPerOToken, otoken.collateralAsset.decimals)}
            symbol={collateralAssetSymbol}
          />
        </Box>
        <Box className={classes.txConsolidated}>
          <TxItem
            label={'Total Payout'}
            value={parseBigNumber(totalPayout, otoken.collateralAsset.decimals)}
            symbol={collateralAssetSymbol}
          />
        </Box>
      </Box>
    </>
  );
};

export default RedeemCardContent;
