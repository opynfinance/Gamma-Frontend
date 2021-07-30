import React from 'react';
import BigNumber from 'bignumber.js';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

import { toTokenAmount } from '../../utils/calculations';
import { TxItem } from '../ActionCard';
import ProtocolFee from '../ProtocolFee';
import MarketImpact from '../MarketImpact';
// import GasFee from '../GasFee';
import { TradeAction } from '../../utils/constants';
import { useTxStyle } from '../../hooks/useTxStyle';
import { parseBigNumber } from '../../utils/parse';

type BuyBackProps = {
  amount: BigNumber;
  cost: BigNumber;
  isLoadingOrderbook: boolean;
  orderBookOfThisToken: any;
  protocolFee: BigNumber;
  marketImpact: BigNumber;
  protocolFeeInUsdc: BigNumber;
};

const BuyBack = ({ amount, cost, protocolFee, marketImpact, isLoadingOrderbook, protocolFeeInUsdc }: BuyBackProps) => {
  const txClasses = useTxStyle();

  const premiumToPayWithProtocolFee = new BigNumber(
    Number(parseBigNumber(cost, 6)) + protocolFeeInUsdc.toNumber(),
  ).precision(6);

  return (
    <Box className={txClasses.txBox}>
      <Box className={txClasses.txCard}>
        <Typography variant="subtitle2">TX Summary</Typography>
        <TxItem label="oTokens to buy back" value={toTokenAmount(amount, 8).toFixed(4)} symbol="oTokens" />
        <TxItem
          label="Cost"
          value={!isLoadingOrderbook ? toTokenAmount(cost, 6).toFixed(4) : new BigNumber(0).toFixed(4)}
          symbol="USDC"
        />
        <ProtocolFee
          protocolFee={protocolFee}
          // useWeth={useWeth}
          // setUseWeth={setUseWeth}
          showWarning={true}
          warningAction={'buy'}
        />
        {/* <GasFee gasToPay={gasToPay} asset={'ETH'} action={'buy'} /> */}
        <MarketImpact marketImpact={marketImpact} action={TradeAction.BUY} />
      </Box>
      <Box className={txClasses.txConsolidated}>
        <Tooltip
          title={
            <React.Fragment>
              <Typography variant="body2">
                Total Cost includes
                <br />
                - Total Premium
                <br />
                - 0x Fee
                <br />
                This does not include the gas fee.
              </Typography>
            </React.Fragment>
          }
        >
          <div>
            <TxItem label={'You pay'} value={premiumToPayWithProtocolFee.toString()} symbol={'USDC'} />
          </div>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default BuyBack;
