import { useState, useEffect } from 'react';
import { loader } from 'graphql.macro';
import { useQuery } from '@apollo/client';
import * as subgraphUtil from '../utils/subgraph';

const oracleAssetQuery = loader('../queries/oracleAsset.graphql');

export function useOracleData(): {
  refetch: Function;
  prices: subgraphUtil.SubgraphAssetPrice[];
  assets: subgraphUtil.SubgraphOracleAsset[];
} {
  const [prices, setPrices] = useState<subgraphUtil.SubgraphAssetPrice[]>([]);

  const [assets, setAssets] = useState<subgraphUtil.SubgraphOracleAsset[]>([]);

  const { data, refetch } = useQuery(oracleAssetQuery);

  useEffect(() => {
    if (!data) return;
    if (data.expiryPrices) setPrices(data.expiryPrices);
    if (data.oracleAssets) setAssets(data.oracleAssets);
  }, [data]);

  return {
    prices,
    assets,
    refetch,
  };
}
