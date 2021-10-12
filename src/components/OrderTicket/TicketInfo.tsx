import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import Tooltip from '@material-ui/core/Tooltip';

import { TxItem } from '../ActionCard';
import { OToken } from '../../types';
import { parseBigNumber } from '../../utils/parse';
import MarketImpact from '../MarketImpact';
import ProtocolFee from '../ProtocolFee';
import { TradeAction } from '../../utils/constants';
import WarningCard from '../WarningCard';

const useStyles = makeStyles(theme => ({
  item: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 2,
    paddingBottom: 2,
  },
  txBox: {
    borderRadius: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
  txCard: {
    backgroundColor: theme.palette.background.lightStone,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(0.5, 0.5, 0, 0),
  },
  txConsolidated: {
    backgroundColor: theme.palette.background.stone,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0, 0, 0.5, 0.5),
  },
}));

type BuyInfoProps = {
  amount: BigNumber;
  totalCost: BigNumber;
  protocolFee: BigNumber;
  protocolFeeInUsdc: BigNumber;
  otoken: OToken;
  usdcBalance: BigNumber;
  underlyingBalance: BigNumber;
  otokenBalance: BigNumber;
  isMarket: boolean;
  marketImpact?: BigNumber;
  showWarning: boolean;
  estimatedGas?: BigNumber;
};
const BuyTicketInfo = ({
  underlyingBalance,
  usdcBalance,
  otokenBalance,
  amount,
  totalCost,
  protocolFee,
  protocolFeeInUsdc,
  otoken,
  isMarket,
  marketImpact,
  showWarning,
  estimatedGas,
}: BuyInfoProps) => {
  const classes = useStyles();

  const premiumToPayWithProtocolFee = new BigNumber(
    Number(parseBigNumber(totalCost, 6)) + protocolFeeInUsdc.toNumber(),
  ).precision(6);

  return (
    <>
      <Box className={classes.txBox}>
        <Box className={classes.txCard}>
          <Typography variant="subtitle2">TX Summary</Typography>
          <TxItem
            label={isMarket ? 'Est. Premium/oToken' : 'Premium/oToken'}
            value={amount.gt(0) ? parseBigNumber(totalCost.div(amount), 6) : '0'}
            symbol={'USDC'}
          />
          <TxItem
            label={isMarket ? 'Est. Total Cost' : 'Total Cost'}
            value={parseBigNumber(totalCost, 6)}
            symbol={'USDC'}
          />
          {isMarket ? (
            <>
              <MarketImpact marketImpact={marketImpact || new BigNumber(0)} action={TradeAction.BUY} />
              <ProtocolFee protocolFee={protocolFee} showWarning={showWarning} warningAction={'buy'} />
            </>
          ) : null}
          {isMarket ? (
            <TxItem label="Est. Gas to be paid" value={(estimatedGas || new BigNumber(0)).toFixed(6)} symbol={'ETH'} />
          ) : null}
        </Box>
        <Box className={classes.txConsolidated}>
          <Tooltip
            title={
              <React.Fragment>
                {isMarket ? (
                  <Typography variant="body2">
                    Total Cost includes
                    <br />
                    - Total Premium
                    <br />
                    - 0x Fee
                    <br />
                    This does not include the gas fee.
                  </Typography>
                ) : (
                  <Typography variant="body2">Total cost to pay if limit order is taken</Typography>
                )}
              </React.Fragment>
            }
          >
            <div>
              <TxItem
                label={'You pay'}
                value={isMarket ? premiumToPayWithProtocolFee.toString() : parseBigNumber(totalCost, 6)}
                symbol={'USDC'}
                showInfo
              />
            </div>
          </Tooltip>
          <TxItem label={'You Receive'} value={amount.toString()} symbol={'oTokens'} />
        </Box>
      </Box>
    </>
  );
};

