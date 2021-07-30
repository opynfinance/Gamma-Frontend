import React from 'react';
import BigNumber from 'bignumber.js';
import Typography from '@material-ui/core/Typography';

import TxItem from '../ActionCard/TxItem';
import WarningCard from '../WarningCard';

type ProtocolFeeProps = {
  protocolFee: BigNumber; // denominated in ETH
  showWarning: boolean;
  warningAction: 'sell' | 'buy';
};

export default function ProtocolFee({ protocolFee, showWarning, warningAction }: ProtocolFeeProps) {
  return (
    <>
      <Typography variant="inherit">
        <TxItem label={'0x Protocol Fee'} value={protocolFee.toFixed(5)} symbol="ETH" />
      </Typography>
      {showWarning && (
        <div style={{ marginTop: '8px' }}>
          <WarningCard warning="Do not change the gas price, otherwise the transaction will fail." />
        </div>
      )}
    </>
  );
}
