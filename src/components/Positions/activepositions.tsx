import React, { useCallback, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Grid from '@material-ui/core/Grid';
import Collapse from '@material-ui/core/Collapse';
import Skeleton from '@material-ui/lab/Skeleton';
import Hidden from '@material-ui/core/Hidden';
import { orange } from '@material-ui/core/colors';

import { Position, ActivePositionWithPNL, ERC20, VaultStatus } from '../../types';
import { TradePosition, VaultType } from '../../utils/constants';
import { toTokenAmount } from '../../utils/calculations';
import { toUTCDateString } from '../../utils/time';
import { parseReturnColor } from './colorUtil';
import SortableTable from './sortableTable';
import EmptyState from './emptyState';
import PositionDetail from '../PositionDetail';
import { CryptoAsset, USDCAmount } from '../AssetTxt';
import { MobilePosition } from './MobilePosition';
import { useQueryParams } from '../../hooks/useQueryParams';
import { parseBigNumber } from '../../utils/parse';

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
    untradedBox: {
      marginBottom: theme.spacing(1),
    },
    danger: {
      color: theme.palette.error.main,
      fontSize: '.8rem',
    },
    safe: {
      color: theme.palette.success.main,
      fontSize: '.8rem',
    },
    warning: {
      color: orange[500],
      fontSize: '.8rem',
    },
  }),
);

type ActivePositionsProps = {
  handleRowClick: (id: string | undefined) => void;
  selectedId: string;
  activePositions: Array<ActivePositionWithPNL>;
  untradedPositions?: Position[];
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
    tooltip:
      'Learn more about how total return is calculated at tiny.cc/opynfaq. There may be a sizeable bid/ask spread.',
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
  {
    id: 'vaultHealth',
    label: 'Vault Health',
    type: 'string',
    tooltip: 'Applicable only for partially collateralized positions',
    sortable: true,
  },
];

