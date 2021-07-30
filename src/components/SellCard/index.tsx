import React, { useMemo, useCallback, useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import ReactGA from 'react-ga';

import ConfirmingCard from '../ConfirmingCard';
import ConfirmContent from '../ConfirmCard/ConfirmContent';
import { useError, useZeroX, useApproval, Spender, useWallet, useGasPrice, useTokenPrice } from '../../hooks';
import { OToken } from '../../types';
import ActionCard, { useActionCard, TxItem } from '../ActionCard';
import AmountInput from '../AmountInput';
import ProtocolFee from '../ProtocolFee';
import { parseBigNumber, parseTxErrorMessage, parseTxErrorType } from '../../utils/parse';
import { calculateOrderOutput, getMarketImpact } from '../../utils/0x-utils';
import { useToast } from '../../context/toast';
import { Errors, TradeAction } from '../../utils/constants';
import MarketImpact from '../MarketImpact';
import { useTxStyle } from '../../hooks/useTxStyle';

type SellCardProps = {
  otoken: OToken;
  longAmount: BigNumber;
};

enum SellCardState {
  UNAPPROVED,
  APPROVING,
  APPROVED,
  SELLING,
  SOLD,
}

const SellCard = ({ otoken, longAmount }: SellCardProps) => {
  const toast = useToast();
  const [amount, setAmount] = React.useState(new BigNumber(0));

  const handleAmountChange = (value: BigNumber) => setAmount(value);

  const { isError, errorName, errorDescription, errorType, setErrorType } = useError(otoken.collateralAsset.symbol);
  const { actionCardState, setActionText, setActionDisabled } = useActionCard({
    title: 'Sell oTokens',
    buttonText: 'Submit Sell Order',
  });

  const underlyingPrice = useTokenPrice(otoken.underlyingAsset.id, 15);
  const { fastest } = useGasPrice(15);

  const [cardState, setCardState] = useState<SellCardState>(SellCardState.APPROVED);
  const [txHash, setTxHash] = useState('');

  // const [useWeth, setUseWeth] = useState(localStorage.getItem('protocol-fee-token') === 'weth');

  const { ethBalance } = useWallet();

  const { fillOrders, orderBooks, getProtocolFee, getProtocolFeeInUsdc } = useZeroX();

  const { approve: approveOtoken, allowance: otokenAllowance } = useApproval(otoken.id, Spender.ZeroXExchange);

  const orderBookForThisToken = useMemo(() => {
    return orderBooks.find(book => book.id === otoken.id);
  }, [orderBooks, otoken]);

  const sellOrder = useMemo(() => {
    if (orderBookForThisToken === undefined || orderBookForThisToken.bids.length === 0) {
      return null;
    } else {
      const { error, ordersToFill, amounts: fillAmounts, sumOutput } = calculateOrderOutput(
        orderBookForThisToken.bids,
        amount,
        {
          ethPrice: underlyingPrice,
          gasPrice: fastest,
        },
      );
      return { error, ordersToFill, fillAmounts, sumOutput };
    }
  }, [amount, orderBookForThisToken, underlyingPrice, fastest]);

  const { marketImpact, error: marketError } = useMemo(() => {
    const bids = orderBookForThisToken ? orderBookForThisToken.bids : [];
    const totalPremium = sellOrder ? sellOrder.sumOutput : new BigNumber(0);
    const fee = sellOrder ? getProtocolFee(sellOrder.ordersToFill) : new BigNumber(0);
    return getMarketImpact(TradeAction.SELL, bids, amount, totalPremium, fee, fastest);
  }, [orderBookForThisToken, amount, sellOrder, getProtocolFee, fastest]);

  const handleError = useCallback(
    (error: Error, errorStep?: string) => {
      setCardState(otokenAllowance.gt(longAmount) ? SellCardState.APPROVED : SellCardState.UNAPPROVED);
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
    [longAmount, otokenAllowance, toast],
  );

  // check allowance
  useEffect(() => {
    if (cardState === SellCardState.APPROVED && otokenAllowance.lt(amount))
      return setCardState(SellCardState.UNAPPROVED);
    if (
      (cardState === SellCardState.UNAPPROVED || cardState === SellCardState.APPROVING) &&
      otokenAllowance.gte(amount)
    )
      return setCardState(SellCardState.APPROVED);
  }, [cardState, amount, otokenAllowance]);

  // update total on user input change
  // and change buttton text
  useEffect(() => {
    if (orderBookForThisToken && orderBookForThisToken.bids.length === 0) {
      setActionText('insufficient liquidity');
      setActionDisabled(true);
      return;
    } else if (sellOrder === null) {
      setActionText('loading 0x orders');
      setActionDisabled(true);
      return;
    }
    switch (cardState) {
      case SellCardState.UNAPPROVED:
        setActionDisabled(false);
        setActionText('Approve oToken');
        break;
      case SellCardState.APPROVING:
        setActionDisabled(true);
        setActionText('Approving...');
        break;
      case SellCardState.APPROVED:
        setActionDisabled(false);
        setActionText('Confirm Sell');
        break;
      case SellCardState.SELLING:
        setActionDisabled(true);
        setActionText('selling...');
        break;
      case SellCardState.SOLD:
        setActionText('done');
        setActionDisabled(false);
        break;
    }
    if (amount.isZero()) return setActionDisabled(true);
    if (amount.gt(longAmount)) return setActionDisabled(true);
    if (orderBookForThisToken === undefined) return setActionDisabled(true);
    if (errorType !== Errors.NO_ERROR && errorType !== Errors.LARGE_MARKET_IMPACT) return setActionDisabled(true);
  }, [amount, cardState, errorType, longAmount, orderBookForThisToken, sellOrder, setActionDisabled, setActionText]);

  // const args = {
  //   orders: sellOrder !== null ? sellOrder.ordersToFill : [],
  //   amounts: sellOrder !== null ? sellOrder.fillAmounts : [],
  //   useWeth,
  // };
  // const gasToPay = use0xGasFee(args);

  // set input errors
  useEffect(() => {
    if (amount.isZero()) return setErrorType(Errors.NO_ERROR);
    if (amount.gt(longAmount)) {
      return setErrorType(Errors.GREATER_THAN_MAX);
    }
    if (orderBookForThisToken && orderBookForThisToken.bids.length === 0) {
      return setErrorType(Errors.INSUFFICIENT_LIQUIDITY);
    }
    if (marketError !== Errors.NO_ERROR) {
      return setErrorType(marketError);
    }
    // if (ethBalance.lt(gasToPay.gasToPay)) return setErrorType(Errors.INSUFFICIENT_ETH_GAS_BALANCE);
    setErrorType(Errors.NO_ERROR);
  }, [amount, longAmount, errorType, marketError, setErrorType, orderBookForThisToken, ethBalance]);

  const handleApproveOtoken = useCallback(async () => {
    if (approveOtoken === null) return console.error('SellCard: approve is null.');

    setCardState(SellCardState.APPROVING);
    return approveOtoken({
      callback: () => {
        ReactGA.event({
          category: 'Transactions',
          action: 'Success',
          label: 'SellCard_ApproveOToken',
        });
      },
      onError: (error: Error) => handleError(error, 'SellCard_ApproveOToken'),
    });
  }, [approveOtoken, handleError]);

  const handleSubmitSellOrder = useCallback(async () => {
    if (sellOrder === null) return console.error('SellCard: sellOrder is null.');
    if (amount.gt(otokenAllowance)) return console.error('SellCard: Insufficient allowance.');

    const args = {
      orders: sellOrder.ordersToFill,
      amounts: sellOrder.fillAmounts,
    };
    setCardState(SellCardState.SELLING);
    const hash = await fillOrders(
      args,
      () => {
        setCardState(SellCardState.SOLD);
        ReactGA.event({
          category: 'Transactions',
          action: 'Success',
          label: 'SellCard_SellOrderFilled',
        });
      },
      (error: Error) => handleError(error, 'SellCard_SellOrderFilled'),
    );
    if (hash) setTxHash(hash);
  }, [sellOrder, amount, otokenAllowance, fillOrders, handleError]);

  const handleConfirm = useCallback(() => {
    if (cardState === SellCardState.UNAPPROVED) return handleApproveOtoken();
    if (cardState === SellCardState.APPROVED) return handleSubmitSellOrder();
    if (cardState === SellCardState.SOLD) return setCardState(SellCardState.APPROVED);
  }, [cardState, handleApproveOtoken, handleSubmitSellOrder]);

  const confirmingText = useMemo(() => `Selling ${parseBigNumber(amount, otoken.decimals)} ${otoken.symbol}...`, [
    amount,
    otoken.decimals,
    otoken.symbol,
  ]);

  const confirmedText = useMemo(() => `Sold ${parseBigNumber(amount, otoken.decimals)} ${otoken.symbol}.`, [
    amount,
    otoken.decimals,
    otoken.symbol,
  ]);

  const description = useCallback((message: string) => {
    return (
      <Typography align="center" variant="body2">
        {message}
      </Typography>
    );
  }, []);

  const protocolFeeInUsdc = sellOrder ? getProtocolFeeInUsdc(sellOrder?.ordersToFill) : new BigNumber(0);

  const premiumToReceiveWithProtocolFee = new BigNumber(
    Number(parseBigNumber(sellOrder ? sellOrder.sumOutput : new BigNumber(0), 6)) - protocolFeeInUsdc.toNumber(),
  ).precision(6);

  const txClasses = useTxStyle();

  const StepContent = useMemo(() => {
    switch (cardState) {
      case SellCardState.UNAPPROVED:
      case SellCardState.APPROVING:
      case SellCardState.APPROVED:
        return (
          <>
            <AmountInput
              label={'Amount'}
              isError={isError}
              errorDescription={errorDescription}
              errorName={errorName}
              adornment={'oTokens'}
              decimals={otoken.decimals}
              onChange={handleAmountChange}
              max={longAmount}
            />
            <Box className={txClasses.txBox}>
              <Box className={txClasses.txCard}>
                <Typography variant="subtitle2">TX Summary</Typography>
                <TxItem label="oTokens in Wallet" value={parseBigNumber(longAmount, otoken.decimals)} />
                <TxItem
                  label="Premium per oToken"
                  value={
                    sellOrder?.sumOutput
                      ? amount.gt(0)
                        ? parseBigNumber(sellOrder?.sumOutput.div(amount.div(10 ** otoken.decimals)), 6)
                        : '0'
                      : orderBookForThisToken && orderBookForThisToken.bids.length === 0
                      ? '0'
                      : 'loading'
                  }
                  symbol="USDC"
                />

                <TxItem
                  label="Premium to Receive"
                  value={
                    sellOrder?.sumOutput
                      ? parseBigNumber(sellOrder?.sumOutput, 6)
                      : orderBookForThisToken && orderBookForThisToken.bids.length === 0
                      ? '0'
                      : 'loading'
                  }
                  symbol="USDC"
                />
                <ProtocolFee
                  protocolFee={sellOrder ? getProtocolFee(sellOrder.ordersToFill) : new BigNumber(0)}
                  // useWeth={useWeth}
                  // setUseWeth={setUseWeth}
                  showWarning={true}
                  warningAction={'sell'}
                />
                {/* <GasFee gasToPay={gasToPay.gasToPay} asset={'ETH'} action={'sell'} /> */}
                <MarketImpact marketImpact={marketImpact} action={TradeAction.SELL} />
              </Box>
              <Box className={txClasses.txConsolidated}>
                <Tooltip
                  title={
                    <React.Fragment>
                      <Typography variant="body2">
                        Total to Receive includes
                        <br />
                        - Premium to receive
                        <br />
                        - Subtracts 0x Fee to pay
                        <br />
                        This does not include the gas fee.
                      </Typography>
                    </React.Fragment>
                  }
                >
                  <div>
                    <TxItem
                      label={'You receive'}
                      value={premiumToReceiveWithProtocolFee.toString()}
                      symbol={'USDC'}
                      showInfo
                    />
                  </div>
                </Tooltip>
              </Box>
            </Box>
          </>
        );
      case SellCardState.SELLING:
        return <ConfirmingCard handleNext={handleConfirm} description={description(confirmingText)} txHash={txHash} />;
      case SellCardState.SOLD:
        return <ConfirmContent description={description(confirmedText)} txHash={txHash} />;
      default:
        throw new Error(`Sell Card: unrecgonized cardState: ${cardState}`);
    }
  }, [
    amount,
    cardState,
    confirmedText,
    confirmingText,
    description,
    errorDescription,
    errorName,
    getProtocolFee,
    handleConfirm,
    isError,
    longAmount,
    marketImpact,
    orderBookForThisToken,
    otoken.decimals,
    premiumToReceiveWithProtocolFee,
    sellOrder,
    txClasses.txBox,
    txClasses.txCard,
    txClasses.txConsolidated,
    txHash,
  ]);

  return (
    <ActionCard {...actionCardState} handleConfirm={handleConfirm}>
      {StepContent}
    </ActionCard>
  );
};

export default SellCard;
