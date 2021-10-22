import BigNumber from 'bignumber.js';

import { SignedOrder, OrderWithMetaData, OToken, OTokenOrderBook, OTokenOrderBookWithDetail } from '../types';
import {
  ZeroXEndpoint,
  MAINNET_OPYN_ENDPOINT,
  USDC_ADDRESS,
  USDC_DECIMALS,
  OTOKEN_DECIMALS,
  OrderType,
  Errors,
  TradeAction,
  PROTOCOL_FEE_PER_GWEI,
  ZERO_ADDR,
} from './constants';
import { sleep } from '../utils/time';
import { toTokenAmount, fromTokenAmount } from './calculations';

const Promise = require('bluebird');

const MAX_RECURSIVE_DEPT = 5;

// const USING_PRIVATE_ENDPOINT = process.env.REACT_APP_ZX_ENDPOINT !== undefined;

type entries = {
  total: number;
  page: number;
  perPage: number;
  records: OrderWithMetaData[];
};

/**
 * get oToken:WETH stats (v1) for all options
 * @param {Array<{addr:string, decimals:number}>} options
 * @param {{addr:string, decimals:number}} quoteAsset
 * @return {Promise<Array<
 * >}
 */
export async function getBasePairAskAndBids(
  oTokens: OToken[],
  networkId: 1 | 42 | 3,
  thisUrl?: string,
): Promise<OTokenOrderBook[]> {
  const filteredOTokens = oTokens; // await filter0xAvailablePairs(networkId, oTokens);
  // 0x has rate limit of 6 request / 10 sec, will need to chuck array into 6 each
  const BATCH_REQUEST = 6;
  const useOpynEndpoint = networkId === 1 && thisUrl?.includes('opyn.co') ? true : false;
  const COOLDOWN = useOpynEndpoint ? 0.1 : 1.3;

  const batchOTokens = filteredOTokens.reduce(
    (prev: OToken[][], curr) => {
      if (prev.length > 0 && prev[prev.length - 1].length >= BATCH_REQUEST) {
        return [...prev, [curr]];
      } else {
        const copy = [...prev];
        copy[copy.length - 1].push(curr);
        return copy;
      }
    },
    [[]],
  );

  let final: OTokenOrderBook[] = [];

  for (const batch of batchOTokens) {
    const [bestAskAndBids] = await Promise.all([
      Promise.map(batch, async ({ id: oTokenAddr }: OToken) => {
        const { asks, bids } = await getOTokenUSDCOrderBook(networkId, oTokenAddr, useOpynEndpoint);
        return {
          id: oTokenAddr,
          asks: asks.filter(record => isValidAsk(record)),
          bids: bids.filter(record => isValidBid(record)),
        };
      }),
      sleep(COOLDOWN * 1000),
    ]);
    final = final.concat(bestAskAndBids);
  }

  return final;
}

export const getBidsSummary = (bids: OrderWithMetaData[]) => {
  const bestBidPrice = bids.length > 0 ? getBidPrice(bids[0].order, USDC_DECIMALS, OTOKEN_DECIMALS) : new BigNumber(0);
  const totalBidAmt = getTotalBidAmount(bids, OTOKEN_DECIMALS);
  return {
    bestBidPrice,
    totalBidAmt,
  };
};

export const getAsksSummary = (asks: OrderWithMetaData[]) => {
  const bestAskPrice = asks.length > 0 ? getAskPrice(asks[0].order, OTOKEN_DECIMALS, USDC_DECIMALS) : new BigNumber(0);
  const totalAskAmt = getTotalAskAmount(asks, OTOKEN_DECIMALS);

  return {
    bestAskPrice,
    totalAskAmt,
  };
};

