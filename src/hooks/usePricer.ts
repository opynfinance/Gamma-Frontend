import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';

import yusdcAbi from '../abis/yUSDC.json';
import { useWallet } from '../context/wallet';
import { toTokenAmount } from '../utils/calculations';
import { YVUSDC_ADDRESS } from '../utils/constants';

/**
 * 
 * This is a temporary implementation, Will be changed to generic implementation when contracts are ready
 */

const usePricer = (token: string) => {
  const [fxRate, setFxRate] = useState<BigNumber>(new BigNumber(1));

  const { networkId, web3, address } = useWallet();

  useEffect(() => {
    // Only check for YVUSDC token now
    if (YVUSDC_ADDRESS[networkId] === token && web3) {
      const contract = new web3.eth.Contract(yusdcAbi as any, token);
      contract.methods.pricePerShare().call({ from: address })
        .then((res: string) => setFxRate(toTokenAmount(new BigNumber(res), 6)))
    }
  }, [address, networkId, token, web3])

  return fxRate;
};


export default usePricer;
