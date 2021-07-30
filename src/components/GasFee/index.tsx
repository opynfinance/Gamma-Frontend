import React from 'react';
import BigNumber from 'bignumber.js';
import { Typography } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';

import { ListItem } from '../ActionCard';

type GasFeeProps = {
  gasToPay: BigNumber;
  asset: string;
  action: string;
};

export default function GasFee({ gasToPay, asset, action }: GasFeeProps) {
  return (
    <Typography variant="inherit">
      <Tooltip title="Estimate amount of gas to pay to complete this transaction" placement="top">
        <ListItem label={`Est. Gas Fee to ${action} on 0x`} value={`${gasToPay.toPrecision(4)} ${asset}`} />
      </Tooltip>
    </Typography>
  );
}
