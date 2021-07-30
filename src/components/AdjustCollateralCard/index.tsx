/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import Card from '@material-ui/core/Card';
import Box from '@material-ui/core/Box';
import ReactGA from 'react-ga';

import ActionCard, { useActionCard } from '../ActionCard';
import AmountInput from '../AmountInput';
import ConfirmingCard from '../ConfirmingCard';
import { ShortPositionState } from '../ShortPositionDetail/useShortPosition';
import CardContent from './CardContent';
import { AntTab, AntTabs } from '../../components/AntTab';
import { parseBigNumber } from '../../utils/parse';
import { parseTxErrorMessage, parseTxErrorType } from '../../utils/parse';

import {
  useControllerActions,
  useWallet,
  useError,
  usePayableProxy,
  useAddresses,
  useApproval,
  useToast,
  Spender,
  useTokenPrice,
} from '../../hooks';
import PartialCollat from '../PartialCollat';
import { calculateSimpleCollateral } from '../../utils/calculations';
import { Errors, VaultType } from '../../utils/constants';

export enum Action {
  ADD = 'Add',
  REMOVE = 'Remove',
}

enum CardStatus {
  PROXY_UNAPPROVED,
  PROXY_APPROVING,

  USDC_UNAPPROVED,
  USDC_APPROVING,

  APPROVED,
  PENDING,
  CONFIRMED,
}

