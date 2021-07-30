import { useCallback, useState, useEffect } from 'react';

import { useWallet, useController, useAddresses } from '.';

const usePayableProxy = () => {
  const { address: account } = useWallet();
  const { addOperator, isOperator } = useController();
  const [isProxyOperator, setIsProxyOperator] = useState(false);
  const { payableProxy: payableProxyAddress } = useAddresses();
  const updateIsOperator = useCallback(() => {
    if (isOperator === null) return console.error('hooks/useOperator: isOperator is null.');
    isOperator({
      account,
      operator: payableProxyAddress,
    }).then(result => setIsProxyOperator(result));
  }, [account, isOperator, payableProxyAddress]);

  // initial isOperator check
  useEffect(() => {
    updateIsOperator();
  }, [updateIsOperator]);

  const defaultErrorHandler = (error: Error) => {
    throw error;
  };

  const addProxyOperator = useCallback(
    ({ callback, onError = defaultErrorHandler }: { callback?: () => any; onError?: (error: Error) => any }) => {
      if (addOperator === null) return onError(new Error('hooks/useOperator: addOperator is null.'));
      return addOperator({
        operator: payableProxyAddress,
        isOperator: true,
        callback: () => {
          if (callback) callback();
          // update isOperator if changed
          updateIsOperator();
        },
        onError,
      });
    },
    [addOperator, payableProxyAddress, updateIsOperator],
  );

  return {
    isProxyOperator,
    addProxyOperator,
  };
};

export { usePayableProxy };
