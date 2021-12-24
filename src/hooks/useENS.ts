import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '.';

type ReturnType = { ensName: string | null };

export const useENS = (address: string | null | undefined): ReturnType => {
  const [ensName, setENSName] = useState<string | null>(null);
  const { networkId } = useWallet();

  useEffect(() => {
    async function resolveENS() {
      if (address && ethers.utils.isAddress(address)) {
        const networkName = networkId === 1 ? 'homestead' : networkId === 42 ? 'kovan' : 'ropsten';
        let provider = new ethers.providers.InfuraProvider(networkName, process.env.REACT_APP_INFURA_API_KEY);
        const ensName = await provider.lookupAddress(address);
        if (ensName) setENSName(ensName);
      }
    }
    resolveENS();
  }, [address, networkId]);

  return { ensName };
};
