import React, { useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

import { OrderWithMetaData } from '../../types';
import { getAskPrice } from '../../utils/0x-utils';
import { AskRows, BidRows } from '../UserOrders/BidsAndAsks';

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

export default function Content({ bids, asks }: { bids: OrderWithMetaData[]; asks: OrderWithMetaData[] }) {
  const classes = useStyles();

  //sort fom high to low
  const asksReversed = useMemo(() => {
    const asksCopy = asks.slice();
    return asksCopy.sort((a, b) => (getAskPrice(a.order).gt(getAskPrice(b.order)) ? -1 : 1));
  }, [asks]);

  return (
    <TableContainer style={{ boxShadow: 'none', height: 240 }} component={Paper}>
      <Table size="small" aria-label="asks" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell className={classes.header}>Price</TableCell>
            <TableCell className={classes.header} align="right">
              Size
            </TableCell>
            <TableCell className={classes.header} align="right">
              Deadline
            </TableCell>
          </TableRow>
        </TableHead>
        <AskRows asks={asksReversed} dispatch={() => {}} isSelected={() => {}} isUserOrder={false} />
        <BidRows bids={bids} dispatch={() => {}} isSelected={() => {}} isUserOrder={false} />
      </Table>
    </TableContainer>
  );
}
