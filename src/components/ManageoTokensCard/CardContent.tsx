import React from 'react';
import BigNumber from 'bignumber.js';
import Box from '@material-ui/core/Box';

import { ListItem, Divider, TxItem } from '../ActionCard';
import { parseBigNumber } from '../../utils/parse';
import { ERC20 } from '../../types';
import { Action } from './';
import { useTxStyle } from '../../hooks/useTxStyle';
import WarningCard from '../WarningCard';

interface Props {
  collateralAmount: BigNumber;
  otokenBalance: BigNumber;
  collateral: ERC20;
  redeemableCollateral: BigNumber;
  mintableOTokens: BigNumber;
  shortAmount: BigNumber;
  otoken: ERC20;
  action: Action;
}
const ManageOtokenCardContent: React.FC<Props> = ({
  collateralAmount,
  otokenBalance,
  collateral,
  redeemableCollateral,
  mintableOTokens,
  shortAmount,
  otoken,
  action,
}) => {
  const classes = useTxStyle();

  return (
    <>
      <ListItem label={'Short oTokens'} value={parseBigNumber(shortAmount, otoken.decimals)} />
      <ListItem label={'Long oTokens'} value={parseBigNumber(otokenBalance, otoken.decimals)} />
      <Divider />
      <Box className={classes.txBox}>
        <Box className={classes.txCard}>
          <TxItem label={'Total Collateral'} value={parseBigNumber(collateralAmount, collateral.decimals)} />
          <TxItem label={'Excess Collateral'} value={parseBigNumber(redeemableCollateral, collateral.decimals)} />
          <TxItem
            label={action === Action.ISSUE ? 'Issueable oTokens' : 'Burnable oTokens'}
            value={
              action === Action.ISSUE
                ? parseBigNumber(mintableOTokens, otoken.decimals)
                : parseBigNumber(otokenBalance, otoken.decimals)
            }
          />
          <Box style={{ marginTop: '8px' }}>
            <WarningCard
              warning="This is an advanced action. Please make sure you understand the implications before proceeding."
              learnMore=""
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default ManageOtokenCardContent;
