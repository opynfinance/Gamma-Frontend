import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles, withStyles, createStyles, Theme } from '@material-ui/core/styles';
import Collapse from '@material-ui/core/Collapse';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Hidden from '@material-ui/core/Hidden';
import Box from '@material-ui/core/Box';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import Typography from '@material-ui/core/Typography';

import { OToken, OTokenWithTradeDetail, OTokenOrderBook, OrderWithMetaData } from '../../types';
import { getGreeksAndIv } from '../../utils/calculations';
import OptionCell from './OptionCell';
import { getBidsSummary, getAsksSummary, sortAsks } from '../../utils/0x-utils';
import { handleSelectProps } from './OptionCell';
import Gamma from '../../img/greeks/gamma.svg';
import Delta from '../../img/greeks/delta.svg';
import Theta from '../../img/greeks/theta.svg';
import Vega from '../../img/greeks/vega.svg';
import { TradeAction } from '../../utils/constants';

export const StrikePriceCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      textAlign: 'center',
      color: theme.palette.success.main,
      fontWeight: 'bold',
    },
    body: {
      backgroundColor: `${theme.palette.success.light}33`,
      textAlign: 'center',
      color: theme.palette.success.main,
      fontWeight: 'bold',
    },
  }),
)(TableCell);

export const HiddenStrikePriceCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      backgroundColor: theme.palette.success.main,
      textAlign: 'center',
      color: theme.palette.success.light,
      //opacity: 0.1
    },
    body: {
      backgroundColor: theme.palette.success.main,
      textAlign: 'center',
      color: theme.palette.success.light,
      //opacity: 0.1
    },
  }),
)(TableCell);

const useRowStyles = makeStyles(theme =>
  createStyles({
    collapsibleCell: {
      padding: 0,
    },
    greekContainer: {
      display: 'flex',
      justifyContent: 'space-around',
    },
    greekBox: {
      display: 'flex',
      flexDirection: 'row',
      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
      },
    },
    greekItem: {
      display: 'flex',
      marginTop: theme.spacing(1),
      justifyContent: 'space-around',
    },
    greekCell: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0.5, 1),
    },
    greekIcon: {
      marginRight: theme.spacing(0.5),
    },
    infoIcon: {
      color: theme.palette.text.secondary,
      fontSize: '14px',
      marginLeft: theme.spacing(0.5),
    },
  }),
);

function getOTokenWithDetail(
  oToken: OToken | null,
  spotPrice: BigNumber,
  bids: OrderWithMetaData[],
  asks: OrderWithMetaData[],
): OTokenWithTradeDetail | null {
  if (oToken === null) return null;

  const { bestBidPrice, totalBidAmt: bidSize } = getBidsSummary(bids);
  const { bestAskPrice, totalAskAmt: askSize } = getAsksSummary(asks.sort(sortAsks));

  const midPrice = bestBidPrice.plus(bestAskPrice).div(new BigNumber(2));

  const priceToShow = bestBidPrice.isZero()
    ? bestAskPrice.isZero()
      ? new BigNumber(0)
      : bestAskPrice
    : bestAskPrice.isZero()
    ? bestBidPrice
    : midPrice;
  const priceString = Math.log10(priceToShow.toNumber()) > 3 ? priceToShow.toFixed(3) : priceToShow.toFixed(4);

  const breakeven = oToken.isPut ? oToken.strikePrice.minus(priceToShow) : oToken.strikePrice.plus(priceToShow);

  const ivAndGreeks = getGreeksAndIv(oToken, priceToShow, spotPrice, 0);

  const oTokenWithDetail = {
    ...oToken,
    ...ivAndGreeks,
    breakeven,
    price: priceToShow,
    priceString,
    askSize,
    bidSize,
    askPrice: bestAskPrice,
    bidPrice: bestBidPrice,
  };
  return oTokenWithDetail;
}

