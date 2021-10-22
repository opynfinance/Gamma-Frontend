export enum Errors {
  NO_ERROR,
  INSUFFICIENT_BALANCE = 'insufficient balance',
  INSUFFICIENT_USDC_BALANCE = 'insufficient usdc balance',
  INSUFFICIENT_LIQUIDITY = 'insufficient liquidity',
  SLIPPAGE_TOO_HIGH = 'slippage',
  GREATER_THAN_MAX = 'greater than max',
  INSUFFICIENT_ETH_GAS_BALANCE = 'insufficient eth balance for gas',
  LARGE_MARKET_IMPACT = 'large market impact',
  FEE_HIGHER_THAN_PREMIUM = '0x Fee higher than premium',
  DEADLINE_PAST_EXPIRY = 'deadline past expiry',
  SMALL_COLLATERAL = 'Collateral amount is small',
  MAX_CAP_REACHED = 'Max cap reached',
  SIZE_TOO_SMALL = 'minimum size for a limit order is 1 oToken',
  GAS_LIMIT_ESTIMATE_FAILED = '0x transaction estimated to fail. Please try again later'
}

export enum CreateMode {
  Market,
  Limit,
}

export enum ExpiryUnit {
  Second,
  Minute,
  Hour,
  Day,
}

export enum TradeAction {
  SELL = 'Sell',
  BUY = 'Buy',
}

export enum TradePosition {
  Long = 'Long',
  Short = 'Short',
  CREDIT = 'Credit Spread',
  DEBIT = 'Debit Spread',
}

export enum ActionType {
  OpenVault,
  MintShortOption,
  BurnShortOption,
  DepositLongOption,
  WithdrawLongOption,
  DepositCollateral,
  WithdrawCollateral,
  SettleVault,
  Redeem,
  Call,
  InvalidAction,
}

export enum OrderType {
  NOT_OTOKEN,
  BID,
  ASK,
}

export enum SupportedNetworks {
  MAINNET = 1,
  KOVAN = 42,
  ROPSTEN = 3, 
}

export enum PositionTab {
  ACTIVE,
  EXPIRED,
  CLOSED,
}

export enum VaultType {
  FULLY_COLLATERALIZED,
  NAKED_MARGIN,
}