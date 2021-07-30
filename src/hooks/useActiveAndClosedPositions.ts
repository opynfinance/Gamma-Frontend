import { useState, useMemo, useCallback } from 'react';
import BigNumber from 'bignumber.js';

import { ActivePositionWithPNL, ExpiredPosition, ClosedPosition, OToken, Position } from '../types';
import { WETH_ADDRESS, TradePosition, WBTC_ADDRESS } from '../utils/constants';
import { toTokenAmount } from '../utils/calculations';
import * as util from '../utils/calculations';
import { useWallet } from '.';
import { useTradeHistory } from './useTradeHistory';
import { useAccountPayouts } from './useAccountPayoutHistory';
import { usePositions } from './usePositions';
import { useOracleData } from './useOracleData';
import { useTokenPrice } from './useTokenPrice';
import { useAddresses } from './useAddresses';
import { getOrderBookDetail } from '../utils/0x-utils';
import { useZeroX } from '../context/zerox';
import { SubgraphTrade } from '../utils/subgraph';
import { vaultToPositionType } from '../utils/oToken';

type PositionWithInitPremium = Position & { initialPremium: BigNumber, actualLongSize: BigNumber };

export function useActiveAndClosedPositions(
  account: string,
): {
  activePositions: ActivePositionWithPNL[]; // active positions
  closedPositions: ClosedPosition[];
  expiredPositions: ExpiredPosition[];
  untradedPositions:  Position[];
} {
  const { orderBooks } = useZeroX();

  const { positions } = usePositions(account);

  const { networkId } = useWallet();

  const { sells, buys } = useTradeHistory(account);

  const [sellsLeft, setSellsLeft] = useState<SubgraphTrade[]>([]);
  const [buysLeft, setBuysLeft] = useState<SubgraphTrade[]>([]);

  const { redeemActions, settleActions } = useAccountPayouts(account);

  const { prices } = useOracleData();

  const usdcAddress = useAddresses().usdc;

  const wethPrice = useTokenPrice(WETH_ADDRESS[networkId], 5); 
  const wbtcPrice = useTokenPrice(WBTC_ADDRESS[networkId], 5);

  const getUnderlyingPrice = useCallback((underlyingAsset: string) => 
    (underlyingAsset === 'WETH' ? wethPrice : wbtcPrice),[wbtcPrice, wethPrice])

  // If balance is available for short position, then the position is neutral/ untradedd
  const balanceMap = useMemo(() => {
    return positions.reduce((acc: { [key: string]: BigNumber }, p) => {
      if (p.longOToken) {
        acc[p.longOToken.id] = p.longAmount;
      }
      return acc;
    }, {});
  }, [positions])  

  const untradedPositionsMap = useMemo(() => {

    const posMap = positions.reduce((acc: { [key: string]: number }, p) => {
      if ( (Number(p.expiry) > Date.now() / 1000) &&  p.shortOToken && balanceMap[p.shortOToken.id] && !balanceMap[p.shortOToken.id].isZero()) {
          acc[p.shortOToken.id] = p.vaultId;
      }
      return acc;
    }, {});


    return posMap;
  }, [balanceMap, positions])

  const isUntraded = useCallback((position: Position) => {
    if (position.shortOToken) {
      return untradedPositionsMap[position.shortOToken.id] === position.vaultId;
    } else if (position.longOToken) {
      return !!untradedPositionsMap[position.longOToken.id];
    }
  }, [untradedPositionsMap])

  // attach init premiums (from buy / sell history)
  // take cares of all positions that touches buys/ sells array
  const {
    activePositionsWithInitPremium,
    expiredPositionsWithInitPremium,
  }: {
    activePositionsWithInitPremium: PositionWithInitPremium[];
    expiredPositionsWithInitPremium: PositionWithInitPremium[];
  } = useMemo(() => {
    let _buys = [...buys];
    let _sells = [...sells];

    const positionsWithInitPremium = positions.filter(position => !isUntraded(position) || 
      (position.shortOToken && position.shortAmount.gt(balanceMap[position.shortOToken.id]))).map(position => {
      const short = position.shortOToken;
      const long = position.longOToken;
      const shortSize = position.shortAmount;
      const longSize = position.longAmount;
      let actualLongSize = position.longAmount;

      let avgShortSoldPrice = new BigNumber(0);
      let avgLongBoughtPrice = new BigNumber(0);

      if (short) {
        const shortId = short.id;
        const { price, sellsLeft } = util.getAverageSellPriceAfter(_sells, shortId, usdcAddress, shortSize, position.firstMintTimestamp ?? 0);
        avgShortSoldPrice = price;
        _sells = sellsLeft;
      }

      if (long) {
        const longId = long.id;
        const { price, buyLeft, total: buyTotal } = util.getAverageBuyPriceBefore(_buys, longId, usdcAddress, longSize, long.expiry);
          const sellTotal = _sells.reduce((acc, cur) => {
            if (cur.oToken.id === long.id) {
              return acc.plus(new BigNumber(cur.oTokenAmount))
            }
            return acc;
          }, new BigNumber(0))

          const netBuy = buyTotal.minus(sellTotal);
          if (longSize.gt(netBuy)) {
            actualLongSize = netBuy;   
          }

        //longSize = total
        avgLongBoughtPrice = price;
        _buys = buyLeft;
      }

      const initialPremium = avgShortSoldPrice
        .times(toTokenAmount(shortSize, 8))
        .minus(avgLongBoughtPrice.times(toTokenAmount(actualLongSize, 8)));

      return {
        ...position,
        initialPremium,
        actualLongSize,
      };
    });

    setSellsLeft(_sells);
    setBuysLeft(_buys);

    console.log(positionsWithInitPremium.filter(p => Number(p.expiry) > Date.now() / 1000))

    return {
      activePositionsWithInitPremium: positionsWithInitPremium.filter(p => Number(p.expiry) > Date.now() / 1000),
      expiredPositionsWithInitPremium: positionsWithInitPremium.filter(p => Number(p.expiry) < Date.now() / 1000),
    };
  }, [buys, sells, positions, isUntraded, balanceMap, usdcAddress]);

  // Todo: make this dynamic
  

  const activePositions: ActivePositionWithPNL[] = useMemo(() => {
    return activePositionsWithInitPremium.map(position => {
      const long = position.longOToken;
      const longAmount = position.actualLongSize;
      const short = position.shortOToken;
      const shortAmount = position.shortAmount;

      // premium if selling long token
      let longPremium = new BigNumber(0);
      // premium to buy back the short position (negative)
      let shortPremium = new BigNumber(0);

      const underlyingPrice = getUnderlyingPrice(position.underlying.symbol);

      if (long) {
        const orderBook = long ? orderBooks.find(book => book.id === long.id) : undefined;
        const currentSellPrice = orderBook ? getOrderBookDetail(orderBook).bestBidPrice : new BigNumber(0);
        const isITM =
          (long.isPut && underlyingPrice.lt(long.strikePrice)) || (!long.isPut && underlyingPrice.gt(long.strikePrice));
        const amountITM = isITM ? long.strikePrice.minus(underlyingPrice).abs() : new BigNumber(0);
        // itm amount or sell price
        const currentPrice = BigNumber.maximum(amountITM, currentSellPrice);
        longPremium = toTokenAmount(longAmount, 8).times(currentPrice);
      }

      if (short) {
        const shortOrderBook = orderBooks.find(book => book.id === short.id);
        const currentBuyPrice = shortOrderBook ? getOrderBookDetail(shortOrderBook).bestAskPrice : new BigNumber(0);
        shortPremium = currentBuyPrice.times(toTokenAmount(shortAmount, 8)).negated();
      }

      const currentPremium = longPremium.plus(shortPremium);

      // pure holding
      return {
        ...position,
        id: getPositionId(position),
        currentPremium,
        profit: position.initialPremium.plus(currentPremium),
      };
    });
  }, [activePositionsWithInitPremium, getUnderlyingPrice, orderBooks]);

  const untradedPositions: Position[] = useMemo(() => {
    return positions.filter(position => position.shortOToken && isUntraded(position)).map(position => {
      if (position.shortOToken?.id) {
        return { ...position, shortAmount: balanceMap[position.shortOToken?.id]}
      } else {
        return { ...position}
      }
    })
  }, [balanceMap, isUntraded, positions]);


  // expired but in waiting period
  // expired and waiting period ends
  const expiredPositions = useMemo(() => {
    return expiredPositionsWithInitPremium.map(position => {
      // expired => expired positions
      const long = position.longOToken;
      const short = position.shortOToken;
      const otoken = long ? long : (short as OToken);

      const expiry = otoken.expiry;

      const expiryPriceObj = prices.find(
        p => p.asset.id === otoken.underlyingAsset.id && p.expiry === expiry.toString(),
      );

      const underlyingPrice = getUnderlyingPrice(position.underlying.symbol);


      const reportedPrice = expiryPriceObj ? toTokenAmount(expiryPriceObj.price, 8) : new BigNumber(0);

      const isPriceReported = expiryPriceObj !== undefined;

      // if the price is not reported, use underlying price for calculation
      const expiryPrice = isPriceReported ? reportedPrice : underlyingPrice;

      // todo: make this dynamic with Pricer config
      // 2hr + 5 min = 60 * 125 sec = 7500
      const isPriceFinalized = Date.now() / 1000 > expiry + 7500;

      let netShortPayout = new BigNumber(0);
      let netLongPayout = new BigNumber(0);

      if (short) {
        const shortExpiredITM =
          (short.isPut && expiryPrice.lt(short.strikePrice)) || (!short.isPut && expiryPrice.gt(short.strikePrice));
        const shortPayout = shortExpiredITM ? expiryPrice.minus(short.strikePrice).abs() : new BigNumber(0);
        // expires itm => short proceed is negative

        netShortPayout = shortPayout.times(toTokenAmount(position.shortAmount, 8)).negated();
      }

      if (long) {
        const longExpiredITM =
          (long.isPut && expiryPrice.lt(long.strikePrice)) || (!long.isPut && expiryPrice.gt(long.strikePrice));
        const longPayout = longExpiredITM ? expiryPrice.minus(long.strikePrice).abs() : new BigNumber(0);
        netLongPayout = longPayout.times(toTokenAmount(position.longAmount, 8));
      }

      const totalPremium = netShortPayout.plus(netLongPayout);

      return {
        ...position,
        id: getPositionId(position),
        currentPremium: totalPremium,
        profit: position.initialPremium.plus(totalPremium),
        expiryPrice,
        isPriceReported,
        isPriceFinalized,
      };
    });
  }, [expiredPositionsWithInitPremium, getUnderlyingPrice, prices]);

  // expired and OTM longs
  // settle action
  // redeem action
  // sell - buy pair
  const closedPositions = useMemo(() => {
    let _buys = [...buysLeft];
    let _sells = [...sellsLeft];

    const _closedPositions: ClosedPosition[] = [];

    const priceUponExpiry = (assetId: string, expiry: number) => {
      const expiryObj = prices.find(
        p => p.asset.id === assetId && p.expiry === expiry.toString(),
      );
      
      const asset = assetId === WETH_ADDRESS[networkId] ? 'WETH' : 'WBTC';
      return expiryObj ? toTokenAmount(expiryObj.price, 8) : getUnderlyingPrice(asset);
    }

    for (const settle of settleActions) {
      const actionTimestamp = Number(settle.timestamp);
      const vaultId = settle.vault.vaultId;
      const short = settle.short;
      const long = settle.long;
      const type = vaultToPositionType(long, short);
      let initialPremium = new BigNumber(0);
      const longAmount = settle.longAmount ? new BigNumber(settle.longAmount) : new BigNumber(0);
      const shortAmount = settle.shortAmount ? new BigNumber(settle.shortAmount) : new BigNumber(0);

      const otoken = (short ? short : long) as OToken;

      const collateralAmount = settle.collateralAmount
        ? toTokenAmount(settle.collateralAmount, otoken.collateralAsset.decimals)
        : new BigNumber(0);

      const collateralWithdrawn = toTokenAmount(settle.amount, otoken.collateralAsset.decimals);

      // zero or negative number
      const netCollateralAmount = collateralWithdrawn.minus(collateralAmount);

      // if there's long, find the init buy price for this long
      if (long) {
        const { price, buyLeft } = util.getAverageBuyPriceBefore(
          _buys,
          long.id,
          usdcAddress,
          longAmount,
          actionTimestamp,
        );
        _buys = buyLeft;
        const buyCost = price.times(toTokenAmount(longAmount, 8));
        initialPremium = initialPremium.minus(buyCost);
      }
      // if there's short, find the init sell price for this short
      if (short) {
        const { price, sellsLeft } = util.getAverageSellPriceAfter(
          _sells,
          short.id,
          usdcAddress,
          shortAmount,
          actionTimestamp,
        );
        _sells = sellsLeft;
        const sellPremium = price.times(toTokenAmount(shortAmount, 8));
        initialPremium = initialPremium.plus(sellPremium);
      }
      let closedPremium = new BigNumber(0);
      if (otoken.collateralAsset.symbol === 'USDC') {
        closedPremium = netCollateralAmount;
      } else {
        let tokenPrice = new BigNumber(0);
        try {
          // make this dynamic
          tokenPrice = priceUponExpiry(otoken.underlyingAsset.id, otoken.expiry);
          closedPremium = netCollateralAmount.times(tokenPrice);
        } catch {}
      }

      _closedPositions.push({
        type,
        shortOToken: short,
        longOToken: long,
        shortAmount,
        longAmount,
        collateral: otoken.collateralAsset,
        collateralAmount: new BigNumber(settle.collateralAmount ? settle.collateralAmount : 0),
        payoutAsset: otoken.collateralAsset,
        payoutAmount: new BigNumber(settle.amount),
        isPut: otoken.isPut,
        vaultId: Number(vaultId),
        underlying: otoken.underlyingAsset,
        expiry: otoken.expiry,
        // data field
        initialPremium,
        closedPremium,
        profit: initialPremium.plus(closedPremium),
      });
    }

    for (const redeem of redeemActions) {
      const size = new BigNumber(redeem.otokenBurned);
      const { price: avgBuyPrice, buyLeft } = util.getAverageBuyPriceBefore(
        _buys,
        redeem.oToken.id,
        usdcAddress,
        size,
        Number(redeem.timestamp),
      );
      _buys = buyLeft;
      const initialPremium = avgBuyPrice.times(toTokenAmount(size, 8)).negated();
      // if payout asset weth, convert to USDC value based on price upon expiry
      let closedPremium = toTokenAmount(redeem.payoutAmount, redeem.payoutAsset.decimals);
      if (redeem.payoutAsset.symbol !== 'USDC') {
        // todo: make this dynamic instead of using ETH price
        const tokenPrice = priceUponExpiry(redeem.oToken.underlyingAsset.id, redeem.oToken.expiry);
        closedPremium = closedPremium.times(tokenPrice);
      }
      const entry: ClosedPosition = {
        type: TradePosition.Long,
        shortAmount: new BigNumber(0),
        shortOToken: null,
        longOToken: redeem.oToken,
        longAmount: size,
        collateral: null,
        collateralAmount: new BigNumber(0),
        payoutAsset: redeem.oToken.collateralAsset,
        payoutAmount: new BigNumber(redeem.payoutAmount),
        isPut: redeem.oToken.isPut,
        vaultId: 0,
        underlying: redeem.oToken.underlyingAsset,
        expiry: redeem.oToken.expiry,
        // data field
        initialPremium,
        closedPremium,
        profit: initialPremium.plus(closedPremium),
      };
      _closedPositions.push(entry);
    }

    // Go through all left buy - sell pair
    // merge sell records with same tx and oToken address
    const _uniqueSells = _sells.reduce((prev: SubgraphTrade[], curr) => {
      const target = prev.find(record => record.oToken.id === curr.oToken.id);
      if (target !== undefined) {
        let copy = { ...target };
        copy.oTokenAmount = new BigNumber(target.oTokenAmount).plus(new BigNumber(curr.oTokenAmount)).toString();
        copy.paymentTokenAmount = new BigNumber(target.paymentTokenAmount)
          .plus(new BigNumber(curr.paymentTokenAmount))
          .toString();
        return [...prev.filter(record => record.oToken.id !== curr.oToken.id), copy];
      } else {
        return [...prev, curr];
      }
    }, []);

    const _uniqueBuys = _buys.reduce((prev: SubgraphTrade[], curr) => {
      const target = prev.find(rec => rec.oToken.id === curr.oToken.id);
      if(target !== undefined) {
        let copy = { ...target }
        copy.oTokenAmount = new BigNumber(target.oTokenAmount).plus(new BigNumber(curr.oTokenAmount)).toString();
        copy.paymentTokenAmount = new BigNumber(target.paymentTokenAmount)
          .plus(new BigNumber(curr.paymentTokenAmount))
          .toString();
        return [...prev.filter(record => record.oToken.id !== curr.oToken.id), copy]
      } else {
        return [...prev, curr]
      }
    }, [])

    

    for (const sell of _uniqueSells) {
      const oToken = sell.oToken;
      const sellTimestamp = Number(sell.timestamp);
      const targetBuy = _uniqueBuys.find(b => b.oToken.id === oToken.id);
      const buyTimestamp = Number(targetBuy?.timestamp);
      const totalSell = new BigNumber(sell.oTokenAmount);
      const totalBuys = new BigNumber(targetBuy?.paymentTokenAmount || 0);
      
      if (targetBuy === undefined || totalBuys?.isZero()) continue;
      const size = BigNumber.min(totalSell, totalBuys);
      const { price: avgBuyPrice, buyLeft } = util.getAverageBuyPriceBefore(
        _buys,
        oToken.id,
        usdcAddress,
        size,
        sellTimestamp,
      );
      _buys = buyLeft;
      const initialPremium = avgBuyPrice.times(toTokenAmount(size, 8)).negated();
      const fillRatio = size.div(new BigNumber(sell.oTokenAmount));
      // closed premium = all payment token amount * fill ratio => convert to USD
      const closedPremium = toTokenAmount(new BigNumber(sell.paymentTokenAmount).times(fillRatio), 6);
      const isShort = sellTimestamp >= buyTimestamp ? true : false; 
      const entry: ClosedPosition = {
        type: isShort?  TradePosition.Short : TradePosition.Long,
        shortAmount: size,
        shortOToken: oToken,
        longOToken: oToken,
        longAmount: size,
        collateral: null,
        collateralAmount: new BigNumber(0),
        payoutAsset: null,
        payoutAmount: new BigNumber(0),
        isPut: oToken.isPut,
        vaultId: 0,
        underlying: oToken.underlyingAsset,
        expiry: oToken.expiry,
        // data field
        profit: initialPremium.plus(closedPremium),
        initialPremium,
        closedPremium,
      };
      _closedPositions.push(entry);
    }

    return _closedPositions;
  }, [buysLeft, sellsLeft, prices, networkId, getUnderlyingPrice, settleActions, usdcAddress, redeemActions]);

  return {
    expiredPositions,
    activePositions,
    closedPositions,
    untradedPositions,
  };
}

function getPositionId(position: Position) {
  return (
    position.type +
    position.vaultId +
    position.isPut +
    position.underlying.id +
    position.longOToken?.id +
    position.shortOToken?.id +
    position.collateral?.id +
    position.expiry +
    position.longAmount.toString() +
    position.shortAmount.toString() +
    position.collateralAmount.toString()
  );
}
