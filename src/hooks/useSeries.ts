import { useState, useEffect } from 'react';
import { loader } from 'graphql.macro';
import { useQuery } from '@apollo/client';

import { ERC20, Series, CollateralType } from '../types';
import { knownCollateralTypes, USDC_ADDRESS, WBTC_ADDRESS, WETH_ADDRESS, YVUSDC_ADDRESS } from '../utils/constants';
import { useWallet } from '../context/wallet';

const all_option_query = loader('../queries/products.graphql');

type Product = {
  strike: ERC20;
  underlying: ERC20;
  collateral: ERC20;
  isPut: boolean;
};

export default function useSeries(): { series: Series[]; refetch: Function } {
  const [series, setSeries] = useState<Series[]>([]);

  const { networkId } = useWallet();

  const validCollateral = [
    USDC_ADDRESS[networkId].toLowerCase(),
    WBTC_ADDRESS[networkId].toLowerCase(),
    WETH_ADDRESS[networkId].toLowerCase(),
    YVUSDC_ADDRESS[networkId].toLowerCase(),
  ]
  const { data, refetch } = useQuery(all_option_query, { variables: { isWhitelisted: true, collateral_in: validCollateral } });

  // set series array.
  useEffect(() => {
    if (data === undefined) return;

    const allProducts: Product[] = data.whitelistedProducts;

    const distinctSeries: Series[] = [];

    const map = new Map();
    for (const { collateral, underlying, strike, isPut } of allProducts) {
      // determine if this series is using cToken, aToken for yield farming
      let type: CollateralType = knownCollateralTypes[0];
      // if it's a put, but not using strike as collateral, or it's a call, not using underlying as collateral,
      // then it could be a "yield farming" protocol.
      // We will assign a CollateralType in this case
      if ((isPut && collateral.id !== strike.id) || (!isPut && collateral.id !== underlying.id)) {
        for (const knownType of knownCollateralTypes) {
          if (knownType.collateralTokens.includes(collateral.symbol)) {
            type = knownType;
          }
        }
      }
      const id = `${underlying.id}-${strike.id}-${type.name}`;
      if (!map.has(id)) {
        map.set(id, true);
        const label = `${underlying.symbol} / ${strike.symbol} ${type.label}`;
        const entity = {
          label,
          underlying,
          strike,
          collateralType: type,
        };
        distinctSeries.push(entity);
      }
    }

    setSeries(distinctSeries);

    return () => {};
  }, [data]);

  return { series, refetch };
}
