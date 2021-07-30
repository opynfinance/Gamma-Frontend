import { useState, useEffect } from 'react';
import { loader } from 'graphql.macro';
import { useQuery } from '@apollo/client';

import * as subgraphUtil from '../utils/subgraph';
import { useWallet, useController } from '.';

const accountPayouts = loader('../queries/accountPayouts.graphql');

export function useAccountPayouts(
  account: string,
): {
  refetch: Function;
  settleActions: subgraphUtil.SettleActionType[];
  redeemActions: subgraphUtil.RedeemActionType[];
} {
  const controller = useController();

  const [redeemActions, setRedeemActions] = useState<subgraphUtil.RedeemActionType[]>([]);
  const [settleActions, setSettleActions] = useState<subgraphUtil.SettleActionType[]>([]);

  const { lastConfirmedTransaction, networkId } = useWallet();

  const { data: payouts, startPolling: startPoolingPayouts, stopPolling, refetch } = useQuery(accountPayouts, {
    variables: { account },
  });

  useEffect(() => {
    if (!payouts) return;
    if (payouts.settleActions !== undefined && account !== '') {
      const actions = payouts.settleActions.map((action: any) => {
        return {
          ...action,
          long: action.long ? subgraphUtil.toInternalOToken(action.long, networkId) : null,
          short: action.short ? subgraphUtil.toInternalOToken(action.short, networkId) : null,
        };
      });
      setSettleActions(actions);
    } else {
      setSettleActions([]);
    }
    if (payouts.redeemActions !== undefined) {
      const actions = payouts.redeemActions.map((action: any) => {
        return {
          ...action,
          oToken: subgraphUtil.toInternalOToken(action.oToken, networkId),
        };
      });
      setRedeemActions(actions);
    }
    stopPolling();
  }, [payouts, stopPolling, account, networkId]);

  const [lastHandledTransaction, setLastHandledTransaction] = useState<number>(0);

  useEffect(() => {
    if (lastHandledTransaction < lastConfirmedTransaction) {
      setLastHandledTransaction(lastConfirmedTransaction);
      startPoolingPayouts(500);
    }

    return undefined;
  }, [account, controller, lastConfirmedTransaction, lastHandledTransaction, startPoolingPayouts]);

  return { refetch, redeemActions, settleActions };
}