import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { BigNumber } from 'bignumber.js';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';

import TradeButton from '../TradeTicketButton';
import SmallLimitOrderWarning from '../SmallLimitOrderWarning';
import ExcludeLimitOrderWarning from '../ExcludeLimitOrderWarning';
import { BuyTicketInfo } from '../OrderTicket/TicketInfo';
// import GasFee from '../GasFee';
import { OToken } from '../../types';
import { parseTxErrorMessage, parseTxErrorType, parseBigNumber } from '../../utils/parse';
import { calculateOrderInput, getMarketImpact } from '../../utils/0x-utils';
import { toTokenAmount, fromTokenAmount } from '../../utils/calculations';
import { Errors, CreateMode, TradeAction, ESTIMATE_FILL_COST_PER_GWEI } from '../../utils/constants';
import {
  useZeroX,
  useApproval,
  Spender,
  useOrderTicketItemStyle,
  useAddresses,
  useToast,
  useWallet,
  // use0xGasFee,
  useGasPrice,
} from '../../hooks';
import ReactGA from 'react-ga';
import TxSteps, { TxStepType } from '../OrderTicket/TxSteps';
import { ListItem } from '../ActionCard';

type BuyCheckoutProps = {
  mode: CreateMode;
  underlyingPrice: BigNumber;
  otokenBalance: BigNumber;
  USDCBalance: BigNumber;
  underlyingBalance: BigNumber;
  input: BigNumber;
  // setInput: any;
  otoken: OToken;
  setError: any;
  isError: boolean;
  setIsConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
  setTxHash: React.Dispatch<React.SetStateAction<string>>;
  setConfirmDescription: React.Dispatch<React.SetStateAction<string>>;
  price: BigNumber;
  deadline: number;
};

