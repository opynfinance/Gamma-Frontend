import React, { useCallback, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import Typography from '@material-ui/core/Typography';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Skeleton from '@material-ui/lab/Skeleton';
import Hidden from '@material-ui/core/Hidden';

import { Position, ActivePositionWithPNL, ERC20 } from '../../types';
import { TradePosition } from '../../utils/constants';
import { toTokenAmount } from '../../utils/calculations';
import { toUTCDateString } from '../../utils/time';
import SortableTable from './sortableTable';
import EmptyState from './emptyState';
import { PrimaryButton } from '../Buttons';
import { useToast, useZeroX } from '../../hooks';
import { useMyOrders, MyOrder } from '../../hooks/useMyOrders';
import Timer from '../Timer';
import { CryptoAsset, USDCAmount } from '../AssetTxt';
import { MobileLimitOrder } from './MobilePosition';
import { getRemainingMakerAndTakerAmount } from '../../utils/0x-utils';

const useStyles = makeStyles(theme =>
  createStyles({
    table: {
      minWidth: 650,
    },
    tableRow: {
      cursor: 'pointer',
      '&$selected, &$selected:hover': {
        backgroundColor: theme.palette.background.stone,
        border: 'none',
      },
    },
    tableRowDetail: {
      '&$selected, &$selected:hover': {
        backgroundColor: theme.palette.background.lightStone,
        border: 'none',
      },
    },
    hover: {},
    selected: {},
    collapsibleCell: {
      padding: 0,
    },
    cellText: {
      fontSize: '.8rem',
    },
    mobileHeader: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  }),
);

type ActivePositionsProps = {
  handleRowClick: (id: string | undefined) => void;
  selectedId: string;
  activePositions: ActivePositionWithPNL[];
};

const headCells = [
  {
    id: 'type',
    label: 'Type',
    tooltip: null,
    sortable: true,
  },
  {
    id: 'underlying',
    label: 'Asset',
    tooltip: null,
    sortable: true,
  },
  {
    id: 'strikePrice',
    label: 'Strike',
    tooltip: 'Price at which the option can be exercised',
    sortable: false,
  },
  {
    id: 'expiry',
    label: 'Expiry (8:00AM UTC)',
    tooltip: null,
    sortable: true,
  },
  {
    id: 'amount',
    label: 'Amount',
    type: 'string',
    tooltip: 'Amount of oTokens you either purchased or sold',
    sortable: false,
  },
  {
    id: 'price',
    label: 'Bid/Ask price',
    type: 'string',
    tooltip: null,
    sortable: false,
  },
  {
    id: 'deadline',
    label: 'Deadline',
    type: 'string',
    tooltip: null,
    sortable: false,
  },
  {
    id: 'status',
    label: 'Status',
    type: 'string',
    tooltip: null,
    sortable: false,
  },
];

const LimitOrders = ({ handleRowClick, selectedId, activePositions }: ActivePositionsProps) => {
  const classes = useStyles();
  const { orders, refetch } = useMyOrders();
  const { cancelOrders } = useZeroX();
  const toast = useToast();

  const [selectedOrders, setSelectedOrders] = useState<{ [key: string]: boolean }>({});

  const selectOrder = useCallback(
    orderId => {
      if (selectedOrders[orderId]) {
        delete selectedOrders[orderId];
      } else {
        selectedOrders[orderId] = true;
      }
      setSelectedOrders({ ...selectedOrders });
    },
    [selectedOrders],
  );

  const selectedCount = useMemo(() => {
    return Object.keys(selectedOrders).length;
  }, [selectedOrders]);

  const selectAll = useCallback(
    (select: boolean) => {
      if (select) {
        const ods = orders.reduce((acc: { [key: string]: boolean }, _, i) => {
          acc[i] = true;
          return acc;
        }, {});
        setSelectedOrders(ods);
      } else {
        setSelectedOrders({});
      }
    },
    [orders],
  );

  const cancelMyOrders = () => {
    const signedOrders = Object.keys(selectedOrders).map(id => orders[parseInt(id)].order.order);
    const callback = () => {
      toast.success(`Successfully canceled ${signedOrders.length} orders`);
      // It takes some time to reflect
      setTimeout(() => refetch(), 5000);
    };

    cancelOrders(signedOrders, callback);
  };

  const HeaderComponent: React.FC = () => {
    if (selectedCount === 0) return null;

    return (
      <Box>
        <PrimaryButton onClick={cancelMyOrders}>Cancel orders</PrimaryButton>
      </Box>
    );
  };

  const renderRow = useCallback(
    (orderDetail: MyOrder, i: number) => {
      const isOutstanding = new BigNumber(orderDetail.order.order.takerAmount).isEqualTo(
        new BigNumber(orderDetail.order.metaData.remainingFillableTakerAmount),
      );

      const { remainingMakerAmount, remainingTakerAmount } = getRemainingMakerAndTakerAmount(orderDetail.order);

      return (
        <TableRow
          hover
          classes={{ hover: classes.hover, selected: classes.selected }}
          className={classes.tableRow}
          key={i}
          onClick={() => selectOrder(i)}
        >
          {[
            <Checkbox checked={!!selectedOrders[i]} color="primary" />,
            <Typography color={orderDetail.type === 1 ? 'secondary' : 'error'} className={classes.cellText}>
              {`${orderDetail.type === 1 ? 'Bid' : 'Ask'} ${orderDetail?.oToken?.isPut ? 'Put' : 'Call'}`}
            </Typography>,
            <CryptoAsset symbol={orderDetail?.oToken?.underlyingAsset?.symbol || ''} />,
            <USDCAmount amount={orderDetail?.oToken?.strikePrice.toString() || ''} />,
            `${toUTCDateString(orderDetail?.oToken?.expiry || 0)}`,
            toTokenAmount(orderDetail.type === 1 ? remainingTakerAmount : remainingMakerAmount, 8).toString(),
            `$${toTokenAmount(
              orderDetail.type === 1 ? orderDetail.order.order.makerAmount : orderDetail.order.order.takerAmount,
              6,
            ).toFixed(2)}`,
            <Timer end={Number(orderDetail.order.order.expiry) * 1000} />,
            <Typography variant="body2"> {isOutstanding ? 'Outstanding' : 'Partial'} </Typography>,
          ].map((text, i) => {
            return (
              <TableCell className={classes.cellText} key={i}>
                {orderDetail ? text : <Skeleton />}
              </TableCell>
            );
          })}
        </TableRow>
      );
    },
    [classes.cellText, classes.hover, classes.selected, classes.tableRow, selectOrder, selectedOrders],
  );

  if (orders.length === 0) {
    return (
      <Grid container justify="center" alignItems="center" direction="column">
        {' '}
        <EmptyState status="Limit orders" />
      </Grid>
    );
  }

  return (
    <>
      <Hidden smDown>
        <SortableTable
          headCells={headCells}
          renderRow={renderRow}
          rows={orders}
          title="My Limit Orders"
          selectable
          selectAll={selectAll}
          selectedCount={selectedCount}
          header={<HeaderComponent />}
        />
      </Hidden>
      <Hidden mdUp>
        <Box className={classes.mobileHeader}>
          <Typography variant="h6">My Limit Orders</Typography>
          {selectedCount > 0 ? <HeaderComponent /> : null}
        </Box>
        {orders.map((order, i) => (
          <MobileLimitOrder
            order={order}
            selected={!!selectedOrders[i]}
            onSelect={() => selectOrder(i)}
            key={order.order.metaData.orderHash}
          />
        ))}
      </Hidden>
    </>
  );
};

export function getPositionStrike(position: Position): string {
  if (position.type === TradePosition.CREDIT || position.type === TradePosition.DEBIT) {
    const longStrike = position.longOToken?.strikePrice as BigNumber;
    const shortStrike = position.shortOToken?.strikePrice as BigNumber;
    // return string
    if (longStrike?.gt(shortStrike)) {
      return `$${shortStrike?.toString()} / $${longStrike.toString()}`;
    } else {
      return `$${longStrike?.toString()} / $${shortStrike.toString()}`;
    }
  }
  if (position.type === TradePosition.Long) return `$${position.longOToken?.strikePrice.toString() as string}`;

  return `$${position.shortOToken?.strikePrice.toString() as string}`;
}

export function getPositionSize(position: Position): string {
  if (position.type === TradePosition.Long) return toTokenAmount(position.longAmount, 8).toString();

  return toTokenAmount(position.shortAmount, 8).toString();
}

export function getCollateralString(position: Position): string {
  const collateral = position.collateral
    ? position.collateral
    : position.shortOToken
    ? position.shortOToken.collateralAsset
    : (position.longOToken?.collateralAsset as ERC20);
  if (!position.collateral) return 'n/a, settled in ' + collateral.symbol;

  const displayCollateral = collateral.symbol === 'WETH' ? 'ETH' : collateral.symbol;

  const symbol = position.collateral.symbol;
  const amount = toTokenAmount(position.collateralAmount, position.collateral.decimals);
  return `${amount} ${symbol}, settled in ${displayCollateral}`;
}

export default LimitOrders;
