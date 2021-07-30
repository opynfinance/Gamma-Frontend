import BigNumber from 'bignumber.js';

import { ERC20 } from '../../types';

//general descriptions
const underlyingAsset = (underlying: ERC20) => (underlying.symbol === 'WETH' ? 'ETH' : underlying.symbol);

const collateralAsset = (collateral: ERC20) => (collateral.symbol === 'WETH' ? 'ETH' : collateral.symbol);

export const europeanDescription =
  'European: Options are exercised at expiry, and cannot be exercised prior.';

export const autoExerciseDescription =
  'Auto-Exercise: In the money options will be exercised upon expiry (8:00 UTC). You can claim proceeds 2hr 5min after expiry (10:05 UTC).';

export const redeemDescription =
  'This option expired at 8:00 UTC. You will be able to redeem starting 2 hours and 5 minutes after expiry at 10:05 UTC, after the oracle locking and dispute periods.';

//cash settlement descriptions
export const generalCashSettleDescription =
  'These are cash settled options that will pay out in the collateral asset of the options series (eg. USDC for puts and underlying for calls). Cash settled means that as an option buyer you will receive the difference between the price of the underlying asset and the strike price if it is in the money at expiry.';

export const longCallCashSettleDescription = (underlying: ERC20) =>
  `Cash Settled: Withdraw the difference between the price of ${underlyingAsset(
    underlying,
  )} at expiry and the strike price, settled in ${underlyingAsset(underlying)}.`;

export const longPutCashSettleDescription = (underlying: ERC20) =>
  `Cash Settled: Withdraw the difference between the price of ${underlyingAsset(
    underlying,
  )} at expiry and the strike price, settled in USDC.`;

export const shortCashSettleDescription = (collateral: ERC20, underlying: ERC20) =>
  `Cash Settled: Withdraw full collateral if out of the money expiry. Otherwise redeem remaining ${collateralAsset(
    collateral,
  )} collateral based on price of ${underlyingAsset(underlying)} at expiry.`;

//position descriptions
export const buyCallDescription = (underlying: ERC20, strike: BigNumber) =>
  `If ${underlyingAsset(
    underlying,
  )} rises to $${strike.toString()} or above, upon expiry, you receive the difference between $${strike.toString()} and the price of ${underlyingAsset(
    underlying,
  )} at the time of expiry.`;

export const sellCallDescription = (underlying: ERC20, collateral: ERC20, strike: BigNumber) =>
  `You put down ${collateralAsset(
    collateral,
  )} to mint + sell options earning premiums. If ${underlyingAsset(
    underlying,
  )} rises above $${strike.toString()} you pay the option buyer.`;

export const callCreditDescription =
  'Increase capital efficiency for selling a call, by buying a call and using it as collateral.';

export const callDebitDescription = (underlying: ERC20) =>
  `Reduce the cost of buying a call option, by selling a call option on ${underlyingAsset(underlying)}.`;

export const buyPutDescription = (underlying: ERC20, strike: BigNumber) =>
  `If ${underlyingAsset(
    underlying,
  )} hits $${strike.toString()} or below, upon expiry, you can withdraw the difference between $${strike.toString()} and the price of ${underlyingAsset(
    underlying,
  )} at the time of expiry.`;

export const sellPutDescription = (underlying: ERC20, collateral: ERC20, strike: BigNumber) =>
  `You put down ${collateralAsset(
    collateral,
  )} to mint + sell options earning premiums. If ${underlyingAsset(
    underlying,
  )} falls below $${strike.toString()} you pay the option buyer.`;

export const putCreditDescription =
  'Increase capital efficiency for selling a put, by buying a put and using it as collateral.';

export const putDebitDescription = (underlying: ERC20) =>
  `Reduce the cost of buying a put option, by selling a put option on ${underlyingAsset(underlying)}.`;

//buy max loss max gain tooltips
export const buyPutMaxGain = 'Strike price - premium paid';

export const buyCallMaxGain =
  'Infinity if the asset rises to infinity upon expiry; otherwise asset price at expiry - strike price - premium paid';

export const buyMaxLoss = 'Premium paid';

//sell max loss max gain tooltips

export const sellMaxGain = 'Premium received';

export const sellPutMaxLoss =
  'Strike price if the asset goes to 0 upon expiry; otherwise strike price - asset price at expiry';

export const sellCallMaxLoss = (collateral: ERC20) =>
  `The amount of ${collateralAsset(collateral)} put down as collateral`;

//spreads max loss max gain tooltips

export const creditMaxGain = 'Net premium received';

export const putCreditMaxLoss = 'Short strike - long strike + net premium received';

export const putDebitMaxGain = 'Long strike - short strike - net premium paid';

export const debitMaxLoss = 'Net premium paid';

export const callCreditMaxLoss = 'Long strike - short strike + net premium received';

export const callDebitMaxGain = 'Short strike - long strike - net premium paid';