const GreekTable = ({ option }: { option: OTokenWithTradeDetail | null }) => {
  const classes = useRowStyles();

  return (
    <div className={classes.greekBox}>
      <div className={classes.greekItem}>
        <Tooltip title="$ change in option premium for a $1 change in the underlying" placement="top">
          <Box style={{ width: '6rem' }}>
            <div className={classes.greekCell}>
              <img src={Delta} alt="delta" className={classes.greekIcon} />
              Delta
              <InfoIcon className={classes.infoIcon} />
            </div>
            <div className={classes.greekCell}>
              <Typography variant="body2">{option ? option.greeks.delta : '-'}</Typography>
            </div>
          </Box>
        </Tooltip>

        <Tooltip title="Change in the option delta for a $1 move in the underlying price" placement="top">
          <Box style={{ width: '6rem' }}>
            <div className={classes.greekCell}>
              <img src={Gamma} alt="gamma" className={classes.greekIcon} />
              Gamma
              <InfoIcon className={classes.infoIcon} />
            </div>
            <div className={classes.greekCell}>
              <Typography variant="body2">{option ? option.greeks.gamma : '-'}</Typography>
            </div>
          </Box>
        </Tooltip>
      </div>

      <div className={classes.greekItem}>
        <Tooltip title="$ change in option premium for a 1% move higher in implied volatility" placement="top">
          <Box style={{ width: '6rem' }}>
            <div className={classes.greekCell}>
              <img src={Vega} alt="vega" className={classes.greekIcon} />
              Vega
              <InfoIcon className={classes.infoIcon} />
            </div>
            <div className={classes.greekCell}>
              <Typography variant="body2">{option ? option.greeks.vega : '-'}</Typography>
            </div>
          </Box>
        </Tooltip>

        <Tooltip title="$ change in option premium each day" placement="top">
          <Box style={{ width: '6rem' }}>
            <div className={classes.greekCell}>
              <img src={Theta} alt="delta" className={classes.greekIcon} />
              Theta
              <InfoIcon className={classes.infoIcon} />
            </div>
            <div className={classes.greekCell}>
              <Typography variant="body2">{option ? option.greeks.theta : '-'}</Typography>
            </div>
          </Box>
        </Tooltip>
      </div>
    </div>
  );
};

export type Row = {
  // id: number;
  strikePrice: BigNumber;
  call: OToken | null;
  put: OToken | null;
  putOrderBook: OTokenOrderBook | null;
  callOrderBook: OTokenOrderBook | null;
};

type StrikeRowProps = {
  row: Row;
  expiry: number;
  spotPrice: BigNumber;
  handleSelect: (option: handleSelectProps) => void;
  isSelected: (token: OToken, action?: TradeAction) => boolean;
  isDisabled: (token: OToken) => boolean;
  selectedTab?: string;
};

const StrikeRow = ({ handleSelect, row, isSelected, isDisabled, spotPrice, selectedTab }: StrikeRowProps) => {
  const [open, setOpen] = React.useState(false);
  const classes = useRowStyles();

  const { strikePrice, call, put, callOrderBook, putOrderBook } = row;

  const callbids = callOrderBook?.bids ?? [];
  const callasks = callOrderBook?.asks ?? [];

  const callWithDetail = useMemo(() => {
    return getOTokenWithDetail(call, spotPrice, callbids, callasks);
  }, [call, spotPrice, callbids, callasks]);

  const putbids = putOrderBook?.bids ?? [];
  const putasks = putOrderBook?.asks ?? [];
  const putWithDetail = useMemo(() => {
    return getOTokenWithDetail(put, spotPrice, putbids, putasks);
  }, [put, spotPrice, putbids, putasks]);

  return (
    <>
      <TableRow>
        <Hidden xsDown>
          {/* Call */}
          <OptionCell
            option={callWithDetail}
            isSelected={isSelected}
            isDisabled={isDisabled}
            handleSelect={handleSelect}
            open={open}
            handleToggleOpen={() => setOpen(!open)}
          />

          <StrikePriceCell>{'$' + strikePrice.toNumber().toLocaleString()}</StrikePriceCell>

          {/** Put  */}
          <OptionCell
            option={putWithDetail}
            isSelected={isSelected}
            isDisabled={isDisabled}
            handleSelect={handleSelect}
            open={open}
            handleToggleOpen={() => setOpen(!open)}
          />
        </Hidden>

        <Hidden smUp>
          <StrikePriceCell>{'$' + strikePrice.toNumber().toLocaleString()}</StrikePriceCell>
          <OptionCell
            option={selectedTab === 'calls' ? callWithDetail : putWithDetail}
            isSelected={isSelected}
            isDisabled={isDisabled}
            handleSelect={handleSelect}
            open={open}
            handleToggleOpen={() => setOpen(!open)}
          />
        </Hidden>
      </TableRow>
      {/* Expanded Details */}
      <TableRow>
        <TableCell className={classes.collapsibleCell} colSpan={13}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box className={classes.greekContainer}>
              <Hidden xsDown>
                <Box style={{ width: '40%' }}>
                  <GreekTable option={callWithDetail} />
                </Box>
                <Box style={{ width: '40%' }}>
                  <GreekTable option={putWithDetail} />
                </Box>
              </Hidden>
              <Hidden smUp>
                <Box>
                  <GreekTable option={selectedTab === 'calls' ? callWithDetail : putWithDetail} />
                </Box>
              </Hidden>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default StrikeRow;