export const getOrderBookDetail = (basicBook: OTokenOrderBook): OTokenOrderBookWithDetail => {
  const bids = basicBook.bids.filter(order => isValidBid(order));
  const asks = basicBook.asks.filter(order => isValidAsk(order));

  const { bestBidPrice, totalBidAmt } = getBidsSummary(bids);
  const { bestAskPrice, totalAskAmt } = getAsksSummary(asks);

  return {
    id: basicBook.id,
    bids,
    asks,
    bestBidPrice,
    bestAskPrice,
    totalAskAmt,
    totalBidAmt,
  };
};

type PairData = {
  assetDataA: {
    minAmount: string;
    maxAmount: string;
    precision: number;
    assetData: string;
  };
  assetDataB: {
    minAmount: string;
    maxAmount: string;
    precision: number;
    assetData: string;
  };
};

/**
 *
 * @param {OrderWithMetaData} order
 */
export const getRemainingMakerAndTakerAmount = (
  order: OrderWithMetaData,
): {
  remainingTakerAmount: BigNumber;
  remainingMakerAmount: BigNumber;
} => {
  const remainingTakerAmount = new BigNumber(order.metaData.remainingFillableTakerAmount);
  const makerAmountBN = new BigNumber(order.order.makerAmount);
  const takerAmountBN = new BigNumber(order.order.takerAmount);
  const remainingMakerAmount = remainingTakerAmount.multipliedBy(makerAmountBN).div(takerAmountBN);
  return { remainingTakerAmount, remainingMakerAmount };
};

/**
 * get bids and asks for an oToken
 */
export async function getOTokenUSDCOrderBook(
  networkId: 1 | 42 | 3,
  oToken: string,
  useOpynEndpoint: boolean,
): Promise<{
  success: Boolean;
  asks: OrderWithMetaData[];
  bids: OrderWithMetaData[];
}> {
  const quote = USDC_ADDRESS[networkId];
  const endpoint = useOpynEndpoint ? MAINNET_OPYN_ENDPOINT : ZeroXEndpoint[networkId].http;
  const url = `${endpoint}sra/v4/orderbook?baseToken=${oToken}&quoteToken=${quote}&perPage=${100}`;
  try {
    const res = await fetch(url);
    // refetch in 0.5 sec
    if (res.status === 429) {
      await sleep(2000);
      return getOTokenUSDCOrderBook(networkId, oToken, useOpynEndpoint);
    } else {
      const result: { asks: entries; bids: entries } = await res.json();
      return {
        success: true,
        asks: result.asks.records,
        bids: result.bids.records,
      };
    }
  } catch (error) {
    return {
      success: false,
      asks: [],
      bids: [],
    };
  }
}

export const isValidBid = (entry: OrderWithMetaData) => {
  const minBid = 0.1;
  const minSize = fromTokenAmount(1,8)
  return getBidPrice(entry.order, USDC_DECIMALS, OTOKEN_DECIMALS).gt(minBid) 
    && new BigNumber(entry.metaData.remainingFillableTakerAmount).gt(minSize) 
    && isValid(entry);
};

export const isValidAsk = (entry: OrderWithMetaData) => {
  const maxAsk = 10000;
  const minSize = fromTokenAmount(1,8)
  const makerAmountLeft = getRemainingMakerAndTakerAmount(entry).remainingMakerAmount
  return getAskPrice(entry.order, OTOKEN_DECIMALS, USDC_DECIMALS).lt(maxAsk) 
    && new BigNumber(makerAmountLeft).gt(minSize) 
    && isValid(entry);
};

/**
 * Return true if the order is valid
 */
export const isValid = (entry: OrderWithMetaData) => {
  const FILL_BUFFER = 62.5;
  const willNotExpireShortly = Number(entry.order.expiry) - Date.now() / 1000 > FILL_BUFFER;
  const isOpen = entry.order.taker === ZERO_ADDR;
  const noTakerFee = entry.order.takerTokenFeeAmount === '0';
  const notFilled = entry.metaData.remainingFillableTakerAmount !== '0';
  return willNotExpireShortly && isOpen && noTakerFee && notFilled;
};

