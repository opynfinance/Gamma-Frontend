import React, { useState, useEffect, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import { toDateString } from '../../utils/time';
import Main from './Main';
import ConfirmingCard from '../ConfirmingCard';
import ConfirmCard from '../ConfirmCard';
import { parseNumber } from '../../utils/parse';
import { TradeAction } from '../../utils/constants';
import { roundTwoDecimals } from '../../utils/calculations';
import { OToken, ERC20 } from '../../types';
import ActionCard from '../ActionCard';

const useStyles = makeStyles(theme => ({
  root: {},
  body: {
    marginTop: 16,
    fontSize: 16,
  },
}));

type OrderTicketProps = {
  underlying: ERC20;
  collateral: ERC20;
  expiry: any;
  isPut: boolean;
  firstAction: TradeAction;
  handleActionChange: any;
  selectedOTokens: OToken[];
  underlyingPrice: BigNumber;
};

const OrderTicket = ({
  underlying,
  collateral,
  expiry,
  isPut,
  firstAction,
  handleActionChange,
  selectedOTokens,
  underlyingPrice,
}: OrderTicketProps) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const [input, setInput] = React.useState<BigNumber>(new BigNumber(0));

  const [selectionType, setSelectionType] = useState('simple');

  useEffect(() => {
    if (selectedOTokens.length === 2) {
      return setSelectionType('complex');
    }
    return setSelectionType('simple');
  }, [selectedOTokens.length]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const decimals = event.target.value.toString().split('.')[1]
        ? event.target.value.toString().split('.')[1].length
        : 0;

      const maxDecimals = 8;
      const value =
        decimals >= maxDecimals ? Number(Number(event.target.value).toFixed(maxDecimals)) : Number(event.target.value);
      if (value >= 0) setInput(new BigNumber(value));
    },
    [setInput],
  );

  const handleNext = useCallback(() => {
    if (firstAction === TradeAction.SELL) {
      if (activeStep === 3) {
        setActiveStep(0);
      } else {
        setActiveStep(activeStep + 1);
      }
    } else {
      if (activeStep === 2) {
        setActiveStep(0);
      } else {
        setActiveStep(activeStep + 1);
      }
    }
  }, [firstAction, activeStep]);

  const getAction = useCallback(() => {
    if (selectionType === 'simple') {
      return firstAction === TradeAction.BUY ? 'Bought' : 'Sold';
    } else {
      return firstAction === TradeAction.BUY ? 'Credit Spread on' : 'Debit Spread on';
    }
  }, [selectionType, firstAction]);

  const getPremium = useCallback(() => {
    if (selectionType === 'simple') {
      // Todo: adjust number based on bids
      return parseNumber(roundTwoDecimals(Number(input) * Number()));
    } else {
      //TODO replace 0.96 - 0.12 w/ higher premium - lower premium props
      return parseNumber(roundTwoDecimals(Number(input) * (0.96 - 0.12)));
    }
  }, [input, selectionType]);

  const description = useCallback(() => {
    return (
      <Typography align="center" className={classes.body} variant="body2">
        {getAction()} {input} {underlying.symbol} {selectionType === 'simple' ? (isPut ? 'Put' : 'Calls') : null} for{' '}
        {getPremium()} {collateral}
      </Typography>
    );
  }, [classes.body, collateral, getAction, getPremium, input, isPut, selectionType, underlying.symbol]);

  const txHash = 'temp';

  return (
    <ActionCard
      noMargin
      noButton
      noStick={false}
      title={getHeaderText({
        underlying,
        expiry,
        isPut,
        selectedOTokens,
        firstAction,
      })}
    >
      {activeStep === 0 || activeStep === 1 ? (
        <Main
          underlyingPrice={underlyingPrice}
          collateral={collateral}
          underlying={underlying}
          expiry={expiry}
          isPut={isPut}
          handleNext={handleNext}
          firstAction={firstAction}
          handleActionChange={handleActionChange}
          step={activeStep}
          handleInputChange={handleInputChange}
          input={input}
          setInput={setInput}
          selectedOTokens={selectedOTokens}
          title={getHeaderText({
            underlying,
            expiry,
            isPut,
            selectedOTokens,
            firstAction,
          })}
        />
      ) : // <ConfirmCard handleNext={handleNext} description={description()} txHash={txHash} />
      activeStep === 0 ? (
        <ConfirmingCard handleNext={handleNext} description={description()} txHash={txHash} />
      ) : (
        <ConfirmCard handleNext={handleNext} description={description()} txHash={txHash} />
      )}
    </ActionCard>
  );
};

const getHeaderText = ({
  underlying,
  expiry,
  isPut,
  firstAction,
  selectedOTokens,
}: {
  underlying: ERC20;
  expiry: number;
  isPut: boolean;
  firstAction: TradeAction;
  selectedOTokens: OToken[];
}) =>
  [
    underlying.symbol,
    toDateString(expiry),
    selectedOTokens.length >= 1 ? (isPut ? 'Put' : 'Call') : '',
    selectedOTokens.length === 2 ? getSpreadText({ isPut, firstAction }) : '',
  ].join(' ');

const getSpreadText = ({ isPut, firstAction }: { isPut: boolean; firstAction: TradeAction }) =>
  // strikes are assumed to be in order
  (!isPut && firstAction === TradeAction.BUY) || (isPut && firstAction === TradeAction.SELL)
    ? 'Debit Spread'
    : 'Credit Spread';

export default OrderTicket;
