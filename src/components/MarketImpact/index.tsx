import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

import { TradeAction } from '../../utils/constants';
import { TxItem } from '../ActionCard';
import WarningCard from '../WarningCard';

type MarketImpactProps = {
  marketImpact: BigNumber;
  action: TradeAction;
};

export default function MarketImpact({ marketImpact, action }: MarketImpactProps) {
  const isError = useMemo(() => marketImpact.gte(10), [marketImpact]);

  const description = useMemo(
    () =>
      action === TradeAction.BUY
        ? `The amount you want to trade will be at a price ${marketImpact.toFixed(
            2,
          )}% higher than the best ask. Consider placing an limit order.`
        : `The amount you want to trade will be at a price ${marketImpact.toFixed(
            2,
          )}% lower than the best bid. Consider placing an limit order.`,
    [marketImpact, action],
  );

  return (
    <Typography variant="inherit">
      <Tooltip
        title="Market impact refers to the increase in the average price of a token as the size of a market order gets larger"
        placement="top"
      >
        <div>
          <TxItem label={'Market Impact'} value={`${marketImpact.toFixed(1)}%`} />
        </div>
      </Tooltip>
      {isError && <WarningCard warning={description} learnMore="" />}
    </Typography>
  );
}
