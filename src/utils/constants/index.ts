import { CollateralType, CollateralTypesEnum, ERC20, Series } from '../../types';

export const OTOKEN_DECIMALS = 8;
export const USDC_DECIMALS = 6;

export * from './links';
export * from './enums';
export * from './addresses';

export const knownCollateralTypes: CollateralType[] = [
  {
    name: 'normal',
    label: '',
    type: CollateralTypesEnum.Normal,
    collateralTokens: [],
  },
  {
    name: 'compound',
    label: '(cToken Collateral)',
    type: CollateralTypesEnum.cToken,
    collateralTokens: ['cUSDC', 'cETH'],
  },
  {
    name: 'yearn',
    label: 'yv',
    type: CollateralTypesEnum.yvToken,
    collateralTokens: ['yvUSDC'],
  },
];

export const defaultSeries: Series = {
  underlying: {
    id: '',
    symbol: 'WETH',
    decimals: 18,
  },
  strike: {
    id: '',
    symbol: 'USDC',
    decimals: 6,
  },
  collateralType: knownCollateralTypes[0],
  label: 'WETH / USDC',
};

export const defaultERC20: ERC20 = {
  id: '',
  symbol: 'WETH',
  decimals: 18,
};

export const MAX_UINT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

export const PROTOCOL_FEE_PER_GWEI = 0.00000;

// estimated gast amount to fill an order: 70000 protocol fee + 150000 tx fee
export const ESTIMATE_FILL_COST_PER_GWEI = 0.00022;

export const DEFAULT_ZEROX_GAS_LIMIT = 250000;
