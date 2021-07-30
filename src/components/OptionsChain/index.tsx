import React, { useState, useEffect, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import Checkbox from '@material-ui/core/Checkbox';
import TableContainer from '@material-ui/core/TableContainer';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import Hidden from '@material-ui/core/Hidden';
import Tooltip from '@material-ui/core/Tooltip';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import InfoIcon from '@material-ui/icons/InfoOutlined';

import StrikeRow, { StrikePriceCell, Row } from './StrikeRow';
import ComingSoon from './comingSoon';
import { Series, OToken } from '../../types';
import { useZeroX } from '../../context/zerox';
import { oTokenIsExpiry } from '../../utils/oToken';
import { handleSelectProps } from './OptionCell';
import { TradeAction } from '../../utils/constants';

const useStyles = makeStyles(theme =>
  createStyles({
    tableContainer: {
      marginRight: '16rem',
      maxHeight: '46vh',
      [theme.breakpoints.down('md')]: {
        marginRight: '15rem',
      },
      [theme.breakpoints.down('sm')]: {
        maxWidth: '100%',
        marginRight: '0',
        maxHeight: '100%',
      },
    },
    comingSoon: {
      minWidth: '100%',
    },
    table: {
      fontSize: '10px',
    },
    toggleButton: {
      width: '50%',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: 0,
    },
    toggleButtonGroup: {
      width: '100%',
    },
  }),
);

const useToolbarStyles = makeStyles((theme: Theme) =>
  createStyles({
    header: {
      padding: theme.spacing(1, 2),
      display: 'flex',
      justifyContent: 'space-between',
      [theme.breakpoints.down('xs')]: {
        justifyContent: 'center',
      },
    },
    coinPriceBox: {
      fontWeight: theme.typography.fontWeightBold,
      border: `1px dashed ${theme.palette.action.disabled}`,
      color: theme.palette.text.secondary,
      display: 'flex',
      alignItems: 'center',
      borderRadius: theme.spacing(0.5),
      padding: theme.spacing(1),
      marginLeft: theme.spacing(2),
    },
    rightHeader: {
      display: 'flex',
      [theme.breakpoints.down('sm')]: {
        display: 'block',
      },
    },
    subHeader: {
      backgroundColor: theme.palette.background.lightStone,
      display: 'flex',
      padding: theme.spacing(0.5),
      justifyContent: 'space-around',
    },
    subHeaderItem: {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    info: {
      color: theme.palette.text.secondary,
      fontSize: '14px',
      marginLeft: theme.spacing(1),
    },
  }),
);

const useHeaderStyles = makeStyles((theme: Theme) =>
  createStyles({
    arrow: {
      minWidth: 20,
    },
    iv: {
      paddingLeft: theme.spacing(2),
    },
    priceButton: {
      minWidth: 110,
    },
  }),
);

const EnhancedTableToolbar = ({
  underlyingName,
  price,
  filterEmpty,
  setFilterEmpty,
}: {
  underlyingName: string;
  price: BigNumber;
  filterEmpty: boolean;
  setFilterEmpty: any;
}) => {
  const classes = useToolbarStyles();
  return (
    <>
      <Box className={classes.header}>
        <Hidden xsDown>
          <Typography variant="h6">Option Chain</Typography>
        </Hidden>
        <Box className={classes.rightHeader}>
          <Box>
            <Checkbox
              checked={filterEmpty}
              onChange={(_, checked) => setFilterEmpty(checked)}
              name="checkedB"
              color="primary"
            />
            <Typography variant="caption">Show only options with liquidity</Typography>
          </Box>
          <Box className={classes.coinPriceBox}>
            <Typography variant="body2">
              1 {underlyingName} = {price.toFixed(1)} USDC
            </Typography>
          </Box>
        </Box>
      </Box>
      <Hidden xsDown>
        <Box className={classes.subHeader}>
          <Typography variant="body2" id="tableTitle" component="div" className={classes.subHeaderItem}>
            CALLS
            <Tooltip
              title={
                <React.Fragment>
                  <Typography color="inherit" variant="subtitle1">
                    How CALL options work
                  </Typography>
                  <Typography variant="subtitle2">Buy</Typography>
                  <Typography variant="body2">
                    If ETH rises to Strike Price or ABOVE, upon expiry, you receive the difference between Strike Price
                    and the price of ETH at the time of expiry.
                  </Typography>
                  <br />
                  <Typography variant="subtitle2">Sell</Typography>
                  <Typography variant="body2">
                    You put down ETH to mint + sell options to earn a premium. If ETH rises ABOVE Strike Price you pay
                    the option buyer.
                  </Typography>
                </React.Fragment>
              }
            >
              <InfoIcon className={classes.info} />
            </Tooltip>
          </Typography>
          <Typography variant="body2" id="tableTitle" component="div" className={classes.subHeaderItem}>
            PUTS
            <Tooltip
              title={
                <React.Fragment>
                  <Typography color="inherit" variant="subtitle1">
                    How PUT options work
                  </Typography>
                  <Typography variant="subtitle2">Buy</Typography>
                  <Typography variant="body2">
                    If ETH hits Strike Price or BELOW, upon expiry, you can withdraw the difference between Strike Price
                    and the price of ETH at the time of expiry.
                  </Typography>
                  <br />
                  <Typography variant="subtitle2">Sell</Typography>
                  <Typography variant="body2">
                    You put down USDC to mint + sell options to earn premiums. If ETH falls BELOW the Strike Price you
                    pay the option buyer.
                  </Typography>
                </React.Fragment>
              }
            >
              <InfoIcon className={classes.info} />
            </Tooltip>
          </Typography>
        </Box>
      </Hidden>
    </>
  );
};

const Header = () => {
  const classes = useHeaderStyles();

  return (
    <>
      <Tooltip title="Implied Volatility (IV) is a market forecast of option price movement" placement="top">
        <TableCell className={classes.iv}>IV</TableCell>
      </Tooltip>

      {/* Desktop view */}
      <Hidden mdDown>
        <Tooltip title="The total amount of options available to sell across call bid prices" placement="top">
          <TableCell>Liquidity</TableCell>
        </Tooltip>
        <Tooltip title="Best available purchase price" placement="top">
          <TableCell align="left">Bid</TableCell>
        </Tooltip>
        <Tooltip title="Best available sell price" placement="top">
          <TableCell align="left">Ask</TableCell>
        </Tooltip>
      </Hidden>

      {/* Small Laptop and tablet view */}
      <Hidden lgUp>
        <Tooltip title="Best available purchase and sell price" placement="top">
          <TableCell align="left">Price</TableCell>
        </Tooltip>
        <Tooltip title="Amount of options available to purchase and sell" placement="top">
          <TableCell>Liquidity</TableCell>
        </Tooltip>
      </Hidden>

      <Hidden mdDown>
        <Tooltip title="The total amount of options available to purchase across all ask prices" placement="top">
          <TableCell>Liquidity</TableCell>
        </Tooltip>
      </Hidden>

      <TableCell className={classes.arrow} />
    </>
  );
};

type OptionsChainProps = {
  selectedSeriesIndex: number;
  allSeries: Series[];
  oTokens: OToken[];
  expiry: any;
  handleSelect: (option: handleSelectProps) => void;
  isSelected: (token: OToken, action?: TradeAction) => boolean;
  isDisabled: (token: OToken) => boolean;
  spotPrice: BigNumber;
  underlyingName?: string;
};

const OptionsChain = ({
  selectedSeriesIndex,
  allSeries,
  oTokens,
  expiry,
  handleSelect,
  isSelected,
  isDisabled,
  spotPrice,
  underlyingName,
}: OptionsChainProps) => {
  const classes = useStyles();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState('calls');
  const [filterEmpty, setFilterEmpty] = useState(true);

  const filteredOTokens = useMemo(
    () =>
      oTokens.filter(oToken => {
        return oTokenIsExpiry(oToken, expiry);
      }),
    [expiry, oTokens],
  );

  const { isLoadingOrderBook, orderBooks } = useZeroX();

  // get rows
  useEffect(() => {
    // group oTokens into rows[], and fetch price data
    const newRows = [];

    const distinctStrikes = Array.from(
      new Set(
        filteredOTokens
          .map(otoken => otoken.strikePrice)
          .sort((a, b) => (a.gt(b) ? 1 : -1))
          .map((strikePrice: BigNumber) => strikePrice.toString()),
      ),
    );

    for (const strikePrice of distinctStrikes) {
      const otokens = filteredOTokens.filter(otoken => otoken.strikePrice.toString() === strikePrice);
      const call = otokens.find(otoken => !otoken.isPut) || null;
      const put = otokens.find(otoken => otoken.isPut) || null;

      const putOrderBook = put ? orderBooks.find(o => o.id === put.id) || null : null;
      const callOrderBook = call ? orderBooks.find(o => o.id === call.id) || null : null;

      const row: Row = {
        put,
        call,
        putOrderBook,
        callOrderBook,
        strikePrice: new BigNumber(strikePrice),
      };
      newRows.push(row);
    }

    setRows(newRows);
  }, [filteredOTokens, orderBooks]);

  const RowsComponent = useMemo(() => {
    const actualRows = filterEmpty
      ? rows.filter(
          row =>
            row.callOrderBook?.asks.length ||
            row.callOrderBook?.bids.length ||
            row.putOrderBook?.bids.length ||
            row.putOrderBook?.asks.length ||
            (row.call && isSelected(row.call)) ||
            (row.put && isSelected(row.put)),
        )
      : rows;
    return actualRows.map((row, idx) => (
      <StrikeRow
        key={`row-${idx}`}
        row={row}
        handleSelect={handleSelect}
        isSelected={isSelected}
        isDisabled={isDisabled}
        expiry={expiry}
        spotPrice={spotPrice}
        selectedTab={tab}
      />
    ));
  }, [filterEmpty, rows, handleSelect, isSelected, isDisabled, expiry, spotPrice, tab]);

  return (
    <Grid container justify="flex-start" alignItems="center">
      <TableContainer component={Paper} className={classes.tableContainer}>
        <EnhancedTableToolbar
          underlyingName={underlyingName || 'ETH'}
          price={spotPrice}
          filterEmpty={filterEmpty}
          setFilterEmpty={setFilterEmpty}
        />
        {rows.length === 0 && !isLoadingOrderBook ? (
          <Grid container justify="center" alignItems="center" direction="column" className={classes.comingSoon}>
            {' '}
            <ComingSoon />{' '}
          </Grid>
        ) : (
          <>
            {isLoadingOrderBook && <LinearProgress />}
            <Hidden xsDown>
              <Table aria-label="collapsible table" aria-labelledby="tableTitle" className={classes.table} stickyHeader>
                <TableHead>
                  <TableRow>
                    <Header />
                    <Tooltip title="Price at which the option can be exercised" placement="top">
                      <StrikePriceCell>Strike</StrikePriceCell>
                    </Tooltip>
                    <Header />
                  </TableRow>
                </TableHead>
                <TableBody>{RowsComponent}</TableBody>
              </Table>
            </Hidden>
            <Hidden smUp>
              <Box>
                <ToggleButtonGroup
                  value={tab}
                  exclusive
                  onChange={(_, value) => setTab(value)}
                  aria-label="text alignment"
                  className={classes.toggleButtonGroup}
                >
                  <ToggleButton value="calls" aria-label="calls" className={classes.toggleButton}>
                    Calls
                  </ToggleButton>
                  <ToggleButton value="puts" aria-label="puts" className={classes.toggleButton}>
                    Puts
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Table aria-label="collapsible table" aria-labelledby="tableTitle" className={classes.table}>
                <TableHead>
                  <TableRow>
                    <StrikePriceCell>Strike</StrikePriceCell>
                    <Header />
                  </TableRow>
                </TableHead>
                <TableBody>{RowsComponent}</TableBody>
              </Table>
            </Hidden>
          </>
        )}
      </TableContainer>
    </Grid>
  );
};

export default OptionsChain;
