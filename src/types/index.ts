import BigNumber from 'bignumber.js';

import { TradePosition, ActionType } from '../utils/constants';

export * from './0x';

export type ERC20 = {
  id: string;
  symbol: string;
  decimals: number;
  name?: string;
};

export enum CollateralTypesEnum {
  Normal, // collateral is underlying for calls, strike asset for puts
  cToken, // use cToken as collateral
  yvToken,
}

export type CollateralType = {
  name: string;
  label: string;
  type: CollateralTypesEnum;
  collateralTokens: string[]; // array of symbols that will be categorized as this type if it's used as collateral
};

export type Series = {
  underlying: ERC20;
  strike: ERC20;
  label: string;
  collateralType: CollateralType;
};

export type OToken = ERC20 & {
  underlyingAsset: ERC20;
  strikeAsset: ERC20;
  collateralAsset: ERC20;
  strikePrice: BigNumber;
  expiry: number;
  isPut: boolean;
  isPermit: boolean; 
  implementation: string; 
};

export type SeriesTokens = {
  [key: string]: OToken[];
} 

export type OTokenBalance = {
  token: OToken;
  balance: BigNumber;
};

export type Greeks = {
  rho: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
};

export type OTokenWithTradeDetail = OToken & {
  iv: number;
  bidSize: BigNumber;
  askSize: BigNumber;
  breakeven: BigNumber;
  price: BigNumber;
  priceString: string;
  greeks: Greeks;
  askPrice: BigNumber,
  bidPrice: BigNumber,
};

export type Position = {
  id?: string;
  vaultType?: number;
  type: TradePosition;
  vaultId: number; // if it's a position in the vault, this is the vault id (starts from 1)
  isPut: Boolean;
  underlying: ERC20;
  expiry: number;

  longOToken: OToken | null;
  shortOToken: OToken | null;
  collateral: ERC20 | null;
  longAmount: BigNumber;
  shortAmount: BigNumber;
  collateralAmount: BigNumber;
  firstMintTimestamp?: number;
  liquidationStarted?: boolean;
};

export type ActivePositionWithPNL = Position & {
  initialPremium: BigNumber;
  currentPremium: BigNumber;
  profit: BigNumber;
  vaultStatus?: VaultStatus,
  spotPercent?: number 
};

export type ClosedPosition = Position & {
  initialPremium: BigNumber;
  closedPremium: BigNumber;
  profit: BigNumber;
  // if it's a position that settle at expiry, will have the following 2 fields
  payoutAsset: ERC20 | null;
  payoutAmount: BigNumber;
};

export type ExpiredPosition = ActivePositionWithPNL & {
  expiryPrice: BigNumber;
  isPriceReported: boolean;
  isPriceFinalized: boolean;
};

export type ActionArg = {
  actionType: ActionType;
  owner: string;
  secondAddress: string;
  asset: string;
  vaultId: string;
  amount: string;
  index: string;
  data: string;
};

export type Signature = {
  r: string, 
  v: number, 
  s: string, 
}

export enum VaultStatus {
  SAFE,
  WARNING,
  DANGER,
  PARTIALLY_LIQUIDATED,
  LIQUIDATED,
}

// Theme extensions

declare module "@material-ui/core/styles/createPalette" {
  interface TypeBackground {
    stone: string,
    lightStone: string,
    tooltip: string,
  }
}

declare global {
  interface Window { $crisp: any; }
}