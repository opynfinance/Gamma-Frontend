import React, { useEffect, useState, useMemo, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import ReactGA from 'react-ga';

import { useWallet, useController } from '../../hooks';
import ActionCard, { useActionCard } from '../ActionCard';
import ConfirmingCard from '../ConfirmingCard';
import { parseBigNumber, parseTxErrorMessage, parseTxErrorType } from '../../utils/parse';
import { ERC20 } from '../../types';
import { useControllerActions, usePayableProxy } from '../../hooks';
import CardContent from './CardContent';
import { useToast } from '../../context/toast';

type RedeemBalanceProps = {
  asset: any;
  collateral: ERC20;
  vaultId: number;
  isWaitingPeriod: boolean;
  handleClosePosition: () => void;
};

enum CardStatus {
  PROXY_UNAPPROVED,
  PROXY_APPROVING,

  REDEEM_APPROVED,
  REDEEM_PENDING,
  REDEEM_CONFIRMED,
}

const RedeemBalanceCard = ({ collateral, vaultId, isWaitingPeriod, handleClosePosition }: RedeemBalanceProps) => {
  const toast = useToast();
  const { controller } = useController();
  const { address } = useWallet();

  const { actionCardState, setActionDisabled, setActionText } = useActionCard({
    title: 'Redeem Balance',
    buttonText: 'Redeem Balance',
  });

  const [cardStatus, setCardStatus] = useState<CardStatus>(CardStatus.REDEEM_APPROVED);

  const [txHash, setTxHash] = useState('');

  const { settleVault } = useControllerActions();

  const isWeth = useMemo(() => collateral.symbol === 'WETH', [collateral.symbol]);
  const { isProxyOperator, addProxyOperator } = usePayableProxy();
  const needsToAddOperator = useMemo(() => isWeth && isProxyOperator === false, [isProxyOperator, isWeth]);

  const handleError = useCallback(
    (error, errorStep?: string) => {
      const message = parseTxErrorMessage(error);
      const errorType = parseTxErrorType(error);
      toast.error(message);
      setCardStatus(cardStatus =>
        cardStatus <= CardStatus.PROXY_APPROVING ? CardStatus.PROXY_UNAPPROVED : CardStatus.REDEEM_APPROVED,
      );
      if (errorStep)
        ReactGA.event({
          category: 'Transactions',
          action: errorType,
          label: `${errorStep} - ${message}`,
        });
    },
    [toast],
  );

  const [redeemableCollateral, setRedeemableCollateral] = useState<BigNumber>(new BigNumber(0));
  useEffect(() => {
    if (!controller) return handleError(new Error('RedeemBalanceCard: controller undefined'));
    // get maximum redemmable collateral
    controller
      .getProceed(address, vaultId)
      .then((proceed: any) => new BigNumber(proceed.toString()))
      .then((result: BigNumber) => setRedeemableCollateral(result))
      .catch((e: any) => console.log('Error in getting payout, occurs in test network', e));
  }, [address, controller, handleError, vaultId]);

  // CARD STATE TRANSITIONS
  useEffect(() => {
    if (needsToAddOperator && cardStatus !== CardStatus.PROXY_APPROVING)
      return setCardStatus(CardStatus.PROXY_UNAPPROVED);
    if (!needsToAddOperator && cardStatus <= CardStatus.PROXY_APPROVING)
      return setCardStatus(CardStatus.REDEEM_APPROVED);
  }, [cardStatus, isProxyOperator, isWeth, needsToAddOperator]);

  // BUTTON STATE

  useEffect(() => {
    if (isWaitingPeriod) {
      setActionText('Redeem Balance');
      setActionDisabled(true);
      return;
    }
    if (cardStatus === CardStatus.PROXY_UNAPPROVED) {
      setActionText('Approve WETH Wrapper');
      setActionDisabled(false);
      return;
    }
    if (cardStatus === CardStatus.PROXY_APPROVING) {
      setActionText('Approving...');
      setActionDisabled(true);
      return;
    }
    if (cardStatus === CardStatus.REDEEM_APPROVED) {
      setActionText('Redeem Balance');
      setActionDisabled(false);
      return;
    }
    if (cardStatus === CardStatus.REDEEM_PENDING) {
      setActionText('Redeeming...');
      setActionDisabled(true);
      return;
    }
    if (cardStatus === CardStatus.REDEEM_CONFIRMED) {
      setActionText('Done');
      setActionDisabled(false);
      return;
    }
  }, [redeemableCollateral, setActionDisabled, setActionText, isWaitingPeriod, cardStatus]);

  // ACTIONS

  const handleAddProxyOperator = useCallback(() => {
    setCardStatus(CardStatus.PROXY_APPROVING);
    const callback = () => {
      setCardStatus(CardStatus.REDEEM_APPROVED);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'RedeemBalanceApproved',
      });
    };
    addProxyOperator({
      callback,
      onError: (error: any) => handleError(error, 'RedeemBalanceApproved'),
    });
  }, [addProxyOperator, handleError]);

  const handleRedeemBalance = useCallback(async () => {
    if (!settleVault) return handleError(new Error('Please connect wallet'));
    setCardStatus(CardStatus.REDEEM_PENDING);

    const callback = () => {
      setCardStatus(CardStatus.REDEEM_CONFIRMED);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'RedeemBalanceConfirmed',
      });
    };
    settleVault(
      {
        vaultId: vaultId,
        collateralAsset: collateral.id,
      },
      callback,
      (error: any) => handleError(error, 'RedeemBalanceConfirmed'),
    ).then(hash => hash && setTxHash(hash));
  }, [collateral.id, handleError, settleVault, vaultId]);

  const handleConfirm = useCallback(() => {
    if (cardStatus === CardStatus.PROXY_UNAPPROVED) return handleAddProxyOperator();
    if (cardStatus === CardStatus.REDEEM_APPROVED) return handleRedeemBalance();
    if (cardStatus === CardStatus.REDEEM_CONFIRMED) return handleClosePosition();
    return handleError(new Error('RedeemCard: handleConfirm called with an invalid card state.'));
  }, [cardStatus, handleAddProxyOperator, handleClosePosition, handleError, handleRedeemBalance]);

  const description = useCallback(
    () => `Redeemed ${parseBigNumber(redeemableCollateral, collateral.decimals)} ${collateral.symbol}`,
    [collateral.decimals, collateral.symbol, redeemableCollateral],
  );

  return (
    <ActionCard {...actionCardState} handleConfirm={handleConfirm}>
      {cardStatus <= CardStatus.REDEEM_APPROVED ? (
        <CardContent
          isWaitingPeriod={isWaitingPeriod}
          redeemableCollateral={redeemableCollateral}
          collateral={collateral}
        />
      ) : null}
      {cardStatus >= CardStatus.REDEEM_PENDING ? (
        <ConfirmingCard
          confirmed={cardStatus === CardStatus.REDEEM_CONFIRMED}
          description={description()}
          txHash={txHash}
        />
      ) : null}
    </ActionCard>
  );
};

export default RedeemBalanceCard;
