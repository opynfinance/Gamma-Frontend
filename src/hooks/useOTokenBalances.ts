import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import { loader } from 'graphql.macro';
import { useQuery } from '@apollo/client';

import { OTokenBalance } from '../types';
import * as subgraphUtil from '../utils/subgraph';
import { useWallet } from '../context/wallet';
import { useZeroX } from '../hooks';

const allBalancesQuery = loader('../queries/balances.graphql');


export default function useBalances(account: string): { 
    balances: OTokenBalance[], 
    refetch: Function 
  } {
  const [balances, setBalances] = useState<OTokenBalance[]>([]);

  const { data, refetch } = useQuery(allBalancesQuery, { variables: { account } });

  const { lastConfirmedTransaction, networkId } = useWallet();

  const { orderBooks } = useZeroX();

  // refetch user otoken balance after each transaction.
  useEffect(() => {
    refetch();
  }, [lastConfirmedTransaction, refetch]);

  // set series array.
  useEffect(() => {
    if (data === undefined) return;

    const subgraphBalances: subgraphUtil.SubgraphAccountBalance[] = data.accountBalances;

    const balances: OTokenBalance[] = [];
    for (const balance of subgraphBalances) {
      const token = subgraphUtil.toInternalOToken(balance.token, networkId);

      const target = orderBooks.find(book => book.id === token.id);
      
      const asks =  target 
                    ? target.asks.filter(o => o.order.maker === account)
                    : []
      const totalAsksSize = asks.length > 0
                            ? new BigNumber(asks.map(ask => 
                                ask.order.makerAmount)
                                .reduce((prev, next) => prev + next)
                              )
                            : new BigNumber(0)


      const newBalance: OTokenBalance = {
        token,
        balance: new BigNumber(balance.balance).minus(totalAsksSize),
      };
      balances.push(newBalance);
    }

    setBalances(balances);

    return () => {};
  }, [data, orderBooks, account, networkId]);

  return { balances, refetch };
}