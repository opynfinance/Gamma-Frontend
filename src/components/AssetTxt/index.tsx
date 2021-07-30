import React, { useMemo } from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { createStyles, makeStyles } from '@material-ui/core';

import WethDark from '../../img/coins/weth-dark.svg';
import WbtcDark from '../../img/coins/wbtc-dark.svg';
import UsdcImg from '../../img/coins/usdc.svg';

const useStyles = makeStyles(theme =>
  createStyles({
    assetItem: {
      display: 'flex',
      alignItems: 'center',
    },
    tableTxt: {
      fontSize: '.7rem',
      marginLeft: '2px',
      fontWeight: theme.typography.fontWeightBold,
    },
  }),
);

export const CryptoAsset: React.FC<{ symbol: string }> = ({ symbol }) => {
  const classes = useStyles();

  const img = useMemo(() => {
    if (symbol === 'WETH') return WethDark;
    if (symbol === 'WBTC') return WbtcDark;
  }, [symbol]);

  return (
    <Box className={classes.assetItem}>
      <img src={img} alt="weth-dark" width="20" />
      <Typography className={classes.tableTxt}>{symbol}</Typography>
    </Box>
  );
};

export const USDCAmount: React.FC<{ amount: string; size?: number }> = ({ amount, size }) => {
  const classes = useStyles();

  return (
    <Box className={classes.assetItem}>
      <img src={UsdcImg} alt="weth-dark" width="20" />
      <Typography className={classes.tableTxt} style={{ fontSize: size ? `${size}rem` : '' }}>
        {amount}
      </Typography>
    </Box>
  );
};
