import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';

import { CollateralType, OToken, SeriesTokens } from '../types';
import { whitelistedExpiry } from '../utils/constants/whitelist';
import { SubgraphEndpoint } from '../utils/constants/links';
import { BLACK_LIST } from '../utils/constants/addresses';
import { SubgraphOToken, toInternalOToken } from '../utils/subgraph';
import { useWallet } from '../context/wallet';
import { knownCollateralTypes, SupportedNetworks } from '../utils/constants';

export default function useLiveOptions() {
  const [loading, setIsLoading] = useState(true);
  const { networkId } = useWallet();
  const endpoint = SubgraphEndpoint[networkId];

  const [oTokens, setOTokens] = useState<OToken[]>([]);
  const [seriesTokens, setSeriesTokens] = useState<SeriesTokens>({});

  useEffect(() => {
    getLiveOTokens(endpoint, networkId)
      .then((data) => {
        setIsLoading(false);
        if (data?.otokens) {
          setOTokens(data?.otokens);
        }
        if (data?.seriesTokens) {
          setSeriesTokens(data.seriesTokens);
        }
      })
      .catch(error => {
        setIsLoading(false);
      });
  }, [endpoint, networkId]);

  return { oTokens, loading, seriesTokens };
}

/**
 * Get all oTokens
 */
export async function getLiveOTokens(endpoint: string, networkId: SupportedNetworks): Promise<{otokens: OToken[], seriesTokens: SeriesTokens} | null> {
  const current = new BigNumber(Date.now()).div(1000).integerValue().toString();
  const query = `
  {
    otokens (where: {expiryTimestamp_gt: ${current}}) {
      id
      symbol
      name
      decimals
      strikeAsset {
        id
        symbol
        decimals
      }
      underlyingAsset {
        id
        symbol
        decimals
      }
      collateralAsset {
        id
        symbol
        decimals
      }
      strikePrice
      isPut
      expiryTimestamp
      implementation
    }
  }`;

  const response = await postQuery(endpoint, query);
  const oT = response.data.otokens
    .map((o: SubgraphOToken) => toInternalOToken(o, networkId))
    .filter((o: OToken) => {
      return new Date(o.expiry * 1000).getUTCDay() === 5 || whitelistedExpiry.includes(o.expiry);
    })
    .filter((o: OToken) => !BLACK_LIST.includes(o.id.toLowerCase()) &&  Math.round(o.strikePrice.toNumber()) > 0);
  // .filter((o: OToken) => o.expiry === 1612512000);

  const seriesToken = oT.reduce((acc: any, o: OToken) => {
    let type: CollateralType = knownCollateralTypes[0];
    if ((o.isPut && o.collateralAsset.id !== o.strikeAsset.id) || (!o.isPut && o.collateralAsset.id !== o.underlyingAsset.id)) {
      for (const knownType of knownCollateralTypes) {
        if (knownType.collateralTokens.includes(o.collateralAsset.symbol)) {
          type = knownType;
        }
      }
    }
    const seriesKey = type.label === '' ? o.underlyingAsset.id : `${o.underlyingAsset.id}-${type.label}`;
    if (acc[seriesKey]) {
      acc[seriesKey].push(o);
    } else {
      acc[seriesKey] = [o];
    }
    return acc;
  }, {})

  return { otokens: oT, seriesTokens: seriesToken };
}

const postQuery = async (endpoint: string, query: string) => {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  };
  const url = endpoint;
  const response = await fetch(url, options);
  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  } else {
    return data;
  }
};