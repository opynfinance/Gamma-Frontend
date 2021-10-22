import { useEffect, useState, useMemo, useReducer, useCallback} from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import BigNumber from 'bignumber.js';

import { ZeroXEndpoint, OrderType } from '../utils/constants';
import { useWallet } from '../context/wallet';
import { OrderWithMetaData, OToken, OTokenOrderBook } from '../types';
import { categorizeOrder, getBasePairAskAndBids, sortBids, sortAsks, isValidAsk, isValidBid } from '../utils/0x-utils';
import { useAddresses } from './useAddresses';
import { useToast } from '../context/toast';
import { toTokenAmount } from '../utils/calculations';

enum OrderbookUpdateType {
  Init,
  Update,
  Expire,
}

function orderbookReducer(
  books: OTokenOrderBook[],
  action: {
    type?: OrderbookUpdateType;
    updateInfos?: {
      type: OrderType;
      token: string;
      order: OrderWithMetaData;
    }[];
    books?: OTokenOrderBook[];
  },
) {
  switch (action.type) {
    case OrderbookUpdateType.Init: {
      if (!action.books) return [];
      return action.books;
    }
    case OrderbookUpdateType.Update: {
      if (!action.updateInfos) return books;
      let orderbooksCopy = [...books];
      for (const { type, token, order: orderInfo } of action.updateInfos) {
        if (type === OrderType.BID) {
          const orderBookForThisOToken = orderbooksCopy.find(ob => ob.id === token);
          if (orderBookForThisOToken) {
            const bids = orderBookForThisOToken.bids;
            const existingBidIdx = bids.findIndex(bid => bid.metaData.orderHash === orderInfo.metaData.orderHash);
            if (existingBidIdx !== -1) {
              orderBookForThisOToken.bids[existingBidIdx] = orderInfo;
            } else {
              orderBookForThisOToken.bids.push(orderInfo);
              orderBookForThisOToken.bids = orderBookForThisOToken.bids.sort(sortBids);
            }
            orderBookForThisOToken.bids = orderBookForThisOToken.bids.filter(isValidBid);
          } else {
            // no orderbook for this oToken
            if (orderInfo.metaData.remainingFillableTakerAmount !== '0') {
              const bids = [orderInfo];
              orderbooksCopy.push({ bids, asks: [], id: token });
            }
          }
        } else if (type === OrderType.ASK) {
          const orderBookForThisOToken = orderbooksCopy.find(ob => ob.id === token);
          if (orderBookForThisOToken) {
            const asks = orderBookForThisOToken.asks;
            const existingAskIdx = asks.findIndex(ask => ask.metaData.orderHash === orderInfo.metaData.orderHash);
            if (existingAskIdx !== -1) {
              orderBookForThisOToken.asks[existingAskIdx] = orderInfo;
            } else {
              orderBookForThisOToken.asks.push(orderInfo);
              orderBookForThisOToken.asks = orderBookForThisOToken.asks.sort(sortAsks);
            }
            orderBookForThisOToken.asks = orderBookForThisOToken.asks.filter(isValidAsk);
          } else {
            // no orderbook for this oToken
            if (orderInfo.metaData.remainingFillableTakerAmount !== '0') {
              const asks = [orderInfo];
              orderbooksCopy.push({ asks, bids: [], id: token });
            }
          }
        }
      }
      return orderbooksCopy;
    }
    case OrderbookUpdateType.Expire: {
      const orderbooksCopy = [...books];
      for (let orderbook of orderbooksCopy) {
        orderbook.bids = orderbook.bids.filter(order => isValidBid(order));
        orderbook.asks = orderbook.asks.filter(order => isValidAsk(order));
      }
      return orderbooksCopy;
    }
    default:
      throw new Error('Unknown type in orderbookReducer');
  }
}

