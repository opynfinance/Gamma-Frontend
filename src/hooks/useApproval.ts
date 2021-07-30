import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { signERC2612Permit } from 'eth-permit';

import { useWallet } from '../context/wallet';
import erc20Abi from '../abis/erc20.json';
import { MARGIN_POOL, PAYABLE_PROXY, USDC_ADDRESS, ZX_EXCHANGE } from '../utils/constants/addresses';
import { SupportedNetworks } from '../utils/constants/enums';
import { MAX_UINT } from '../utils/constants/index';
import { parseTxErrorMessage } from '../utils/parse';
import { useToast } from '../hooks';
import otokenAbi from '../abis/otoken.json';


export enum Spender {
  MarginPool,
  Controller,
  PayableProxy,
  ZeroXExchange,
}

const useApproval = (tokenId: string | null, spender: Spender) => {
  const [allowance, setAllowance] = useState<BigNumber>(new BigNumber(-1));
  const [loading, setLoading] = useState(true);

  const wallet = useWallet();
  if (wallet === undefined) {
    throw new Error('useApproval must be used within a ContractProvider');
  }

  const { handleTransaction, address: walletAddress, signer, networkId } = wallet;

  const getAllowance = useCallback(async () => {
    if (tokenId === null || !signer) return new BigNumber(-1);
    const spenderAddress = getSpenderAddress(spender, networkId);
    const tokenContract = new ethers.Contract(tokenId, erc20Abi, signer);
    const allowance = await tokenContract
      .allowance(walletAddress, spenderAddress)
      .then((result: ethers.BigNumber) => new BigNumber(result.toString()));
    setAllowance(allowance);
    return allowance;
  }, [spender, networkId, tokenId, signer, walletAddress]);

  useEffect(() => {
    setLoading(true);
    getAllowance()
      .then(allowance => {
        setAllowance(allowance);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setAllowance(new BigNumber(0));
        setLoading(false);
      });
  }, [getAllowance]);

  const approve = useCallback(
    async ({ amount, callback, onError } = {}) => {
      if (!signer || tokenId === null) return onError(new Error('useApproval: wallet not connect.'));

      const spenderAddress = getSpenderAddress(spender, networkId);
      const tokenContract = new ethers.Contract(tokenId, erc20Abi, signer);
      const hash = await handleTransaction({
        transaction: () => tokenContract.approve(spenderAddress, amount ? amount.toString() : MAX_UINT),
        callback: () => {
          callback();
          getAllowance();
        },
        onError,
      });
      return hash;
    },
    [getAllowance, handleTransaction, networkId, signer, spender, tokenId],
  );

  return { approve, getAllowance, allowance, setAllowance, loading };
};

const usePermit = (tokenId: string | null, spender: Spender) => {
  const [allowance, setAllowance] = useState<BigNumber>(new BigNumber(-1));
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<any>();
  const [callData, setCallData] = useState<string | null>();
  const [nonce, setNonce] = useState();

  const toast = useToast();

  const wallet = useWallet();
  if (wallet === undefined) {
    throw new Error('useApproval must be used within a ContractProvider');
  }

  const { address: walletAddress, signer, networkId } = wallet;

  const getAllowance = useCallback(async () => {
    if (tokenId === null || !signer) return new BigNumber(-1);
    const spenderAddress = getSpenderAddress(spender, networkId);
    const tokenContract = new ethers.Contract(tokenId, erc20Abi, signer);
    const allowance = await tokenContract
      .allowance(walletAddress, spenderAddress)
      .then((result: ethers.BigNumber) => new BigNumber(result.toString()));
    setAllowance(allowance);
    return allowance;
  }, [spender, networkId, tokenId, signer, walletAddress]);

  useEffect(() => {
    setLoading(true);
    getAllowance()
      .then(allowance => {
        setAllowance(allowance);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setAllowance(new BigNumber(0));
        setLoading(false);
      });
  }, [getAllowance]);


   useCallback(async () => {
    if (!signer || tokenId === null) return console.error("useApproval: wallet not connect");
    const owner = walletAddress;

    //if token is USDC, thne use erc20 ABI and permit USDC. Otherwise permit oToken
    const abi = tokenId === USDC_ADDRESS[networkId] ? erc20Abi : otokenAbi;
    const oTokenContract = new ethers.Contract(tokenId, abi, signer);
    const nonce = await oTokenContract
      .nonces(owner)
      .then((result: number) => result);
    setNonce(nonce);
    console.log(`set nonce`)
    return nonce;
  }, [signer, walletAddress, tokenId, networkId]);
  

  const permit = useCallback(
    async ({ amount, callback, onError } = {}) => {
      if (!signer || tokenId === null) return onError(new Error('useApproval: wallet not connect.'));
      const owner = walletAddress;
      const value = amount ? amount.toString() : MAX_UINT 
      const maxDeadline = new BigNumber(Date.now() + (60*60*1000)).toNumber()
      const spenderAddress = getSpenderAddress(spender, networkId);
      interface Domain {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: string;
      }

      const USDCDomain: Domain = {
        name: "USD Coin",
        version: "2",
        chainId: networkId,
        verifyingContract: USDC_ADDRESS[networkId],
      }
      
      try {
       if (tokenId === USDC_ADDRESS[networkId]) {
        let usdcSignedMessage = spenderAddress && await signERC2612Permit(wallet.provider, USDCDomain, owner, spenderAddress.toString(), value, maxDeadline, nonce);
        const sig = usdcSignedMessage && {
          r: usdcSignedMessage.r,
          v: usdcSignedMessage.v, 
          s: usdcSignedMessage.s,  
        }
        
        setSignature(sig);


      const encodedCallData = usdcSignedMessage && ethers.utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
        [tokenId, owner, spenderAddress, value.toString(), maxDeadline, usdcSignedMessage.v, usdcSignedMessage.r, usdcSignedMessage.s],
      )
      setCallData(encodedCallData);

       } else {
         let signedMessage = spenderAddress && await signERC2612Permit(wallet.provider, tokenId, owner, spenderAddress.toString(), value, maxDeadline, nonce);

         const sig = signedMessage && {
          r: signedMessage.r,
          v: signedMessage.v, 
          s: signedMessage.s,  
        }
        
        setSignature(sig);


        const encodedCallData = signedMessage && ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
          [tokenId, owner, spenderAddress, value.toString(), maxDeadline, signedMessage.v, signedMessage.r, signedMessage.s],
        )
        setCallData(encodedCallData);
       }

      } catch(error) {
        const errorMessage = parseTxErrorMessage(error);
        return toast.error(errorMessage);
      }
    },
    [networkId, signer, spender, tokenId, walletAddress, toast, wallet.provider, nonce],
  );

  return { permit, getAllowance, allowance, setAllowance, loading, signature, callData };
};
 

function getSpenderAddress(spender: Spender, networkId: SupportedNetworks): string | undefined {
  switch (spender) {
    case Spender.MarginPool:
      return MARGIN_POOL[networkId];
    case Spender.PayableProxy:
      return PAYABLE_PROXY[networkId];
    case Spender.ZeroXExchange:
      return ZX_EXCHANGE[networkId];
    default:
      throw new Error('UseAllowance: spender is not recognized.');
  }
}

export { useApproval, usePermit };