import BigNumber from 'bignumber.js';

import { parseNumber } from './parse';
import { TradeAction } from './constants';
import { Greeks, OToken, OTokenWithTradeDetail, VaultStatus } from '../types';
import { SubgraphTrade } from './subgraph';

const greek = require('greeks');
const iv = require('implied-volatility');

/**
 *
 * @param option oToken
 * @param optionPrice the price denominated in USD.
 * @param spotPrice price of underlying denominated in USD
 * @param interestRate interest rate, 1 for 1%
 */
export function getGreeksAndIv(
  option: OToken,
  optionPrice: BigNumber,
  spotPrice: BigNumber,
  interestRate: number,
): { greeks: Greeks; iv: number } {
  const type = option.isPut ? 'put' : 'call';
  // expiry in year
  const t = new BigNumber(option.expiry - Date.now() / 1000).div(86400).div(365).toNumber();

  const s = spotPrice.toNumber();
  const k = option.strikePrice.toNumber();
  const expectedCost = optionPrice.toNumber();
  const initEstimation = 1;
  const v = iv.getImpliedVolatility(expectedCost, s, k, t, interestRate, type, initEstimation); // 0.11406250000000001 (11.4%)

  return {
    iv: s === 0 ? 0 : Number(v * 100), // percentage
    greeks: {
      delta: greek.getDelta(s, k, t, v, interestRate, type).toFixed(3),
      gamma: greek.getGamma(s, k, t, v, interestRate).toFixed(3),
      vega: greek.getVega(s, k, t, v, interestRate).toFixed(3),
      theta: greek.getTheta(s, k, t, v, interestRate, type).toFixed(3),
      rho: greek.getRho(s, k, t, v, interestRate, type).toFixed(3),
    },
  };
}

export function toTokenAmount(amount: BigNumber | number | string, decimals: number): BigNumber {
  return new BigNumber(amount).div(new BigNumber(10).exponentiatedBy(decimals));
}

export function fromTokenAmount(amount: BigNumber | number | string, decimals: number): BigNumber {
  return new BigNumber(amount).times(new BigNumber(10).exponentiatedBy(decimals));
}

export function roundTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function netPremium(oTokens: OTokenWithTradeDetail[], action: TradeAction): BigNumber {
  const [token1, token2] = oTokens;
  if (token1 && token2) {
    if ((!token1.isPut && action === TradeAction.BUY) || (token1.isPut && action === TradeAction.SELL)) { // Debit spread
      return token1.isPut ? 
        token2.askPrice.minus(token1.bidPrice): 
        token2.bidPrice.minus(token1.askPrice)
    }
    return token1.isPut ? 
      token2.bidPrice.minus(token1.askPrice): 
      token2.askPrice.minus(token1.bidPrice)
   
  } else {
    return action === TradeAction.BUY ? token1.askPrice : token1.bidPrice
  }
}


export function maxLoss(oTokens: OTokenWithTradeDetail[], action: TradeAction): any {
  const [token1, token2] = oTokens;
  if (token1 && token2) { //Spread
    const net = roundTwoDecimals(netPremium(oTokens, action).absoluteValue().toNumber());
    if ((!token1.isPut && action === TradeAction.BUY) || (token1.isPut && action === TradeAction.SELL)) { // Debit spread
      return net;
    } else { // Credit Spread
      return roundTwoDecimals(token1.strikePrice
        .minus(token2.strikePrice).absoluteValue()
        .minus(net).absoluteValue()
        .toNumber())
    }
  }
  else if (action === TradeAction.BUY) {
    return roundTwoDecimals(token1.askPrice.toNumber());
  } else if (action === TradeAction.SELL && token1.isPut) {
    return roundTwoDecimals(token1.strikePrice.minus(token1.bidPrice).toNumber());
  } else if (action === TradeAction.SELL && !token1.isPut) {
    return 'unlimited';
  } else {
    return 0;
  }
}