const BuyCheckout = ({
  mode,
  setError,
  isError,
  USDCBalance,
  underlyingBalance,
  otokenBalance,
  input,
  underlyingPrice,
  // setInput,
  otoken,
  setIsConfirmed,
  setTxHash,
  setConfirmDescription,
  price,
  deadline,
}: BuyCheckoutProps) => {
  const gasPrice = useGasPrice(15);

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const [hasApprove0x, setHasApproved0x] = useState(false);

  // const [useWeth, setUseWeth] = useState(localStorage.getItem('protocol-fee-token') === 'weth');

  const buyAmount = useMemo(() => fromTokenAmount(input, 8), [input]).integerValue();

  const classes = useOrderTicketItemStyle();

  const { fillOrders, getProtocolFee, getProtocolFeeInUsdc, createOrder, broadcastOrder } = useZeroX();

  const { ethBalance } = useWallet();

  const usdcAddress = useAddresses().usdc;

  const { allowance: usdcAllowance, approve: approveUSDC, loading: isLoadingAllowance } = useApproval(
    usdcAddress,
    Spender.ZeroXExchange,
  );

  const [steps, setSteps] = useState(0);
  // const [isExchangeTxn, setIsExchangeTxn] = useState(false);

  const { orderBooks } = useZeroX();

  const { asks } = useMemo(() => {
    const target = orderBooks.find(book => book.id === otoken.id);
    return target ? target : { asks: [] };
  }, [otoken, orderBooks]);

  const { error: fillOrderError, ordersToFill, amounts: fillAmounts, sumInput: requiredUSDC } = useMemo(() => {
    // const reversedAsks = asks.sort(sortAsks);
    return calculateOrderInput(asks, buyAmount, { gasPrice: gasPrice.fastest, ethPrice: underlyingPrice });
  }, [asks, buyAmount, underlyingPrice, gasPrice.fastest]);

  const { error: marketError, marketImpact } = useMemo(() => {
    return getMarketImpact(
      TradeAction.BUY,
      asks,
      buyAmount,
      requiredUSDC,
      getProtocolFee(ordersToFill),
      gasPrice.fastest,
    );
  }, [asks, buyAmount, requiredUSDC, ordersToFill, getProtocolFee, gasPrice.fastest]);

  const hasEnoughAllowanceFor0x = useMemo(() => usdcAllowance.gt(requiredUSDC), [requiredUSDC, usdcAllowance]);

  // pause estimation when isError is true
  // const gasToPay = use0xGasFee(ordersToFill, fillAmounts, true, isExchangeTxn, isError);

  const totalCost = useMemo(() => {
    if (mode === CreateMode.Market) return requiredUSDC;
    return fromTokenAmount(input.times(price), 6).integerValue();
  }, [requiredUSDC, input, mode, price]);

  // set check if user has enough USDC to purchase
  useEffect(() => {
    let currDate = Math.floor(Date.now() / 1000);
    let deadlineTimestamp = +deadline + +currDate;

    if (mode === CreateMode.Market) {
      // set liquidity error first
      if (fillOrderError !== Errors.NO_ERROR) setError(fillOrderError);
      else if (marketError !== Errors.NO_ERROR) setError(marketError);
      else if (requiredUSDC.gt(USDCBalance)) setError(Errors.INSUFFICIENT_USDC_BALANCE);
      else setError(Errors.NO_ERROR);
      return;
    } else if (fromTokenAmount(input.times(price), 6).integerValue().gt(USDCBalance)) {
      setError(Errors.INSUFFICIENT_USDC_BALANCE);
    } else if (deadlineTimestamp > otoken.expiry && CreateMode.Limit) {
      setError(Errors.DEADLINE_PAST_EXPIRY);
    } else {
      setError(Errors.NO_ERROR);
    }
  }, [
    totalCost,
    USDCBalance,
    setError,
    fillOrderError,
    ethBalance,
    mode,
    marketError,
    steps,
    requiredUSDC,
    input,
    price,
    deadline,
    otoken.expiry,
  ]);

  useEffect(() => {
    if (!hasEnoughAllowanceFor0x && !hasApprove0x) {
      // approve USDC / ETH
      setSteps(0);
    } else {
      // buy otoken
      setSteps(1);
    }
  }, [hasEnoughAllowanceFor0x, hasApprove0x]);

  const handleError = useCallback(
    (error, errorStep?: string) => {
      setIsLoading(false);
      const message = parseTxErrorMessage(error);
      const errorType = parseTxErrorType(error);
      toast.error(message);
      if (errorStep)
        ReactGA.event({
          category: 'Transactions',
          action: errorType,
          label: `${errorStep} - ${message}`,
        });
    },
    [toast],
  );

  const approve = useCallback(async () => {
    if (!approveUSDC) return;
    ReactGA.event({
      category: 'Buy',
      action: 'ClickedApproveUsdc_0/1',
    });
    setIsLoading(true);
    const callback = () => {
      setHasApproved0x(true);
      setIsLoading(false);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'Buy_ApproveUSDC',
      });
    };
    await approveUSDC({ callback, onError: (error: any) => handleError(error, 'Buy_FilledOrder') });
  }, [approveUSDC, handleError]);

  // simply buy through 0x exchange
  const pureBuy = useCallback(async () => {
    setIsLoading(true);
    ReactGA.event({
      category: 'Buy',
      action: 'ClickedBuyOtoken_1/1',
    });
    if (ordersToFill.length === 0) {
      toast.error('No orders to fill');
    }
    const args = {
      orders: ordersToFill,
      amounts: fillAmounts,
    };
    const callback = () => {
      setIsConfirmed(true);
      setConfirmDescription(`Successfully bought ${toTokenAmount(buyAmount, 8).toFixed(4)} oTokens!`);
      setIsLoading(false);
      // setInput(0);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'Buy_FilledOrder',
      });
    };
    const tx = await fillOrders(args, callback, (error: any) => handleError(error, 'Buy_FilledOrder'));
    setTxHash(tx);
  }, [
    ordersToFill,
    handleError,
    fillOrders,
    buyAmount,
    fillAmounts,
    // setInput,
    setConfirmDescription,
    setIsConfirmed,
    setTxHash,
    toast,
  ]);

  const createAndBroadcast = useCallback(async () => {
    ReactGA.event({
      category: 'Buy',
      action: 'ClickedCreateLimitOrder',
    });
    const order = await createOrder(usdcAddress, otoken.id, totalCost, fromTokenAmount(input, 8), deadline);
    if (!order) return;
    await broadcastOrder(order);
    if (order) {
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'BuyLimit_OrderCreated',
      });
    }
  }, [createOrder, broadcastOrder, usdcAddress, otoken, totalCost, input, deadline]);

  const isSmallOrder = useMemo(() => {
    const fillCostInUSDC = gasPrice.fast.times(ESTIMATE_FILL_COST_PER_GWEI).times(underlyingPrice);
    const totalPremium = input.times(price);
    return !totalPremium.isZero() && totalPremium.lt(fillCostInUSDC.times(2));
  }, [gasPrice, underlyingPrice, input, price]);

  const protocolFeeInUsdc = getProtocolFeeInUsdc(ordersToFill);

  const netPremiumIsNegative = protocolFeeInUsdc.toNumber() > Number(parseBigNumber(totalCost, 6));

  const buyCheckoutSteps: Array<TxStepType> = useMemo(
    () => [
      { step: 'Approve USDC to 0x trading contract', type: 'APPROVE' },
      { step: mode === CreateMode.Market ? 'Buy oToken' : 'Place limit buy order', type: 'ACTION' },
    ],
    [mode],
  );

  return (
    <>
      <ListItem label={'oToken Balance'} value={parseBigNumber(otokenBalance, otoken.decimals)} />
      <TxSteps steps={buyCheckoutSteps} currentStep={steps} />
      <BuyTicketInfo
        otoken={otoken}
        otokenBalance={otokenBalance}
        amount={new BigNumber(input)}
        usdcBalance={USDCBalance}
        underlyingBalance={underlyingBalance}
        totalCost={totalCost}
        protocolFee={getProtocolFee(ordersToFill)}
        protocolFeeInUsdc={getProtocolFeeInUsdc(ordersToFill)}
        isMarket={mode === CreateMode.Market}
        showWarning={steps === 1}
        marketImpact={marketImpact}
      />
      <List disablePadding>
        {/* Show warning if input * price < gas price * 150000 gas * ethPrice */}
        {mode === CreateMode.Limit && netPremiumIsNegative && !input.isZero() ? (
          <ExcludeLimitOrderWarning />
        ) : mode === CreateMode.Limit && isSmallOrder ? (
          <SmallLimitOrderWarning />
        ) : null}
      </List>
      <Box className={classes.actionButtonBox}>
        {isLoading ? (
          <Typography component="div" display="block" align="center" className={classes.notice}>
            <CircularProgress />
          </Typography>
        ) : steps === 0 ? (
          <TradeButton buttonLabel={'Approve USDC'} disabled={input.isZero() || isError} onClick={() => approve()} />
        ) : (
          steps === 1 && (
            <TradeButton
              buttonLabel={
                mode === CreateMode.Market
                  ? marketError === Errors.LARGE_MARKET_IMPACT
                    ? 'Make Trade Anyway'
                    : 'Buy oToken'
                  : 'Create Order'
              }
              onClick={() => {
                if (mode === CreateMode.Market) pureBuy();
                else createAndBroadcast();
              }}
              disabled={
                isLoadingAllowance || input.isZero() || isError || (mode === CreateMode.Limit && netPremiumIsNegative)
              }
            />
          )
        )}
      </Box>
    </>
  );
};

export default BuyCheckout;