export const getOrderFillRatio = (order: OrderWithMetaData) =>
  new BigNumber(order.metaData.remainingFillableTakerAmount).div(new BigNumber(order.order.takerAmount)).times(100);

/**
 *
 * @param {number} networkId
 * @param {string[]} oTokens array of oToken addresses
 * @returns {OrderType}
 */
export const categorizeOrder = (
  networkId: 1 | 42 | 3,
  oTokens: string[],
  orderInfo: OrderWithMetaData,
): { type: OrderType; token: string } => {
  const usdc = USDC_ADDRESS[networkId];

  const takerToken = orderInfo.order.takerToken;
  const makerToken = orderInfo.order.makerToken;

  if (takerToken === usdc && oTokens.includes(makerToken)) {
    return { type: OrderType.ASK, token: makerToken };
  }
  if (makerToken === usdc && oTokens.includes(takerToken)) {
    return { type: OrderType.BID, token: takerToken };
  }
  return { type: OrderType.NOT_OTOKEN, token: '' };
};

/**
 * Calculate the price of a bid order
 */
export const getBidPrice = (
  bid: SignedOrder,
  makerAssetDecimals: number = USDC_DECIMALS,
  takerAssetDecimals: number = OTOKEN_DECIMALS,
): BigNumber => {
  const makerAmount = toTokenAmount(new BigNumber(bid.makerAmount), makerAssetDecimals);
  const takerAmount = toTokenAmount(new BigNumber(bid.takerAmount), takerAssetDecimals);
  return makerAmount.div(takerAmount);
};

/**
 * Sort functino to sort bids from high to low
 * @param a
 * @param b
 */
export const sortBids = (a: OrderWithMetaData, b: OrderWithMetaData): 1 | -1 => {
  const priceA = getBidPrice(a.order, USDC_DECIMALS, OTOKEN_DECIMALS);
  const priceB = getBidPrice(b.order, USDC_DECIMALS, OTOKEN_DECIMALS);
  return priceA.gt(priceB) ? -1 : 1;
};

/**
 * Sort function to sort asks from low to high
 * @param a
 * @param b
 */
export const sortAsks = (a: OrderWithMetaData, b: OrderWithMetaData): 1 | -1 => {
  const priceA = getAskPrice(a.order, OTOKEN_DECIMALS, USDC_DECIMALS);
  const priceB = getAskPrice(b.order, OTOKEN_DECIMALS, USDC_DECIMALS);
  return priceA.gt(priceB) ? 1 : -1;
};

/**
 * Calculate price of an ask order
 * @description maker want to sell oToken
 * takerAmount 100 weth
 * makerAmount 1 oToken
 */
export const getAskPrice = (
  ask: SignedOrder,
  makerAssetDecimals: number = OTOKEN_DECIMALS,
  takerAssetDecimals: number = USDC_DECIMALS,
): BigNumber => {
  const makerAmount = toTokenAmount(new BigNumber(ask.makerAmount), makerAssetDecimals);
  const takerAmount = toTokenAmount(new BigNumber(ask.takerAmount), takerAssetDecimals);
  return takerAmount.div(makerAmount);
};

/**
 *
 * @param asks
 * @param decimals
 * @returns {BigNumber} max amount of oToken fillable
 */
export const getTotalAskAmount = (asks: OrderWithMetaData[], decimals: number): BigNumber => {
  return asks.reduce(
    (prev, cur) => prev.plus(toTokenAmount(getRemainingMakerAndTakerAmount(cur).remainingMakerAmount, decimals)),
    new BigNumber(0),
  );
};

/**
 *
 * @param bids
 * @param decimals
 * @returns {BigNumber} max amount of oToken fillable
 */
export const getTotalBidAmount = (bids: OrderWithMetaData[], decimals: number): BigNumber => {
  return bids.reduce(
    (prev, cur) => prev.plus(toTokenAmount(cur.metaData.remainingFillableTakerAmount, decimals)),
    new BigNumber(0),
  );
};