export function maxGain(oTokens: OTokenWithTradeDetail[], action: TradeAction): any {
  const [token1, token2] = oTokens;
  if (token1 && token2) {
    const net = roundTwoDecimals(netPremium(oTokens, action).absoluteValue().toNumber());
    if ((!token1.isPut && action === TradeAction.BUY) || (token1.isPut && action === TradeAction.SELL)) { // Debit spread
      return roundTwoDecimals(token1.strikePrice
        .minus(token2.strikePrice).absoluteValue()
        .minus(net).absoluteValue()
        .toNumber())
    } else { // Credit Spread
      return net;
    }
  }
  else if (action === TradeAction.BUY && token1.isPut) {
    return parseNumber(roundTwoDecimals(token1.strikePrice.minus(token1.askPrice).toNumber()));
  } else if (action === TradeAction.BUY && !token1.isPut) {
    return 'unlimited';
  } else if (action === TradeAction.SELL) {
    return parseNumber(roundTwoDecimals(token1.bidPrice.toNumber()));
  } else {
    return 0;
  }
}

export function getBreakeven(price: number, strike: number, isPut: Boolean): number {
  if (isPut) {
    return strike - price;
  } else {
    return strike + price;
  }
}

/**
 * Calculate the amount of collateral needed for minting {amount} oToken
 * @param otoken
 * @param baseAmount amount of oToken to mint, in base unit
 */
export function calculateSimpleCollateral(otoken: OToken, baseAmount: BigNumber): BigNumber {
  const humanReadableAmount = toTokenAmount(baseAmount, 8);
  const collateralDecimals = otoken.collateralAsset.decimals;
  if (otoken.isPut) {
    // otoken.strikePrice is already in human readable format
    return fromTokenAmount(otoken.strikePrice.times(humanReadableAmount), collateralDecimals).integerValue(
      BigNumber.ROUND_CEIL,
    );
  } else {
    // amount collateral is amount to mint
    return fromTokenAmount(humanReadableAmount, collateralDecimals).integerValue(BigNumber.ROUND_CEIL);
  }
}

/**
 * Calcualte amount of collateral needed to create a spread position
 * @param longOToken
 * @param shortOToken
 * @param spreadSize
 */
export function calculateSpreadCollateral(longOToken: OToken, shortOToken: OToken, spreadSize: BigNumber) {
  const collateralAsset = longOToken.collateralAsset;
  const humanReadableAmount = toTokenAmount(spreadSize, 8);
  if (longOToken.isPut) {
    // If it's put spread
    if (shortOToken.strikePrice.gt(longOToken.strikePrice)) {
      return fromTokenAmount(
        humanReadableAmount.times(shortOToken.strikePrice.minus(longOToken.strikePrice)),
        collateralAsset.decimals,
      ).integerValue(BigNumber.ROUND_CEIL);
    } else {
      return new BigNumber(0);
    }
  } else {
    // If it's a call spread
    if (shortOToken.strikePrice.gt(longOToken.strikePrice)) {
      return new BigNumber(0);
    } else {
      return fromTokenAmount(
        humanReadableAmount.times(longOToken.strikePrice.minus(shortOToken.strikePrice)).div(longOToken.strikePrice),
        collateralAsset.decimals,
      ).integerValue(BigNumber.ROUND_CEIL);
    }
  }
}

/**
 * Get the average price of buying {oTokenAmount} oTokenId
 * @param buys
 * @param oTokenId
 * @param paymentTokenAddr
 * @param oTokenAmount
 * @param timestamp
 */
