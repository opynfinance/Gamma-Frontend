import React, { useState, useContext, FunctionComponent, useMemo } from 'react';
import Web3 from 'web3';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

import useOnboard from './useOnboard';
import useNotify from './useNotify';
import { SupportedNetworks } from '../../utils/constants';
import erc20Abi from '../../abis/erc20.json';

type handleTransactionProps = {
  transaction: () => Promise<{ hash: string }>;
  callback?: (hash?: string) => any;
  onError?: (error: Error) => any;
};

type WalletState = {
  signer: ethers.Signer | null;
  provider: ethers.providers.Web3Provider | null;
  web3: Web3 | null;
  handleSelectWallet: any;
  handleTransaction: any;
  address: string;
  connected: boolean;
  networkId: SupportedNetworks;
  getBalance: ((tokenId: string) => Promise<BigNumber>) | null;
  ethBalance: BigNumber;
  lastConfirmedTransaction: number;
  walletType: string;
};
const initialState: WalletState = {
  signer: null,
  provider: null,
  web3: null,
  handleSelectWallet: null,
  handleTransaction: null,
  address: '',
  connected: false,
  networkId: SupportedNetworks.MAINNET,
  getBalance: null,
  ethBalance: new BigNumber(0),
  lastConfirmedTransaction: 0,
  walletType: 'injected',
};

const walletContext = React.createContext<WalletState>(initialState);
const useWallet = () => useContext(walletContext);

const WalletProvider: FunctionComponent = ({ children }) => {
  const {
    handleSelectWallet,
    connected,
    networkId,
    address,
    signer,
    provider,
    balance: ethBalance,
    web3,
    walletType,
  } = useOnboard();
  const { handleNotify } = useNotify(networkId);
  const [lastConfirmedTransaction, setLastConfirmedTransaction] = useState<number>(0);

  const state = useMemo(
    () => ({
      handleSelectWallet,
      handleTransaction: async ({ transaction, callback, onError }: handleTransactionProps) => {
        try {
          const { hash } = await transaction();
          // callback on transaction confirmed
          handleNotify({
            hash,
            onConfirm: () => {
              if (typeof callback === 'function') callback();
              setLastConfirmedTransaction(() => new Date().getTime());
            },
          });
          return hash;
        } catch (error) {
          if (typeof onError === 'function') {
            onError(error);
            return '';
          } else throw error;
        }
      },
      getBalance: (tokenId: string): Promise<BigNumber> => {
        if (address && signer) {
          const tokenContract = new ethers.Contract(tokenId, erc20Abi, signer);
          return new Promise((resolve, reject) => {
            tokenContract
              .balanceOf(address)
              .then((balance: ethers.BigNumber) => resolve(new BigNumber(balance.toString())))
              .catch((error: Error) => console.error(error));
          });
        }
        return new Promise(() => new BigNumber(0));
      },
      lastConfirmedTransaction,
      connected,
      signer,
      address: address ? address.toLowerCase() : '',
      networkId,
      ethBalance,
      web3,
      provider,
      walletType,
    }),

    [
      address,
      connected,
      ethBalance,
      handleNotify,
      handleSelectWallet,
      lastConfirmedTransaction,
      networkId,
      signer,
      provider,
      web3,
      walletType,
    ],
  );

  return <walletContext.Provider value={state}>{children}</walletContext.Provider>;
};

export { useWallet, WalletProvider };
