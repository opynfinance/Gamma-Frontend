import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { BigNumber } from 'bignumber.js';
import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import ReactGA from 'react-ga';

// import GasFee from '../GasFee';
import { SpreadTicketInfo } from '../OrderTicket/TicketInfo';
import MarketImpact from '../MarketImpact';
import TradeButton from '../TradeTicketButton';
import { calculateSpreadCollateral, fromTokenAmount } from '../../utils/calculations';
import { OToken } from '../../types';
import { calculateOrderOutput, calculateOrderInput, getMarketImpact, sortAsks } from '../../utils/0x-utils';
import {
  useWallet,
  useControllerActions,
  useApproval,
  useController,
  useZeroX,
  useGasPrice,
  Spender,
  useOrderTicketItemStyle,
  // use0xGasFee,
} from '../../hooks';
import { PAYABLE_PROXY, Errors, USDC_ADDRESS } from '../../utils/constants';
import { TradeAction } from '../../utils/constants';
import { ERC20 } from '../../types';
import { useToast } from '../../context/toast';
import ProtocolFee from '../ProtocolFee';
import { parseTxErrorMessage, parseTxErrorType } from '../../utils/parse';

const accountOperatorQuery = loader('../../queries/accountOperator.graphql');

enum SpreadSteps {
  APPROVE_BUY,
  BUY,
  APPROVE_COLLATERAL_OR_WRAPPER,
  APPROVE_LONG,
  CREATE_SPREAD,
  APPROVE_SELL,
  SELL,
}

type CreateSpreadProps = {
  firstAction: TradeAction;
  otokenBalances: BigNumber[];
  collateral: ERC20;
  collateralBalance: BigNumber;
  USDCBalance: BigNumber;
  underlyingBalance: BigNumber;
  input: BigNumber;
  underlyingPrice: BigNumber;
  setInput: React.Dispatch<React.SetStateAction<BigNumber>>;
  otokens: OToken[];
  setError: any;
  isError: any;
  setIsConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
  setTxHash: React.Dispatch<React.SetStateAction<string>>;
  setConfirmDescription: React.Dispatch<React.SetStateAction<string>>;
};

/**
 * In create spread, user either
 * 1. Use existing Long oToken with collateral to mint new short, and sell short
 * 2. Buy long oToken + mint new short + sell short
 * @param param0
 */
