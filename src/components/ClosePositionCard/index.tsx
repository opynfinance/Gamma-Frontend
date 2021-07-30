import React, { useState, useMemo, useEffect, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import Typography from '@material-ui/core/Typography';
import ReactGA from 'react-ga';

import ConfirmingCard from '../ConfirmingCard';
import ConfirmContent from '../ConfirmCard/ConfirmContent';
import ActionCard, { useActionCard, ListItem } from '../ActionCard';
import { parseBigNumber, parseTxErrorMessage, parseTxErrorType } from '../../utils/parse';
import { Divider } from '../ActionCard';
import AmountInput from '../AmountInput';
import TxSteps, { TxStepType } from '../OrderTicket/TxSteps';
import { Position, OToken } from '../../types';
import {
  useWallet,
  useOTokenBalances,
  usePayableProxy,
  useControllerActions,
  useZeroX,
  useApproval,
  useAddresses,
  Spender,
  useError,
  useToast,
  useGasPrice,
  useTokenPrice,
  // use0xGasFee,
} from '../../hooks';
import { toTokenAmount } from '../../utils/calculations';
import { Errors, TradeAction } from '../../utils/constants';
import { calculateOrderInput, getMarketImpact } from '../../utils/0x-utils';
import BurnRemove from './BurnRemove';
import BuyBack from './BuyBack';

enum CardStep {
  BUYBACK,
  BURN_AND_WITHDRAW,
}

enum CardStatus {
  UNAPPROVED,
  APPROVING,
  APPROVED,
  PENDING,
  CONFIRMED,
}

type ClosePositionProps = {
  position: Position;
};

const buyBackSteps: Array<TxStepType> = [
  { step: 'Buy back oTokens', type: 'ACTION' },
  { step: 'Burn oTokens and redeem collateral', type: 'ACTION' },
];

const ClosePositionCard = ({ position }: ClosePositionProps) => {
  const toast = useToast();

  const { ethBalance, address: account } = useWallet();

  // card state
  const [cardStep, setCardStep] = useState<CardStep>(CardStep.BUYBACK);
  const [cardStatus, setCardStatus] = useState<CardStatus>(CardStatus.APPROVED);

  // transaction
  const [txHash, setTxHash] = useState('');

  // input amoutn, input errors, and balance
  const [amount, setAmount] = useState<BigNumber>(new BigNumber(0));
  const { isError, errorName, errorDescription, errorType, setErrorType } = useError('USDC');
  const { actionCardState, setActionText, setActionDisabled } = useActionCard({
    title: 'Buy Back and Redeem oTokens',
    buttonText: 'Buy Back oTokens',
  });

  // zx
  const {
    fillOrders,
    orderBooks,
    isLoadingOrderBook: isLoadingOrderbook,
    getProtocolFee,
    getProtocolFeeInUsdc,
  } = useZeroX();

  // allowance, approval, operator
  const { usdc: usdcAddress } = useAddresses();
  const { allowance: zxAllowance, approve: approveZx } = useApproval(usdcAddress, Spender.ZeroXExchange);
  const { isProxyOperator, addProxyOperator } = usePayableProxy();

  // balances
  const { balances } = useOTokenBalances(account);

  // if account doesn't have enough short oToken in their wallet, will need to buy back
  const shortBalance = useMemo(() => {
    if (!position.shortOToken) return new BigNumber(0);
    const balanceObj = balances.find(balance => balance.token.id === (position.shortOToken as OToken).id);
    if (!balanceObj) return new BigNumber(0);
    return balanceObj.balance;
  }, [balances, position]);

  const orderBookOfThisToken = orderBooks.find(book => book.id === position.shortOToken?.id);

  const gasPrice = useGasPrice(15);
  const underlyingPrice = useTokenPrice(position.shortOToken?.id as string, 15);

  const { ordersToFill, amountsToFill, liquidityError, cost, protocolFee, protocolFeeInUsdc } = useMemo(() => {
    if (isLoadingOrderbook || amount.isZero())
      return {
        ordersToFill: [],
        amountsToFill: [],
        liquidityError: Errors.NO_ERROR,
        cost: new BigNumber(0),
        protocolFee: new BigNumber(0),
        protocolFeeInUsdc: new BigNumber(0),
      };

    if (orderBookOfThisToken === undefined || orderBookOfThisToken.asks.length === 0)
      return {
        ordersToFill: [],
        amountsToFill: [],
        liquidityError: cardStep === CardStep.BUYBACK ? Errors.INSUFFICIENT_LIQUIDITY : false,
        cost: new BigNumber(0),
        protocolFee: new BigNumber(0),
        protocolFeeInUsdc: new BigNumber(0),
      };

    const { error: liquidityError, ordersToFill, amounts: amountsToFill, sumInput: cost } = calculateOrderInput(
      orderBookOfThisToken.asks,
      amount,
      {
        ethPrice: underlyingPrice,
        gasPrice: gasPrice.fastest,
      },
    );

    const protocolFee = getProtocolFee(ordersToFill);
    const protocolFeeInUsdc = getProtocolFeeInUsdc(ordersToFill);

    return {
      ordersToFill,
      amountsToFill,
      liquidityError,
      cost,
      protocolFee,
      protocolFeeInUsdc: protocolFeeInUsdc,
    };
  }, [
    isLoadingOrderbook,
    amount,
    orderBookOfThisToken,
    cardStep,
    underlyingPrice,
    gasPrice.fastest,
    getProtocolFee,
    getProtocolFeeInUsdc,
  ]);

  const protocolFeeForOrdersToFill = useMemo(() => {
    return getProtocolFee(ordersToFill);
  }, [getProtocolFee, ordersToFill]);

  const { error: marketError, marketImpact } = useMemo(() => {
    const asks = orderBookOfThisToken ? orderBookOfThisToken.asks : [];
    return getMarketImpact(TradeAction.BUY, asks, amount, cost, protocolFeeForOrdersToFill, gasPrice.fastest);
  }, [amount, cost, orderBookOfThisToken, protocolFeeForOrdersToFill, gasPrice.fastest]);

  // handle BUYBACK state transitions
  useEffect(() => {
    if (cardStep !== CardStep.BUYBACK) return;
    const needApproval = zxAllowance.lt(cost);
    if (!needApproval && cardStatus <= CardStatus.APPROVING) return setCardStatus(CardStatus.APPROVED);
    if (needApproval && cardStatus !== CardStatus.APPROVING) return setCardStatus(CardStatus.UNAPPROVED);
    // check if approved for amount
    // at step approve / buy back, check if need to buy back
    else if (!position.shortAmount.isZero() && shortBalance.gte(position.shortAmount)) {
      setCardStep(CardStep.BURN_AND_WITHDRAW);
      return;
    }
  }, [shortBalance, position.shortAmount, cardStep, zxAllowance, cost, cardStatus]);

  // handle BURN_AND_WITHDRAW state transitions
  const isWeth = useMemo(() => position.shortOToken?.collateralAsset.symbol === 'WETH', [position.shortOToken]);
  useEffect(() => {
    if (cardStep !== CardStep.BURN_AND_WITHDRAW) return;
    if (!isWeth && cardStatus <= CardStatus.APPROVING) return setCardStatus(CardStatus.APPROVED);
    if (!isWeth && cardStatus > CardStatus.APPROVING) return;
    // if WETH
    if (isProxyOperator === false && cardStatus !== CardStatus.APPROVING) return setCardStatus(CardStatus.UNAPPROVED);
    if (isProxyOperator === true && cardStatus <= CardStatus.APPROVING) return setCardStatus(CardStatus.APPROVED);
  }, [cardStatus, cardStep, isProxyOperator, isWeth, position.collateral]);

  // const args = { orders: ordersToFill, amounts: amountsToFill, useWeth };
  // const gasToPay = use0xGasFee(args);

  //  input errors
  useEffect(() => {
    if (liquidityError) return setErrorType(liquidityError);
    if (cardStep === CardStep.BUYBACK) {
      if (amount.gt(position.shortAmount)) return setErrorType(Errors.GREATER_THAN_MAX);
      // if (ethBalance.lt(gasToPay.gasToPay)) return setErrorType(Errors.INSUFFICIENT_ETH_GAS_BALANCE);
      if (marketError !== Errors.NO_ERROR) return setErrorType(marketError);
    }
    if (cardStep === CardStep.BURN_AND_WITHDRAW) {
      if (amount.gt(position.shortAmount)) return setErrorType(Errors.GREATER_THAN_MAX);
    }

    setErrorType(Errors.NO_ERROR);
  }, [
    amount,
    cardStep,
    liquidityError,
    position.shortAmount,
    setActionDisabled,
    setErrorType,
    marketError,
    ethBalance,
    // gasToPay,
  ]);

  const { amountCollateralToWithdraw, amountLongToWithdraw } = useMemo(() => {
    const withdrawRatio = amount.div(position.shortAmount);
    const amountCollateralToWithdraw = position.collateralAmount
      .times(withdrawRatio)
      .integerValue(BigNumber.ROUND_DOWN);
    const amountLongToWithdraw = position.longAmount.times(withdrawRatio).integerValue(BigNumber.ROUND_DOWN);

    return { amountCollateralToWithdraw, amountLongToWithdraw };
  }, [amount, position.collateralAmount, position.longAmount, position.shortAmount]);

  const { burnAndWithdrawCollateral } = useControllerActions();

  // actions
  const handleError = useCallback(
    (error, errorStep?: string) => {
      const message = parseTxErrorMessage(error);
      const errorType = parseTxErrorType(error);
      toast.error(message);
      if (cardStatus < CardStatus.APPROVED) return setCardStatus(CardStatus.UNAPPROVED);
      if (errorStep)
        ReactGA.event({
          category: 'Transactions',
          action: errorType,
          label: `${errorStep} - ${message}`,
        });
      return setCardStatus(CardStatus.APPROVED);
    },
    [cardStatus, toast],
  );

  const handleApproveZx = useCallback(() => {
    if (approveZx === null) throw new Error('ClosePositionCard: approveZx is null.');
    setCardStatus(CardStatus.APPROVING);
    const callback = () => {
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'BuyBack_Approve0x',
      });
    };
    approveZx({ callback, onError: (error: any) => handleError(error, 'BuyBack_Approve0x') });
  }, [approveZx, handleError]);

  const handleBuyBack = useCallback(() => {
    setCardStatus(CardStatus.PENDING);
    const callback = () => {
      // skip CONFIRMED and go straight to BURN_AND_WITHDRAW
      setCardStep(CardStep.BURN_AND_WITHDRAW);
      // set to UNAPPROVED if we need to set the operator
      setCardStatus(isWeth && isProxyOperator === false ? CardStatus.UNAPPROVED : CardStatus.APPROVED);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'BuyBack_FillOrder',
      });
    };
    fillOrders({ orders: ordersToFill, amounts: amountsToFill }, callback, (error: any) =>
      handleError(error, 'BuyBack_FillOrder'),
    );
  }, [fillOrders, amountsToFill, handleError, isProxyOperator, isWeth, ordersToFill]);

  const handleAddProxyOperator = useCallback(() => {
    setCardStatus(CardStatus.APPROVING);
    const callback = () => {};
    addProxyOperator({ callback, onError: handleError });
  }, [addProxyOperator, handleError]);

  const handleBurnAndWithdraw = useCallback(() => {
    // burn and withdraw collateral
    if (!position.shortOToken) throw new Error('No short asset in this position');
    if (burnAndWithdrawCollateral === null) throw new Error('ClosePositionCard: burnAndWithdrawCollateral is null.');
    setCardStatus(CardStatus.PENDING);
    burnAndWithdrawCollateral(
      {
        vaultId: position.vaultId,
        shortAsset: (position.shortOToken as OToken).id,
        burnAmount: amount, // burn amount
        collateralAsset: position.shortOToken.collateralAsset.id,
        collateralAmount: amountCollateralToWithdraw,
        longAsset: position.longOToken ? position.longOToken.id : '',
        longAmount: amountLongToWithdraw,
      },
      // callback
      () => {
        setCardStatus(CardStatus.CONFIRMED);
        ReactGA.event({
          category: 'Transactions',
          action: 'Success',
          label: 'BurnAndWithdraw',
        });
      }, // go to step 2 when the tx is completed
      (error: any) => handleError(error, 'BurnAndWithdraw'),
    ).then(hash => hash && setTxHash(hash));
  }, [
    amount,
    amountCollateralToWithdraw,
    amountLongToWithdraw,
    burnAndWithdrawCollateral,
    handleError,
    position.longOToken,
    position.shortOToken,
    position.vaultId,
  ]);

  const handleCloseConfirmCard = useCallback(() => {
    // where should we go ?
    setCardStep(CardStep.BUYBACK);
    setCardStatus(CardStatus.APPROVED);
  }, []);

  const handleConfirm = useCallback(() => {
    if (cardStep === CardStep.BUYBACK && cardStatus === CardStatus.UNAPPROVED) return handleApproveZx();
    if (cardStep === CardStep.BUYBACK && cardStatus === CardStatus.APPROVED) return handleBuyBack();
    if (cardStep === CardStep.BURN_AND_WITHDRAW && cardStatus === CardStatus.UNAPPROVED)
      return handleAddProxyOperator();
    if (cardStep === CardStep.BURN_AND_WITHDRAW && cardStatus === CardStatus.APPROVED) return handleBurnAndWithdraw();
    if (cardStep === CardStep.BURN_AND_WITHDRAW && cardStatus === CardStatus.CONFIRMED) return handleCloseConfirmCard();
    return handleError(new Error('ClosePosition: handleConfirm called with an invalid card state.'));
  }, [
    cardStatus,
    cardStep,
    handleAddProxyOperator,
    handleApproveZx,
    handleBurnAndWithdraw,
    handleBuyBack,
    handleCloseConfirmCard,
    handleError,
  ]);

  const description = () => {
    const collateral = position.collateral;
    const long = position.longOToken;

    const collateralMessage = collateral
      ? `${toTokenAmount(amountCollateralToWithdraw, collateral.decimals).toFixed(4)} ${collateral.symbol}`
      : '';
    const longAmountMessage = long ? `and ${toTokenAmount(amountLongToWithdraw, 8).toFixed(4)} ${long.symbol}` : '';

    return (
      <Typography align="center" variant="body2">
        Closed position, redeeming ${collateralMessage} {longAmountMessage}
      </Typography>
    );
  };

  // change button text and handle disabling
  useEffect(() => {
    switch (cardStep) {
      case CardStep.BUYBACK:
        switch (cardStatus) {
          case CardStatus.UNAPPROVED:
            setActionDisabled(false);
            setActionText('Approve 0x');
            break;
          case CardStatus.APPROVING:
            setActionDisabled(true);
            setActionText('Approving...');
            break;
          case CardStatus.APPROVED:
            setActionDisabled(false);
            setActionText('Buy back oTokens');
            break;
          case CardStatus.PENDING:
            setActionDisabled(true);
            setActionText('Buying...');
            break;
          case CardStatus.CONFIRMED:
            setActionDisabled(true);
            setActionText('Bought.');
            break;
        }
        break;
      case CardStep.BURN_AND_WITHDRAW:
        switch (cardStatus) {
          case CardStatus.UNAPPROVED:
            setActionDisabled(false);
            setActionText('Approve WETH Proxy');
            break;
          case CardStatus.APPROVING:
            setActionDisabled(true);
            setActionText('Approving...');
            break;
          case CardStatus.APPROVED:
            setActionDisabled(false);
            setActionText('Burn and Withdraw');
            break;
          case CardStatus.PENDING:
            setActionDisabled(true);
            setActionText('pending...');
            break;
          case CardStatus.CONFIRMED:
            setActionDisabled(false);
            setActionText('Done');
            break;
        }
    }
    if (amount.isZero()) {
      // disable button if amount is zero
      setActionDisabled(true);
      return;
    }
    if (errorType !== Errors.NO_ERROR && errorType !== Errors.LARGE_MARKET_IMPACT) return setActionDisabled(true);
  }, [amount, cardStatus, cardStep, errorType, setActionDisabled, setActionText]);

  const max = useMemo(
    () =>
      cardStep === CardStep.BUYBACK
        ? position.shortAmount.minus(shortBalance)
        : BigNumber.min(shortBalance, position.shortAmount),
    [cardStep, position.shortAmount, shortBalance],
  );

  return (
    <ActionCard {...actionCardState} handleConfirm={handleConfirm}>
      {!(cardStep === CardStep.BURN_AND_WITHDRAW && cardStatus >= CardStatus.PENDING) ? (
        <>
          <AmountInput
            label="Amount"
            errorName={errorName}
            isError={isError}
            errorDescription={errorDescription}
            onChange={setAmount}
            adornment={'oTokens'}
            decimals={position.shortOToken?.decimals}
            initValue={max}
            max={max}
          />
          <ListItem label={'Short Amount'} value={parseBigNumber(position.shortAmount, 8) + ' oTokens'} />
          <ListItem label={'Long Amount'} value={parseBigNumber(shortBalance, 8) + ' oTokens'} />
          <Divider />
          <TxSteps steps={buyBackSteps} currentStep={cardStep} />
        </>
      ) : null}
      {cardStep === CardStep.BUYBACK ? (
        <BuyBack
          amount={amount}
          isLoadingOrderbook={isLoadingOrderbook}
          cost={cost}
          // useWeth={useWeth}
          // setUseWeth={setUseWeth}
          protocolFee={protocolFee}
          // gasToPay={new BigNumber(0)}
          marketImpact={marketImpact}
          orderBookOfThisToken={orderBookOfThisToken}
          protocolFeeInUsdc={protocolFeeInUsdc}
        />
      ) : null}
      {cardStep === CardStep.BURN_AND_WITHDRAW && cardStatus <= CardStatus.APPROVED ? (
        <BurnRemove
          otoken={position.shortOToken as OToken}
          amount={amount}
          amountCollateralToWithdraw={amountCollateralToWithdraw}
          amountLongToWithdraw={amountLongToWithdraw}
        />
      ) : null}
      {cardStep === CardStep.BURN_AND_WITHDRAW && cardStatus === CardStatus.PENDING ? (
        <ConfirmingCard description={description()} txHash={txHash} />
      ) : null}
      {cardStep === CardStep.BURN_AND_WITHDRAW && cardStatus === CardStatus.CONFIRMED ? (
        <ConfirmContent description={description()} txHash={txHash} />
      ) : null}
    </ActionCard>
  );
};

export default ClosePositionCard;
