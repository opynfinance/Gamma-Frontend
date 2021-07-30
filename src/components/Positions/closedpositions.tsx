import React, { useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import Grid from '@material-ui/core/Grid';

import EmptyState from './emptyState';
import { ClosedPosition } from '../../types';
import { toUTCDateString } from '../../utils/time';
import { getPositionStrike, getPositionSize } from './activepositions';
import { parseReturnColor } from './colorUtil';
import { toTokenAmount } from '../../utils/calculations';
import SortableTable from './sortableTable';
import { CryptoAsset, USDCAmount } from '../AssetTxt';
import { MobilePosition } from './MobilePosition';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  tableRow: {
    '&$selected, &$selected:hover': {
      backgroundColor: '#E0E0E0',
    },
  },
  hover: {},
  selected: {},
  cellText: {
    fontSize: '.7rem',
  },
});

type ClosedPositionsProps = {
  handleRowClick: (id: string | undefined) => void;
  selectedId: string;
  closedPositions: ClosedPosition[];
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
    id: 'profit',
    label: 'Total Return',
    type: 'string',
    tooltip: 'Calculated using the price of ETH upon expiry. Learn more at tiny.cc/opynfaq',
    sortable: true,
  },
  {
    id: 'initialPremium',
    label: 'Initial Premium',
    type: 'string',
    tooltip: 'Average of premiums for each option you either purchased or sold',
    sortable: true,
  },
  {
    id: 'closedPremium',
    label: 'Closed Premium',
    type: 'string',
    tooltip: 'Average of premiums for each option that expired or you closed',
    sortable: true,
  },
  {
    id: 'payoutAmount',
    label: 'Settlement',
    type: 'string',
    tooltip: null,
    sortable: true,
  },
];

const ClosedPositions = ({ handleRowClick, selectedId, closedPositions }: ClosedPositionsProps) => {
  const classes = useStyles();

  const renderRow = useCallback(
    (position: ClosedPosition, i) => (
      <TableRow
        key={i}
        hover
        selected={position.id === selectedId}
        classes={{ hover: classes.hover, selected: classes.selected }}
        className={classes.tableRow}
        onClick={() => handleRowClick(position.id)}
      >
        <TableCell component="th" scope="row">
          {`${position.type} ${position.isPut ? 'Put' : 'Call'}`}
        </TableCell>
        <TableCell>
          <CryptoAsset symbol={position.underlying.symbol} />
        </TableCell>
        <TableCell>
          <USDCAmount amount={getPositionStrike(position)} />
        </TableCell>
        <TableCell>{toUTCDateString(position.expiry)}</TableCell>
        <TableCell>{getPositionSize(position)} </TableCell>
        <TableCell>
          <Typography
            className={classes.cellText}
            color={parseReturnColor(position.initialPremium.plus(position.closedPremium).toFixed(4))}
          >
            ${position.initialPremium.plus(position.closedPremium).toFixed(4)}
          </Typography>
        </TableCell>
        <TableCell>{position.initialPremium.toFixed(4)} USDC</TableCell>
        <TableCell>{position.closedPremium.toFixed(4)} USDC</TableCell>
        <TableCell>{getSettlementString(position)}</TableCell>
      </TableRow>
    ),
    [classes.cellText, classes.hover, classes.selected, classes.tableRow, handleRowClick, selectedId],
  );

  if (closedPositions.length === 0) {
    return (
      <Grid container justify="center" alignItems="center" direction="column">
        {' '}
        <EmptyState status="Closed positions" />
      </Grid>
    );
  }

  return (
    <>
      <Hidden smDown>
        <SortableTable headCells={headCells} rows={closedPositions} renderRow={renderRow} title="Closed Positions" />
      </Hidden>
      <Hidden mdUp>
        <Typography variant="h6">My Closed Positions</Typography>
        {closedPositions.map(position => (
          <MobilePosition position={position} closed key={position.id} />
        ))}
      </Hidden>
    </>
  );
};

export function getSettlementString(position: ClosedPosition): string {
  return position.payoutAsset
    ? `${toTokenAmount(position.payoutAmount, position.payoutAsset.decimals).toFixed(5)} ${position.payoutAsset.symbol}`
    : '-';
}

export default ClosedPositions;
