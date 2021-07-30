import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';

import { WBTC_ADDRESS, WETH_ADDRESS, ZERO_ADDR } from '../utils/constants';

/**
 * get token price by address.
 * @param token token address
 * @param refetchIntervalSec refetch interval in seconds
 * @returns {BigNumber} price denominated in USD
 */
export const useTokenPrice = (token: string, refetchIntervalSec: number = 20): BigNumber => {
  const [price, setPrice] = useState(new BigNumber(0));

  useEffect(() => {
    let isCancelled = false;

    async function updatePrice() {
      const price = await getTokenPriceCoingecko(token);
      if (!isCancelled) setPrice(price);
    }
    updatePrice();
    const id = setInterval(updatePrice, refetchIntervalSec * 1000);

    // cleanup function: remove interval
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [token, refetchIntervalSec]);

  return price;
};

export const getTokenPriceCoingecko = async (token: string): Promise<BigNumber> => {
  if (!token || token === ZERO_ADDR) return new BigNumber(0);
  let coin = '';
  // map rinkeby address to mainnet address
  // WETH
  
  if (Object.values(WETH_ADDRESS).includes(token))
    coin = 'ethereum';
  // WBTC
  if (Object.values(WBTC_ADDRESS).includes(token))
    coin = 'bitcoin';

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`;
  const res = await fetch(url);
  const priceStruct: { usd: number } = (await res.json())[coin.toLowerCase()];
  if (priceStruct === undefined) return new BigNumber(0);
  const price = priceStruct.usd;
  return new BigNumber(price);
};