const CreateSpread = ({
  firstAction,
  setError,
  isError,
  otokenBalances,
  collateral,
  collateralBalance,
  underlyingBalance,
  input,
  setInput,
  otokens,
  setIsConfirmed,
  setTxHash,
  setConfirmDescription,
  USDCBalance,
  underlyingPrice,
}: CreateSpreadProps) => {
  const toast = useToast();
  const longOToken = useMemo(() => (firstAction === TradeAction.BUY ? otokens[0] : otokens[1]), [otokens, firstAction]);

  const shortOToken = useMemo(() => (firstAction === TradeAction.BUY ? otokens[1] : otokens[0]), [
    otokens,
    firstAction,
  ]);

  const longOTokenBalance = useMemo(() => (firstAction === TradeAction.BUY ? otokenBalances[0] : otokenBalances[1]), [
    otokenBalances,
    firstAction,
  ]);
  const shortOTokenBalance = useMemo(() => (firstAction === TradeAction.BUY ? otokenBalances[1] : otokenBalances[0]), [
    otokenBalances,
    firstAction,
  ]);

  const { fillOrders, getProtocolFee, getProtocolFeeInUsdc, orderBooks } = useZeroX();

  const [isLoading, setIsLoading] = useState(false);

  // local boolean to prevent low update on front end
  const [hasApprovedCollateral, setHasApprovedCollateral] = useState(false);
  const [hasApprovedLong, setHasApprovedLong] = useState(false); // user has "send approve" long tx
  const [hasApprovedPaymentToken, setHasApproval0xPaymentToken] = useState(false); // user has send approve USDC tx
  const [hasApproveShort, setHasApprovedShort] = useState(false);
  // const [isExchangeTxn, setIsExchangeTxn] = useState(false);

  const [hasSetProxyOperator, setHasSetOperator] = useState(true);

  const [steps, setSteps] = useState(SpreadSteps.APPROVE_BUY);

  // change this to get value from 2 inputs when we enable ratio spread.
  const longAmount = useMemo(() => fromTokenAmount(input, 8).integerValue(), [input]);
  const shortAmount = useMemo(() => fromTokenAmount(input, 8).integerValue(), [input]);

  const { address: account, networkId, ethBalance } = useWallet();

  const { data: accountOperatorData } = useQuery(accountOperatorQuery, {
    variables: {
      id: `${account}-${PAYABLE_PROXY[networkId]}`.toLowerCase(),
    },
  });

  useEffect(() => {
    setHasSetOperator(accountOperatorData ? accountOperatorData.accountOperator !== null : false);
  }, [accountOperatorData]);

  const classes = useOrderTicketItemStyle();

  const { asks: longAsks } = useMemo(() => {
    const target = orderBooks.find(b => b.id === longOToken.id);
    return target ? target : { asks: [] };
  }, [orderBooks, longOToken.id]);

  const { bids: shortBids } = useMemo(() => {
    const target = orderBooks.find(b => b.id === shortOToken.id);
    return target ? target : { bids: [] };
  }, [orderBooks, shortOToken.id]);

  const paymentToken = useMemo(() => USDC_ADDRESS[networkId], [networkId]);

  const { approve: approve0xPayment, allowance: paymentAllowance, loading: loadingPaymentAllowance } = useApproval(
    paymentToken,
    Spender.ZeroXExchange,
  );
  const { approve: approve0xShort, allowance: zxShortAllowance, loading: loadingShortAllowance } = useApproval(
    shortOToken.id,
    Spender.ZeroXExchange,
  );

  // margin pool needs allowance for long and collateral
  const {
    approve: approveCollateral,
    allowance: poolCollateralAllowance,
    loading: loadingCollateralAllowance,
  } = useApproval(collateral.id, Spender.MarginPool);
  const { approve: approveLongOToken, allowance: poolLongAllowance, loading: loadingLongAllowance } = useApproval(
    longOToken.id,
    Spender.MarginPool,
  );

  const isLoadingAllowance =
    loadingPaymentAllowance || loadingShortAllowance || loadingCollateralAllowance || loadingLongAllowance;

  const controllerState = useController();
  const { createSpread } = useControllerActions();

  const buyLongOTokenAmount = useMemo(
    () => (longAmount.gt(longOTokenBalance) ? longAmount.minus(longOTokenBalance) : new BigNumber(0)),
    [longOTokenBalance, longAmount],
  );
  const [hasBoughtOToken, setHasBoughtOToken] = useState(false);
  const [hasMintedOToken, setHasMintedOToken] = useState(false);

  const [onClick, setOnClick] = useState<Function>(() => {});
  const [buttonLabel, setButtonLabel] = useState('Init');

  const gasPrice = useGasPrice(15);

  const {
    error: buyError,
    ordersToFill: buyOrdersToFill,
    amounts: fillBuyAmounts,
    sumInput: totalCost,
  } = useMemo(() => {
    const reversedAsks = longAsks.sort(sortAsks);
    return calculateOrderInput(reversedAsks, buyLongOTokenAmount, {
      gasPrice: gasPrice.fastest,
      ethPrice: underlyingPrice,
    });
  }, [longAsks, buyLongOTokenAmount, gasPrice.fastest, underlyingPrice]);

  const {
    error: sellError,
    ordersToFill: sellOrdersToFill,
    amounts: fillSellAmounts,
    sumOutput: totalPremium,
  } = useMemo(() => {
    return calculateOrderOutput(shortBids, shortAmount, { gasPrice: gasPrice.fastest, ethPrice: underlyingPrice });
  }, [shortBids, shortAmount, gasPrice.fastest, underlyingPrice]);

  const buyProtocolFee = useMemo(() => {
    return getProtocolFee(buyOrdersToFill);
  }, [getProtocolFee, buyOrdersToFill]);

  const { error: marketBuyError, marketImpact: buyMarketImpact } = useMemo(() => {
    return getMarketImpact(TradeAction.BUY, longAsks, buyLongOTokenAmount, totalCost, buyProtocolFee, gasPrice.fastest);
  }, [longAsks, totalCost, buyLongOTokenAmount, buyProtocolFee, gasPrice.fastest]);

  const sellProtocolFee = useMemo(() => {
    return getProtocolFee(sellOrdersToFill);
  }, [getProtocolFee, sellOrdersToFill]);

  const { error: marketSellError, marketImpact: sellMarketImpact } = useMemo(() => {
    return getMarketImpact(TradeAction.SELL, shortBids, shortAmount, totalPremium, sellProtocolFee, gasPrice.fastest);
  }, [shortBids, shortAmount, totalPremium, sellProtocolFee, gasPrice.fastest]);

  const neededCollateral = useMemo(() => calculateSpreadCollateral(longOToken, shortOToken, shortAmount), [
    longOToken,
    shortOToken,
    shortAmount,
  ]);

  // const buyArgs = { orders: buyOrdersToFill, amounts: fillBuyAmounts, useWeth };
  // const buyGasToPay = use0xGasFee(buyArgs, isExchangeTxn);

  // const sellArgs = { orders: sellOrdersToFill, amounts: fillSellAmounts, useWeth };
  // const sellGasToPay = use0xGasFee(sellArgs, isExchangeTxn);

  useEffect(() => {
    if (sellError !== Errors.NO_ERROR) return setError(sellError);
    if (buyError !== Errors.NO_ERROR) return setError(buyError);
    if (marketBuyError !== Errors.NO_ERROR && steps === SpreadSteps.BUY) return setError(marketBuyError);
    if (marketSellError !== Errors.NO_ERROR && steps === SpreadSteps.SELL) return setError(marketSellError);
    if (totalCost.gt(USDCBalance) || USDCBalance.isZero()) return setError(Errors.INSUFFICIENT_USDC_BALANCE);
    if (collateral.symbol === 'WETH' && neededCollateral.gt(ethBalance)) return setError(Errors.INSUFFICIENT_BALANCE);
    if (collateral.symbol !== 'WETH' && neededCollateral.gt(collateralBalance))
      return setError(Errors.INSUFFICIENT_BALANCE);
    // if (steps === SpreadSteps.BUY && ethBalance.lt(buyGasToPay.gasToPay))
    //   return setError(Errors.INSUFFICIENT_ETH_GAS_BALANCE);
    // if (steps === SpreadSteps.SELL && ethBalance.lt(sellGasToPay.gasToPay))
    // return setError(Errors.INSUFFICIENT_ETH_GAS_BALANCE);
    setError(Errors.NO_ERROR);
  }, [
    sellError,
    buyError,
    setError,
    collateral.symbol,
    ethBalance,
    collateralBalance,
    neededCollateral,
    totalCost,
    USDCBalance,
    // buyGasToPay,
    // sellGasToPay,
    marketBuyError,
    marketSellError,
    steps,
  ]);

  // check if need to approve to sell "short oToken" on 0x
  const hasEnough0xShortAllowance = useMemo(() => zxShortAllowance.gte(shortAmount), [zxShortAllowance, shortAmount]);

  // check if user has enough USDC allowance to buy "long oToken" on 0x
  const hasEnough0xPaymentTokenAllowance = useMemo(() => paymentAllowance.gte(totalCost), [
    paymentAllowance,
    totalCost,
  ]);

  // check if user has enough allowance on collateral
  const hasEnoughPoolCollateralAllowance = useMemo(() => {
    if (collateral.symbol === 'WETH') return true;
    return poolCollateralAllowance.gte(neededCollateral);
  }, [neededCollateral, collateral, poolCollateralAllowance]);

  const hasEnoughPoolLongAllowance = useMemo(() => poolLongAllowance.gte(longAmount), [poolLongAllowance, longAmount]);

  const handleError = useCallback(
    (error: Error, errorStep?: string) => {
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

  const approve0xUSDC = useCallback(async () => {
    if (!approve0xPayment) return;
    ReactGA.event({
      category: 'Spread',
      action: 'ClickedApproveUsdc_0/6',
    });
    setIsLoading(true);
    await approve0xPayment({
      callback: () => {
        setIsLoading(false);
        setHasApproval0xPaymentToken(true);
        ReactGA.event({
          category: 'Transactions',
          action: 'Success',
          label: 'Spread_Approve0xPaymentToken_0/6',
        });
      },
      onError: (error: Error) => handleError(error, 'Spread_Approve0xPaymentToken_0/6'),
    });
  }, [approve0xPayment, handleError]);

  const approve0xShortOToken = useCallback(async () => {
    if (!approve0xShort) return;
    ReactGA.event({
      category: 'Spread',
      action: 'ClickedApproveOtoken_5/6',
    });
    setIsLoading(true);
    await approve0xShort({
      callback: () => {
        setIsLoading(false);
        setHasApprovedShort(true);
        ReactGA.event({
          category: 'Transactions',
          action: 'Success',
          label: 'Spread_HasApprovedShort_5/6',
        });
      },
      onError: (error: Error) => handleError(error, 'Spread_HasApprovedShort_5/6'),
    });
  }, [approve0xShort, handleError]);

  const addPayableProxyAsOperator = useCallback(async () => {
    if (controllerState === undefined) return;
    const { addOperator } = controllerState;
    if (!addOperator) return;
    ReactGA.event({
      category: 'Spread',
      action: 'ClickedApproveWethWrapper_2/6',
    });
    setIsLoading(true);
    try {
      addOperator({
        operator: PAYABLE_PROXY[networkId].toLowerCase(),
        isOperator: true,
        callback: () => {
          setHasSetOperator(true);
          setIsLoading(false);
          ReactGA.event({
            category: 'Transactions',
            action: 'Success',
            label: 'Spread_HasSetOperator_2/6',
          });
        },
      });
    } catch (error) {
      handleError(error, 'Spread_HasSetOperator_2/6');
    }
  }, [controllerState, handleError, networkId]);

  const approveMarginPoolCollateral = useCallback(async () => {
    if (!approveCollateral) return;
    ReactGA.event({
      category: 'Spread',
      action: 'ClickedApproveCollateral_2/6',
    });
    setIsLoading(true);
    approveCollateral({
      callback: () => {
        setHasApprovedCollateral(true);
        setIsLoading(false);
        ReactGA.event({
          category: 'Transactions',
          action: 'Success',
          label: 'Spread_HasApprovedCollateral_2/6',
        });
      },
      onError: (error: Error) => handleError(error, 'Spread_HasApprovedCollateral_2/6'),
    });
  }, [approveCollateral, handleError]);

  const approveMarginPoolLong = useCallback(async () => {
    if (!approveLongOToken) return;
    ReactGA.event({
      category: 'Spread',
      action: 'ClickedApproveLongOtoken_3/6',
    });
    setIsLoading(true);
    approveLongOToken({
      callback: () => {
        setHasApprovedLong(true);
        setIsLoading(false);
        ReactGA.event({
          category: 'Transactions',
          action: 'Success',
          label: 'Spread_HasApprovedLong_3/6',
        });
      },
      onError: (error: Error) => handleError(error, 'Spread_HasApprovedLong_3/6'),
    });
  }, [approveLongOToken, handleError]);

  // create spread
  const mint = useCallback(async () => {
    if (!createSpread) return;
    const depositor = collateral.symbol === 'WETH' ? PAYABLE_PROXY[networkId] : account;
    ReactGA.event({
      category: 'Spread',
      action: 'ClickedCreateSpread_4/6',
    });
    setIsLoading(true);
    const args = {
      account,
      vaultId: 0, // will be override
      shortOToken: shortOToken.id,
      shortAmount: shortAmount,
      collateralAsset: collateral.id,
      collateralAmount: neededCollateral,
      longOToken: longOToken.id,
      longAmount: longAmount,
      depositor,
    };

    const callback = () => {
      setIsLoading(false);
      setHasMintedOToken(true);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'Spread_HasMintedOToken_4/6',
      });
    };

    await createSpread(args, callback, (error: Error) => handleError(error, 'Spread_HasMintedOToken_4/6'));
  }, [
    createSpread,
    collateral.symbol,
    collateral.id,
    networkId,
    account,
    shortOToken.id,
    shortAmount,
    neededCollateral,
    longOToken.id,
    longAmount,
    handleError,
  ]);

  // buy oToken from 0x (no mint and sell)
  const buyLongToken = useCallback(async () => {
    ReactGA.event({
      category: 'Spread',
      action: 'ClickedBuyOtoken_1/6',
    });
    setIsLoading(true);
    const args = { orders: buyOrdersToFill, amounts: fillBuyAmounts };

    await fillOrders(
      args,
      () => {
        setIsLoading(false);
        setHasBoughtOToken(true);
        ReactGA.event({
          category: 'Transactions',
          action: 'Success',
          label: 'Spread_HasBoughtOToken_1/6',
        });
      },
      (error: Error) => handleError(error, 'Spread_HasBoughtOToken_1/6'),
    );
  }, [fillOrders, fillBuyAmounts, buyOrdersToFill, handleError]);

  // simply sell through 0x exchange.
  const sellShortToken = useCallback(async () => {
    ReactGA.event({
      category: 'Spread',
      action: 'ClickedSellOtoken_6/6',
    });
    setIsLoading(true);
    const args = { orders: sellOrdersToFill, amounts: fillSellAmounts };
    const callback = () => {
      setIsLoading(false);
      // show confirm card
      const otoken1Strike = otokens[0].strikePrice.toString();
      const otoken2Strike = otokens[1].strikePrice.toString();
      setConfirmDescription(`Create ${input} ${otoken1Strike} / ${otoken2Strike} spread.`);
      setInput(new BigNumber(0));
      setIsConfirmed(true);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'Spread_SoldOToken_6/6',
      });
    };
    const tx = await fillOrders(args, callback, (error: Error) => handleError(error, 'Spread_SoldOToken_6/6'));
    setTxHash(tx);
  }, [
    sellOrdersToFill,
    otokens,
    setConfirmDescription,
    input,
    setInput,
    setIsConfirmed,
    fillOrders,
    fillSellAmounts,
    setTxHash,
    handleError,
  ]);

  useEffect(() => {
    if (input.isZero() || (buyLongOTokenAmount.gt(0) && !hasBoughtOToken)) {
      if (!hasEnough0xPaymentTokenAllowance && !hasApprovedPaymentToken) {
        // approve USDC to buy long
        setSteps(SpreadSteps.APPROVE_BUY);
        // setIsExchangeTxn(false);
        setOnClick(() => approve0xUSDC);
        setButtonLabel('Approve USDC');
        return;
      } else {
        // buy long oToken
        setSteps(SpreadSteps.BUY);
        // setIsExchangeTxn(true);
        setOnClick(() => buyLongToken);
        setButtonLabel('Buy oToken');
        return;
      }
    } else if (neededCollateral.gt(0) && !hasMintedOToken) {
      if (collateral.symbol !== 'WETH' && !hasEnoughPoolCollateralAllowance && !hasApprovedCollateral) {
        // approve collateral to buy long
        setSteps(SpreadSteps.APPROVE_COLLATERAL_OR_WRAPPER);
        // setIsExchangeTxn(false);
        setOnClick(() => approveMarginPoolCollateral);
        setButtonLabel(`Approve ${collateral.symbol}`);
        return;
      } else if (collateral.symbol === 'WETH' && !hasSetProxyOperator) {
        setSteps(SpreadSteps.APPROVE_COLLATERAL_OR_WRAPPER);
        // setIsExchangeTxn(false);
        setOnClick(() => addPayableProxyAsOperator);
        setButtonLabel('Approve WETH Wrapper');
        return;
      }
    }
    if (!hasEnoughPoolLongAllowance && !hasApprovedLong) {
      // approve long allowance
      setSteps(SpreadSteps.APPROVE_LONG);
      // setIsExchangeTxn(false);
      setOnClick(() => approveMarginPoolLong);
      setButtonLabel('Approve long oToken');
      return;
    }

    if (!hasMintedOToken) {
      // mint token
      setSteps(SpreadSteps.CREATE_SPREAD);
      // setIsExchangeTxn(false);
      setOnClick(() => mint);
      setButtonLabel('Create Spread');
      return;
    } else {
      if (!hasEnough0xShortAllowance && !hasApproveShort) {
        setSteps(SpreadSteps.APPROVE_LONG);
        // setIsExchangeTxn(false);
        setOnClick(() => approve0xShortOToken);
        setButtonLabel('Approve oToken');
        return;
      }

      setSteps(SpreadSteps.SELL);
      // setIsExchangeTxn(true);
      setOnClick(() => sellShortToken);
      setButtonLabel('Sell oToken');
      return;
    }
  }, [
    buyLongOTokenAmount,
    hasEnough0xShortAllowance,
    hasEnough0xPaymentTokenAllowance,
    approve0xUSDC,
    neededCollateral,
    hasEnoughPoolCollateralAllowance,
    approveMarginPoolCollateral,
    hasSetProxyOperator,
    addPayableProxyAsOperator,
    hasEnoughPoolLongAllowance,
    approveMarginPoolLong,
    hasMintedOToken,
    mint,
    sellShortToken,
    approve0xShortOToken,
    buyLongToken,
    hasBoughtOToken,
    collateral,
    input,
    hasApprovedCollateral,
    hasApprovedLong,
    hasApprovedPaymentToken,
    hasApproveShort,
  ]);

  return (
    <>
      <SpreadTicketInfo
        amount={input}
        shortOToken={shortOToken}
        longOToken={longOToken}
        usdcBalance={USDCBalance}
        underlyingBalance={underlyingBalance}
        collateralRequired={neededCollateral}
        shortOTokenBalance={shortOTokenBalance}
        longOTokenBalance={longOTokenBalance}
        totalPremium={totalPremium}
        totalCost={totalCost}
        protocolFee={getProtocolFee(sellOrdersToFill.concat(buyOrdersToFill))}
        protocolFeeInUsdc={getProtocolFeeInUsdc(sellOrdersToFill.concat(buyOrdersToFill))}
        showWarning={buttonLabel.includes('Sell') || buttonLabel.includes('Buy')}
        warningAction={buttonLabel.includes('Sell') ? 'sell' : 'buy'}
      />
      <List disablePadding>
        <ProtocolFee
          protocolFee={getProtocolFee(sellOrdersToFill.concat(buyOrdersToFill))}
          // useWeth={useWeth}
          // setUseWeth={setUseWeth}
          showWarning={buttonLabel.includes('Sell') || buttonLabel.includes('Buy')}
          warningAction={buttonLabel.includes('Sell') ? 'sell' : 'buy'}
        />
        {/* {steps === SpreadSteps.BUY ? (
          <GasFee gasToPay={buyGasToPay.gasToPay} asset={'ETH'} action={'buy'} />
        ) : steps === SpreadSteps.SELL ? (
          <GasFee gasToPay={sellGasToPay.gasToPay} asset={'ETH'} action={'buy'} />
        ) : null}  */}
        {(steps === SpreadSteps.BUY || steps === SpreadSteps.SELL) && (
          <MarketImpact
            marketImpact={steps === SpreadSteps.BUY ? buyMarketImpact : sellMarketImpact}
            action={steps === SpreadSteps.BUY ? TradeAction.BUY : TradeAction.SELL}
          />
        )}
        <Divider className={classes.pos} />
        <Typography className={classes.step}>Step: {steps} / 6</Typography>
        <LinearProgress className={classes.bar} variant="determinate" value={(steps / 6) * 100} />
        {isLoading ? (
          <Typography variant="overline" display="block" align="center" className={classes.notice}>
            <CircularProgress />
          </Typography>
        ) : (
          <TradeButton
            buttonLabel={buttonLabel}
            onClick={onClick}
            disabled={input.isZero() || isError || isLoadingAllowance}
          />
        )}
        <br />
      </List>
    </>
  );
};

export default CreateSpread;
