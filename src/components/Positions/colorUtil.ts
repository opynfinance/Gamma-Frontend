export function parseReturnColor(totalReturn: string): any {
  if (totalReturn.includes('-')) {
    return 'error';
  } else {
    return 'secondary';
  }
}
