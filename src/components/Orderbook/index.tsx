import React, { useMemo } from 'react';

import { OToken } from '../../types';
import { useZeroX } from '../../hooks';
import Orders from './Ordertable';

type MyOrdersProps = {
  otoken: OToken;
};

const OrderBook = ({ otoken }: MyOrdersProps) => {
  const { orderBooks } = useZeroX();

  const { asks, bids } = useMemo(() => {
    const empty = { asks: [], bids: [] };
    if (!otoken) return empty;
    const target = orderBooks.find(book => book.id === otoken.id);
    if (!target) return empty;
    return {
      asks: target.asks,
      bids: target.bids,
    };
  }, [orderBooks, otoken]);

  return <Orders asks={asks} bids={bids} />;
};

export default OrderBook;
