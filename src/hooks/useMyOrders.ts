import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '../context/wallet';
import { OrderWithMetaData, OToken } from '../types';
import { categorizeOrder } from '../utils/0x-utils';
import { OrderType, ZeroXEndpoint } from '../utils/constants';
import useLiveOptions from './useLiveOptions';

export type MyOrder = {
  type: OrderType;
  token: string;
  order: OrderWithMetaData;
  oToken: OToken | undefined;
};

export const useMyOrders = () => {
  const { address, networkId } = useWallet();
  const apiUrl = useMemo(() => ZeroXEndpoint[networkId].http, [networkId]);
  const { oTokens } = useLiveOptions();

  const otokenAddrs = useMemo(() => {
    return oTokens.map(token => token.id);
  }, [oTokens]);

  const getOToken = useCallback((id: string) => {
    return oTokens.find(oT => oT.id === id);
  }, [oTokens])

  const [orders, setOrders] = useState<MyOrder[]>();


  const parseOrders = useCallback((orders: Array<OrderWithMetaData>) => {
    const data = orders.map(orderInfo => {
      const { type, token } = categorizeOrder(networkId, otokenAddrs, orderInfo);
      const oToken = getOToken(token);
      return { type, token, order: orderInfo, oToken };
    })
    .filter(updateInfo => {
      return updateInfo.type !== OrderType.NOT_OTOKEN;
    });

    setOrders(data);
  }, [getOToken, networkId, otokenAddrs]);

  const fetchOrders = useCallback(() => {
    if (address !== '') {
      fetch(`${apiUrl}sra/v4/orders?maker=${address}&perPage=1000`)
        .then(res => res.json())
        .then(res => parseOrders(res.records))
        .catch(() => setTimeout(fetchOrders, 5000)); // If it fails because of network issue try again
    }
  }, [address, apiUrl, parseOrders])

  useEffect(() => {
    fetchOrders();
  }, [address, apiUrl, fetchOrders, parseOrders])

  return { orders: orders || [], refetch: fetchOrders} ;
}