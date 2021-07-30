import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import { loader } from 'graphql.macro';
import { useQuery } from '@apollo/client';

import { Position } from '../types';
import { SupportedNetworks, TradePosition } from '../utils/constants';
import * as subgraphUtil from '../utils/subgraph';
import { useWallet, useController } from '../hooks';
import { vaultToPositionType } from '../utils/oToken';

const accountPositionsQuery = loader('../queries/accountPositions.graphql');

const getPositionsFromData = (data: any, networkId: SupportedNetworks): Position[] | undefined => {
  if (data === undefined || data.account == null) return;

  const accountData: subgraphUtil.SubgraphAccountBalancesAndVaults = data.account;
  const liquidations: Array<subgraphUtil.LiquidationType> = data.liquidations;

  const liquidationMap = liquidations.reduce((acc: any, liquidation) => {
    acc[liquidation.vault.vaultId] = true;
    return acc;
  }, {});

  // convert balances into long positions
  const positions: Position[] = [];

  for (const balanceEntry of accountData.balances) {
    const token = subgraphUtil.toInternalOToken(balanceEntry.token, networkId);
    if (balanceEntry.balance === '0') continue;
    const position: Position = {
      vaultId: 0, // otokens are not in a vault.
      type: TradePosition.Long,
      longOToken: token,
      longAmount: new BigNumber(balanceEntry.balance),
      shortOToken: null,
      collateral: null,
      shortAmount: new BigNumber(0),
      collateralAmount: new BigNumber(0),
      expiry: token.expiry,
      isPut: token.isPut,
      underlying: token.underlyingAsset,
      firstMintTimestamp: 0,
    };
    positions.push(position);
  }

  // deal with vaults
  for (let idx = 0; idx < accountData.vaults.length; idx++) {
    const vault = accountData.vaults[idx];
    const vaultId = Number(vault.vaultId);
    const vaultType = Number(vault.type);
    // if vault contains only collateral, doesn't count as position.
    if (!vault.shortOToken && !vault.longOToken) continue;

    const short = vault.shortOToken ? subgraphUtil.toInternalOToken(vault.shortOToken, networkId) : null;
    const long = vault.longOToken ? subgraphUtil.toInternalOToken(vault.longOToken, networkId) : null;
    const collateral = vault.collateralAsset;

    const shortAmount = vault.shortAmount ? new BigNumber(vault.shortAmount) : new BigNumber(0);
    const longAmount = vault.longAmount ? new BigNumber(vault.longAmount) : new BigNumber(0);
    const collateralAmount = vault.collateralAmount ? new BigNumber(vault.collateralAmount) : new BigNumber(0);

    const positionType = vaultToPositionType(long, short);

    // token is used for basic property like expiry and isPut
    const token = subgraphUtil.toInternalOToken(
      vault.shortOToken ? vault.shortOToken : (vault.longOToken as subgraphUtil.SubgraphOToken), networkId
    );

    positions.push({
      vaultId,
      type: positionType,
      longOToken: long,
      shortOToken: short,
      collateral,
      shortAmount,
      longAmount,
      collateralAmount,
      expiry: token.expiry,
      isPut: token.isPut,
      underlying: token.underlyingAsset,
      firstMintTimestamp: Number(vault.firstMintTimestamp),
      vaultType,
      liquidationStarted: !!liquidationMap[vaultId],
    });
  }
  return positions;
};

export function usePositions(account: string): { positions: Position[]; refetch: Function } {
  const [positions, setPositions] = useState<Position[]>([]);
  const controller = useController();

  const { lastConfirmedTransaction, networkId } = useWallet();
  const { data, startPolling, stopPolling, refetch } = useQuery(accountPositionsQuery, {
    variables: { account },
  });

  // const [waiting, setWaiting] = useState<boolean>(false);
  const [lastHandledTransaction, setLastHandledTransaction] = useState<number>(0);
  // set series array.
  useEffect(() => {
    const positions = getPositionsFromData(data, networkId);
    setPositions(positions ? positions : []);
    stopPolling();

    return undefined;
  }, [data, stopPolling, networkId]);

  useEffect(() => {
    if (lastHandledTransaction < lastConfirmedTransaction) {
      setLastHandledTransaction(lastConfirmedTransaction);
      startPolling(500);
    }

    return undefined;
  }, [account, controller, lastConfirmedTransaction, lastHandledTransaction, startPolling]);

  return { positions, refetch };
}