const getLiquidityExpiryMap = (books: OTokenOrderBook[], oTokens: OToken[]) => {
  const oTokenMap = oTokens.reduce((acc: any, oToken) => {
    acc[oToken.id] = { underlying: oToken.underlyingAsset.id, expiry: oToken.expiry }
    return acc;
  }, {});

  const liquidityExpiryMap = oTokens.reduce((acc: any, oToken) => {
    acc[oToken.underlyingAsset.id] = {}
    return acc;
  }, {});

  for (const book of books) {
    if (oTokenMap[book.id]) {
      const askSum = book.asks.reduce((acc, ask) => {
        return acc.plus(toTokenAmount(ask.order.makerAmount, 8))
      }, new BigNumber(0));
      const bidSum = book.bids.reduce((acc, bid) => {
        return acc.plus(toTokenAmount(bid.metaData.remainingFillableTakerAmount, 8))
      }, new BigNumber(0));
      const totalSum = askSum.plus(bidSum);

      const { expiry, underlying} = oTokenMap[book.id];

      if (liquidityExpiryMap[underlying][expiry] !== undefined) {
        liquidityExpiryMap[underlying][expiry] += totalSum.toNumber();
      } else {
        liquidityExpiryMap[underlying][expiry] = 0;
      }
    }
  }
  
  return liquidityExpiryMap;
}

export default function use0xOrderBooks(oTokens: OToken[], completeCallback?: any) {
  const { networkId, address: account } = useWallet();

  const toast = useToast();

  const wsUrl = useMemo(() => ZeroXEndpoint[networkId].ws, [networkId]);

  const [isLoading, setIsLoading] = useState(true);
  const [liquidityExpiryMap, setLiquidityExpiryMap] = useState({});

  const [orderbooksBasic, dispatch] = useReducer(orderbookReducer, []);

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    wsUrl,
    {
      share: true,
      onError: event => {
        console.log(event);
      },
      shouldReconnect: closeEvent => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    },
    true,
  );

  const refreshOrders = useCallback(async() => {
    if (oTokens.length === 0) return [];
    setIsLoading(true);
    const url = window.location.href;
    const result = await getBasePairAskAndBids(oTokens, networkId, url);
    setLiquidityExpiryMap(getLiquidityExpiryMap(result, oTokens));
    setIsLoading(false);
    if (typeof completeCallback === 'function') completeCallback();
    return result;
  }, [completeCallback, networkId, oTokens])

  // fetch initial bids and asks when oTokens are ready
  useEffect(() => {
    refreshOrders().then((books: OTokenOrderBook[]) => {
      dispatch({ type: OrderbookUpdateType.Init, books });
    });
  }, [oTokens, networkId, completeCallback, refreshOrders]);

  const { usdc } = useAddresses();

  useEffect(() => {
    if (readyState === ReadyState.OPEN) return;
    const config = JSON.stringify({
      type: 'subscribe',
      channel: 'orders',
      requestId: Date.now().toString(),
    });
    sendMessage(config);
  }, [readyState, sendMessage, usdc]);

  // filter out invalid orders every 5 sec
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: OrderbookUpdateType.Expire });
    }, 5000);
    return () => clearInterval(interval);
  }, [orderbooksBasic]);

  // update bids and asks array when receive new orders
  useEffect(() => {
    if (!lastMessage || !lastMessage.data) return;

    const data = JSON.parse(lastMessage.data);
    const orders: OrderWithMetaData[] = data.payload;
    const otokenAddrs = oTokens.map(token => token.id);

    const updateInfos = orders
      .map(orderInfo => {
        const { type, token } = categorizeOrder(networkId, otokenAddrs, orderInfo);
        return { type, token, order: orderInfo };
      })
      .filter(updateInfo => {
        return updateInfo.type !== OrderType.NOT_OTOKEN;
      });

    if (updateInfos.length > 0)
      dispatch({
        type: OrderbookUpdateType.Update,
        updateInfos,
      });
    if (updateInfos.length > 0) {
      const isMyOrder = updateInfos.find(
        info =>
          Number(info.order.order.expiry) > Date.now() / 1000 &&
          info.order.metaData.remainingFillableTakerAmount !== info.order.order.takerAmount &&
          info.order.order.maker === account && info.order.metaData.state !== 'CANCELLED',
      );

      if (isMyOrder) toast.success(`Order filled!`);
    }
  }, [lastMessage, oTokens, networkId, toast, account]);

  return { orderBooks: orderbooksBasic, isLoading, liquidityExpiryMap, refreshOrders };
}
