import React, { useEffect, useMemo } from 'react';

import { Errors } from '../utils/constants';

export function useError(collateral: string): any {
  const [isError, setIsError] = React.useState(false);
  const [errorType, setErrorType] = React.useState<Errors>(Errors.NO_ERROR);
  const [errorName, setErrorName] = React.useState('');
  const [errorDescription, setErrorDescription] = React.useState('');

  const displayCollateralName = useMemo(() => (collateral === 'WETH' ? 'ETH' : collateral), [collateral]);

  useEffect(() => {
    if (errorType === Errors.INSUFFICIENT_BALANCE) {
      setIsError(true);
      setErrorName('Insufficient Balance');
      setErrorDescription('Insufficient ' + displayCollateralName + ' Balance');
    } else if (errorType === Errors.INSUFFICIENT_USDC_BALANCE) {
      setIsError(true);
      setErrorName('Insufficient Balance');
      setErrorDescription('Insufficient USDC Balance');
    } else if (errorType === Errors.INSUFFICIENT_LIQUIDITY) {
      setIsError(true);
      setErrorName('Insufficient Liquidity');
      setErrorDescription('Insufficient Liquidity: Please try a smaller amount');
    } else if (errorType === Errors.SLIPPAGE_TOO_HIGH) {
      setIsError(true);
      setErrorName('Slippage');
      setErrorDescription('Slippage Warning: 10.4%');
    } else if (errorType === Errors.GREATER_THAN_MAX) {
      setIsError(true);
      setErrorName('Greater than max');
      setErrorDescription('You cannot input more than the max amount');
    } else if (errorType === Errors.SMALL_COLLATERAL) {
      setIsError(true);
      setErrorName('Collateral amount is less');
      setErrorDescription('Collateral amount is lesser than minimum margin required. Try larger input or disable partial collateralization. Minimum required is 1 ETH for calls and 2500 USDC for puts.');
    } else if (errorType === Errors.MAX_CAP_REACHED) {
      setIsError(true);
      setErrorName('Max cap reached');
      setErrorDescription('Max cap reached for partially collateralized vault. Try smaller input or disable partial collateralization');
    } else if (errorType === Errors.INSUFFICIENT_ETH_GAS_BALANCE) {
      setIsError(true); //warning - they can still access metamask and see gas for themselves 
      setErrorName('Insufficient ETH Balance');
      setErrorDescription('Insufficient ETH balance to pay for gas');
    } else if (errorType === Errors.LARGE_MARKET_IMPACT) {
      setIsError(false); // this is just a warning, not an error
      setErrorName('Large Market Impact');
      setErrorDescription('');
    } else if (errorType === Errors.FEE_HIGHER_THAN_PREMIUM) {
      setIsError(false); // this is just a warning, not an error
      setErrorName('Current 0x Fee higher than expected premium');
      setErrorDescription('');
    } else if (errorType === Errors.DEADLINE_PAST_EXPIRY) {
      setIsError(true);
      setErrorName('Deadline past expiry');
      setErrorDescription('Limit order deadline must be before expiry');
    } else if (errorType === Errors.SIZE_TOO_SMALL) {
      setIsError(true);
      setErrorName('Order too small');
      setErrorDescription(Errors.SIZE_TOO_SMALL);
    } else if (errorType === Errors.GAS_LIMIT_ESTIMATE_FAILED) {
      setIsError(true);
      setErrorName('Gas estimation failed');
      setErrorDescription(Errors.GAS_LIMIT_ESTIMATE_FAILED);
    } else {
      setIsError(false);
    }
    return () => { };
  }, [displayCollateralName, errorType]);

  return {
    isError,
    errorName,
    errorDescription,
    errorType,
    setErrorType,
  };
}
