import { OToken, Series, CollateralTypesEnum } from '../types';
import { TradePosition } from './constants';

export function oTokenIsSeries(oToken: OToken, series: Series): boolean {
  if (!series) return true;
  if (oToken.strikeAsset.id !== series.strike.id || oToken.underlyingAsset.id !== series.underlying.id) return false;

  if (series.collateralType.type === CollateralTypesEnum.Normal) {
    if (oToken.isPut) return oToken.collateralAsset.id === series.strike.id;
    else return oToken.collateralAsset.id === series.underlying.id;
  } else {
    return series.collateralType.collateralTokens.includes(oToken.collateralAsset.symbol);
  }
}

export function oTokenIsExpiry(oToken: OToken, expiry: number): boolean {
  return oToken.expiry === expiry;
}

export function vaultToPositionType(long: OToken | null, short: OToken | null) {
  let positionType = TradePosition.Long;
  if (long && short) {
    // puts: if short strike > long strike, then it's a credit spread
    // calls: if short strike < long strike, then it's a credit spread
    if (
      (short.isPut && short.strikePrice.gt(long.strikePrice)) ||
      (!short.isPut && short.strikePrice.lt(long.strikePrice))
    ) {
      positionType = TradePosition.CREDIT;
    } else {
      positionType = TradePosition.DEBIT;
    }
  } else if (short) {
    positionType = TradePosition.Short;
  }
  return positionType;
}
