import React, { useState, useEffect, useContext, FunctionComponent, useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import { useWallet } from '../wallet';
import { ZeroXEndpoint, PROTOCOL_FEE_PER_GWEI, ZX_EXCHANGE, WETH_ADDRESS, ZERO_ADDR } from '../../utils/constants';
import { SignedOrder, OTokenOrderBook } from '../../types';
import { useGasPrice } from '../../hooks/useGasPrice';
import { use0xOrderBooks, useLiveOptions } from '../../hooks';
import { useToast } from '../toast';
import zeroXAbi from '../../abis/ZeroX_Exchange.json';
import { useTokenPrice } from '../../hooks/useTokenPrice';

const v4orderUtils = require('@0x/protocol-utils');

type FillOrderArgs = {
  orders: SignedOrder[];
  amounts: BigNumber[];
};

type MarketBuyArgs = {
  orders: SignedOrder[];
  makerAssetFillAmount: BigNumber; // makerAssetFillAmount
};

type MarketSellArgs = {
  orders: SignedOrder[];
  takerAssetFillAmount: BigNumber; // takerAssetFillAmount
};

type zeroXContextProps = {
  fillOrders: (args: FillOrderArgs, callback?: any, onError?: any) => Promise<string>;
  marketBuy: (args: MarketBuyArgs, callback?: any, onError?: any) => Promise<string>;
  marketSell: (args: MarketSellArgs, callback?: any, onError?: any) => Promise<string>;
  cancelOrders: (orders: SignedOrder[], callback?: any, onError?: any) => Promise<string>;
  getProtocolFee: (numbOfOrders: SignedOrder[]) => BigNumber;
  getProtocolFeeInUsdc: (numbOfOrders: SignedOrder[]) => BigNumber;
  getGasPriceForOrders: (numbOfOrders: SignedOrder[]) => BigNumber;
  createOrder: (
    makerAsset: string,
    takerAsset: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    expiry: number,
  ) => Promise<any>;
  broadcastOrder: (order: SignedOrder) => Promise<void>;
  orderBooks: OTokenOrderBook[];
  isLoadingOrderBook: boolean;
  liquidityExpiryMap: any;
};

const initialContext = {
  marketSell: async () => '',
  marketBuy: async () => '',
  fillOrders: async () => '',
  cancelOrders: async () => '',
  getProtocolFee: (orders: SignedOrder[]) => new BigNumber(30).times(orders.length).times(PROTOCOL_FEE_PER_GWEI),
  getProtocolFeeInUsdc: (orders: SignedOrder[]) => new BigNumber(30).times(orders.length).times(PROTOCOL_FEE_PER_GWEI),
  getGasPriceForOrders: (orders: SignedOrder[]) => new BigNumber(30),
  createOrder: async () => null,
  broadcastOrder: async () => undefined,
  orderBooks: [],
  isLoadingOrderBook: false,
  liquidityExpiryMap: {},
};

const zeroXContext = React.createContext<zeroXContextProps>(initialContext);
const useZeroX = () => useContext(zeroXContext);

const ZeroXProvider: FunctionComponent = ({ children }) => {
  const toast = useToast();

  const { handleTransaction, connected, address: account, signer, networkId, web3 } = useWallet();
  const { fastest, fast } = useGasPrice(4);

  const [exchange, setExchange] = useState<any>(null);

  const { oTokens } = useLiveOptions();

  const { isLoading: isLoadingOrderBook, orderBooks, liquidityExpiryMap } = use0xOrderBooks(oTokens);

  const weth = useMemo(() => WETH_ADDRESS[networkId], [networkId]);

  const ethPrice = useTokenPrice(weth, 10);

  useEffect(() => {
    if (connected && networkId && signer) {
      const exchangeAddress = ZX_EXCHANGE[(networkId as 1) || 42];
      setExchange(() => new ethers.Contract(exchangeAddress, zeroXAbi, signer));
    } else {
      setExchange(null);
    }
  }, [connected, networkId, signer]);

  const getGasPriceForOrders = useCallback(
    (orders: SignedOrder[]) => {
      // const closestExpiry = Math.min(...orders.map(o => Number(o.expiry) - Date.now() / 1000));
      // // use fastest if it's expiring in 200 secs (3 min 20 sec)
      // return closestExpiry < 300 ? fastest : fast;
      // console.log(fastest.toString())
      return fastest;
    },
    [fastest],
  );

  /**
   * If any order is expiring within 2 mins, use fastest
   */
  const getProtocolFee = useCallback(
    (orderInfos: SignedOrder[]) => {
      const gasPrice = getGasPriceForOrders(orderInfos);
      const orderInfoLength = orderInfos.length > 0 ? orderInfos.length : 1;
      return gasPrice.times(new BigNumber(orderInfoLength)).times(PROTOCOL_FEE_PER_GWEI);
    },
    [getGasPriceForOrders],
  );

  const getProtocolFeeInUsdc = useCallback(
    (orderInfos: SignedOrder[]) => {
      const feeInUsdc = getProtocolFee(orderInfos).times(new BigNumber(ethPrice));
      return feeInUsdc;
    },
    [getProtocolFee, ethPrice],
  );

  const createOrder = useCallback(
    async (
      makerToken: string,
      takerToken: string,
      makerAmount: BigNumber,
      takerAmount: BigNumber,
      deadline: number,
    ) => {
      if (!signer || !web3) return toast.error('No wallet connected');
      const expiry = parseInt((Date.now() / 1000 + deadline).toFixed(0), 10);
      const salt = BigNumber.random(20)
        .times(new BigNumber(10).pow(new BigNumber(20)))
        .integerValue();
      const taker = ZERO_ADDR;
      const order = new v4orderUtils.LimitOrder({
        chainId: networkId,
        makerToken,
        takerToken,
        makerAmount,
        takerAmount,
        // takerTokenFeeAmount,
        maker: account,
        taker,
        // pool:
        expiry: new BigNumber(expiry).integerValue(),
        salt,
        // verifyingContract
      });
      const signature = await order.getSignatureWithProviderAsync(
        web3.currentProvider as any,
        v4orderUtils.SignatureType.EIP712,
      );
      return {
        ...order,
        signature,
      };
    },
    [networkId, signer, account, web3, toast],
  );

  const cancelOrders = useCallback(
    async (orders: SignedOrder[], callback?: any, onError?: any) => {
      if (!account) return;

      return handleTransaction({
        transaction: () =>
          exchange.batchCancelLimitOrders(orders, {
            gasPrice: ethers.utils.parseUnits(fast.toString(), 'gwei'),
          }),
        callback,
        onError,
      });
    },
    [account, exchange, handleTransaction, fast],
  );

  const broadcastOrder = useCallback(
    async (order: SignedOrder) => {
      const endpoint = ZeroXEndpoint[networkId].http;
      const url = `${endpoint}sra/v4/orders`;
      const body = JSON.stringify([order]);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });
      if (res.status === 200) return toast.success('Order created');
      const jsonRes = await res.json();
      toast.error(jsonRes.validationErrors[0].reason);
    },
    [networkId, toast],
  );

  const fillOrders = useCallback(
    async (args: FillOrderArgs, callback?: any, onError?: any) => {
      if (!account) return;

      const { orders, amounts } = args;
      if (orders.length === 0 || amounts.length === 0) {
        throw new Error('0x Transaction Error: No orders selected.');
      }
      const signatures = orders.map(order => order.signature);

      const gasPrice = getGasPriceForOrders(orders);
      const feeInEth = getProtocolFee(orders).toString();
      const amountsStr = amounts.map(amount => amount.toString());

      return handleTransaction({
        transaction: () =>
          exchange.batchFillLimitOrders(orders, signatures, amountsStr, false, {
            value: feeInEth,
            gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei'),
            gasLimit: 170000,
          }),
        callback,
        onError,
      });
    },
    [account, exchange, getGasPriceForOrders, getProtocolFee, handleTransaction],
  );

  const marketBuy = useCallback(
    async (args: MarketBuyArgs, callback?: any, onError?: any) => {
      if (!account) return;

      const { orders, makerAssetFillAmount } = args;
      if (orders.length === 0) {
        throw new Error('0x Transaction Error: No orders selected.');
      }
      const signatures = orders.map(order => order.signature);

      const gasPrice = getGasPriceForOrders(orders);
      const feeInEth = getProtocolFee(orders).toString();
      return handleTransaction({
        transaction: () =>
          exchange.fillOrKillLimitOrder(orders[0], signatures[0], makerAssetFillAmount.integerValue().toString(), {
            value: feeInEth,
            gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei'),
          }),
        callback,
        onError,
      });
    },
    [account, exchange, getGasPriceForOrders, getProtocolFee, handleTransaction],
  );

  const marketSell = useCallback(
    async (args: MarketSellArgs, callback?: any, onError?: any) => {
      if (!account) return;

      const { orders, takerAssetFillAmount } = args;
      if (orders.length === 0) {
        throw new Error('0x Transaction Error: No orders selected.');
      }
      const signatures = orders.map(order => order.signature);

      const gasPrice = getGasPriceForOrders(orders);
      const feeInEth = getProtocolFee(orders).toString();

      return handleTransaction({
        transaction: () =>
          exchange.fillLimitOrder(orders[0], signatures[0], takerAssetFillAmount.toString(), {
            value: ethers.utils.parseEther(feeInEth),
            gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei'),
          }),
        callback,
        onError,
      });
    },
    [account, exchange, getGasPriceForOrders, getProtocolFee, handleTransaction],
  );

  const state = useMemo(() => {
    return {
      cancelOrders,
      fillOrders,
      broadcastOrder,
      createOrder,
      orderBooks,
      isLoadingOrderBook,
      liquidityExpiryMap,
      getProtocolFee,
      getProtocolFeeInUsdc,
      getGasPriceForOrders,
      marketBuy,
      marketSell,
    };
  }, [
    cancelOrders,
    fillOrders,
    broadcastOrder,
    createOrder,
    orderBooks,
    isLoadingOrderBook,
    liquidityExpiryMap,
    getProtocolFee,
    getProtocolFeeInUsdc,
    getGasPriceForOrders,
    marketBuy,
    marketSell,
  ]);

  return <zeroXContext.Provider value={state}>{children}</zeroXContext.Provider>;
};

export { ZeroXProvider, useZeroX };
