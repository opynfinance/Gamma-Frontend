import React, { useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Collapse from '@material-ui/core/Collapse';
import Grid from '@material-ui/core/Grid';
import Skeleton from '@material-ui/lab/Skeleton';
import { useHistory } from 'react-router';

import EmptyState from './emptyState';
import { Position, ExpiredPosition } from '../../types';
import { TradePosition } from '../../utils/constants';
import { toTokenAmount } from '../../utils/calculations';
import { toUTCDateString } from '../../utils/time';
import { parseReturnColor } from './colorUtil';
import SortableTable from './sortableTable';
import PositionDetail from '../PositionDetail';
import { CryptoAsset, USDCAmount } from '../AssetTxt';
import { MobilePosition } from './MobilePosition';

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
  }),
);

type ExpiredPositionsProps = {
  handleRowClick: (id: string | undefined) => void;
  selectedId: string;
  expiredPositions: ExpiredPosition[];
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
    id: 'expiryPrice',
    label: 'Settle Price',
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
    id: 'currentPremium',
    label: 'Current Premium',
    type: 'string',
    tooltip: 'Average of premiums for each option that expired or you closed',
    sortable: true,
  },
  {
    id: 'collateral',
    label: 'Collateral',
    type: 'string',
    tooltip: null,
    sortable: false,
  },
];

const ExpiredPositions = ({ handleRowClick, selectedId, expiredPositions }: ExpiredPositionsProps) => {
  const classes = useStyles();
  const history = useHistory();

  const renderRow = useCallback(
    (position: ExpiredPosition, i: number) => (
      <>
        <TableRow
          hover
          selected={position.id === selectedId}
          classes={{ hover: classes.hover, selected: classes.selected }}
          className={classes.tableRow}
          key={i}
          onClick={() => handleRowClick(position.id)}
        >
          {[
            `${position.type} ${position.isPut ? 'Put' : 'Call'}`,
            <CryptoAsset symbol={position.underlying.symbol} />,
            <USDCAmount amount={getPositionStrike(position)} />,
            toUTCDateString(position.expiry),
            position.isPriceReported ? '$' + position.expiryPrice.toFixed(4) : 'Settlement Price Pending',
            getPositionSize(position),
            <Typography className={classes.cellText} color={parseReturnColor(position.profit.toFixed(4))}>
              ${position.profit.toFixed(4)}
            </Typography>,
            position.initialPremium.toFixed(4),
            `${position.currentPremium.toFixed(4)} USDC`,
            getCollateralString(position),
          ].map((text, i) => (
            <TableCell className={classes.cellText} key={i}>
              {position ? text : <Skeleton />}
            </TableCell>
          ))}
        </TableRow>
        <TableRow
          className={classes.tableRowDetail}
          selected={position.id === selectedId}
          classes={{ selected: classes.selected }}
        >
          <TableCell colSpan={10} className={classes.collapsibleCell}>
            <Collapse in={selectedId === position.id} timeout="auto" unmountOnExit>
              <PositionDetail
                deselectPosition={() => console.log('')}
                navigateToClosedPositions={() => history.push('dashboard/closed')}
                position={position}
              />
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    ),
    [
      classes.cellText,
      classes.collapsibleCell,
      classes.hover,
      classes.selected,
      classes.tableRow,
      classes.tableRowDetail,
      handleRowClick,
      history,
      selectedId,
    ],
  );

  if (expiredPositions.length === 0) {
    return (
      <Grid container justify="center" alignItems="center" direction="column">
        {' '}
        <EmptyState status="Expired positions" />
      </Grid>
    );
  }

  return (
    <>
      <Hidden smDown>
        <SortableTable renderRow={renderRow} rows={expiredPositions} headCells={headCells} title="Expired Positions" />
      </Hidden>
      <Hidden mdUp>
        <Typography variant="h6">My Expired Positions</Typography>
        {expiredPositions.map(position => (
          <MobilePosition
            position={position}
            selected={selectedId === position.id}
            onExpand={() => handleRowClick(position.id)}
            key={position.id}
          />
        ))}
      </Hidden>
    </>
  );
};

function getPositionStrike(position: Position): string {
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

function getPositionSize(position: Position): string {
  if (position.type === TradePosition.Long) return toTokenAmount(position.longAmount, 8).toString();

  return toTokenAmount(position.shortAmount, 8).toString();
}

function getCollateralString(position: Position): string {
  if (!position.collateral) return 'n/a';
  const symbol = position.collateral.symbol;
  const amount = toTokenAmount(position.collateralAmount, position.collateral.decimals);
  return `${amount.toFixed(5)} ${symbol}`;
}

export default ExpiredPositions;
