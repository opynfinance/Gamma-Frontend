import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BigNumber } from 'bignumber.js';
import CircularProgress from '@material-ui/core/CircularProgress';
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import ReactGA from 'react-ga';

import TradeButton from '../TradeTicketButton';
import SmallLimitOrderWarning from '../SmallLimitOrderWarning';
import {
  useControllerActions,
  useZeroX,
  useWallet,
  useController,
  useApproval,
  usePermit,
  Spender,
  useOrderTicketItemStyle,
  useAddresses,
  useGasPrice,
  useAsyncMemo,
} from '../../hooks';
import { ERC20, OToken } from '../../types';
import { calculateOrderOutput, getMarketImpact } from '../../utils/0x-utils';
import { calculateSimpleCollateral, fromTokenAmount, toTokenAmount } from '../../utils/calculations';
import { PAYABLE_PROXY, Errors, CreateMode, TradeAction, ESTIMATE_FILL_COST_PER_GWEI } from '../../utils/constants';
import { SellTicketInfo } from '../OrderTicket/TicketInfo';
import { useToast } from '../../context/toast';
import { parseTxErrorMessage, parseTxErrorType, parseBigNumber } from '../../utils/parse';
import { ListItem } from '../ActionCard';
import TxSteps, { TxStepType } from '../OrderTicket/TxSteps';
import PartialCollat from '../PartialCollat';
import usePricer from '../../hooks/usePricer';

type SellCheckoutProps = {
  mode: CreateMode;
  collateral: ERC20;
  usdcBalance: BigNumber;
  otokenBalance: BigNumber;
  collateralBalance: BigNumber;
  underlyingBalance: BigNumber;
  input: BigNumber;
  setInput: any;
  otoken: OToken;
  setError: any;
  isError: any;
  underlyingPrice: BigNumber;
  setIsConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
  setTxHash: React.Dispatch<React.SetStateAction<string>>;
  setConfirmDescription: React.Dispatch<React.SetStateAction<string>>;
  price: BigNumber;
  deadline: number;
  errorType: Errors;
};

