import { useMemo } from 'react';

import {
  ZERO_ADDR,
  CONTROLLER,
  PAYABLE_PROXY,
  MARGIN_POOL,
  ZX_EXCHANGE,
  USDC_ADDRESS,
  WETH_ADDRESS,
} from '../utils/constants';

import { useWallet } from '.';

const useAddresses = () => {
  const { networkId } = useWallet();

  const state = useMemo(
    () => ({
      zero: ZERO_ADDR,
      controller: CONTROLLER[networkId],
      payableProxy: PAYABLE_PROXY[networkId],
      marginPool: MARGIN_POOL[networkId],
      zxExchange: ZX_EXCHANGE[networkId],
      usdc: USDC_ADDRESS[networkId],
      weth: WETH_ADDRESS[networkId],
    }),
    [networkId],
  );

  return state;
};

export { useAddresses };
