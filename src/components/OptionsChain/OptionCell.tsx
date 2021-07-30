import React, { MouseEvent, useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import { withStyles, Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import TableCell from '@material-ui/core/TableCell';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Hidden from '@material-ui/core/Hidden';
import Box from '@material-ui/core/Box';
import Skeleton from '@material-ui/lab/Skeleton';
import Typography from '@material-ui/core/Typography';
import clsx from 'clsx';
import ReactGA from 'react-ga';

import { OTokenWithTradeDetail, OToken } from '../../types';
import PriceButton from './PriceButton';
import { useZeroX } from '../../context/zerox';
import { parseBigNumber } from '../../utils/parse';
import { TradeAction } from '../../utils/constants';

export type handleSelectProps = {
  token: OTokenWithTradeDetail;
  selected: boolean;
  action?: TradeAction;
};

export const Cell = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      maxWidth: 135,
      padding: '8px',
      [theme.breakpoints.up('md')]: {
        maxWidth: 105,
      },
    },
  }),
)(TableCell);

const useStyles = makeStyles(theme =>
  createStyles({
    iv: {
      color: theme.palette.text.secondary,
      paddingLeft: theme.spacing(2),
    },
    mobilePrice: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    mobileMargin: {
      marginTop: theme.spacing(1),
    },
  }),
);

type OptionCellProps = {
  option: OTokenWithTradeDetail | null;
  isSelected: (token: OToken, action: TradeAction) => boolean;
  isDisabled: (token: OToken) => boolean;
  handleSelect: (option: handleSelectProps) => void;
  open: Boolean;
  handleToggleOpen: (event: MouseEvent<HTMLButtonElement>) => void;
};

const PLACEHOLDER = '-';
const OptionCell = ({ option, isSelected, isDisabled, handleSelect, open, handleToggleOpen }: OptionCellProps) => {
  const [askSelected, setAskSelected] = useState(false);
  const [buySelected, setBuySelected] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setDisabled(option ? isDisabled(option) : true);
    setAskSelected(option ? isSelected(option, TradeAction.BUY) : false);
    setBuySelected(option ? isSelected(option, TradeAction.SELL) : false);
  }, [option, isSelected, isDisabled]);

  const { isLoadingOrderBook } = useZeroX();
  const classes = useStyles();

  const AskPriceButton = useMemo(
    () => (
      <PriceButton
        disabled={disabled}
        selected={askSelected}
        handleSelect={
          option
            ? () => {
                handleSelect({ token: option, selected: askSelected, action: TradeAction.BUY });
                ReactGA.event({
                  category: 'trade',
                  action: askSelected ? 'deselectedOption' : 'selectedOption',
                  label: option.name,
                });
              }
            : () => console.error('Handle Select: option is not defined.')
        }
      >
        {isLoadingOrderBook ? <Skeleton /> : option ? '$' + option.askPrice.toFixed(2) : PLACEHOLDER}
      </PriceButton>
    ),
    [disabled, askSelected, option, isLoadingOrderBook, handleSelect],
  );

  const BidPriceButton = useMemo(
    () => (
      <PriceButton
        disabled={disabled}
        selected={buySelected}
        handleSelect={
          option
            ? () => {
                handleSelect({ token: option, selected: buySelected, action: TradeAction.SELL });
                ReactGA.event({
                  category: 'trade',
                  action: buySelected ? 'deselectedOption' : 'selectedOption',
                  label: option.name,
                });
              }
            : () => console.error('Handle Select: option is not defined.')
        }
      >
        {isLoadingOrderBook ? <Skeleton /> : option ? '$' + option.bidPrice.toFixed(2) : PLACEHOLDER}
      </PriceButton>
    ),
    [disabled, buySelected, option, isLoadingOrderBook, handleSelect],
  );

  return (
    <>
      <Cell component="td" className={classes.iv}>
        {isLoadingOrderBook ? (
          <Skeleton />
        ) : option ? (
          parseBigNumber(new BigNumber(option.iv), 0, 2) + '%'
        ) : (
          PLACEHOLDER
        )}
      </Cell>
      {/* Desktop view */}
      <Hidden mdDown>
        <TableCell>
          {isLoadingOrderBook ? <Skeleton /> : option ? `${option.bidSize.toFixed(2)}` : PLACEHOLDER}
        </TableCell>
        <Cell>{BidPriceButton}</Cell>
        <Cell>{AskPriceButton}</Cell>
        <TableCell>
          {isLoadingOrderBook ? <Skeleton /> : option ? `${option.askSize.toFixed(2)}` : PLACEHOLDER}
        </TableCell>
      </Hidden>

      {/* Tablet and mobile view */}
      <Hidden lgUp>
        <Cell>
          <Box className={classes.mobilePrice}>
            <Typography variant="caption">Bid</Typography>
            {BidPriceButton}
          </Box>
          <Box className={clsx(classes.mobilePrice, classes.mobileMargin)}>
            <Typography variant="caption">Ask</Typography>
            {AskPriceButton}
          </Box>
        </Cell>
        <Cell>
          <Typography variant="caption" component="div">
            {option ? `${option.bidSize.toFixed(2)}` : PLACEHOLDER}
          </Typography>
          <Typography variant="caption" component="div" className={classes.mobileMargin}>
            {option ? `${option.askSize.toFixed(2)}` : PLACEHOLDER}
          </Typography>
        </Cell>
      </Hidden>
      <Cell style={{ paddingLeft: '0.5em', minWidth: '2em' }}>
        <IconButton aria-label="expand row" size="small" onClick={handleToggleOpen}>
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Cell>
    </>
  );
};

export default OptionCell;
