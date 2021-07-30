import React from 'react';
import Card from '@material-ui/core/Card';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { createStyles, makeStyles } from '@material-ui/core/styles';

import Ethereum from '../../img/coins/ethereum.svg';
import Usdc from '../../img/coins/usdc.svg';
import Wbtc from '../../img/coins/wbtc.svg';
import WethDark from '../../img/coins/weth-dark.svg';
import WbtcDark from '../../img/coins/wbtc-dark.svg';
import { useTokenBalance, useTokenPrice, useWallet } from '../../hooks';
import { parseBigNumber } from '../../utils/parse';
import { USDC_ADDRESS, WBTC_ADDRESS, WETH_ADDRESS } from '../../utils/constants';

const useStyles = makeStyles(theme =>
  createStyles({
    assetCard: {
      padding: theme.spacing(1),
      [theme.breakpoints.down('md')]: {
        padding: theme.spacing(1, 3),
      },
    },
    assetTitle: {
      fontWeight: theme.typography.fontWeightBold,
    },
    coinPriceItem: {
      marginTop: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
      [theme.breakpoints.down('md')]: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(1, 1),
      },
    },
    coin: {
      display: 'flex',
      width: '5rem',
    },
    coinImg: {
      height: '17px',
      width: '17px',
    },
    coinName: {
      marginLeft: theme.spacing(1),
    },
    coinPrice: {
      marginLeft: theme.spacing(1),
    },
    currentAssetCard: {
      minWidth: '20rem',
      padding: theme.spacing(1),
    },
    assetItem: {
      marginTop: theme.spacing(1),
    },
    priceItem: {
      display: 'flex',
      alignItems: 'center',
    },
    priceText: {
      fontWeight: theme.typography.fontWeightBold,
      marginLeft: theme.spacing(1),
    },
    priceImg: {
      height: '22px',
      width: '22px',
    },
    priceCaption: {
      color: theme.palette.text.secondary,
    },
  }),
);

export default function AssetCard() {
  const classes = useStyles();
  const { ethBalance, networkId, address } = useWallet();
  const wbtcBalance = useTokenBalance(WBTC_ADDRESS[networkId], address);
  const usdcBalance = useTokenBalance(USDC_ADDRESS[networkId], address);

  return (
    <Card className={classes.assetCard}>
      <Typography variant="subtitle1" className={classes.assetTitle}>
        Crypto Assets
      </Typography>
      <Box>
        <Box className={classes.coinPriceItem}>
          <Box className={classes.coin}>
            <img src={Usdc} alt="usdc" className={classes.coinImg} />
            <Typography variant="body2" className={classes.coinName}>
              USDC
            </Typography>
          </Box>
          <Typography variant="body2" className={classes.coinPrice}>
            {parseBigNumber(usdcBalance, 6)}
          </Typography>
        </Box>
        <Box className={classes.coinPriceItem}>
          <Box className={classes.coin}>
            <img src={Ethereum} alt="ethereum" className={classes.coinImg} />
            <Typography variant="body2" className={classes.coinName}>
              ETH
            </Typography>
          </Box>
          <Typography variant="body2" className={classes.coinPrice}>
            {parseBigNumber(ethBalance, 18)}
          </Typography>
        </Box>
        <Box className={classes.coinPriceItem}>
          <Box className={classes.coin}>
            <img src={Wbtc} alt="wbtc" className={classes.coinImg} />
            <Typography variant="body2" className={classes.coinName}>
              WBTC
            </Typography>
          </Box>
          <Typography variant="body2" className={classes.coinPrice}>
            {parseBigNumber(wbtcBalance, 8)}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

export const CurrentPrices: React.FC = () => {
  const classes = useStyles();
  const { networkId } = useWallet();
  const ethPrice = useTokenPrice(WETH_ADDRESS[networkId], 60);
  const btcPrice = useTokenPrice(WBTC_ADDRESS[networkId], 60);

  return (
    <Card className={classes.currentAssetCard}>
      <Typography variant="subtitle1" className={classes.assetTitle}>
        Current Asset Prices
      </Typography>
      <Box className={classes.assetItem}>
        <div className={classes.priceItem}>
          <img src={WethDark} alt="ethereum" className={classes.priceImg} />
          <Typography className={classes.priceText}>$ {parseFloat(ethPrice.toFixed(4)).toLocaleString()}</Typography>
        </div>
        <Typography variant="caption" className={classes.priceCaption}>
          Current price of ETH in USD
        </Typography>
        <div className={classes.priceItem} style={{ marginTop: '12px' }}>
          <img src={WbtcDark} alt="ethereum" className={classes.priceImg} />
          <Typography className={classes.priceText}>$ {parseFloat(btcPrice.toFixed(2)).toLocaleString()}</Typography>
        </div>
        <Typography variant="caption" className={classes.priceCaption}>
          Current price of WBTC in USD
        </Typography>
      </Box>
    </Card>
  );
};