type SellInfoProps = {
  amount: BigNumber;
  totalPremium: BigNumber;
  protocolFee: BigNumber;
  protocolFeeInUsdc: BigNumber;
  collateralRequired: BigNumber;
  otoken: OToken;
  usdcBalance: BigNumber;
  underlyingBalance: BigNumber;
  otokenBalance: BigNumber;
  isMarket: boolean;
  marketImpact?: BigNumber;
  showWarning: boolean;
  estimatedGas?: BigNumber;
};
const SellTicketInfo = ({
  collateralRequired,
  usdcBalance,
  underlyingBalance,
  otokenBalance,
  amount,
  totalPremium,
  protocolFee,
  protocolFeeInUsdc,
  isMarket,
  otoken,
  marketImpact,
  showWarning,
  estimatedGas,
}: SellInfoProps) => {
  const classes = useStyles();
  const collateralSymbol = otoken.collateralAsset.symbol === 'WETH' ? 'ETH' : otoken.collateralAsset.symbol;

  const premiumToReceiveWithProtocolFee = new BigNumber(
    Number(parseBigNumber(totalPremium, 6)) - protocolFeeInUsdc.toNumber(),
  ).precision(6);

  return (
    <>
      <Box className={classes.txBox}>
        <Box className={classes.txCard}>
          <Typography variant="subtitle2">TX Summary</Typography>
          <TxItem
            label={isMarket ? 'Est. Premium/oToken' : 'Premium/oToken'}
            value={amount.gt(0) ? parseBigNumber(totalPremium.div(amount), 6) : '0'}
            symbol={'USDC'}
          />
          <TxItem
            label={isMarket ? 'Est. Total to Receive' : 'Total to Receive'}
            value={parseBigNumber(totalPremium, 6)}
            symbol={'USDC'}
          />
          {isMarket ? (
            <>
              <MarketImpact marketImpact={marketImpact || new BigNumber(0)} action={TradeAction.BUY} />
              <ProtocolFee protocolFee={protocolFee} showWarning={showWarning} warningAction={'buy'} />
              {estimatedGas ? (
                <TxItem label="Est. Gas to be paid" value={estimatedGas.toFixed(6)} symbol={'ETH'} />
              ) : null}
            </>
          ) : null}
          <TxItem
            label="Collateral Required"
            value={parseBigNumber(collateralRequired, otoken.collateralAsset.decimals)}
            symbol={collateralSymbol}
          />
        </Box>
        <Box className={classes.txConsolidated}>
          <Tooltip
            title={
              <React.Fragment>
                {isMarket ? (
                  <Typography variant="body2">
                    Total to Receive includes
                    <br />
                    - Premium to receive
                    <br />
                    - Subtracts 0x Fee to pay
                    <br />
                    This does not include the gas fee.
                  </Typography>
                ) : (
                  <Typography variant="body2">Total premium to receive if limit order is taken</Typography>
                )}
              </React.Fragment>
            }
          >
            <div>
              <TxItem
                label={'You receive'}
                value={isMarket ? premiumToReceiveWithProtocolFee.toString() : parseBigNumber(totalPremium, 6)}
                symbol={'USDC'}
                showInfo
              />
            </div>
          </Tooltip>
        </Box>
      </Box>

      {isMarket && Math.sign(premiumToReceiveWithProtocolFee.toNumber()) === -1 && (
        <div style={{ marginTop: '8px' }}>
          <WarningCard
            warning={`Ox Fee (${Number(parseBigNumber(protocolFeeInUsdc, 0))} USDC ) is higher than premium to receive (
            ${Number(parseBigNumber(totalPremium, 6))} USDC ).`}
          />
        </div>
      )}
    </>
  );
};

type SpreadInfoProps = {
  amount: BigNumber;
  totalPremium: BigNumber;
  totalCost: BigNumber;
  protocolFee: BigNumber;
  protocolFeeInUsdc: BigNumber;
  longOToken: OToken;
  shortOToken: OToken;
  usdcBalance: BigNumber;
  underlyingBalance: BigNumber;
  shortOTokenBalance: BigNumber;
  longOTokenBalance: BigNumber;
  collateralRequired: BigNumber;
  showWarning: boolean;
  warningAction: 'buy' | 'sell';
  showMarketImpact?: boolean;
  marketImpact?: BigNumber;
  marketStep?: TradeAction;
  estimatedGas?: BigNumber;
};

