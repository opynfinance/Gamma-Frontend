import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '.';

const getENSAvatar = async (ensName: string) => {
  const response = await fetch(`https://metadata.ens.domains/mainnet/avatar/${ensName}/meta`);
  const data = await response.json();
  return data.image ?? null;
};

type ReturnType = { ensName: string | null; ensAvatar: string | null };

export const useENS = (address: string | null | undefined): ReturnType => {
  const [ensName, setENSName] = useState<string | null>(null);
  const [ensAvatar, setENSAvatar] = useState<string | null>(null);
  const { networkId } = useWallet();

  useEffect(() => {
    async function resolveENS() {
      if (address && ethers.utils.isAddress(address)) {
        const networkName = networkId === 1 ? 'homestead' : networkId === 42 ? 'kovan' : 'ropsten';
        let provider = new ethers.providers.InfuraProvider(networkName, process.env.REACT_APP_INFURA_API_KEY);
        const ensName = await provider.lookupAddress(address);
        const ensAvatar = ensName ? await getENSAvatar(ensName) : null;
        if (ensName) setENSName(ensName);
        if (ensAvatar) setENSAvatar(ensAvatar);
      }
    }
    resolveENS();
  }, [address, networkId]);

  return { ensName, ensAvatar };
};