export function getAverageBuyPriceBefore(
  buys: SubgraphTrade[],
  oTokenId: string,
  paymentTokenAddr: string,
  oTokenAmount: BigNumber,
  timestamp: number,
) {
  let buyLeft = [...buys];

  let sumOTokenAmount = new BigNumber(0);
  let sumPaymentTokenAmount = new BigNumber(0);

  const paymentTokenDeciamls = 6;

  const targetBuys = buys
    .filter(b => Number(b.timestamp) < Number(timestamp))
    .filter(b => b.paymentToken.id === paymentTokenAddr)
    .filter(b => b.oToken.id === oTokenId)
    .sort((a, b) => (Number(a.timestamp) > Number(b.timestamp) ? -1 : 1)); // sort by timestamp, high to low
  
  const total = targetBuys.reduce((acc, curr) => ( acc.plus(new BigNumber(curr.oTokenAmount)) ), new BigNumber(0));

  for (const buy of targetBuys) {
    const boughtAmount = new BigNumber(buy.oTokenAmount);
    const paymentAmount = new BigNumber(buy.paymentTokenAmount);
    if (sumOTokenAmount.plus(boughtAmount).lte(oTokenAmount)) {
      sumOTokenAmount = sumOTokenAmount.plus(boughtAmount);
      sumPaymentTokenAmount = sumPaymentTokenAmount.plus(paymentAmount);
      // exclude entry from buys
      buyLeft = buyLeft.filter(b => b.id !== buy.id);
    } else {
      const orderFillRatio = oTokenAmount.minus(sumOTokenAmount).div(boughtAmount);
      sumOTokenAmount = sumOTokenAmount.plus(boughtAmount.times(orderFillRatio).integerValue());
      sumPaymentTokenAmount = sumPaymentTokenAmount.plus(paymentAmount.times(orderFillRatio).integerValue());
      buyLeft = buyLeft.filter(b => b.id !== buy.id);
      // update the buy entry in buyLeft with amount left
      let newBuyEntry = { ...buy };
      newBuyEntry.oTokenAmount = boughtAmount.minus(boughtAmount.times(orderFillRatio)).integerValue().toString();
      newBuyEntry.paymentTokenAmount = paymentAmount
        .minus(paymentAmount.times(orderFillRatio))
        .integerValue()
        .toString();
      buyLeft.push(newBuyEntry);
      break;
    }
  }
  const price = sumOTokenAmount.gt(0)
    ? toTokenAmount(sumPaymentTokenAmount, paymentTokenDeciamls).div(toTokenAmount(sumOTokenAmount, 8))
    : new BigNumber(0);
  return {
    buyLeft,
    price,
    total
  };
}

/**
 * Get the average price of selling {oTokenAmount} oTokenId
 * @param buys
 * @param oTokenId
 * @param paymentTokenAddr
 * @param oTokenAmount
 * @param timestamp
 */
export function getAverageSellPriceAfter(
  sells: SubgraphTrade[],
  oTokenId: string,
  paymentTokenAddr: string,
  oTokenAmount: BigNumber,
  timestamp: number,
) {
  let sellsLeft = [...sells];

  let sumOTokenAmount = new BigNumber(0);
  let sumPaymentTokenAmount = new BigNumber(0);

  const paymentTokenDeciamls = 6;

  const targetSells = sells
    .filter(s => Number(s.timestamp) >= timestamp)
    .filter(s => s.paymentToken.id === paymentTokenAddr)
    .filter(s => s.oToken.id === oTokenId)
    .sort((a, b) => (Number(a.timestamp) > Number(b.timestamp) ? 1 : -1)); // sort by timestamp, low to high

  for (const sell of targetSells) {
    const orderSellAmount = new BigNumber(sell.oTokenAmount);
    const paymentAmount = new BigNumber(sell.paymentTokenAmount);

    if (sumOTokenAmount.plus(orderSellAmount).lte(oTokenAmount)) {
      sumOTokenAmount = sumOTokenAmount.plus(orderSellAmount);
      sumPaymentTokenAmount = sumPaymentTokenAmount.plus(paymentAmount);
      // exclude entry from buys
      sellsLeft = sellsLeft.filter(s => s.id !== sell.id);
    } else {
      const orderFillRatio = oTokenAmount.minus(sumOTokenAmount).div(orderSellAmount);
      sumPaymentTokenAmount = sumPaymentTokenAmount.plus(paymentAmount.times(orderFillRatio).integerValue());
      sumOTokenAmount = sumOTokenAmount.plus(orderSellAmount.times(orderFillRatio).integerValue());
      sellsLeft = sellsLeft.filter(s => s.id !== sell.id);
      // update the sell entry in sellsLeft with amount left
      let newEntry = { ...sell };
      newEntry.oTokenAmount = orderSellAmount.minus(orderSellAmount.times(orderFillRatio)).integerValue().toString();
      newEntry.paymentTokenAmount = paymentAmount.minus(paymentAmount.times(orderFillRatio)).integerValue().toString();
      sellsLeft.push(newEntry);
      break;
    }
  }
  const price = sumOTokenAmount.gt(0)
    ? toTokenAmount(sumPaymentTokenAmount, paymentTokenDeciamls).div(toTokenAmount(sumOTokenAmount, 8))
    : new BigNumber(0);
  return {
    sellsLeft,
    price,
  };
}