/**
 * Calculate amount of makerAsset token to get if I supply {amount} takerAsset
 * used to calculate amount of USDC we can get after selling {amount} oToken
 * @param orderInfos bid order
 * @param takerAmount oToken to sell
 * @param opts input for smart routing.
 */
export const calculateOrderOutput = (
  orderInfos: OrderWithMetaData[],
  takerAmount: BigNumber,
  opts?: { gasPrice?: BigNumber; ethPrice?: BigNumber },
  dept: number = 0,
) => {
  let estProtocolFeeInUSDC = new BigNumber(0);
  const defaultRes = {
    error: Errors.INSUFFICIENT_LIQUIDITY,
    ordersToFill: [] as SignedOrder[],
    amounts: [] as BigNumber[],
    sumOutput: new BigNumber(0),
    estProtocolFeeInUSDC,
  };
  // useSmartRouting will assume makerAsset is USDC
  if (takerAmount.isZero()) {
    return {
      ...defaultRes,
      error: Errors.NO_ERROR,
    };
  }
  if (orderInfos.length === 0 || dept > MAX_RECURSIVE_DEPT) {
    return defaultRes;
  }
  let takerAmountLeft = takerAmount.integerValue();

  let sumOutput = new BigNumber(0);

  // array of orders to fill
  const ordersToFill: SignedOrder[] = [];
  // amounts to fill for each order
  const amounts: BigNumber[] = [];

  let cacheBestResult = defaultRes;
  let cacheHighestUSDC = new BigNumber(0);

  for (let i = 0; i < orderInfos.length; i = i + 1) {
    // calculate price without this order
    const newOrders = orderInfos.slice(0, i).concat(orderInfos.slice(i + 1, orderInfos.length));
    const resultWithoutThisOrder = calculateOrderOutput(newOrders, takerAmount, opts, dept + 1);
    const usdcWithoutThisOrder = resultWithoutThisOrder.sumOutput.minus(resultWithoutThisOrder.estProtocolFeeInUSDC);
    if (usdcWithoutThisOrder.gt(cacheHighestUSDC) && resultWithoutThisOrder.error === Errors.NO_ERROR) {
      cacheHighestUSDC = usdcWithoutThisOrder;
      cacheBestResult = resultWithoutThisOrder;
    }

    const { metaData, order } = orderInfos[i];
    // amonunt of oToken fillable. always an integer
    const fillable = new BigNumber(metaData.remainingFillableTakerAmount);

    ordersToFill.push(order);

    const price = new BigNumber(order.makerAmount).div(new BigNumber(order.takerAmount));

    if (fillable.lt(takerAmountLeft)) {
      sumOutput = sumOutput.plus(fillable.times(price).integerValue(BigNumber.ROUND_DOWN));
      takerAmountLeft = takerAmountLeft.minus(fillable);
      // fill the full amount of this order
      amounts.push(fillable);
    } else {
      sumOutput = sumOutput.plus(takerAmountLeft.times(price).integerValue(BigNumber.ROUND_DOWN));
      // fill the last order with only amount = inputLeft
      amounts.push(takerAmountLeft);
      takerAmountLeft = new BigNumber(0);
      break;
    }
  }

  if (takerAmountLeft.gt(new BigNumber(0))) {
    return {
      error: Errors.INSUFFICIENT_LIQUIDITY,
      ordersToFill: [] as SignedOrder[],
      amounts: [] as BigNumber[],
      sumOutput: new BigNumber(0),
      estProtocolFeeInUSDC,
    };
  }

  if (opts?.ethPrice && opts.gasPrice) {
    estProtocolFeeInUSDC = fromTokenAmount(
      new BigNumber(PROTOCOL_FEE_PER_GWEI).times(opts.gasPrice).times(opts.ethPrice).times(ordersToFill.length),
      USDC_DECIMALS,
    );
  }

  if (BigNumber.max(sumOutput.minus(estProtocolFeeInUSDC), new BigNumber(0)).lt(cacheHighestUSDC)) {
    return cacheBestResult;
  }

  return { error: Errors.NO_ERROR, ordersToFill, amounts, sumOutput: sumOutput.integerValue(), estProtocolFeeInUSDC };
};

