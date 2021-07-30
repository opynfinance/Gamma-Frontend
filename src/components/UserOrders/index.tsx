import React, { useCallback, useMemo, useReducer } from 'react';
import ReactGA from 'react-ga';

import { OToken, OrderWithMetaData } from '../../types';
import ActionCard from '../ActionCard';
import BidsAndAsks from './BidsAndAsks';
import { useZeroX, useWallet, useToast } from '../../hooks';

type MyOrdersProps = {
  selectedOTokens: OToken[];
};

function selectOrderReducer(
  orders: OrderWithMetaData[],
  action: {
    type: 'Add' | 'Remove' | 'Clear';
    order: OrderWithMetaData;
  },
) {
  switch (action.type) {
    case 'Add': {
      return [...orders, action.order];
    }
    case 'Remove': {
      return orders.filter(o => o.metaData.orderHash !== action.order.metaData.orderHash);
    }
    case 'Clear': {
      return [];
    }
    default: {
      throw new Error('Unkown action type');
    }
  }
}

const MyOrders = ({ selectedOTokens }: MyOrdersProps) => {
  const otoken = useMemo(() => selectedOTokens[0], [selectedOTokens]);

  const [selectedOrders, dispatch] = useReducer(selectOrderReducer, []);

  const toast = useToast();

  const { orderBooks, cancelOrders } = useZeroX();

  const { address: account } = useWallet();

  const { asks, bids } = useMemo(() => {
    const empty = { asks: [], bids: [] };
    if (!otoken) return empty;
    const target = orderBooks.find(book => book.id === otoken.id);
    if (!target) return empty;
    return {
      asks: target.asks.filter(o => o.order.maker === account),
      bids: target.bids.filter(o => o.order.maker === account),
    };
  }, [orderBooks, account, otoken]);

  const isSelected = useCallback(
    (order: OrderWithMetaData) => {
      return selectedOrders.map(o => o.metaData.orderHash).includes(order.metaData.orderHash);
    },
    [selectedOrders],
  );

  const showCard = useMemo(() => selectedOTokens.length === 1, [selectedOTokens]);

  const cancel = useCallback(() => {
    const orders = selectedOrders.map(o => o.order);
    const callback = () => {
      toast.success(`Successfully cancel ${orders.length} orders `);
      dispatch({ type: 'Clear', order: selectedOrders[0] });
      ReactGA.event({
        category: 'Transactions',
        action: 'Success',
        label: 'Limit_CancelOrders',
      });
    };
    cancelOrders(orders, callback);
  }, [selectedOrders, cancelOrders, toast]);

  return showCard ? (
    <ActionCard
      buttonText="Cancel Orders"
      isDisabled={selectedOrders.length === 0}
      noMargin
      title={'My Orders'}
      handleConfirm={cancel}
    >
      <BidsAndAsks isSelected={isSelected} dispatch={dispatch} bids={bids} asks={asks} />
    </ActionCard>
  ) : (
    <></>
  );
};

export default MyOrders;
