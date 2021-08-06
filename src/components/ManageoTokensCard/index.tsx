import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import Card from '@material-ui/core/Card';
import Box from '@material-ui/core/Box';

import AmountInput from '../AmountInput';
import ActionCard, { useActionCard } from '../ActionCard';
import ConfirmingCard from '../ConfirmingCard';
import { useError, useControllerActions, useTokenPrice } from '../../hooks';
import { ShortPositionState } from '../ShortPositionDetail/useShortPosition';
import { parseBigNumber, parseTxErrorMessage } from '../../utils/parse';
import { useToast } from '../../context/toast';
import CardContent from './CardContent';
import { AntTab, AntTabs } from '../../components/AntTab';
import { VaultType } from '../../utils/constants';
import PartialCollat from '../PartialCollat';
import { calculateSimpleCollateral } from '../../utils/calculations';

enum CardStatus {
  APPROVED,
  PENDING,
  CONFIRMED,
}

export enum Action {
  BURN = 'Burn',
  ISSUE = 'Issue',
}

const ManageoTokensCard = ({
  otoken,
  vaultId,
  collateral,
  redeemableCollateral,
  otokenBalance,
  shortAmount,
  collateralAmount,
  mintableOTokens,
  vaultType,
}: ShortPositionState) => {
  const toast = useToast();

  const [txHash, setTxHash] = useState('');

  const [action, setAction] = useState<Action>(Action.ISSUE);
  const [cardStatus, setCardStatus] = useState<CardStatus>(CardStatus.APPROVED);

  const [amount, setAmount] = useState(new BigNumber(0));
  const [collatPercent, setCollatPercent] = useState(0);

  const { actionCardState, setActionText, setActionDisabled } = useActionCard({
    title: 'Manage oTokens',
    buttonText: 'Burn oTokens',
  });

  const { isError, errorName, errorDescription } = useError(collateral.symbol);
  const { issueTokens, burnTokens, burnAndWithdrawCollateral } = useControllerActions();
  const handleAmountChange = (value: BigNumber) => {
    const p = (action === Action.ISSUE ? shortAmount.multipliedBy(availableCollatPercent / 100) : shortAmount)
      .multipliedBy(action === Action.ISSUE ? 100 : availableCollatPercent)
      .dividedBy(shortAmount.plus(action === Action.ISSUE ? value : value.negated()))
      .toFixed(1);

    setCollatPercent(parseInt(p));
    setAmount(new BigNumber(value.toFixed(0)));
  };

  const handleActionChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setAction(newValue === 0 ? Action.ISSUE : Action.BURN);
  };

  const max = useMemo(() => {
    if (action === Action.ISSUE) return mintableOTokens;
    // if (action === Action.BURN)
    return otokenBalance;
  }, [action, mintableOTokens, otokenBalance]);

  const underlyingSpotPrice = useTokenPrice(otoken.underlyingAsset.id, 10);

  // ui state changes
  useEffect(() => {
    if (cardStatus === CardStatus.PENDING) {
      setActionText('waiting...');
      setActionDisabled(true);
      return;
    }
    if (cardStatus === CardStatus.CONFIRMED) {
      setActionText('done');
      setActionDisabled(false);
      return;
    }
    if (action === Action.ISSUE) {
      setActionText('Issue Tokens');
      if (amount.gt(mintableOTokens)) return setActionDisabled(true);
    }
    if (action === Action.BURN) {
      setActionText('Burn Tokens');
      if (amount.gt(otokenBalance)) return setActionDisabled(true);
    }
    if (amount.isZero()) return setActionDisabled(true);
    return setActionDisabled(false);
  }, [
    amount,
    action,
    setActionText,
    setActionDisabled,
    collateral.decimals,
    mintableOTokens,
    otokenBalance,
    cardStatus,
  ]);

  // action handlers
  const handleError = useCallback(
    error => {
      const message = parseTxErrorMessage(error);
      toast.error(message);
      // return back to idle state
      return setCardStatus(CardStatus.APPROVED);
    },
    [toast],
  );

  const handleIssueOtokens = useCallback(() => {
    if (!issueTokens) return handleError(new Error('ManageOtokensCard: issueTokens is undefined.'));
    if (amount.gt(mintableOTokens)) return handleError(new Error('Insufficient collateral to mint oTokens'));
    setCardStatus(CardStatus.PENDING);
    const callback = () => setCardStatus(CardStatus.CONFIRMED);
    issueTokens(
      {
        vaultId: vaultId,
        asset: otoken.id,
        amount: amount,
      },
      callback,
      handleError,
    ).then(hash => hash && setTxHash(hash));
  }, [amount, handleError, issueTokens, mintableOTokens, otoken.id, vaultId]);

  const handleBurnOtokens = useCallback(() => {
    if (!burnTokens || !burnAndWithdrawCollateral)
      return handleError(new Error('ManageOtokensCard: burnTokens is undefined.'));
    if (amount.gt(otokenBalance)) return handleError(new Error('Insufficent otokens.'));
    setCardStatus(CardStatus.PENDING);
    const callback = () => setCardStatus(CardStatus.CONFIRMED);
    if (amount.eq(otokenBalance)) {
      // If 100% token is removed withdraw collat
      burnAndWithdrawCollateral(
        {
          vaultId: vaultId,
          shortAsset: otoken.id,
          burnAmount: amount, // burn amount
          collateralAsset: otoken.collateralAsset.id,
          collateralAmount: collateralAmount,
          longAsset: '',
          longAmount: new BigNumber(0),
        },
        callback,
        handleError,
      ).then(hash => hash && setTxHash(hash));
    } else {
      burnTokens(
        {
          vaultId: vaultId,
          asset: otoken.id,
          amount: amount,
        },
        callback,
        handleError,
      ).then(hash => setTxHash(hash));
    }
  }, [
    amount,
    burnAndWithdrawCollateral,
    burnTokens,
    collateralAmount,
    handleError,
    otoken.collateralAsset.id,
    otoken.id,
    otokenBalance,
    vaultId,
  ]);

  const handleCloseConfirmCard = useCallback(() => setCardStatus(CardStatus.APPROVED), []);

  // confirm button behavior
  const handleConfirm = useCallback(() => {
    if (cardStatus === CardStatus.APPROVED && action === Action.BURN) return handleBurnOtokens();
    if (cardStatus === CardStatus.APPROVED && action === Action.ISSUE) return handleIssueOtokens();
    if (cardStatus === CardStatus.CONFIRMED) return handleCloseConfirmCard();
    handleError('AdjustCollateralCard: Invalid state.');
  }, [action, cardStatus, handleBurnOtokens, handleCloseConfirmCard, handleError, handleIssueOtokens]);

  const description = useCallback(() => `${action} ${parseBigNumber(amount, otoken.decimals)} ${otoken.symbol}`, [
    action,
    amount,
    otoken.decimals,
    otoken.symbol,
  ]);

  const neededCollateral = useMemo(() => (otoken ? calculateSimpleCollateral(otoken, shortAmount) : new BigNumber(0)), [
    shortAmount,
    otoken,
  ]);

  const availableCollatPercent = useMemo(() => Math.floor(collateralAmount.div(neededCollateral).toNumber() * 100), [
    collateralAmount,
    neededCollateral,
  ]);

  return (
    <ActionCard {...actionCardState} handleConfirm={handleConfirm}>
      {cardStatus <= CardStatus.APPROVED ? (
        <>
          <Card>
            <AntTabs
              variant="fullWidth"
              value={action === Action.ISSUE ? 0 : 1}
              onChange={handleActionChange}
              aria-label="add-or-remove"
            >
              <AntTab label={Action.ISSUE} />
              <AntTab label={Action.BURN} />
            </AntTabs>
            <Box style={{ padding: '8px' }}>
              <AmountInput
                // value={amount}
                label={'Amount'}
                isError={isError}
                errorDescription={errorDescription}
                errorName={errorName}
                adornment={''}
                decimals={otoken.decimals}
                onChange={handleAmountChange}
                max={max}
                value={amount}
              />
              {vaultType === VaultType.NAKED_MARGIN ? (
                <PartialCollat
                  partialSelected={() => {}}
                  setCollatPercent={p => {
                    if (collatPercent !== p)
                      setAmount(
                        new BigNumber(
                          (action === Action.ISSUE
                            ? shortAmount.multipliedBy(availableCollatPercent / 100)
                            : shortAmount
                          )
                            .multipliedBy((action === Action.ISSUE ? 100 : availableCollatPercent) / p)
                            .minus(shortAmount)
                            .multipliedBy(action === Action.ISSUE ? 1 : -1)
                            .toFixed(0),
                        ),
                      );
                  }}
                  oToken={otoken}
                  mintAmount={shortAmount}
                  collateral={collateral}
                  underlyingPrice={underlyingSpotPrice}
                  neededCollateral={neededCollateral}
                  setError={() => {}}
                  minimum={action === Action.BURN ? availableCollatPercent : undefined}
                  maximum={action === Action.ISSUE ? availableCollatPercent : undefined}
                  hideSwitch
                  collatPercent={collatPercent}
                />
              ) : null}
              <CardContent
                collateralAmount={collateralAmount}
                otokenBalance={otokenBalance}
                collateral={collateral}
                redeemableCollateral={redeemableCollateral}
                mintableOTokens={mintableOTokens}
                shortAmount={shortAmount}
                otoken={otoken}
                action={action}
              />
            </Box>
          </Card>
        </>
      ) : null}
      {cardStatus >= CardStatus.PENDING ? (
        <ConfirmingCard
          confirmed={cardStatus === CardStatus.CONFIRMED}
          handleNext={handleConfirm}
          description={description()}
          txHash={txHash}
        />
      ) : null}
    </ActionCard>
  );
};

export default ManageoTokensCard;