const SellCheckoutCallee = ({
  mode,
  setError,
  isError,
  collateral,
  usdcBalance,
  underlyingBalance,
  otokenBalance,
  input,
  otoken,
  collateralBalance,
  setIsConfirmed,
  setTxHash,
  setConfirmDescription,
  price,
  deadline,
  underlyingPrice,
  errorType,
}: SellCheckoutProps) => {
  const toast = useToast();
  const [steps, setSteps] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPartial, setIsPartial] = useState(true);
  const [collateralPercent, setCollateralPercent] = useState(100);

  //   const [hasApprovedPool, setHasApprovedPool] = useState(false);
  const [hasPermitPool, setHasPermitPool] = useState(false);
  const [hasApproved0x, setHasApproved0x] = useState(false);
  const [hasSetOperator, setHasSetOperator] = useState(false);

  const [mintAmount, setMintAmount] = useState<BigNumber>(new BigNumber(0));
  const [hasSentMintTx, setHasSentMintTx] = useState(false);
  const [buttonLabel, setButtonLabel] = useState('');
  const [onClick, setOnClick] = useState<Function>(() => {});
  // const [isExchangeTxn, setIsExchangeTxn] = useState(false);

  const { address: account, networkId, signer, ethBalance } = useWallet();

  const [payableProxyEnabled, setPayableProxyEnabled] = useState(false);

  const sellAmount = useMemo(() => fromTokenAmount(input, 8).integerValue(), [input]);

  const classes = useOrderTicketItemStyle();

  const {
    fillOrders,
    getProtocolFee,
    getProtocolFeeInUsdc,
    orderBooks,
    createOrder,
    broadcastOrder,
    getGasNeeded,
    gasLimitEstimateFailed,
  } = useZeroX();
  const fxRate = usePricer(collateral.id);

  const {
    approve: approve0xProxy,
    allowance: oTokenAllowance,
    loading: loadingOTokenAllowance,
  } = useApproval(otoken.id, Spender.ZeroXExchange);

  const { bids } = useMemo(() => {
    const target = orderBooks.find(book => book.id === otoken.id);
    return target ? target : { bids: [] };
  }, [otoken, orderBooks]);

  const { approve: approveCollateral, loading: loadingCollateralAllowanceApprove } = useApproval(
    otoken.collateralAsset.id,
    Spender.MarginPool,
  );
  const controllerState = useController();

  const {
    permit: permitCollateral,
    allowance: collateralAllowance,
    loading: loadingCollateralAllowance,
    callData: collateralCallData,
  } = usePermit(otoken.collateralAsset.id, Spender.MarginPool);

  useEffect(() => {
    if (!controllerState) return;
    const { isOperator, payableProxy } = controllerState;
    if (!isOperator || !payableProxy) return;
    isOperator({ operator: payableProxy.address, account }).then(enabled => setPayableProxyEnabled(enabled));
  }, [account, controllerState]);

  const { depositAndMint, permitDepositAndMint } = useControllerActions();

  const isLoadingAllowance = loadingOTokenAllowance || loadingCollateralAllowance || loadingCollateralAllowanceApprove;

  useEffect(() => {
    const _mintAmount = sellAmount.gt(otokenBalance) ? sellAmount.minus(otokenBalance) : new BigNumber(0);
    setMintAmount(_mintAmount);
  }, [sellAmount, otokenBalance]);

  const { fast: gasPrice } = useGasPrice(5);

  const {
    error: fillOrderError,
    ordersToFill,
    amounts: fillAmounts,
    sumOutput,
  } = useMemo(() => {
    return calculateOrderOutput(bids, sellAmount, { gasPrice, ethPrice: underlyingPrice });
  }, [bids, sellAmount, gasPrice, underlyingPrice]);

  const gasEstimate = useAsyncMemo(
    () => getGasNeeded({ orders: ordersToFill, amounts: fillAmounts }, isError),
    new BigNumber(0),
    [ordersToFill.length, fillAmounts.length, gasPrice.toNumber()],
  );

  const { error: marketError, marketImpact } = useMemo(() => {
    return getMarketImpact(TradeAction.SELL, bids, sellAmount, sumOutput, getProtocolFee(ordersToFill), gasPrice);
  }, [bids, sellAmount, sumOutput, ordersToFill, getProtocolFee, gasPrice]);

  const neededCollateral = useMemo(
    () =>
      otoken
        ? calculateSimpleCollateral(otoken, mintAmount).dividedBy(fxRate).integerValue(BigNumber.ROUND_CEIL)
        : new BigNumber(0),
    [fxRate, mintAmount, otoken],
  );

  const actualNeededCollateral = useMemo(() => {
    if (!isPartial) return neededCollateral;
    return neededCollateral.multipliedBy(new BigNumber(collateralPercent / 100)).integerValue(BigNumber.ROUND_CEIL);
  }, [collateralPercent, isPartial, neededCollateral]);

  // check if need to approve erc20 proxy.
  const hasApproved0xProxy = useMemo(() => oTokenAllowance.gte(sellAmount), [oTokenAllowance, sellAmount]);

  const hasApprovedCollateral = useMemo(() => {
    if (!otoken) return false;
    if (otoken.collateralAsset.symbol === 'WETH') {
      return true;
    }
    return collateralAllowance.gte(actualNeededCollateral);
  }, [otoken, actualNeededCollateral, collateralAllowance]);

  const totalPremium = useMemo(() => {
    if (mode === CreateMode.Market) return sumOutput;
    else return fromTokenAmount(input.times(price), 6);
  }, [mode, sumOutput, input, price]);

  const protocolFeeInUsdc = getProtocolFeeInUsdc(ordersToFill);

  const premiumToReceiveWithProtocolFee = new BigNumber(
    Number(parseBigNumber(totalPremium, 6)) - protocolFeeInUsdc.toNumber(),
  ).precision(6);

  const netPremiumIsNegative = Math.sign(premiumToReceiveWithProtocolFee.toNumber()) === -1;

  const throwErrorToast = useCallback(
    errorVal => {
      toast.error(errorVal);
    },
    [toast],
  );

  // set collateral message
  useEffect(() => {
    let currDate = Math.floor(Date.now() / 1000);
    let deadlineTimestamp = +deadline + +currDate;

    if (gasLimitEstimateFailed && steps === 4) throwErrorToast(Errors.GAS_LIMIT_ESTIMATE_FAILED);
    if (fillOrderError && mode === CreateMode.Market) return setError(fillOrderError);
    if (marketError && mode === CreateMode.Market) return setError(marketError);
    if (collateral.symbol !== 'WETH' && actualNeededCollateral.gt(collateralBalance))
      return setError(Errors.INSUFFICIENT_BALANCE);
    if (collateral.symbol === 'WETH' && actualNeededCollateral.gt(ethBalance))
      return setError(Errors.INSUFFICIENT_BALANCE);
    if (steps === 4 && ethBalance.lt(gasEstimate) && mode === CreateMode.Market)
      return setError(Errors.INSUFFICIENT_ETH_GAS_BALANCE);
    if (deadlineTimestamp > otoken.expiry && CreateMode.Limit) return setError(Errors.DEADLINE_PAST_EXPIRY);
    if (isPartial && errorType === Errors.SMALL_COLLATERAL) return;
    if (isPartial && errorType === Errors.MAX_CAP_REACHED) return;
    if (netPremiumIsNegative) return setError(Errors.FEE_HIGHER_THAN_PREMIUM);
    if (errorType !== Errors.NO_ERROR) setError(Errors.NO_ERROR);
  }, [
    marketError,
    collateralBalance,
    collateral.symbol,
    setError,
    signer,
    fillOrderError,
    ethBalance,
    mode,
    steps,
    deadline,
    otoken.expiry,
    netPremiumIsNegative,
    actualNeededCollateral,
    errorType,
    isPartial,
    gasEstimate,
    throwErrorToast,
    gasLimitEstimateFailed,
  ]);

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

  const approveERC20Proxy = useCallback(async () => {
    if (!otoken) throw new Error('No OToken selected');
    if (!approve0xProxy) return;
    ReactGA.event({
      category: 'Sell',
      action: 'ClickedApproveOtoken_3/4',
    });
    setIsLoading(true);
    const callback = () => {
      setIsLoading(false);
      setHasApproved0x(true);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: `${deadline > 0 ? 'SellLimit_HasApproved0x_3/4' : 'Sell_HasApproved0x_3/4'}`,
      });
    };

    await approve0xProxy({
      callback,
      onError: (error: any) =>
        handleError(error, `${deadline > 0 ? 'SellLimit_HasApproved0x_3/4' : 'Sell_HasApproved0x_3/4'}`),
    });
  }, [approve0xProxy, setHasApproved0x, otoken, handleError, deadline]);

  const addPayableProxyAsOperator = useCallback(async () => {
    if (controllerState === undefined) return;
    const { addOperator } = controllerState;
    if (!addOperator) return;
    ReactGA.event({
      category: 'Sell',
      action: 'ClickedApproveWethWrapper_0/4',
    });
    setIsLoading(true);
    try {
      await addOperator({
        operator: PAYABLE_PROXY[networkId].toLowerCase(),
        isOperator: true,
        callback: () => {
          setIsLoading(false);
          setHasSetOperator(true);
          ReactGA.event({
            category: 'Transactions',
            action: 'Success',
            label: 'Sell_HasSetOperator_0/4',
          });
        },
      });
    } catch (error) {
      handleError(error, 'Sell_HasSetOperator_0/4');
    }
  }, [controllerState, networkId, handleError]);

  //   const approveMarginPool = useCallback(async () => {
  //     if (!otoken) throw new Error('No OToken selected');
  //     if (!approveCollateral) return;
  //     ReactGA.event({
  //       category: 'Sell',
  //       action: 'ClickedApproveCollateral_1/4',
  //     });
  //     setIsLoading(true);
  //     await approveCollateral({
  //       callback: () => {
  //         setIsLoading(false);
  //         setHasApprovedPool(true);
  //         ReactGA.event({
  //           category: 'Transactions',
  //           action: 'Success',
  //           label: 'Sell_HasApprovedPool_1/4',
  //         });
  //       },
  //       onError: (error: any) => handleError(error, 'Sell_HasApprovedPool_1/4'),
  //     });
  //   }, [otoken, approveCollateral, handleError]);

  const permitMarginPool = useCallback(async () => {
    if (!otoken) throw new Error('No OToken selected');
    if (!permitCollateral) return;
    ReactGA.event({
      category: 'Sell',
      action: 'ClickedPermitCollateral_1/4',
    });

    if (collateral.symbol === 'WBTC') {
      setIsLoading(true);
    }
    const callback = () => {
      setHasPermitPool(true);
      setIsLoading(false);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'Sell_HasPermitMaringPool',
      });
    };

    if (collateral.symbol === 'WBTC' || collateral.symbol === 'yvUSDC') {
      await approveCollateral({
        callback,
        onError: (error: any) => handleError(error, 'Sell_HasApproveWBTCMarginPool'),
      });
    } else {
      await permitCollateral({
        callback,
        onError: (error: any) => handleError(error, 'Sell_HasPermitMarginPool'),
      });
    }
    setHasPermitPool(true);
  }, [otoken, permitCollateral, handleError, approveCollateral, collateral.symbol]);

  // mint oToken
  const mint = useCallback(async () => {
    if (!otoken) throw new Error('No OToken selected');
    if (!depositAndMint) return;
    ReactGA.event({
      category: 'Sell',
      action: 'ClickedIssueOtoken_2/4',
    });
    setIsLoading(true);
    const args = {
      account: account,
      vaultId: 0, // will be override
      oToken: otoken.id,
      mintAmount,
      collateralAsset: otoken.collateralAsset.id,
      depositAmount: actualNeededCollateral,
      operator: PAYABLE_PROXY[networkId],
    };

    const callback = () => {
      setMintAmount(new BigNumber(0));
      setIsLoading(false);
      setHasSentMintTx(true);

      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: `${deadline > 0 ? 'SellLimit_HasIssuedOTokens_2/4' : 'Sell_HasIssuedOTokens_2/4'}`,
      });
    };

    if (otoken.collateralAsset.symbol === 'WETH') {
      await depositAndMint(
        { ...args, depositor: PAYABLE_PROXY[networkId] },
        callback,
        (error: any) => {
          handleError(error, `${deadline > 0 ? 'SellLimit_HasIssuedOTokens_2/4' : 'Sell_HasIssuedOTokens_2/4'}`);
        },
        isPartial,
      );
    } else {
      await depositAndMint(
        { ...args, depositor: account },
        callback,
        (error: any) =>
          handleError(error, `${deadline > 0 ? 'SellLimit_HasIssuedOTokens_2/4' : 'Sell_HasIssuedOTokens_2/4'}`),
        isPartial,
      );
    }
  }, [
    otoken,
    depositAndMint,
    account,
    mintAmount,
    actualNeededCollateral,
    networkId,
    deadline,
    isPartial,
    handleError,
  ]);

  // permit, deposit, mint oToken
  const permitDepositMint = useCallback(async () => {
    if (!otoken) throw new Error('No OToken selected');
    if (!permitDepositAndMint) return;
    ReactGA.event({
      category: 'Sell',
      action: 'ClickedIssueOtoken_2/4',
    });
    setIsLoading(true);
    const args = {
      account: account,
      vaultId: 0, // will be override
      oToken: otoken.id,
      mintAmount,
      collateralAsset: otoken.collateralAsset.id,
      depositAmount: actualNeededCollateral,
      operator: PAYABLE_PROXY[networkId],
      networkId: networkId,
      dataCollateral: collateralCallData ? collateralCallData : '',
    };

    const callback = () => {
      setMintAmount(new BigNumber(0));
      setIsLoading(false);
      setHasSentMintTx(true);

      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: `${deadline > 0 ? 'SellLimit_HasIssuedOTokens_2/4' : 'Sell_HasIssuedOTokens_2/4'}`,
      });
    };

    if (otoken.collateralAsset.symbol === 'WETH') {
      await permitDepositAndMint(
        { ...args, depositor: PAYABLE_PROXY[networkId] },
        callback,
        (error: any) => {
          handleError(error, `${deadline > 0 ? 'SellLimit_HasIssuedOTokens_2/4' : 'Sell_HasIssuedOTokens_2/4'}`);
          setIsLoading(false);
        },
        isPartial,
      );
    } else {
      await permitDepositAndMint(
        { ...args, depositor: account },
        callback,
        (error: any) => {
          handleError(error, `${deadline > 0 ? 'SellLimit_HasIssuedOTokens_2/4' : 'Sell_HasIssuedOTokens_2/4'}`);
          setIsLoading(false);
        },
        isPartial,
      );
    }
  }, [
    otoken,
    permitDepositAndMint,
    account,
    mintAmount,
    actualNeededCollateral,
    networkId,
    collateralCallData,
    deadline,
    isPartial,
    handleError,
  ]);

  // simply sell through 0x exchange. (no mint and sell)
  const pureSell = useCallback(async () => {
    ReactGA.event({
      category: 'Sell',
      action: 'ClickedSellOtoken_4/4',
    });
    setIsLoading(true);
    const args = { orders: ordersToFill, amounts: fillAmounts };
    const callback = () => {
      const message = `Successfully sold ${toTokenAmount(sellAmount, 8).toFixed(4)} oTokens!`;
      setConfirmDescription(message);
      setIsConfirmed(true);
      setIsLoading(false);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'Sell_SellFilledOrders_4/4',
      });
    };
    const txhash = await fillOrders(args, callback, (error: any) => handleError(error, 'Sell_SellFilledOrders_4/4'));
    setTxHash(txhash);
  }, [
    ordersToFill,
    fillOrders,
    fillAmounts,
    sellAmount,
    setConfirmDescription,
    setIsConfirmed,
    setTxHash,
    handleError,
  ]);

  const usdcAddress = useAddresses().usdc;

  const createAndBroadcast = useCallback(async () => {
    ReactGA.event({
      category: 'Sell',
      action: 'ClickedCreateLimitOrder',
    });
    const order = await createOrder(otoken.id, usdcAddress, fromTokenAmount(input, 8), totalPremium, deadline);
    if (!order) return;
    await broadcastOrder(order);
    if (order) {
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'SellLimit_OrderCreated',
      });
    }
  }, [createOrder, broadcastOrder, otoken, totalPremium, input, deadline, usdcAddress]);

  // control button text and onClick
  useEffect(() => {
    if (collateral.symbol === 'WETH' && !payableProxyEnabled && !hasSetOperator && mintAmount.gt(0)) {
      // add operator
      setSteps(1);
      setButtonLabel('Approve WETH Wrapper');
      setOnClick(() => addPayableProxyAsOperator);
    } else if (collateral.symbol !== 'WETH' && !hasApprovedCollateral && !hasPermitPool) {
      // approve USDC
      setSteps(1);
      setButtonLabel('Approve Collateral');
      setOnClick(() => permitMarginPool);
    } else if (mintAmount.gt(0) && !hasSentMintTx) {
      // mint otoken
      setSteps(2);
      setButtonLabel('Issue oToken');
      if (collateralCallData && !hasApprovedCollateral) {
        setOnClick(() => permitDepositMint);
      } else {
        setOnClick(() => mint);
      }
    } else if (!hasApproved0xProxy && !hasApproved0x) {
      // approve 0x
      setSteps(3);
      setButtonLabel('Approve oToken');
      setOnClick(() => approveERC20Proxy);
    } else {
      // trade
      setSteps(4);
      // setIsExchangeTxn(true);
      if (mode === CreateMode.Market) {
        if (marketError === Errors.LARGE_MARKET_IMPACT) {
          setButtonLabel('Make Trade Anyway');
        } else {
          setButtonLabel('Sell oToken');
        }
        setOnClick(() => pureSell);
      } else {
        if (netPremiumIsNegative) {
          setButtonLabel('Create Order Anyway');
        } else {
          setButtonLabel('Create Order');
        }
        setOnClick(() => createAndBroadcast);
      }
    }
  }, [
    mintAmount,
    hasApproved0xProxy,
    hasApprovedCollateral,
    sellAmount,
    payableProxyEnabled,
    addPayableProxyAsOperator,
    approveERC20Proxy,
    permitMarginPool,
    collateral.symbol,
    collateralCallData,
    mint,
    permitDepositMint,
    pureSell,
    setSteps,
    hasSetOperator,
    hasPermitPool,
    hasApproved0x,
    hasSentMintTx,
    createAndBroadcast,
    mode,
    marketError,
    netPremiumIsNegative,
  ]);

  const isSmallOrder = useMemo(() => {
    const fillCostInUSDC = gasPrice.times(ESTIMATE_FILL_COST_PER_GWEI).times(underlyingPrice);
    const totalPremium = input.times(price);
    return !totalPremium.isZero() && totalPremium.lt(fillCostInUSDC.times(2));
  }, [gasPrice, underlyingPrice, input, price]);

  const sellCheckoutSteps: Array<TxStepType> = useMemo(
    () => [
      { step: collateral.symbol === 'WETH' ? 'Permit WETH Wrapper' : 'Permit Collateral', type: 'APPROVE' },
      { step: 'Issue oTokens', type: 'ACTION' },
      { step: 'Permit oToken to 0x trading contract', type: 'APPROVE' },
      { step: mode === CreateMode.Market ? 'Sell oToken' : 'Place limit sell order', type: 'ACTION' },
    ],
    [mode, collateral],
  );

  const onPartialSelected = (partial: boolean) => {
    setIsPartial(partial);
  };

  return (
    <div>
      <ListItem label={`${collateral.symbol} Balance`} value={parseBigNumber(collateralBalance, collateral.decimals)} />
      <ListItem label={'oToken Balance'} value={parseBigNumber(otokenBalance, otoken.decimals)} />
      <PartialCollat
        partialSelected={onPartialSelected}
        setCollatPercent={setCollateralPercent}
        oToken={otoken}
        mintAmount={mintAmount}
        collateral={collateral}
        underlyingPrice={underlyingPrice}
        neededCollateral={neededCollateral}
        setError={setError}
      />
      <TxSteps steps={sellCheckoutSteps} currentStep={steps - 1} />
      <SellTicketInfo
        otoken={otoken}
        usdcBalance={usdcBalance}
        underlyingBalance={underlyingBalance}
        otokenBalance={otokenBalance}
        collateralRequired={actualNeededCollateral}
        amount={new BigNumber(input)}
        totalPremium={totalPremium}
        protocolFee={getProtocolFee(ordersToFill)}
        protocolFeeInUsdc={protocolFeeInUsdc}
        isMarket={mode === CreateMode.Market}
        showWarning={buttonLabel.includes('Sell')}
        marketImpact={marketImpact}
        estimatedGas={steps === 4 ? gasEstimate : undefined}
      />
      <List disablePadding>
        {mode === CreateMode.Limit && isSmallOrder ? <SmallLimitOrderWarning /> : null}

        <br />
      </List>
      <Box className={classes.actionButtonBox}>
        {isLoading ? (
          <Typography variant="overline" display="block" align="center" className={classes.notice}>
            <CircularProgress />
          </Typography>
        ) : (
          <TradeButton
            buttonLabel={buttonLabel}
            disabled={isLoadingAllowance || input.isZero() || isError || (steps === 4 && gasLimitEstimateFailed)}
            onClick={onClick}
          />
        )}
      </Box>
    </div>
  );
};

export default SellCheckoutCallee;
