/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

import marginAbi from '../abis/marginCalculator.json';
import controllerAbi from '../abis/controller.json';
import { useWallet } from '../context/wallet';
import { CONTROLLER, MARGIN_CALCULATOR } from '../utils/constants';
import { fromTokenAmount, toTokenAmount } from '../utils/calculations';

type marginRequiredProps = {
  underlying: string,
  strikeAsset: string,
  collateral: string,
  shortAmount: BigNumber,
  strikePrice: BigNumber,
  underlyingPrice: BigNumber,
  shortExpiryTimestamp: number,
  collateralDecimals: number,
  isPut: boolean,
}

type timesToExpiryProps = {
  underlying: string,
  strikeAsset: string,
  collateral: string,
  isPut: boolean,
}

const initialState = {
  underlying: '',
  strikeAsset: '',
  collateral: '',
  shortAmount: new BigNumber(0),
  strikePrice: new BigNumber(0),
  underlyingPrice: new BigNumber(0),
  shortExpiryTimestamp: 0,
  collateralDecimals: 0,
  isPut: false,
}

const useMarginCalculator = (props?: marginRequiredProps) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [controllerContract, setControllerContract] = useState<ethers.Contract | null>();
  const [marginRequired, setMarginRequired] = useState(new BigNumber(0));
  const [dustRequired, setDustRequired] = useState(new BigNumber(0));
  const [nakedCap, setNakedCap] = useState(new BigNumber(0));
  const [nakedBalance, setNakedBalance] = useState(new BigNumber(0))
  const [timesToExpiry, setTimesToExpiry] = useState<Array<any>>([]);
  const [spotShock, setSpotShock] = useState(new BigNumber(0));
  const [maxPrice, setMaxPrice] = useState(new BigNumber(0));

  const { signer, networkId } = useWallet();

  const { underlying, strikeAsset, collateral, shortAmount, strikePrice, underlyingPrice, shortExpiryTimestamp, collateralDecimals, isPut } = props || initialState;

  
  useEffect(() => {
    if (signer) {
      setContract(new ethers.Contract(MARGIN_CALCULATOR[networkId], marginAbi, signer));
      setControllerContract(new ethers.Contract(CONTROLLER[networkId], controllerAbi, signer));
    }
  }, [networkId, signer]);

  const getNakedMarginRequired = useCallback(async (
    underlying: string,
    strikeAsset: string,
    collateral: string,
    shortAmount: BigNumber,
    strikePrice: BigNumber,
    underlyingPrice: BigNumber,
    shortExpiryTimestamp:number,
    collateralDecimals: number,
    isPut: boolean,
    ) => {
    if (!contract) return null;
    const minCollat: ethers.BigNumber = await contract.getNakedMarginRequired(
      underlying,
      strikeAsset,
      collateral,
      shortAmount.toString(),
      fromTokenAmount(strikePrice, 8).toString(),
      fromTokenAmount(underlyingPrice, 8).toString(),
      shortExpiryTimestamp,
      collateralDecimals,
      isPut
    );
    return toTokenAmount(new BigNumber(minCollat.toString()), collateralDecimals);
  }, [contract]);

  const getCollateralDust = useCallback(async (collateral: string, collateralDecimals: number) => {
    if (!contract) return null;
    const dustAmount: ethers.BigNumber = await contract.getCollateralDust(collateral);
    return toTokenAmount(new BigNumber(dustAmount.toString()), collateralDecimals);
  }, [contract])

  const getTimesToExpiry = useCallback(async (underlying: string, strikeAsset: string, collateral: string, isPut: boolean) => {
    if (!contract) return [];
    return (await contract.getTimesToExpiry(underlying, strikeAsset, collateral, isPut)) as Array<any>;
  }, [contract])

  const getSpotShock = useCallback(async (underlying: string, strikeAsset: string, collateral: string, isPut: boolean) => {
    if (!contract) return new BigNumber(0);
    const shockAmount: ethers.BigNumber = await contract.getSpotShock(underlying, strikeAsset, collateral, isPut);
    return toTokenAmount(new BigNumber(shockAmount.toString()), 27);
  }, [contract])

  const getMaxPrice = useCallback(async (underlying: string, strikeAsset: string, collateral: string, isPut: boolean, shortExpiryTimestamp: number, _timesToExpiry?: Array<BigNumber>) => {
    if (!contract) return new BigNumber(0);
    let timeToExpiry = shortExpiryTimestamp - (Date.now()/ 1000);
    timeToExpiry = (_timesToExpiry || timesToExpiry).find((time: BigNumber) => time.toNumber() > timeToExpiry);
    if (!timeToExpiry) return new BigNumber(0);
    const maxPrice: ethers.BigNumber = await contract.getMaxPrice(underlying, strikeAsset, collateral, isPut, timeToExpiry);
    return toTokenAmount(new BigNumber(maxPrice.toString()), 27);
  }, [contract, timesToExpiry])

  const getMarginRequired = useCallback(async (oTokenId: string, collatAddress: string, shortAmount: BigNumber, collatAmount: BigNumber, vaultType: number, collatDecimals: number) => {
    if (!contract) return new BigNumber(0);
    const [, requiredMargin]: Array<ethers.BigNumber> = await contract.getMarginRequired(
      [[oTokenId],[], [collatAddress], [shortAmount.toString()], [], [collatAmount.toString()]], vaultType
    );
    return toTokenAmount(new BigNumber(requiredMargin.toString()), collatDecimals);
  }, [contract])

  const getLiquidationPrice = useCallback((collatPercent: number, _isPut?: boolean, _strikePrice?: BigNumber, _maxPrice?: BigNumber, _spotShock?: BigNumber) => {
    let _liqPrice = new BigNumber(0);
    const maxP = _maxPrice || maxPrice;
    const strikeP = _strikePrice || strikePrice;
    const shock = _spotShock || spotShock;
    if (isPut || _isPut) {
      _liqPrice = strikeP
        .multipliedBy(collatPercent / 100 - 1)
        .dividedBy(shock.multipliedBy(maxP.minus(1)));
    } else {
      if (collatPercent < 100) {
        _liqPrice = strikeP
          .multipliedBy(shock)
          .multipliedBy(maxP.minus(1))
          .div(collatPercent / 100 - 1);
      }
    }
    return _liqPrice;
  }, [isPut, maxPrice, spotShock, strikePrice]);

  const getSpotPercent = useCallback((collatPercent: number, _underlyingPrice?: BigNumber, _isPut?: boolean, _strikePrice?: BigNumber, _maxPrice?: BigNumber, _spotShock?: BigNumber) => {
    let _liqPrice = getLiquidationPrice(collatPercent, _isPut, _strikePrice, _maxPrice, _spotShock);
    const underlyingP = _underlyingPrice || underlyingPrice;
    const _spotPercent = new BigNumber(_liqPrice).dividedBy(underlyingP).minus(1).multipliedBy(100);
    return _spotPercent.integerValue(BigNumber.ROUND_CEIL).toNumber();
  }, [getLiquidationPrice, underlyingPrice]);

  const getNakedCap = useCallback(async (collateral: string, decimals: number) => {
    if (!controllerContract) return new BigNumber(0);
    const capAmount: ethers.BigNumber = await controllerContract.getNakedCap(collateral);
    return toTokenAmount(new BigNumber(capAmount.toString()), decimals);
  }, [controllerContract]);

  const getNakedBalance = useCallback(async (collateral: string, decimals: number) => {
    if (!controllerContract) return new BigNumber(0);
    const balance: ethers.BigNumber = await controllerContract.getNakedPoolBalance(collateral);
    return toTokenAmount(new BigNumber(balance.toString()), decimals);
  }, [controllerContract]);

  useEffect(() => {
    if (!contract || !props || !controllerContract || underlyingPrice.toNumber() === 0) return;
    
    getTimesToExpiry(underlying, strikeAsset, collateral, isPut).then(val => setTimesToExpiry(val)).catch((err) => console.log(err));
        
    if (shortAmount.isZero()) return;

    getNakedMarginRequired(underlying,
      strikeAsset,
      collateral,
      shortAmount,
      strikePrice,
      underlyingPrice,
      shortExpiryTimestamp,
      collateralDecimals,
      isPut).then(margin => setMarginRequired(margin as BigNumber)).catch((err) => console.log(err));
    getCollateralDust(collateral, collateralDecimals).then(val => setDustRequired(val || new BigNumber(0))).catch((err) => console.log(err));
    getSpotShock(underlying, strikeAsset, collateral, isPut).then(val => setSpotShock(val)).catch((err) => console.log(err));
    getNakedCap(collateral, collateralDecimals).then(val => setNakedCap(val)).catch((err) => console.log(err));
    getNakedBalance(collateral, collateralDecimals).then(val => setNakedBalance(val)).catch((err) => console.log(err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, shortAmount.toNumber(), underlying, isPut, underlyingPrice.toNumber(), collateral]);

  useEffect(() => {
    getMaxPrice(underlying, strikeAsset, collateral, isPut, shortExpiryTimestamp).then(val => setMaxPrice(val)).catch((err) => console.log(err));
  }, [collateral, isPut, shortExpiryTimestamp, strikeAsset, timesToExpiry.length, underlying])

  const getNakedMarginVariables = async (props: marginRequiredProps) => {
    const { underlying, strikeAsset, collateral, shortExpiryTimestamp, collateralDecimals, isPut, shortAmount, strikePrice, underlyingPrice } = props;

    // Catch error in future
    try {
      const _dustRequired = await getCollateralDust(collateral, collateralDecimals);
      const _timesToExpiry = await getTimesToExpiry(underlying, strikeAsset, collateral, isPut);
      const _spotShock = await getSpotShock(underlying, strikeAsset, collateral, isPut);
      const _maxPrice = await getMaxPrice(underlying, strikeAsset, collateral, isPut, shortExpiryTimestamp, _timesToExpiry);
      const _marginRequired = await getNakedMarginRequired(underlying, strikeAsset, collateral, shortAmount, strikePrice, underlyingPrice, shortExpiryTimestamp, collateralDecimals, isPut)
      
      return {
        dustRequired: _dustRequired,
        timesToExpiry: _timesToExpiry,
        spotShock: _spotShock,
        maxPrice: _maxPrice,
        marginRequired: _marginRequired,
      }
    } catch(e) {
      console.log(e)
    }

    return {
      dustRequired: null,
      timesToExpiry: [],
      spotShock: new BigNumber(0),
      maxPrice: new BigNumber(0),
    }
  }


  return { 
    marginRequired,
    dustRequired,
    timesToExpiry,
    spotShock,
    maxPrice,
    nakedCap,
    nakedBalance,
    getMarginRequired,
    getMaxPrice,
    getSpotPercent,
    getLiquidationPrice,
    getNakedMarginVariables,
  };
};

export default useMarginCalculator;