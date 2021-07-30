import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';

import { OrderWithMetaData } from '../../types';
import { getAskPrice, getBidPrice, getRemainingMakerAndTakerAmount } from '../../utils/0x-utils';
import { toTokenAmount } from '../../utils/calculations';
import Timer from '../Timer';

type BidsAndAsksProps = {
  bids: OrderWithMetaData[];
  asks: OrderWithMetaData[];
  isSelected: any;
  dispatch: any;
};

const useStyles = makeStyles(theme => ({
  header: {
    paddingLeft: 12,
    paddingRight: 4,
  },
  cell: {
    paddingLeft: 8,
    paddingRight: 4,
  },
}));

export default function BidsAndAsks({ dispatch, bids, asks, isSelected }: BidsAndAsksProps) {
  const classes = useStyles();

  return (
    <TableContainer style={{ boxShadow: 'none' }} component={Paper}>
      <Table size="small" aria-label="asks">
        <TableHead>
          <TableRow>
            <TableCell className={classes.header}>Ask</TableCell>
            <TableCell className={classes.header}>Price</TableCell>
            <TableCell className={classes.header} align="right">
              Size
            </TableCell>
            <TableCell className={classes.header} align="right">
              Deadline
            </TableCell>
          </TableRow>
        </TableHead>
        <AskRows asks={asks} dispatch={dispatch} isSelected={isSelected} isUserOrder={true} />
      </Table>
      <br />
      <Table size="small" aria-label="asks">
        <TableHead>
          <TableRow>
            <TableCell className={classes.header}>Bid</TableCell>
            <TableCell className={classes.header}>Price</TableCell>
            <TableCell className={classes.header} align="right">
              Size
            </TableCell>
            <TableCell className={classes.header} align="right">
              Deadline
            </TableCell>
          </TableRow>
        </TableHead>
        <BidRows bids={bids} dispatch={dispatch} isSelected={isSelected} isUserOrder={true} />
      </Table>
    </TableContainer>
  );
}

export function AskRows({
  asks,
  isSelected,
  dispatch,
  isUserOrder,
}: {
  asks: OrderWithMetaData[];
  isSelected: any;
  dispatch: any;
  isUserOrder: boolean;
}) {
  const classes = useStyles();

  const askRows = useMemo(() => {
    return asks.map(ask => {
      const amountLeft = toTokenAmount(getRemainingMakerAndTakerAmount(ask).remainingMakerAmount, 8);
      const percentageLeft = new BigNumber(ask.metaData.remainingFillableTakerAmount)
        .div(ask.order.takerAmount)
        .times(100);
      const amountToDisplay = isUserOrder
        ? `${amountLeft.toFixed(2)} (${percentageLeft.integerValue()}%)`
        : amountLeft.toFixed(2);
      return (
        <TableRow key={ask.metaData.orderHash}>
          {isUserOrder && (
            <Checkbox
              size={'small'}
              checked={isSelected(ask)}
              inputProps={{ 'aria-labelledby': ask.metaData.orderHash }}
              onChange={event => {
                if (event.target.checked) {
                  dispatch({ type: 'Add', order: ask });
                } else {
                  dispatch({ type: 'Remove', order: ask });
                }
              }}
            />
          )}
          <TableCell className={classes.cell} component="th" scope="row" style={{ color: '#F55536' }}>
            {getAskPrice(ask.order, 8, 6).toFixed(2)}
          </TableCell>
          <TableCell className={classes.cell} align="right">
            {amountToDisplay}
          </TableCell>
          <TableCell className={classes.cell} align="right">
            <Timer end={Number(ask.order.expiry) * 1000} />
          </TableCell>
        </TableRow>
      );
    });
  }, [isUserOrder, isSelected, asks, dispatch, classes.cell]);
  return <TableBody>{askRows}</TableBody>;
}

export function BidRows({
  bids,
  isSelected,
  dispatch,
  isUserOrder,
}: {
  bids: OrderWithMetaData[];
  isSelected: any;
  dispatch: any;
  isUserOrder: boolean;
}) {
  const classes = useStyles();
  const bidRows = useMemo(() => {
    return bids.map(bid => {
      const amountLeft = toTokenAmount(bid.metaData.remainingFillableTakerAmount, 8);
      const percentageLeft = new BigNumber(bid.metaData.remainingFillableTakerAmount)
        .div(bid.order.takerAmount)
        .times(100);
      const amountToDisplay = isUserOrder
        ? `${amountLeft.toFixed(2)} (${percentageLeft.integerValue()}%)`
        : amountLeft.toFixed(2);
      return (
        <TableRow key={bid.metaData.orderHash}>
          {isUserOrder && (
            <Checkbox
              size={'small'}
              checked={isSelected(bid)}
              onChange={event => {
                if (event.target.checked) {
                  dispatch({ type: 'Add', order: bid });
                } else {
                  dispatch({ type: 'Remove', order: bid });
                }
              }}
              inputProps={{ 'aria-labelledby': bid.metaData.orderHash }}
            />
          )}
          <TableCell className={classes.cell} component="th" scope="row" style={{ color: '#4FC2A0' }}>
            {getBidPrice(bid.order, 6, 8).toFixed(2)}
          </TableCell>
          <TableCell className={classes.cell} align="right">
            {amountToDisplay}
          </TableCell>
          <TableCell className={classes.cell} align="right">
            {<Timer end={Number(bid.order.expiry) * 1000} />}
          </TableCell>
        </TableRow>
      );
    });
  }, [isUserOrder, isSelected, bids, dispatch, classes.cell]);
  return <TableBody style={{ paddingTop: 10 }}>{bidRows}</TableBody>;
}
