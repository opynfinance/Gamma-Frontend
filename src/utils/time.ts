export function toUTCDateString(expiry: number): string {
  const expiryDate = new Date(expiry * 1000);
  return expiryDate.toUTCString().split(' ').slice(0, 4).join(' ');
}

export function toDateString(expiry: number): string {
  const expiryDate = new Date(expiry * 1000);
  return expiryDate.getMonth() + 1 + '/' + expiryDate.getDate();
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
