import React, { useState, useEffect, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import ReactGA from 'react-ga';

import ConfirmingCard from '../ConfirmingCard';
import ConfirmContent from '../ConfirmCard/ConfirmContent';
import ActionCard, { useActionCard } from '../ActionCard';
import { OToken } from '../../types';
import RedeemCardContent from './CardContent';
import { useControllerActions, useController } from '../../hooks';
import { parseBigNumber, parseTxErrorMessage } from '../../utils/parse';
import { useToast } from '../../context/toast';

type ExerciseProps = {
  otoken: OToken;
  longAmount: BigNumber;
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

const RedeemCard = ({ otoken, longAmount, handleClosePosition, isWaitingPeriod }: ExerciseProps) => {
  const { controller } = useController();
  const toast = useToast();
  //TODO: Logic to determine error type

  const { redeemTokens } = useControllerActions();

  const { actionCardState, setActionText, setActionDisabled } = useActionCard({
    title: 'Redeem Expired Tokens',
    buttonText: 'Redeem Payout',
  });

  const [cardStatus, setCardStatus] = useState<CardStatus>(CardStatus.REDEEM_APPROVED);

  const [txHash, setTxHash] = useState('');

  const [payoutPerOToken, setPayoutPerOToken] = useState<BigNumber>(new BigNumber(0));
  const [totalPayout, setTotalPayout] = useState<BigNumber>(new BigNumber(0));

  const handleError = useCallback(
    (error, errorStep?: string) => {
      const message = parseTxErrorMessage(error);
      toast.error(message);
      if (errorStep)
        ReactGA.event({
          category: 'Transactions',
          action: 'Error',
          label: `${errorStep} - ${message}`,
        });
    },
    [toast],
  );

  useEffect(() => {
    if (!controller) return handleError(new Error('RedeemCard: controller undefined'));
    controller
      .getPayout(otoken.id, 10 ** otoken.decimals)
      .then((result: any) => {
        const payout = new BigNumber(result.toString());
        setPayoutPerOToken(payout);
        setTotalPayout(payout.times(longAmount).div(10 ** otoken.decimals));
      })
      .catch((e: any) => console.log('Error in getting payout, occurs in test network', e));
  }, [controller, handleError, longAmount, otoken]);

  useEffect(() => {
    if (isWaitingPeriod === true) {
      console.log('waiting per ' + isWaitingPeriod);
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
      setActionText('Redeem Payout');
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

    return;
  }, [cardStatus, isWaitingPeriod, setActionDisabled, setActionText, totalPayout]);

  // actions
  const handleRedeemTokens = useCallback(() => {
    if (!redeemTokens) return handleError(new Error('Please connect wallet'));

    setCardStatus(CardStatus.REDEEM_PENDING);
    const callback = () => {
      setCardStatus(CardStatus.REDEEM_CONFIRMED);
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'RedeemPayoutConfirmed',
      });
    };
    redeemTokens(
      {
        otoken: otoken.id,
        amount: longAmount,
        collateralAsset: otoken.collateralAsset.id,
      },
      callback,
      (error: any) => handleError(error, 'RedeemPayoutConfirmed'),
    ).then(hash => hash && setTxHash(hash));
    return;
  }, [handleError, longAmount, otoken.collateralAsset.id, otoken.id, redeemTokens]);

  const handleConfirm = useCallback(() => {
    // if (cardStatus === CardStatus.PROXY_UNAPPROVED) return handleAddProxyOperator();
    if (cardStatus === CardStatus.REDEEM_APPROVED) return handleRedeemTokens();
    if (cardStatus === CardStatus.REDEEM_CONFIRMED) return handleClosePosition();
    return handleError(new Error('RedeemCard: handleConfirm called with an invalid card state.'));
  }, [cardStatus, handleClosePosition, handleError, handleRedeemTokens]);

  const description = useCallback(
    () =>
      `Redeeming ${parseBigNumber(longAmount, otoken.decimals)} ${otoken.underlyingAsset.symbol} ` +
      `${otoken.isPut ? 'puts' : 'calls'} for ${parseBigNumber(totalPayout, otoken.collateralAsset.decimals)} ` +
      `${otoken.collateralAsset.symbol}.`,

    [
      longAmount,
      otoken.collateralAsset.decimals,
      otoken.collateralAsset.symbol,
      otoken.decimals,
      otoken.isPut,
      otoken.underlyingAsset.symbol,
      totalPayout,
    ],
  );

  return (
    <ActionCard {...actionCardState} handleConfirm={handleConfirm}>
      {cardStatus <= CardStatus.REDEEM_APPROVED ? (
        <RedeemCardContent
          payoutPerOToken={payoutPerOToken}
          longAmount={longAmount}
          totalPayout={totalPayout}
          otoken={otoken}
          collateralAsset={otoken.collateralAsset}
          isWaitingPeriod={isWaitingPeriod}
        />
      ) : null}
      {cardStatus === CardStatus.REDEEM_PENDING ? <ConfirmingCard description={description()} txHash={txHash} /> : null}
      {cardStatus === CardStatus.REDEEM_CONFIRMED ? (
        <ConfirmContent description={description()} txHash={txHash} />
      ) : null}
    </ActionCard>
  );
};

export default RedeemCard;
