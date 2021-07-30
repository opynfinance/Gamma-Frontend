import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import { SignedOrder } from '../types/0x';
import { useZeroX } from '../context/zerox';
import { useWallet } from '../context/wallet';
import { ZX_EXCHANGE } from '../utils/constants/addresses';
import zeroXAbi from '../abis/ZeroX_Exchange.json';


/**
 * Get gas fee for filling a 0x order
 * @param args Fill order args for 0x order
 */
export const use0xGasFee = (
  orders: SignedOrder[],
  amounts: BigNumber[],
  useWeth?: boolean,
  isExchangeTxn?: boolean,
  paused?: boolean,
): { gasToPay: BigNumber } => {
  const [gasToPay, setGasToPay] = useState(new BigNumber(0));
  const [exchange, setExchange] = useState<any>(null);

  const { getGasPriceForOrders, getProtocolFee } = useZeroX();
  const { connected, address: networkId, signer } = useWallet();

  useEffect(() => {
    if (connected && networkId && signer) {
      const exchangeAddress = ZX_EXCHANGE[1];
      setExchange(() => new ethers.Contract(exchangeAddress, zeroXAbi, signer));
    } else {
      setExchange(null);
    }
  }, [connected, networkId, signer]);

  useEffect(() => {
    const calculateGasLimit = async () => {
      try {
        if (isExchangeTxn && gasToPay.isZero() && !paused && orders.length > 0) {
          const signatures = orders.map(order => order.signature);
          const gasPrice = getGasPriceForOrders(orders);
          const feeInEth = getProtocolFee(orders).toString();
          const amountsStr = amounts.map(amount => amount.toString());
          const exchangeGasLimit = await exchange.estimateGas.fillLimitOrder(orders[0], signatures[0], amountsStr[0], {
            value: useWeth ? '0' : ethers.utils.parseEther(feeInEth),
            gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei'),
          });
          const payment = (await exchangeGasLimit.toNumber()) * gasPrice.toNumber() * 10e-10;
          setGasToPay(new BigNumber(payment).precision(4));
          return;
        }
      } catch (error) {
        console.log('gas estimation ' + error);
      }
    };
    calculateGasLimit();
    return;
  }, [paused, orders, useWeth, amounts, exchange, getGasPriceForOrders, getProtocolFee, isExchangeTxn, gasToPay]);

  return { gasToPay };
};