/**
 * Get Health status for partially collateralized  vault
 * 
 * @param isPut 
 * @param spotPercent 
 * @returns VaultStatus
 */
export function getVaultStatus(isPut: boolean, spotPercent: number) {
  if (isPut) {
    return spotPercent < -33 ? VaultStatus.SAFE : spotPercent < -20 ? VaultStatus.WARNING : VaultStatus.DANGER;
  }

  return  spotPercent > 50 ? VaultStatus.SAFE : spotPercent > 25 ? VaultStatus.WARNING : VaultStatus.DANGER;
}


/**
 * Return Profit if Asset is at assetPrice
 * @returns 
 */
function getPayoutForAssetPrice(oToken: OTokenWithTradeDetail, assetPrice: number,action: TradeAction) {
  const strike = oToken.strikePrice.toNumber();
  const price = roundTwoDecimals(action === TradeAction.BUY ? oToken.askPrice.toNumber() : oToken.bidPrice.toNumber());

  if (!oToken.isPut) {
    if (action === TradeAction.BUY) {
      if (assetPrice - strike - price < -price) return -price;
      else return assetPrice - strike - price;
    } else {
      if (assetPrice - strike - price < -price) return price;
      else return strike + price - assetPrice;
    }
  } else {
    if (action === TradeAction.BUY) {
      if (strike - assetPrice - price < -price) return -price;
      else return strike - assetPrice - price;
    } else {
      if (strike - assetPrice - price < -price) return price;
      else return assetPrice - strike + price;
    }
  }
}


/**
 * Get payout details need for PNL chart
 */
export function getPayoutDetails(oTokens: OTokenWithTradeDetail[], action: TradeAction) {
  const labels: Array<string> = [];
    const values: Array<number> = [];
    const [oToken1, oToken2] =  oTokens;
    const strike1 = oToken1.strikePrice.toNumber();
    const strike2 = oToken2?.strikePrice?.toNumber() || 0;
    const end = (strike2 ? strike2 : strike1) + 2000;
    const price = netPremium(oTokens, action).absoluteValue().toNumber();

    const gain = maxGain(oTokens, action)
    const loss = maxLoss(oTokens, action);

    const strike = oTokens.length === 1 ? strike1 : (oToken1.isPut ? Math.max(strike1, strike2) : Math.min(strike1, strike2))
    const breakeven = roundTwoDecimals(getBreakeven(price, strike, oToken1.isPut));

    for (let i = 0; i <= end; i += 10) {
      if (i > breakeven && i < breakeven + 10) {
        values.push(0);
        labels.push(`${oToken1.underlyingAsset.symbol}: ${breakeven}`)
      }
      labels.push(`${oToken1.underlyingAsset.symbol}: ${i}`);
      const _payout = getPayoutForAssetPrice(oToken1, i, action)
      if (oToken2) {
        values.push(roundTwoDecimals(_payout + getPayoutForAssetPrice(oToken2, i, action === TradeAction.BUY ? TradeAction.SELL : TradeAction.BUY)))
      } else {
        values.push(roundTwoDecimals(_payout));
      }
    }

    return { labels, values, gain, loss, breakeven };
}