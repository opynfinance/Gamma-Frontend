import React, { useState, useEffect, useContext, FunctionComponent } from 'react';
import { ethers } from 'ethers';

import { useWallet } from '../wallet';
import controllerABI from '../../abis/controller.json';
import payableProxyABI from '../../abis/payableProxy.json';
import { ActionArg } from '../../types';
import { CONTROLLER, PAYABLE_PROXY } from '../../utils/constants/addresses';

type ControllerState = {
  controller: ethers.Contract | null;
  payableProxy: ethers.Contract | null;
  handleOperate:
    | (({
        args,
        gasPrice,
        callback,
        onError,
      }: {
        args: ActionArg[];
        gasPrice?: any;
        callback?: any;
        onError?: any;
      }) => Promise<string>)
    | null;
  // payable proxy
  handlePayableOperate:
    | (({
        args,
        value,
        callback,
        onError,
        sendEthTo,
        gasPrice,
      }: {
        args: ActionArg[];
        value: string;
        sendEthTo: string;
        callback?: any;
        onError?: (error: Error) => any;
        gasPrice?: any;
      }) => Promise<string>)
    | null;
  isOperator: (({ operator, account }: { operator: string; account: string }) => Promise<boolean>) | null;
  addOperator:
    | (({
        operator,
        isOperator,
        callback,
        onError,
      }: {
        operator: string;
        isOperator: boolean;
        callback?: any;
        onError?: any;
      }) => Promise<string | undefined>)
    | null;
};

const nullState = {
  controller: null,
  payableProxy: null,
  isOperator: null,
  addOperator: null,
  handleOperate: null,
  handlePayableOperate: null,
};

const controllerContext = React.createContext<ControllerState>(nullState);
const useController = () => useContext(controllerContext);

const ControllerProvider: FunctionComponent = ({ children }) => {
  const wallet = useWallet();
  if (wallet === undefined) {
    throw new Error('ControllerProvider must be used within a WalletProvider');
  }
  const { signer, networkId, handleTransaction, web3, address } = wallet;
  const [state, setState] = useState<ControllerState>(nullState);

  useEffect(() => {
    if (networkId && signer) {
      const controllerAddress = CONTROLLER[networkId];
      const controller = new ethers.Contract(controllerAddress, controllerABI, signer);

      const payableProxyAddress = PAYABLE_PROXY[networkId];
      const payableProxy = new ethers.Contract(payableProxyAddress, payableProxyABI, signer);

      setState({
        controller,
        payableProxy,
        handleOperate: ({ args, gasPrice, callback, onError }) =>
          handleTransaction({
            transaction: () =>
              controller.operate(args, { gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei') }),
            callback,
            onError,
          }),
        handlePayableOperate: ({
          args,
          sendEthTo,
          value,
          callback,
          onError,
          gasPrice,
        }: {
          args: ActionArg[];
          sendEthTo: string;
          value: String;
          callback?: () => any;
          onError?: (error: Error) => any;
          gasPrice?: any;
        }) =>
          handleTransaction({
            transaction: () =>
              payableProxy.operate(args, sendEthTo, {
                value: value,
                gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei'),
              }),
            callback,
            onError,
          }),
        isOperator: ({ account, operator }: { account: string; operator: string }) =>
          controller.isOperator(account, operator),
        addOperator: ({
          operator,
          isOperator,
          callback,
          onError,
        }: {
          operator: string;
          isOperator: boolean;
          callback?: any;
          onError?: (error: Error) => any;
        }) =>
          handleTransaction({
            transaction: () => controller.setOperator(operator, isOperator),
            callback,
            onError,
          }),
      });
    }

    return undefined;
  }, [address, handleTransaction, networkId, signer, web3]);

  return <controllerContext.Provider value={state}>{children}</controllerContext.Provider>;
};
export { ControllerProvider, useController };
