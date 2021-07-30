import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import Checkbox from '@material-ui/core/Checkbox';
import clsx from 'clsx';

import { ActivePositionWithPNL, Position, ClosedPosition } from '../../types';
import { TradePosition, VaultType } from '../../utils/constants';
import { CryptoAsset, USDCAmount } from '../AssetTxt';
import { toUTCDateString } from '../../utils/time';
import { getPositionSize, getPositionStrike } from './activepositions';
import { getSettlementString } from './closedpositions';
import { parseReturnColor } from './colorUtil';
import { toTokenAmount } from '../../utils/calculations';
import { MyOrder } from '../../hooks/useMyOrders';
import Timer from '../Timer';
import PositionDetail from '../PositionDetail';

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(1),
      margin: theme.spacing(1, 0),
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: '.7rem',
      fontWeight: theme.typography.fontWeightBold,
    },
    txtGreen: {
      color: theme.palette.success.main,
    },
    txtRed: {
      color: theme.palette.error.main,
    },
    detailsBox: {
      marginTop: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    detailLabel: {
      fontSize: '.7rem',
    },
    dot: {
      borderRadius: '50%',
      height: '5px',
      width: '5px',
      backgroundColor: theme.palette.text.primary,
      margin: theme.spacing(0, 0.7),
    },
    strikeBox: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing(2),
    },
    priceLabel: {
      color: theme.palette.text.secondary,
      fontWeight: theme.typography.fontWeightBold,
    },
    footer: {
      marginTop: theme.spacing(1),
      display: 'flex',
      justifyContent: 'space-between',
    },
    limitFooter: {
      marginTop: theme.spacing(1),
      display: 'flex',
      justifyContent: 'space-around',
    },
    headerItem: {
      display: 'flex',
      alignItems: 'center',
    },
    expandButton: {
      padding: 0,
      backgroundColor: 'transparent',
      transition: 'none',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
    positionDetail: {
      marginTop: theme.spacing(1),
    },
  }),
);

type MobilePositionProps = {
  position: Position | ActivePositionWithPNL | ClosedPosition;
  untraded?: boolean;
  closed?: boolean;
  selected?: boolean;
  onExpand?: () => void;
};

