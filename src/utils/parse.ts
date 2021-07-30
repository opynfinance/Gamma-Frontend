import BigNumber from 'bignumber.js';

function getMonth(month: string): string {
  if (month === 'January' || month === 'Jan') {
    return '1';
  } else if (month === 'February' || month === 'Feb') {
    return '2';
  } else if (month === 'March' || month === 'Mar') {
    return '3';
  } else if (month === 'April' || month === 'Apr') {
    return '4';
  } else if (month === 'May') {
    return '5';
  } else if (month === 'June' || month === 'Jun') {
    return '6';
  } else if (month === 'July' || month === 'Jul') {
    return '7';
  } else if (month === 'August' || month === 'Aug') {
    return '8';
  } else if (month === 'September' || month === 'Sept') {
    return '9';
  } else if (month === 'October' || month === 'Oct') {
    return '10';
  } else if (month === 'November' || month === 'Nov') {
    return '11';
  } else if (month === 'December' || month === 'Dec') {
    return '12';
  } else {
    return ' ';
  }
}

export function parseDate(expiry: any): any {
  var split = expiry.split(' ', 2);
  var month = getMonth(split[0]);
  var day = ' ';
  var res = ' ';
  if (split[1]) {
    day = split[1];
    res = month + '/' + day;
  }
  return res;
}

export function parseType(type: any): any {
  if (type.includes('Credit') && type.includes('Put')) {
    return 'Put Credit Spread';
  } else if (type.includes('Credit') && type.includes('Call')) {
    return 'Put Credit Spread';
  } else if (type.includes('Debit') && type.includes('Put')) {
    return 'Put Debit Spread';
  } else if (type.includes('Debit') && type.includes('Call')) {
    return 'Call Debit Spread';
  } else if (type.includes('Call')) {
    return 'Call';
  } else {
    return 'Put';
  }
}

export function parsePosition(type: any): any {
  if (type.includes('Long')) {
    return 'Long';
  } else {
    return 'Short';
  }
}

export function getLegs(spread: any): any {
  var split = spread.split(' ', 4);
  return split;
}

export function getCollateralAsset(type: any, underlying: any): any {
  if (type.includes('Call')) {
    return underlying;
  } else {
    return 'USDC';
  }
}

export function parseUnderlying(series: any): any {
  var split = series.split(' ', 3);
  return split[0];
}

export function parseCollateral(series: any): any {
  var split = series.split(' ', 3);
  return split[2];
}

export function parseNumber(num: any): any {
  if (num) {
    return num;
  } else {
    return 0;
  }
}

export const parseBigNumber = (bigNumber: BigNumber, inputDecimals: number = 0, outputDecimals = 4) => {
  const number = bigNumber.div(10 ** inputDecimals);
  if (number.abs().lt(10 ** -3) && !number.isZero()) return number.toExponential(4);
  if (number.abs().gt(10 ** 8)) return number.toExponential(6);
  return number.toFixed(outputDecimals);
};

export const parseTxErrorMessage = (error: any) => {
  return error.message && error.message.length < 100
    ? error.message
    : error.error
    ? error.error.message
      ? error.error.message
      : error.error.toString()
    : error.toString();
};

export const parseTxErrorType = (error: any) => {
  const userErrors = [
    'User Denied Transaction Signature',
    'Wallet Not Connect',
    'Failed to Sign With Ledger Device',
    'Request Declined by User',
    'Underlying Network Changed'
  ]

  if ( userErrors.some(err => error.message.toLowerCase().includes(err.toLowerCase())) ) {
    return 'userError'
  } else {
    return 'error'
  }
};
