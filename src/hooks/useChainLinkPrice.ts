import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

import marginAbi from '../abis/chainlink.json';
import { useWallet } from '../context/wallet';
import { SupportedNetworks, WBTC_ADDRESS, WBTC_PRICE_FEED, WETH_ADDRESS, WETH_PRICE_FEED } from '../utils/constants';
import { toTokenAmount } from '../utils/calculations';


const useChainLinkPrice = (token: string) => {
  const [price, setPrice] = useState<BigNumber>(new BigNumber(0));

  const { networkId, signer } = useWallet();
  const pricerAddress = getPriceFeed(token, networkId);

  useEffect(() => {
    if (signer && pricerAddress) {
      const contract = new ethers.Contract(pricerAddress, marginAbi, signer);
      contract.latestRoundData().then((res: Array<ethers.BigNumber>) => {
        const [,_price] = res;
        setPrice(toTokenAmount(new BigNumber(_price.toString()), 8));
      });
    }
  }, [pricerAddress, signer])

  return price;
};

const getPriceFeed = (token: string, networkId: SupportedNetworks) => {
  if (Object.values(WETH_ADDRESS).includes(token)) {
    return WETH_PRICE_FEED[networkId];
  } else if (Object.values(WBTC_ADDRESS).includes(token)) {
    return WBTC_PRICE_FEED[networkId];
  }
};

export default useChainLinkPrice;