export const MobilePosition: React.FC<MobilePositionProps> = ({ position, untraded, closed, selected, onExpand }) => {
  const classes = useStyles();
  const profit = useMemo(() => (position as ActivePositionWithPNL).profit?.toFixed(2) || new BigNumber(0).toFixed(2), [
    position,
  ]);
  const closedPremium = useMemo(
    () => (position as ClosedPosition).initialPremium?.plus((position as ClosedPosition).closedPremium).toFixed(2),
    [position],
  );

  const Dot = () => <div className={classes.dot} />;

  return (
    <Card className={classes.root}>
      <Box className={classes.header}>
        <Typography
          className={clsx(classes.title, position.type === TradePosition.Short ? classes.txtRed : classes.txtGreen)}
        >
          {untraded ? 'Untraded' : position.type} {position.isPut ? 'Put' : 'Call'}
        </Typography>
        <IconButton onClick={onExpand} className={classes.expandButton}>
          {selected ? (
            <ExpandLessIcon color="primary" fontSize="small" />
          ) : (
            <ExpandMoreIcon color="primary" fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Box className={classes.detailsBox}>
        <CryptoAsset symbol={position.underlying.symbol} />
        <Dot />
        <Typography component="div" className={classes.detailLabel}>
          {toUTCDateString(position.expiry)}
        </Typography>
        <Dot />
        <Typography component="div" className={classes.detailLabel}>
          Amount {getPositionSize(position)}
        </Typography>
        {position.type === TradePosition.Short ? (
          <>
            <Dot />
            <Typography component="div" className={classes.detailLabel}>
              {position.vaultType === VaultType.FULLY_COLLATERALIZED
                ? 'Fully collateralized'
                : 'Partially collateralized'}
            </Typography>
          </>
        ) : null}
      </Box>
      <Box className={classes.strikeBox}>
        <Box>
          <Typography className={classes.priceLabel} variant="caption">
            Strike
          </Typography>
          <USDCAmount amount={getPositionStrike(position)} size={1.5} />
        </Box>
        <Box>
          <Typography className={classes.priceLabel} variant="caption">
            Total Return
          </Typography>
          <Typography style={{ fontSize: '1.5rem' }} color={parseReturnColor(profit)}>
            ${profit}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <Box className={classes.footer}>
        <Box>
          <Typography className={classes.priceLabel} variant="caption">
            Initial Premium
          </Typography>
          <Typography variant="body2">
            ${(position as ActivePositionWithPNL).initialPremium?.toFixed(2) || '0.00'}
          </Typography>
        </Box>
        {closed ? (
          <Box>
            <Typography className={classes.priceLabel} variant="caption">
              Closed Premium
            </Typography>
            <Typography variant="body2">${closedPremium}</Typography>
          </Box>
        ) : (
          <Box>
            <Typography className={classes.priceLabel} variant="caption">
              Current Premium
            </Typography>
            <Typography variant="body2">
              ${(position as ActivePositionWithPNL).currentPremium?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        )}
        {closed ? (
          <Box>
            <Typography className={classes.priceLabel} variant="caption">
              Settlement
            </Typography>
            <Typography variant="body2">{getSettlementString(position as ClosedPosition)}</Typography>
          </Box>
        ) : (
          <Box>
            <Typography className={classes.priceLabel} variant="caption">
              Collateral
            </Typography>
            <Typography variant="body2">{getCollateralString(position)}</Typography>
          </Box>
        )}
      </Box>
      {!closed ? (
        <Collapse in={selected} timeout="auto" unmountOnExit>
          <Box className={classes.positionDetail}>
            <Divider />
            <PositionDetail
              deselectPosition={() => console.log('')}
              navigateToClosedPositions={() => console.log('')}
              position={position}
              untraded={untraded}
            />
          </Box>
        </Collapse>
      ) : null}
    </Card>
  );
};

type LimitOrderProps = {
  order: MyOrder;
  selected: boolean;
  onSelect: () => void;
};

export const MobileLimitOrder: React.FC<LimitOrderProps> = ({ order, selected, onSelect }) => {
  const classes = useStyles();
  const isOutstanding = useMemo(
    () =>
      new BigNumber(order.order.order.takerAmount).isEqualTo(
        new BigNumber(order.order.metaData.remainingFillableTakerAmount),
      ),
    [order.order.metaData.remainingFillableTakerAmount, order.order.order.takerAmount],
  );

  const Dot = () => <div className={classes.dot} />;

  return (
    <Card className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.headerItem}>
          <Checkbox checked={selected} color="primary" onClick={onSelect} />
          <Typography className={clsx(classes.title, order.type === 1 ? classes.txtGreen : classes.txtRed)}>
            {`${order.type === 1 ? 'Bid' : 'Ask'} ${order?.oToken?.isPut ? 'Put' : 'Call'}`}
          </Typography>
        </Box>
      </Box>
      <Box className={classes.detailsBox}>
        <CryptoAsset symbol={order?.oToken?.underlyingAsset?.symbol || ''} />
        <Dot />
        <Typography component="div" className={classes.detailLabel}>
          {toUTCDateString(order?.oToken?.expiry || 0)}
        </Typography>
        <Dot />
        <Typography component="div" className={classes.detailLabel}>
          Amount{' '}
          {toTokenAmount(
            order.type === 1 ? order.order.order.takerAmount : order.order.order.makerAmount,
            8,
          ).toString()}
        </Typography>
      </Box>
      <Box className={classes.strikeBox}>
        <Box>
          <Typography className={classes.priceLabel} variant="caption">
            Strike
          </Typography>
          <USDCAmount amount={order.oToken?.strikePrice.toString() || ''} size={1.5} />
        </Box>
        <Box>
          <Typography className={classes.priceLabel} variant="caption">
            Bid/Ask Price
          </Typography>
          <Typography style={{ fontSize: '1.5rem' }}>
            $
            {toTokenAmount(order.type === 1 ? order.order.order.makerAmount : order.order.order.takerAmount, 6).toFixed(
              2,
            )}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <Box className={classes.limitFooter}>
        <Box>
          <Typography className={classes.priceLabel} variant="caption">
            Deadline
          </Typography>
          <Typography variant="body2">
            <Timer end={Number(order.order.order.expiry) * 1000} />
          </Typography>
        </Box>
        <Box>
          <Typography className={classes.priceLabel} variant="caption">
            Status
          </Typography>
          <Typography variant="body2">{isOutstanding ? 'Outstanding' : 'Partial'}</Typography>
        </Box>
      </Box>
    </Card>
  );
};

export function getCollateralString(position: Position): string {
  if (!position.collateral) return 'n/a';

  const symbol = position.collateral.symbol;
  const amount = toTokenAmount(position.collateralAmount, position.collateral.decimals);
  return `${amount} ${symbol}`;
}