const AdjustCollateralCard = ({
  collateral,
  collateralAmount,
  redeemableCollateral,
  collateralBalance,
  vaultId,
  vaultType,
  otoken,
  shortAmount,
}: ShortPositionState) => {
  const isWithdrawOnly = shortAmount.isZero() && vaultType === VaultType.NAKED_MARGIN;
  const buttonText = isWithdrawOnly ? 'Withdraw Collateral' : 'Add Collateral';
  const title = isWithdrawOnly ? 'Withdraw Collateral' : 'Adjust Collateral';

  const { actionCardState, setActionText, setActionDisabled } = useActionCard({
    title: title,
    buttonText: buttonText,
  });

  const { ethBalance } = useWallet();
  const [txHash, setTxHash] = useState('');

  const toast = useToast();

  const [action, setAction] = useState<Action>(isWithdrawOnly ? Action.REMOVE : Action.ADD);
  const [cardStatus, setCardStatus] = useState<CardStatus>(CardStatus.APPROVED);
  const [amount, setAmount] = useState(new BigNumber(0));

  const { usdc: usdcAddress } = useAddresses();
  const { allowance: usdcAllowance, approve: approveUsdc } = useApproval(usdcAddress, Spender.MarginPool);
  const isWeth = useMemo(() => collateral.symbol === 'WETH', [collateral.symbol]);
  const needsToApproveUsdc = useMemo(() => action === Action.ADD && isWeth === false && amount.gt(usdcAllowance), [
    action,
    amount,
    isWeth,
    usdcAllowance,
  ]);
  const { isProxyOperator, addProxyOperator } = usePayableProxy();
  const needsToAddOperator = useMemo(() => isWeth && isProxyOperator === false, [isProxyOperator, isWeth]);

  // state transitions
  useEffect(() => {
    // if collateral is WETH,
    // need to approve payable proxy as operator
    // for both add and remove
    if (needsToAddOperator === true && cardStatus > CardStatus.PROXY_APPROVING)
      return setCardStatus(CardStatus.PROXY_UNAPPROVED);
    if (needsToAddOperator === false && needsToApproveUsdc === false && cardStatus < CardStatus.APPROVED)
      return setCardStatus(CardStatus.APPROVED);

    // if collateral is not WETH,
    // need to approve USDC only when adding
    if (isWeth === false && action === Action.ADD) {
      if (needsToApproveUsdc === true && cardStatus !== CardStatus.USDC_APPROVING)
        return setCardStatus(CardStatus.USDC_UNAPPROVED);
      if (needsToApproveUsdc === false && cardStatus < CardStatus.PENDING) return setCardStatus(CardStatus.APPROVED);
    }
  }, [action, cardStatus, isWeth, needsToAddOperator, needsToApproveUsdc]);

  const { withdrawCollateral, depositCollateral } = useControllerActions();

  const underlyingSpotPrice = useTokenPrice(otoken.underlyingAsset.id, 10);

  const neededCollateral = useMemo(() => (otoken ? calculateSimpleCollateral(otoken, shortAmount) : new BigNumber(0)), [
    shortAmount,
    otoken,
  ]);

  const availableCollatPercent = useMemo(() => Math.ceil(collateralAmount.div(neededCollateral).toNumber() * 100), [
    collateralAmount.toNumber(),
    neededCollateral.toNumber(),
  ]);

  const max = useMemo(() => {
    if (action === Action.REMOVE) return redeemableCollateral;
    // if (action === Action.ADD)
    if (vaultType === VaultType.NAKED_MARGIN) return neededCollateral.minus(collateralAmount);
    if (isWeth) return ethBalance;
    return collateralBalance;
  }, [
    action,
    collateralAmount,
    collateralBalance,
    ethBalance,
    isWeth,
    neededCollateral,
    redeemableCollateral,
    vaultType,
  ]);

  // update total on user input change
  // and change buttton text
  useEffect(() => {
    if (cardStatus === CardStatus.PROXY_UNAPPROVED) {
      setActionText('Add WETH Wrapper');
      setActionDisabled(false);
      return;
    }
    if (cardStatus === CardStatus.PROXY_APPROVING) {
      setActionText('Adding...');
      setActionDisabled(true);
      return;
    }
    if (cardStatus === CardStatus.USDC_UNAPPROVED) {
      setActionText('Approve USDC');
      setActionDisabled(false);
      return;
    }
    if (cardStatus === CardStatus.USDC_APPROVING) {
      setActionText('Approving');
      setActionDisabled(true);
      return;
    }
    if (cardStatus === CardStatus.APPROVED && action === Action.ADD) {
      setActionText('Add Collateral');
      if (amount.lt(0)) return setActionDisabled(true);
      if (isWeth === false && amount.gt(collateralBalance)) return setActionDisabled(true);
      if (isWeth === true && amount.gt(ethBalance)) return setActionDisabled(true);
      return setActionDisabled(false);
    }
    if (cardStatus === CardStatus.APPROVED && action === Action.REMOVE) {
      setActionText(isWithdrawOnly ? 'Withdraw Collateral' : 'Remove Collateral');
      if (amount.lt(0)) return setActionDisabled(true);
      if (amount.gt(redeemableCollateral)) return setActionDisabled(true);
      return setActionDisabled(false);
    }
    if (cardStatus === CardStatus.PENDING) {
      setActionText('waiting');
      setActionDisabled(true);
      return;
    }
    if (cardStatus === CardStatus.CONFIRMED) {
      setActionText('done');
      setActionDisabled(false);
    }
    return undefined;
  }, [
    amount.toString(),
    action,
    collateralAmount.toNumber(),
    redeemableCollateral.toNumber(),
    collateralBalance.toNumber(),
    cardStatus,
    isWeth,
    ethBalance.toNumber(),
  ]);

  const { isError, errorName, errorDescription, setErrorType } = useError(collateral?.symbol ?? '');

  const handleAmountChange = (value: BigNumber) => {
    if (value.isGreaterThan(max)) {
      setErrorType(Errors.GREATER_THAN_MAX);
    } else {
      setErrorType(Errors.NO_ERROR);
    }
    setAmount(value);
  };

  console.log(isError);

  const handleActionChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    if (isWithdrawOnly) return;
    setAction(newValue === 0 ? Action.ADD : Action.REMOVE);
  };

  // action handlers
  const handleError = useCallback(
    (error, errorStep?: string) => {
      const message = parseTxErrorMessage(error);
      const errorType = parseTxErrorType(error);
      toast.error(message);
      // return back to idle state
      if (needsToAddOperator) return setCardStatus(CardStatus.PROXY_UNAPPROVED);
      if (needsToApproveUsdc) return setCardStatus(CardStatus.USDC_UNAPPROVED);

      if (errorStep)
        ReactGA.event({
          category: 'Transactions',
          action: errorType,
          label: `${errorStep} - ${message}`,
        });
      return setCardStatus(CardStatus.APPROVED);
    },
    [needsToAddOperator, needsToApproveUsdc, toast],
  );

  const handleApproveUsdc = useCallback(() => {
    if (!approveUsdc) handleError(new Error('AdjustCollateralCard: approveUsdc is null'), 'CollateralApproveUsdc');
    setCardStatus(CardStatus.USDC_APPROVING);
    const callback = () => {
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'CollateralApproveUsdc',
      });
    };
    approveUsdc({ callback, onError: (error: any) => handleError(error, 'CollateralApproveUsdc') });
  }, [approveUsdc, handleError]);

  const handleAddProxyOperator = useCallback(() => {
    if (isProxyOperator) return handleError(new Error('Proxy is already added as operator for this account.'));
    setCardStatus(CardStatus.PROXY_APPROVING);
    const callback = () => {
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'CollateralApproveProxy',
      });
    };
    addProxyOperator({ callback, onError: (error: any) => handleError(error, 'CollateralApproveProxy') });
  }, [addProxyOperator, handleError, isProxyOperator]);

  const handleAddCollateral = useCallback(() => {
    if (isWeth === false && amount.gt(collateralBalance)) return handleError('Amount exceeds available balance.');
    if (isWeth === false && amount.gt(usdcAllowance))
      return handleError('AdjustCollateralCard: amount exceeds USDC allowance', 'CollateralAdded');

    if (isWeth === true && amount.gt(ethBalance))
      return handleError('Amount exceeds available balance.', 'CollateralAdded');
    if (needsToAddOperator) return handleError('Need to add proxy operator.', 'CollateralAdded');

    if (!depositCollateral)
      return handleError('AdjustCollateralCard: depositCollateral is undefined', 'CollateralAdded');

    setCardStatus(CardStatus.PENDING);
    const callback = () => {
      setCardStatus(CardStatus.CONFIRMED);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'CollateralAdded',
      });
    };
    depositCollateral(
      {
        vaultId: vaultId,
        asset: collateral.id,
        amount,
      },
      callback,
      handleError,
    ).then(hash => hash && setTxHash(hash));
  }, [
    amount,
    collateral.id,
    collateralBalance,
    depositCollateral,
    ethBalance,
    handleError,
    isWeth,
    needsToAddOperator,
    usdcAllowance,
    vaultId,
  ]);

  const handleWithdrawCollateral = useCallback(() => {
    const _amount = amount.isZero() && isWithdrawOnly ? max : amount;
    if (_amount.gt(redeemableCollateral))
      handleError('Amount exceeds available redeemable collateral.', 'CollateralWithdrawn');
    if (!withdrawCollateral) throw new Error('AdjustCollateralCard: withdrawCollateral is undefined');
    if (needsToAddOperator) handleError('Need to add proxy operator.', 'CollateralWithdrawn');
    setCardStatus(CardStatus.PENDING);
    const callback = () => {
      setCardStatus(CardStatus.CONFIRMED);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'CollateralWithdrawn',
      });
    };
    withdrawCollateral(
      {
        vaultId: vaultId,
        asset: collateral.id,
        amount: _amount,
      },
      callback,
      handleError,
    ).then(hash => hash && setTxHash(hash));
  }, [amount, collateral.id, handleError, needsToAddOperator, redeemableCollateral, vaultId, withdrawCollateral]);

  const handleCloseConfirmCard = useCallback(() => setCardStatus(CardStatus.APPROVED), []);

  const handleConfirm = useCallback(() => {
    if (cardStatus === CardStatus.PROXY_UNAPPROVED) return handleAddProxyOperator();
    if (cardStatus === CardStatus.USDC_UNAPPROVED) return handleApproveUsdc();
    if (cardStatus === CardStatus.APPROVED && action === Action.ADD) return handleAddCollateral();
    if (cardStatus === CardStatus.APPROVED && action === Action.REMOVE) return handleWithdrawCollateral();
    if (cardStatus === CardStatus.CONFIRMED) return handleCloseConfirmCard();
    handleError('AdjustCollateralCard: Invalid state.');
  }, [
    action,
    cardStatus,
    handleAddCollateral,
    handleAddProxyOperator,
    handleApproveUsdc,
    handleCloseConfirmCard,
    handleError,
    handleWithdrawCollateral,
  ]);

  const description = useCallback(() => `${action} ${parseBigNumber(amount, collateral.decimals)} Collateral`, [
    action,
    amount,
    collateral.decimals,
  ]);

  return (
    <ActionCard {...actionCardState} handleConfirm={handleConfirm} isDisabled={isError}>
      {cardStatus <= CardStatus.APPROVED ? (
        <Card>
          <AntTabs
            variant="fullWidth"
            value={action === Action.ADD ? 0 : 1}
            onChange={handleActionChange}
            aria-label="add-or-remove"
          >
            {isWithdrawOnly ? null : <AntTab label={Action.ADD} />}
            <AntTab label={isWithdrawOnly ? 'Withdraw' : Action.REMOVE} />
          </AntTabs>
          <Box style={{ padding: '8px' }}>
            <AmountInput
              label={'Amount'}
              isError={isError}
              errorDescription={errorDescription}
              errorName={errorName}
              adornment={collateral.symbol}
              decimals={collateral.decimals}
              onChange={handleAmountChange}
              max={max}
              value={amount.isZero() && isWithdrawOnly ? max : amount}
            />
            {vaultType === VaultType.NAKED_MARGIN ? (
              <PartialCollat
                partialSelected={() => {}}
                setCollatPercent={collatPercent => {
                  setErrorType(Errors.NO_ERROR);
                  setAmount(
                    neededCollateral
                      .multipliedBy((collatPercent - availableCollatPercent) / 100)
                      .multipliedBy(action === Action.ADD ? 1 : -1),
                  );
                }}
                oToken={otoken}
                mintAmount={shortAmount}
                collateral={collateral}
                underlyingPrice={underlyingSpotPrice}
                neededCollateral={neededCollateral}
                setError={() => {}}
                minimum={action === Action.ADD ? availableCollatPercent : undefined}
                maximum={action === Action.REMOVE ? availableCollatPercent : undefined}
                hideSwitch
              />
            ) : null}
            <CardContent
              redeemableCollateral={redeemableCollateral}
              collateral={collateral}
              collateralBalance={collateralBalance}
              collateralAmount={collateralAmount}
              ethBalance={ethBalance}
              action={action}
              amount={amount.isZero() && isWithdrawOnly ? max : amount}
            />
          </Box>
        </Card>
      ) : null}
      {cardStatus >= CardStatus.PENDING ? (
        <ConfirmingCard confirmed={cardStatus === CardStatus.CONFIRMED} description={description()} txHash={txHash} />
      ) : null}
    </ActionCard>
  );
};

export default AdjustCollateralCard;

//