/**
 * Calculate amount of {takerAsset} need to pay if I want {amount} {makerAsset}
 * Used to calculate the USDC needed to buy {amount} oToken
 * @param orderInfos ask orders
 * @param amount oToken I want to buy
 * @param opts
 */
export const calculateOrderInput = (
  orderInfos: OrderWithMetaData[],
  amount: BigNumber,
  opts?: { gasPrice: BigNumber; ethPrice: BigNumber },
  dept: number = 0,
) => {
  let estProtocolFeeInUSDC = new BigNumber(0);
  const defualtResult = {
    error: Errors.INSUFFICIENT_LIQUIDITY,
    ordersToFill: [] as SignedOrder[],
    amounts: [] as BigNumber[],
    sumInput: new BigNumber(0),
    estProtocolFeeInUSDC,
  };
  if (amount.isZero()) {
    return {
      ...defualtResult,
      error: Errors.NO_ERROR,
    };
  }
  if (orderInfos.length === 0 || dept > MAX_RECURSIVE_DEPT) {
    return defualtResult;
  }
  let neededMakerAmount = amount; // needed maker asset

  const ordersToFill: SignedOrder[] = [];
  const amounts: BigNumber[] = [];

  let cachedResult = defualtResult;
  let cachedLowestUSDC = new BigNumber(Infinity);

  for (let i = 0; i < orderInfos.length; i = i + 1) {
    const { metaData, order } = orderInfos[i];
    const fillableTakerAmount = new BigNumber(metaData.remainingFillableTakerAmount); // USDC

    // caclulate result without this order
    const newOrders = orderInfos.slice(0, i).concat(orderInfos.slice(i + 1, orderInfos.length));
    const resultWithoutThisOrder = calculateOrderInput(newOrders, amount, opts, dept + 1);
    const totalCostWithoutThisOrder = resultWithoutThisOrder.sumInput.plus(resultWithoutThisOrder.estProtocolFeeInUSDC);
    //
    if (totalCostWithoutThisOrder.lt(cachedLowestUSDC) && resultWithoutThisOrder.error === Errors.NO_ERROR) {
      cachedLowestUSDC = totalCostWithoutThisOrder;
      cachedResult = resultWithoutThisOrder;
    }

    const fillableMakerAmount = new BigNumber(order.makerAmount)
      .times(fillableTakerAmount)
      .div(new BigNumber(order.takerAmount))
      .integerValue(BigNumber.ROUND_DOWN);

    if (fillableMakerAmount.lt(neededMakerAmount) && opts && orderInfos[i + 1] !== undefined) {
      const gasPrice = opts.gasPrice || new BigNumber(0);
      const ethPrice = opts.ethPrice || new BigNumber(0);
      // the price of the current order will always be better than the next one.
      // calculate how much in USDC will this order safe compared to protocol fee.
      const nextPrice = getAskPrice(orderInfos[i + 1].order); // higher
      const thisPrice = getAskPrice(order); // lower
      const profit = nextPrice.minus(thisPrice).times(toTokenAmount(fillableMakerAmount, OTOKEN_DECIMALS));
      const protocolFee = new BigNumber(PROTOCOL_FEE_PER_GWEI).times(gasPrice).times(ethPrice);
      if (protocolFee.gt(profit)) continue;
    }

    ordersToFill.push(order);

    if (fillableMakerAmount.lt(neededMakerAmount)) {
      // takes all fillabe amount
      amounts.push(fillableTakerAmount);
      neededMakerAmount = neededMakerAmount.minus(fillableMakerAmount);
    } else {
      // only fill partial of the order
      const requiredTakerAsset = fillableTakerAmount.times(neededMakerAmount).div(fillableMakerAmount);
      amounts.push(requiredTakerAsset.integerValue(BigNumber.ROUND_CEIL));
      neededMakerAmount = new BigNumber(0);
      break;
    }
  }

  if (neededMakerAmount.gt(new BigNumber(0))) {
    return {
      error: Errors.INSUFFICIENT_LIQUIDITY,
      ordersToFill: [] as SignedOrder[],
      amounts: [] as BigNumber[],
      sumInput: new BigNumber(0),
      estProtocolFeeInUSDC,
    };
  }

  if (opts?.ethPrice && opts.gasPrice) {
    estProtocolFeeInUSDC = fromTokenAmount(
      new BigNumber(PROTOCOL_FEE_PER_GWEI).times(opts.gasPrice).times(opts.ethPrice).times(ordersToFill.length),
      USDC_DECIMALS,
    );
  }

  // sum all amounts => total cost in USDC
  const sumInput = amounts.reduce((prev, curr) => prev.plus(curr), new BigNumber(0));

  if (sumInput.plus(estProtocolFeeInUSDC).gt(cachedLowestUSDC)) {
    return cachedResult;
  }

  return {
    error: Errors.NO_ERROR,
    ordersToFill,
    amounts,
    sumInput: sumInput.integerValue(),
    estProtocolFeeInUSDC,
  };
};

