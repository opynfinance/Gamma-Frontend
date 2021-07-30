import { ERC20, OToken } from '../types';
import {OTOKEN} from '../utils/constants/addresses';
import { SupportedNetworks } from './constants/enums';
import { SubgraphEndpoint } from './constants/links';

import BigNumber from 'bignumber.js';

export function toInternalOToken(token: SubgraphOToken, networkId: SupportedNetworks): OToken {
  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    underlyingAsset: token.underlyingAsset,
    strikeAsset: token.strikeAsset,
    collateralAsset: token.collateralAsset,
    strikePrice: new BigNumber(token.strikePrice).div(1e8),
    isPut: token.isPut,
    expiry: Number(token.expiryTimestamp),
    isPermit: token.implementation ===  OTOKEN[networkId],
    implementation: token.implementation,
  };
}

export type SubgraphAccountBalancesAndVaults = {
  balances: SubgraphAccountBalance[];
  vaults: SubgraphVault[];
};

export type SubgraphVault = {
  vaultId: string;
  type: number;
  shortOToken: SubgraphOToken | null;
  shortAmount: string | null;
  longOToken: SubgraphOToken | null;
  longAmount: string | null;
  collateralAsset: ERC20 | null;
  collateralAmount: string | null;
  firstMintTimestamp: string;
};

export type SubgraphAccountBalance = {
  balance: string;
  token: SubgraphOToken;
};

export type SubgraphOToken = {
  name: string;
  decimals: 8;
  expiryTimestamp: string;
  id: string;
  isPut: boolean;
  strikeAsset: ERC20;
  collateralAsset: ERC20;
  underlyingAsset: ERC20;
  strikePrice: string;
  symbol: string;
  implementation: string; 
};

export type SubgraphOracleAsset = {
  pricer: {
    lockingPeriod: string;
    disputePeriod: string;
  };
  id: string;
};

export type SubgraphAssetPrice = {
  expiry: string;
  asset: {
    id: string;
  };
  price: string;
};

export type SubgraphTrade = {
  id: string;
  oToken: OToken;
  paymentToken: {
    symbol: string;
    id: string;
    decimals: number;
  };
  paymentTokenAmount: string;
  oTokenAmount: string;
  transactionHash: string;
  timestamp: string;
};

export type RedeemActionType = {
  transactionHash: string;
  oToken: OToken;
  otokenBurned: string;
  payoutAsset: {
    symbol: string;
    id: string;
    decimals: number;
  };
  block: string;
  payoutAmount: string;
  timestamp: string;
};

export type SettleActionType = {
  vault: {
    vaultId: string;
  };
  long: OToken | null;
  short: OToken | null;
  longAmount: string | null;
  shortAmount: string | null;
  collateral: {
    id: string;
    symbol: string;
    decimals: number;
  } | null;
  collateralAmount: string | null;
  block: string;
  amount: string; // payout amount
  timestamp: string;
  transactionHash: string;
};

export type LiquidationType = {
  vault: {
    vaultId: string;
  };
};

export async function getAccountVaultsAtBlock(
  account: string,
  blocknum: number,
  networkId: SupportedNetworks,
): Promise<SubgraphVault[]> {
  const query = `{
    vaults (block: {number : ${blocknum} } ,where:{
      owner: "${account}"
    }) {
      vaultId
      longOToken {
        id
        symbol
        isPut
        strikePrice
      }
      shortOToken {
        id
        symbol
        isPut
        strikePrice
      }
      longAmount
      shortAmount
      collateralAsset {
        id,
        symbol
        decimals
      }
      collateralAmount
    }
  }
  `;
  const endpoint = SubgraphEndpoint[networkId];
  const response = await postQuery(endpoint, query);
  return response.data.vaults;
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