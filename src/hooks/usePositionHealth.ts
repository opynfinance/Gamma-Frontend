import { useCallback, useEffect, useState } from "react";
import BigNumber from 'bignumber.js';

import { ActivePositionWithPNL, VaultStatus } from "../types";
import useMarginCalculator from "./useMarginCalculator";
import { useWallet } from "../context/wallet";
import { TradePosition, VaultType, WETH_ADDRESS } from "../utils/constants";
import { calculateSimpleCollateral, getVaultStatus } from "../utils/calculations";
import useChainLinkPrice from "./useChainLinkPrice";

const usePositionHealth = (positions: ActivePositionWithPNL[]) => {
  const { getNakedMarginVariables, getSpotPercent } = useMarginCalculator();
  const { networkId } = useWallet();
  const ethPrice = useChainLinkPrice(WETH_ADDRESS[networkId]);

  const [positionsWithHealth, setPositionsWithHealth] = useState<Array<any>>([]);

  const getPositions = useCallback(async () => {
    const _positionsWithHealth = positions.map(async (position) => {
      if (position.underlying.id !== WETH_ADDRESS[networkId] || position.type !== TradePosition.Short || position.vaultType === VaultType.FULLY_COLLATERALIZED || !position.collateral) return position;
      const { maxPrice, spotShock } = await getNakedMarginVariables({
        underlying: position.underlying.id,
        strikeAsset: position.shortOToken?.strikeAsset.id || '',
        collateral: position.collateral?.id || '',
        shortAmount: position.shortAmount,
        strikePrice: position.shortOToken?.strikePrice || new BigNumber(0),
        underlyingPrice: ethPrice,
        shortExpiryTimestamp: position.shortOToken?.expiry || 0,
        collateralDecimals: position.collateral?.decimals || 0,
        isPut: position.isPut.valueOf(),
      });

      const neededCollateral = position.shortOToken ? calculateSimpleCollateral(position.shortOToken, position.shortAmount) : new BigNumber(0);
      const collatPercent = position.collateralAmount.div(neededCollateral).multipliedBy(100).toNumber();
      const spotPercent = getSpotPercent(collatPercent, ethPrice, position.isPut.valueOf(), position.shortOToken?.strikePrice, maxPrice, spotShock);
      let vaultStatus = collatPercent !== 100 ? getVaultStatus(position.isPut.valueOf(), spotPercent) : VaultStatus.SAFE
      if (position.liquidationStarted) {
        if (position.shortAmount.isZero()) vaultStatus = VaultStatus.LIQUIDATED;
        else vaultStatus = VaultStatus.PARTIALLY_LIQUIDATED
      }

      return {
        ...position,
        spotPercent,
        vaultStatus
      }
    });

    return Promise.all(_positionsWithHealth);
  }, [ethPrice, getNakedMarginVariables, getSpotPercent, networkId, positions]);

  useEffect(() => {
    getPositions().then(setPositionsWithHealth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, ethPrice.toNumber(), networkId]);

  return positionsWithHealth;
};

export default usePositionHealth;
