import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import erc20Abi from '../abis/erc20.json';
import { useWallet } from '../context/wallet';

/**
 * get token balance.
 * @param token token address
 * @param refetchIntervalSec refetch interval in seconds
 * @returns {BigNumber} raw balance
 */
export const useTokenBalance = (token: string, account: string, refetchIntervalSec: number = 20): BigNumber => {
  const [balance, setBalance] = useState(new BigNumber(0));
  const { networkId } = useWallet();
  useEffect(() => {
    let isCancelled = false;

    async function updateBalance() {
      if (!token) return;
      if (!account) return;
      const balance = await getBalance(token, account, networkId);
      if (!isCancelled) setBalance(balance);
    }
    updateBalance();
    const id = setInterval(updateBalance, refetchIntervalSec * 5000);

    // cleanup function: remove interval
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [token, refetchIntervalSec, account, networkId]);

  return balance;
};

async function getBalance(token: string, account: string, networkId: number) {
  const networkName = networkId === 1 ? 'homestead' : networkId === 42 ? 'kovan' : 'ropsten';
  let provider = new ethers.providers.InfuraProvider(networkName, process.env.REACT_APP_INFURA_API_KEY);
  const erc20 = new ethers.Contract(token, erc20Abi, provider);
  try {
    const t = await erc20.balanceOf(account);
    return new BigNumber(t.toString());
  } catch (error) {
    // call revert exception is thrown everything we change network
    if (!error.toString().includes('call revert exception')) {
      console.log('get Balance error', error);
    }
    return new BigNumber(0);
  }
}
