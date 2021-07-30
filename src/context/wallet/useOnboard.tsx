import { useState, useEffect, useCallback } from 'react';
import Onboard from 'bnc-onboard';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

import { SupportedNetworks } from '../../utils/constants';

const dappId = process.env.REACT_APP_BLOCKNATIVE_DAPP_ID;

const useOnboard = () => {
  const [signer, setSigner] = useState<any>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [balance, setBalance] = useState<BigNumber>(new BigNumber(0));
  const [onboard, setOnboard] = useState<any>(null);
  const [networkId, setNetworkId] = useState<SupportedNetworks>(
    Number(localStorage.getItem('networkId') ?? SupportedNetworks.MAINNET),
  );
  const [walletType, setWalletType] = useState('');

  useEffect(() => {
    const handleUpdateWallet = (wallet: any) => {
      if (wallet.provider) {
        window.localStorage.setItem('selectedWallet', wallet.name);
        const provider = new ethers.providers.Web3Provider(wallet.provider);
        setProvider(provider);
        setSigner(() => provider.getSigner());
        setWeb3(new Web3(wallet.provider));
        setWalletType(wallet.type);
      } else {
        setSigner(null);
      }
    };

    const handleNetworkChange = (newNetworkId: number) => {
      if (newNetworkId in SupportedNetworks) {
        setNetworkId(newNetworkId);
        localStorage.setItem('networkId', newNetworkId.toString());

        if (onboard === null) return;
        onboard.config({
          networkId: newNetworkId,
        });
      } else {
        console.error('Unsupported Network', newNetworkId);
      }
    };

    const network = networkId === 1 ? 'mainnet' : networkId === 42 ? 'kovan' : 'ropsten';

    const RPC_URL = `https://${network}.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`;

    const wallets = [
      { walletName: 'metamask', preferred: true },
      {
        walletName: 'walletConnect',
        preferred: true,
        infuraKey: process.env.REACT_APP_INFURA_API_KEY,
      },
      {
        walletName: 'lattice',
        rpcUrl: RPC_URL,
        preferred: true,
        appName: 'Opyn V2',
      },
      { walletName: 'coinbase', preferred: true },
      {
        walletName: 'ledger',
        preferred: true,
        rpcUrl: RPC_URL,
      },
    ];

    const onboard = Onboard({
      dappId, // [String] The API key from blocknative
      networkId: networkId, // [Integer] The Ethereum network ID your Dapp uses.
      darkMode: false,
      subscriptions: {
        wallet: handleUpdateWallet,
        address: setAddress,
        balance: balance => setBalance(new BigNumber(balance)),
        network: handleNetworkChange,
      },
      walletSelect: { wallets },
      walletCheck: [
        { checkName: 'derivationPath' },
        { checkName: 'connect' },
        { checkName: 'accounts' },
        { checkName: 'network' },
      ],
    });
    setOnboard(onboard);

    // check if the user has previously selected a wallet
    const previouslySelectedWallet = window.localStorage.getItem('selectedWallet');
    if (previouslySelectedWallet && onboard) {
      onboard.walletSelect(previouslySelectedWallet).then((success: boolean) => {
        if (success) onboard.walletCheck();
      });
    }
  }, [networkId]);

  const handleSelectWallet = useCallback(() => {
    if (!onboard) return;
    onboard.walletSelect().then((success: boolean) => {
      if (success) onboard.walletCheck();
    });
  }, [onboard]);

  return {
    web3,
    handleSelectWallet,
    connected: address ? true : false,
    networkId,
    address,
    signer,
    provider,
    balance,
    walletType,
  };
};

export default useOnboard;