const SpreadTicketInfo = ({
  usdcBalance,
  underlyingBalance,
  shortOTokenBalance,
  longOTokenBalance,
  amount,
  totalPremium,
  totalCost,
  protocolFee,
  protocolFeeInUsdc,
  longOToken,
  shortOToken,
  collateralRequired,
  showWarning,
  warningAction,
  showMarketImpact,
  marketImpact,
  marketStep,
  estimatedGas,
}: SpreadInfoProps) => {
  const classes = useStyles();

  const collateralSymbol = useMemo(() => {
    const symbol = shortOToken.collateralAsset.symbol;
    return symbol === 'WETH' ? 'ETH' : symbol;
  }, [shortOToken]);

  const premiumToReceiveWithProtocolFee = new BigNumber(
    Number(parseBigNumber(totalPremium.minus(totalCost), 6)) - protocolFeeInUsdc.toNumber(),
  ).precision(6);

  const premiumToPayWithProtocolFee = new BigNumber(
    Number(parseBigNumber(totalCost.minus(totalPremium), 6)) + protocolFeeInUsdc.toNumber(),
  ).precision(6);

  return (
    <List disablePadding>
      <Box className={classes.txBox}>
        <Box className={classes.txCard}>
          <TxItem
            label={'Est. Premium to pay(Long)'}
            value={amount.gt(0) ? parseBigNumber(totalCost, 6) : '0'}
            symbol={'USDC'}
          />
          <TxItem
            label={'Est. Premium to receive(Short)'}
            value={amount.gt(0) ? parseBigNumber(totalPremium, 6) : '0'}
            symbol={'USDC'}
          />
          {showMarketImpact ? (
            <MarketImpact marketImpact={marketImpact || new BigNumber(0)} action={marketStep || TradeAction.BUY} />
          ) : null}
          <ProtocolFee protocolFee={protocolFee} showWarning={showWarning} warningAction={warningAction} />
          {estimatedGas ? <TxItem label="Est. Gas to be paid" value={estimatedGas.toFixed(6)} symbol={'ETH'} /> : null}
          {collateralRequired ? (
            <TxItem
              label="Collateral Required"
              value={parseBigNumber(collateralRequired, shortOToken.collateralAsset.decimals)}
              symbol={collateralSymbol}
            />
          ) : null}
        </Box>
        <Box className={classes.txConsolidated}>
          {totalPremium.minus(totalCost).gt(0) ? (
            <Tooltip
              title={
                <React.Fragment>
                  <Typography variant="body2">
                    Total to Receive Includes
                    <br />
                    - Short premium to receive
                    <br />
                    - Subtract long premium to pay
                    <br />
                    - Subtracts 0x Fee to pay
                    <br />
                    This does not include the gas fee.
                  </Typography>
                </React.Fragment>
              }
            >
              <div>
                {' '}
                <TxItem
                  label="Net Total to Receive ℹ"
                  value={premiumToReceiveWithProtocolFee.toString()}
                  symbol={'USDC'}
                />
              </div>
            </Tooltip>
          ) : (
            <Tooltip
              title={
                <React.Fragment>
                  <Typography variant="body2">
                    Total to Pay Includes
                    <br />
                    - Short premium to receive
                    <br />
                    - Long premium to pay
                    <br />
                    - 0x Fee to pay
                    <br />
                    This does not include the gas fee.
                  </Typography>
                </React.Fragment>
              }
            >
              <div>
                {' '}
                <TxItem
                  label="Est. Net Total to Pay"
                  value={premiumToPayWithProtocolFee.toString()}
                  symbol={'USDC'}
                  showInfo
                />
              </div>
            </Tooltip>
          )}
        </Box>
      </Box>

      {totalPremium.minus(totalCost).gt(0) && Math.sign(premiumToReceiveWithProtocolFee.toNumber()) === -1 && (
        <Typography align="center" color="error" variant="body2">
          <span role="img" aria-label="warning">
            ❗️
          </span>
          Ox Fee ({Number(parseBigNumber(protocolFeeInUsdc, 0))} USDC ) is higher than premium to receive (
          {Number(parseBigNumber(totalPremium.minus(totalCost), 6))} USDC ).
        </Typography>
      )}
    </List>
  );
};

export { BuyTicketInfo, SellTicketInfo, SpreadTicketInfo };