const ActivePositions = ({ handleRowClick, selectedId, activePositions, untradedPositions }: ActivePositionsProps) => {
  const classes = useStyles();
  const [untradedSelected, setUntradedSelected] = useState(-1);
  const queryParams = useQueryParams();
  const filter = queryParams.get('filter');

  const getHealthClass = useCallback(
    (position: ActivePositionWithPNL) => {
      if (position?.type !== TradePosition.Short) return classes.cellText;
      if (position.vaultType === VaultType.FULLY_COLLATERALIZED) return classes.safe;
      return position?.vaultStatus === VaultStatus.SAFE
        ? classes.safe
        : position?.vaultStatus === VaultStatus.WARNING
        ? classes.warning
        : classes.danger;
    },
    [classes.cellText, classes.danger, classes.safe, classes.warning],
  );

  const renderUntradedRow = useCallback(
    (position: ActivePositionWithPNL, i: number) => (
      <>
        <TableRow
          hover
          selected={i === untradedSelected}
          classes={{ hover: classes.hover, selected: classes.selected }}
          className={classes.tableRow}
          key={i}
          onClick={() => setUntradedSelected(untradedSelected !== i ? i : -1)}
        >
          {[
            `Untraded ${position.isPut ? 'Put' : 'Call'}`,
            <CryptoAsset symbol={position.underlying.symbol} />,
            <USDCAmount amount={getPositionStrike(position)} />,
            toUTCDateString(position.expiry),
            getPositionSize(position),
            <Typography variant="body2" className={classes.cellText} color="secondary">
              $0
            </Typography>,
            '$0.0000',
            '$0.0000',
            getCollateralString(position),
            <Typography className={getHealthClass(position)}>{getHealthStatus(position)}</Typography>,
          ].map((text, i) => (
            <TableCell className={classes.cellText} key={i}>
              {position ? text : <Skeleton />}
            </TableCell>
          ))}
        </TableRow>
        <TableRow
          className={classes.tableRowDetail}
          selected={i === untradedSelected}
          classes={{ selected: classes.selected }}
        >
          <TableCell colSpan={10} className={classes.collapsibleCell}>
            <Collapse in={untradedSelected === i} timeout="auto" unmountOnExit>
              <PositionDetail
                deselectPosition={() => console.log('hello')}
                navigateToClosedPositions={() => console.log('hello')}
                position={position}
                untraded
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
      getHealthClass,
      untradedSelected,
    ],
  );

  const renderActiveRow = useCallback(
    (position: ActivePositionWithPNL & {}, i: number) => (
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
            getPositionSize(position),
            <Typography
              variant="body2"
              className={classes.cellText}
              color={parseReturnColor(position.profit.toFixed(4))}
            >
              ${position.profit.toFixed(4)}
            </Typography>,
            `${position.initialPremium.toFixed(4)} USDC`,
            `${position.currentPremium.toFixed(4)} USDC`,
            getCollateralString(position),
            <Typography className={getHealthClass(position)}>{getHealthStatus(position)}</Typography>,
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
                deselectPosition={() => handleRowClick('')}
                navigateToClosedPositions={() => console.log('hello')}
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
      getHealthClass,
      handleRowClick,
      selectedId,
    ],
  );

  const filteredPositions = useMemo(() => {
    if (!filter) return activePositions;
    const filterStatus =
      filter === 'safe'
        ? VaultStatus.SAFE
        : filter === 'danger'
        ? VaultStatus.DANGER
        : filter === 'warning'
        ? VaultStatus.WARNING
        : VaultStatus.LIQUIDATED;
    return activePositions.filter(position => {
      if (filterStatus === VaultStatus.LIQUIDATED) {
        return position.vaultStatus === filterStatus || position.vaultStatus === VaultStatus.PARTIALLY_LIQUIDATED;
      }
      return position.vaultStatus === filterStatus;
    });
  }, [activePositions, filter]);

  if (filteredPositions.length === 0 && untradedPositions?.length === 0) {
    return (
      <Grid container justify="center" alignItems="center" direction="column">
        {' '}
        <EmptyState status="Active positions" />
      </Grid>
    );
  }

  return (
    <>
      {untradedPositions?.length ? (
        <Box className={classes.untradedBox}>
          <Hidden smDown>
            <SortableTable
              headCells={headCells}
              renderRow={renderUntradedRow}
              rows={untradedPositions}
              title="My Untraded Positions"
            />
          </Hidden>
          <Hidden mdUp>
            <Typography variant="h6">My Untraded Positions</Typography>
            {untradedPositions.map((position, i) => (
              <MobilePosition
                position={position}
                untraded
                key={`${position.id}-${i}`}
                selected={i === untradedSelected}
                onExpand={() => setUntradedSelected(untradedSelected !== i ? i : -1)}
              />
            ))}
          </Hidden>
        </Box>
      ) : null}
      {filteredPositions.length ? (
        <Box>
          <Hidden smDown>
            <SortableTable
              headCells={headCells}
              renderRow={renderActiveRow}
              rows={filteredPositions}
              title="My Active Positions"
            />
          </Hidden>
          <Hidden mdUp>
            <Typography variant="h6">My Active Positions</Typography>
            {filteredPositions.map(position => (
              <MobilePosition
                position={position}
                key={position.id}
                selected={position.id === selectedId}
                onExpand={() => handleRowClick(position.id)}
              />
            ))}
          </Hidden>
        </Box>
      ) : null}
    </>
  );
};

export function getPositionStrike(position: Position): string {
  if (position.type === TradePosition.CREDIT || position.type === TradePosition.DEBIT) {
    const longStrike = position.longOToken?.strikePrice as BigNumber;
    const shortStrike = position.shortOToken?.strikePrice as BigNumber;
    // return string
    if (longStrike?.gt(shortStrike)) {
      return `${shortStrike?.toString()} / $${longStrike.toString()}`;
    } else {
      return `${longStrike?.toString()} / $${shortStrike.toString()}`;
    }
  }
  if (position.type === TradePosition.Long) return `${position.longOToken?.strikePrice.toString() as string}`;

  return `${position.shortOToken?.strikePrice.toString() as string}`;
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
  const amount = parseBigNumber(position.collateralAmount, position.collateral.decimals);
  return `${amount} ${symbol}, settled in ${displayCollateral}`;
}

function getHealthStatus(position: ActivePositionWithPNL) {
  if (position.type !== TradePosition.Short) return 'N/A';
  if (position.vaultType === VaultType.FULLY_COLLATERALIZED) return 'Fully Collateralized';
  switch (position.vaultStatus) {
    case VaultStatus.SAFE:
      return 'Safe';
    case VaultStatus.WARNING:
      return 'Warning';
    case VaultStatus.DANGER:
      return 'Danger';
    case VaultStatus.PARTIALLY_LIQUIDATED:
      return 'Partially Liquidated';
    case VaultStatus.LIQUIDATED:
      return 'Liquidated';
    default:
      return 'N/A';
  }
}

export default ActivePositions;
