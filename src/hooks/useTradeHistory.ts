import { useState, useEffect, useCallback } from 'react';
import { loader } from 'graphql.macro';
import { useQuery } from '@apollo/client';

import * as subgraphUtil from '../utils/subgraph';
import { useWallet, useController } from '.';

const tradeHistoryQuery = loader('../queries/accountTrades.graphql');

export function useTradeHistory(
  account: string,
): { refetch: Function; buys: subgraphUtil.SubgraphTrade[]; sells: subgraphUtil.SubgraphTrade[] } {
  const controller = useController();

  const [sells, setSells] = useState<subgraphUtil.SubgraphTrade[]>([]);
  const [buys, setBuys] = useState<subgraphUtil.SubgraphTrade[]>([]);

  const { lastConfirmedTransaction, networkId } = useWallet();

  const { data: tradeHistory, stopPolling, startPolling: startPollingHistory, refetch: refetchHistory } = useQuery(
    tradeHistoryQuery,
    {
      variables: { account },
    },
  );

  useEffect(() => {
    if (!tradeHistory) return;
    if (tradeHistory.sells) {
      const trades = tradeHistory.sells.map((trade: any) => {
        return {
          ...trade,
          oToken: subgraphUtil.toInternalOToken(trade.oToken, networkId),
        };
      });
      setSells(trades);
    }
    if (tradeHistory.buys) {
      const trades = tradeHistory.buys.map((trade: any) => {
        return {
          ...trade,
          oToken: subgraphUtil.toInternalOToken(trade.oToken, networkId),
        };
      });
      setBuys(trades);
    }
    stopPolling();
  }, [tradeHistory, stopPolling, networkId]);

  const refetch = useCallback(() => {
    refetchHistory();
  }, [refetchHistory]);

  const [lastHandledTransaction, setLastHandledTransaction] = useState<number>(0);

  useEffect(() => {
    if (lastHandledTransaction < lastConfirmedTransaction) {
      setLastHandledTransaction(lastConfirmedTransaction);
      startPollingHistory(500);
    }

    return undefined;
  }, [account, controller, lastConfirmedTransaction, lastHandledTransaction, startPollingHistory]);

  return {
    buys,
    sells,
    refetch,
  };
}