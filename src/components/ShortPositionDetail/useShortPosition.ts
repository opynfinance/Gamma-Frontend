/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';

import { ERC20, OToken, Position } from '../../types';
import { useApproval, useWallet, useController, Spender } from '../../hooks';
import { VaultType } from '../../utils/constants';

export type ShortPositionProps = {
  collateralAmount: BigNumber;
  collateral: ERC20;
  vaultId: number;
  otoken: OToken;
  shortAmount: BigNumber;
  position: Position;
  vaultType?: VaultType 
};

export type ShortPositionState = {
  collateralBalance: BigNumber;
  otokenBalance: BigNumber;
  redeemableCollateral: BigNumber;
  collateralAllowance: BigNumber;
  collateralAmount: BigNumber;
  mintableOTokens: BigNumber;
  shortAmount: BigNumber;
  otoken: OToken;
  collateral: ERC20;
  position: Position;
  vaultId: number;
  vaultType?: VaultType;
  approveCollateral:
    | (({ amount, callback, onError }: { amount: BigNumber; callback: any; onError?: any }) => void)
    | null;
};

const useShortPosition = ({
  collateralAmount,
  collateral,
  vaultId,
  otoken,
  shortAmount,
  position,
  vaultType
}: ShortPositionProps): ShortPositionState => {
  const [redeemableCollateral, setRedeemableCollateral] = useState<BigNumber>(new BigNumber(0));
  const [collateralBalance, setCollateralBalance] = useState<BigNumber>(new BigNumber(0));
  const [otokenBalance, setOtokenBalance] = useState<BigNumber>(new BigNumber(0));
  const [mintableOTokens, setMintableOTokens] = useState<BigNumber>(new BigNumber(0));
  const [collateralAllowance, setCollateralAllowance] = useState(new BigNumber(0));

  const { controller } = useController();
  const { address, getBalance } = useWallet();

  const { approve: approveCollateral, getAllowance: getCollateralAllowance } = useApproval(
    collateral.id,
    Spender.MarginPool,
  );

  useEffect(() => {
    if (controller) {
      // get maximum redemmable collateral
      controller
        .getProceed(address, vaultId)
        .then((proceed: any) => new BigNumber(proceed.toString()))
        .then((result: BigNumber) => {
          const mintableOTokens = result
            .div(10 ** collateral.decimals)
            .div(otoken.isPut ? otoken.strikePrice : 1)
            .times(10 ** otoken.decimals)
            .integerValue(BigNumber.ROUND_DOWN);

          setMintableOTokens(mintableOTokens);
          setRedeemableCollateral(result);
        });
    }
  }, [
    address,
    collateralAmount.toNumber(),
    collateral.decimals,
    controller,
    otoken.decimals,
    otoken.strikePrice.toNumber(),
    vaultId,
  ]);

  useEffect(() => {
    if (getBalance) {
      getBalance(collateral.id).then(setCollateralBalance);
      getBalance(otoken.id).then(setOtokenBalance);
    }
    if (getCollateralAllowance) {
      getCollateralAllowance().then(setCollateralAllowance);
    }
  }, [collateral.id, getBalance, getCollateralAllowance, otoken.id]);

  return {
    collateralBalance,
    otokenBalance,
    redeemableCollateral,
    collateralAllowance,
    collateralAmount,
    mintableOTokens,
    shortAmount,
    otoken,
    collateral,
    position,
    vaultId,
    vaultType,
    approveCollateral,
  };
};

export default useShortPosition;
