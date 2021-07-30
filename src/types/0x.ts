import BigNumber from 'bignumber.js';

export type OrderWithMetaData = {
  order: SignedOrder;
  metaData: {
    orderHash: string;
    remainingFillableTakerAmount: string;
    state: string;
  };
};

type Signature = {
  r: string;
  s: string;
  v: number;
  signatureType: number;
};

export type SignedOrder = UnsignedOrder & {
  signature: Signature;
};

export type SignedRFQOrder = UnsignedRFQOrder & {
  signature: Signature;
};

export type UnsignedOrder = {
  makerToken: string;
  takerToken: string;
  makerAmount: string;
  takerAmount: string;
  maker: string;
  taker: string;
  pool: string;
  expiry: string;
  salt: string;
  chainId: number;
  verifyingContract: string;
  takerTokenFeeAmount: string;
  sender: string;
  feeRecipient: string;
};

export type UnsignedRFQOrder = {
  maker: string;
  taker: string;
  makerToken: string;
  takerToken: string;
  makerAmount: string;
  takerAmount: string;
  txOrigin: string;
  pool: string;
  expiry: number;
  salt: string;
  chainId: number; // Ethereum Chain Id where the transaction is submitted.
  verifyingContract: string; // Address of the contract where the transaction should be sent
};

export type OTokenOrderBook = {
  id: string;
  asks: OrderWithMetaData[];
  bids: OrderWithMetaData[];
};

export type OTokenOrderBookWithDetail = OTokenOrderBook & {
  bestAskPrice: BigNumber;
  bestBidPrice: BigNumber;
  totalBidAmt: BigNumber;
  totalAskAmt: BigNumber;
};