export function getMarketImpact(
  action: TradeAction,
  orders: OrderWithMetaData[],
  amount: BigNumber,
  totalPremium: BigNumber,
  protocolFeeForOrdersToFill: BigNumber,
  gasPrice: BigNumber,
): { avgPrice: BigNumber; marketImpact: BigNumber; error: Errors } {
  const otokenAmount = toTokenAmount(amount, OTOKEN_DECIMALS);
  const usdcAmount = toTokenAmount(totalPremium, USDC_DECIMALS);
  const avgPrice = amount.isZero() ? new BigNumber(0) : usdcAmount.div(otokenAmount);

  let error = Errors.NO_ERROR;
  let marketImpact = new BigNumber(0);

  if (orders.length === 0 || amount.isZero()) {
    return { marketImpact, error, avgPrice };
  }

  const bestPrice =
    action === TradeAction.BUY
      ? getAskPrice(orders[0].order, OTOKEN_DECIMALS, USDC_DECIMALS)
      : getBidPrice(orders[0].order, USDC_DECIMALS, OTOKEN_DECIMALS);

  const bestPriceSize =
    action === TradeAction.BUY
      ? toTokenAmount(getRemainingMakerAndTakerAmount(orders[0]).remainingMakerAmount, 8)
      : toTokenAmount(getRemainingMakerAndTakerAmount(orders[0]).remainingTakerAmount, 8);

  const usdcAmtInclProtocolFee = new BigNumber(usdcAmount.toNumber() + protocolFeeForOrdersToFill.toNumber());

  const protocolFeeForBestPrice = gasPrice.times(PROTOCOL_FEE_PER_GWEI);
  const bestPriceInclProtocolFee = new BigNumber(bestPrice.toNumber() + protocolFeeForBestPrice.toNumber());

  const avgNotInclBestPrice = usdcAmtInclProtocolFee
    .minus(bestPriceInclProtocolFee.times(bestPriceSize))
    .div(otokenAmount.minus(bestPriceSize));

  marketImpact = otokenAmount.lt(bestPriceSize)
    ? new BigNumber(0)
    : new BigNumber(100).minus(avgNotInclBestPrice.div(bestPrice).times(new BigNumber(100))).absoluteValue();

  if (marketImpact.gte(10)) error = Errors.LARGE_MARKET_IMPACT;

  return { marketImpact, avgPrice, error };
}

