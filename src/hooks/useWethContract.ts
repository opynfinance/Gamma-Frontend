import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { useWallet } from '../context/wallet';
import { WETH_ADDRESS } from '../utils/constants/addresses';
import wethAbi from '../abis/weth.json';

export const useWethContract = () => {
  const [balance, setBalance] = useState<BigNumber>(new BigNumber(0));
  const [loading, setLoading] = useState(true);

  const wallet = useWallet();
  if (wallet === undefined) {
    throw new Error('useApproval must be used within a ContractProvider');
  }

  const { handleTransaction, address: walletAddress, signer, networkId } = wallet;

  const weth = useMemo(() => WETH_ADDRESS[networkId], [networkId]);

  const getBalance = useCallback(async () => {
    if (!signer) return new BigNumber(-1);
    const tokenContract = new ethers.Contract(weth, wethAbi, signer);
    const balance = await tokenContract
      .balanceOf(walletAddress)
      .then((result: ethers.BigNumber) => new BigNumber(result.toString()));
    setBalance(balance);
    return balance;
  }, [signer, walletAddress, weth]);

  useEffect(() => {
    setLoading(true);
    getBalance()
      .then(balance => {
        setBalance(balance);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }, [getBalance]);

  const deposit = useCallback(
    async ({ amount, callback, onError } = {}) => {
      if (!signer) return onError(new Error('useApproval: wallet not connect.'));

      const wethContract = new ethers.Contract(weth, wethAbi, signer);
      const hash = await handleTransaction({
        transaction: () =>
          wethContract.deposit({
            value: amount,
          }),
        callback: () => {
          callback();
          getBalance();
        },
        onError,
      });
      return hash;
    },
    [weth, handleTransaction, signer, getBalance],
  );

  return { deposit, loading, balance };
};
