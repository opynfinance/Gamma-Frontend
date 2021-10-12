import { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import * as actions from './actions';
import { usePositions, useWallet, useController, usePayableProxy, useAddresses, useGasPrice } from '../../hooks';
import { ActionArg, Position } from '../../types';
import { SupportedNetworks, VaultType } from '../../utils/constants';

type vaultActionProps = {
  vaultId: number;
  asset: string;
  amount: BigNumber;
  depositor?: string;
};

type settleVaultProps = {
  vaultId: number;
  collateralAsset: string;
};

type depositCollateralProps = {
  vaultId: number;
  asset: string;
  amount: BigNumber;
  depositor?: string;
};

type createSpreadProps = {
  vaultId: number;
  collateralAsset: string;
  collateralAmount: BigNumber;
  longOToken: string;
  longAmount: BigNumber;
  shortOToken: string;
  shortAmount: BigNumber;
  depositor: string;
};

type burnAndWithdrawCollateralProps = {
  vaultId: number;

  shortAsset: string;
  burnAmount: BigNumber;
  collateralAsset: string;
  collateralAmount: BigNumber;
  longAsset: string;
  longAmount: BigNumber;
};

export type permitProps = {
  networkId: SupportedNetworks;
  dataPayment?: any; //for USDC for payment token if add 0xCallee
  dataShort?: any; //for if add 0xCallee to approve oToken to sell
  dataLong?: any; //oToken collateral for spreads
  dataCollateral?: any; //USDC for sell and spreads
};

type depositAndMintProps = {
  vaultId: number;
  collateralAsset: string;
  mintAmount: BigNumber;
  depositAmount: BigNumber;
  oToken: string;
  depositor: string;
};

type permitDepositAndMintProps = depositAndMintProps & permitProps;

type permitAndCreateSpreadProps = createSpreadProps & permitProps;

type redeemTokensProps = {
  amount: BigNumber;
  otoken: string;
  collateralAsset: string;
};

/**
 * Find the vaultId for the operation
 * @param shortOToken the shortOtoken you want to mint
 * @param longOToken the longOtoken you want to put
 */
const getVaultIdAndOpenArg = async ({
  positions,
  controller,
  account,
  shortOToken,
  longOToken,
  collateral,
  isPartial,
}: {
  positions: Position[];
  controller: ethers.Contract;
  account: string;
  shortOToken: string | null;
  longOToken: string | null;
  collateral: string | null;
  isPartial?: boolean;
}): Promise<{ vaultId: number; openArgs: ActionArg[] | null }> => {
  const target = positions
    .filter(p => p.vaultId !== 0)
    .find(p => {
      const shortValid = p.shortOToken === null || shortOToken === null || p.shortOToken.id === shortOToken;
      const longValid = p.longOToken === null || longOToken === null || p.longOToken.id === longOToken;
      const collateralValid = p.collateral === null || collateral === null || p.collateral.id === collateral;
      const vaultTypeMatched = isPartial
        ? p.vaultType === VaultType.NAKED_MARGIN
        : p.vaultType === VaultType.FULLY_COLLATERALIZED;
      return shortValid && longValid && collateralValid && vaultTypeMatched;
    });

  const encodedData = ethers.utils.defaultAbiCoder.encode(['uint256'], ['1']);

  if (!target) {
    const vaultId = 1 + (await controller.getAccountVaultCounter(account)).toNumber();
    return {
      vaultId,
      openArgs: actions.openVault({
        account,
        vaultId,
        data: isPartial ? encodedData : undefined,
      }),
    };
  } else {
    return {
      vaultId: target.vaultId,
      openArgs: null,
    };
  }
};

type Action<Props> = ((props: Props, callback?: any, onError?: any) => void | Promise<string>) | null;
export type ActionsState = {
  depositAndMint: Action<depositAndMintProps>;
  createSpread: Action<createSpreadProps>;
  burnAndWithdrawCollateral: Action<burnAndWithdrawCollateralProps>;
  depositCollateral: Action<depositCollateralProps>;
  withdrawCollateral: Action<vaultActionProps>;
  burnTokens: Action<vaultActionProps>;
  issueTokens: Action<vaultActionProps>;
  redeemTokens: Action<redeemTokensProps>;
  settleVault: Action<settleVaultProps>;
  permitDepositAndMint: Action<permitDepositAndMintProps>;
  permitAndCreateSpread: Action<permitAndCreateSpreadProps>;
};

const useControllerActions = () => {
  const wallet = useWallet();
  if (wallet === undefined) throw new Error('useControllerActions must be used within a ContractProvider');

  const controllerState = useController();
  if (controllerState === undefined) throw new Error('useControllerActions must be used within a ControllerProvider');

  const { address: account } = wallet;
  const { positions } = usePositions(account);
  const { fast: gasPrice } = useGasPrice(5);
  const { controller, handleOperate, handlePayableOperate } = controllerState;
  const { isProxyOperator } = usePayableProxy();
  const { weth: wethAddress, payableProxy: payableProxyAddress } = useAddresses();

  const handleOperateWeth = useCallback(
    ({ args, callback, onError, value }) => {
      if (!isProxyOperator) return onError(new Error('PayableProxy is not added as an operator for this account.'));
      if (!handlePayableOperate) return onError(new Error('handlePayableOperate is null.'));
      return handlePayableOperate({
        args,
        callback,
        onError,
        value,
        sendEthTo: account,
        gasPrice,
      });
    },
    [account, handlePayableOperate, isProxyOperator, gasPrice],
  );

  const controllerActions = useMemo(() => {
    if (!(account && handleOperate && handlePayableOperate && controller))
      return {
        depositAndMint: null,
        createSpread: null,
        burnAndWithdrawCollateral: null,
        depositCollateral: null,
        withdrawCollateral: null,
        burnTokens: null,
        issueTokens: null,
        redeemTokens: null,
        settleVault: null,
        permitDepositAndMint: null,
        permitAndCreateSpread: null,
      };
    return {
      depositAndMint: async (props: depositAndMintProps, callback?: any, onError?: any, isPartial?: boolean) => {
        const { vaultId, openArgs } = await getVaultIdAndOpenArg({
          positions,
          controller,
          account,
          shortOToken: props.oToken,
          longOToken: null,
          collateral: props.collateralAsset,
          isPartial,
        });
        const depositAndMintArgs = actions.depositAndMint({ ...props, account, vaultId });
        const args = openArgs ? [...openArgs, ...depositAndMintArgs] : depositAndMintArgs;
        if (props.depositor === account) {
          return handleOperate({ args, callback, onError, gasPrice });
        } else {
          const value = props.depositAmount.toString();
          return handlePayableOperate({ args, value, sendEthTo: account, callback, onError, gasPrice });
        }
      },
      permitDepositAndMint: async (
        props: permitDepositAndMintProps,
        callback?: any,
        onError?: any,
        isPartial?: boolean,
      ) => {
        const { vaultId, openArgs } = await getVaultIdAndOpenArg({
          positions,
          controller,
          account,
          shortOToken: props.oToken,
          longOToken: null,
          collateral: props.collateralAsset,
          isPartial,
        });
        const permitDepositAndMintArgs = actions.permitDepositAndMint({ ...props, account, vaultId });
        const args = openArgs ? [...openArgs, ...permitDepositAndMintArgs] : permitDepositAndMintArgs;
        if (props.depositor === account) {
          return handleOperate({ args, callback, onError, gasPrice });
        } else {
          const value = props.depositAmount.toString();
          return handlePayableOperate({ args, value, sendEthTo: account, callback, gasPrice });
        }
      },
      permitAndCreateSpread: async (props: permitAndCreateSpreadProps, callback?: any, onError?: any) => {
        const { vaultId, openArgs } = await getVaultIdAndOpenArg({
          positions,
          controller,
          account,
          shortOToken: props.shortOToken,
          longOToken: props.longOToken,
          collateral: props.collateralAsset,
        });
        const permitAndCreateSpreadArgs = actions.permitAndCreateSpread({ ...props, account, vaultId });
        const args = openArgs ? [...openArgs, ...permitAndCreateSpreadArgs] : permitAndCreateSpreadArgs;
        if (account === props.depositor) {
          return handleOperate({ args, callback, onError, gasPrice });
        } else {
          const value = props.collateralAmount.toString();
          return handlePayableOperate({ args, callback, value, sendEthTo: account, gasPrice });
        }
      },
      createSpread: async (props: createSpreadProps, callback?: any, onError?: any) => {
        const { vaultId, openArgs } = await getVaultIdAndOpenArg({
          positions,
          controller,
          account,
          shortOToken: props.shortOToken,
          longOToken: props.longOToken,
          collateral: props.collateralAsset,
        });
        const createSpreadArgs = actions.createSpread({ ...props, account, vaultId });
        const args = openArgs ? [...openArgs, ...createSpreadArgs] : createSpreadArgs;
        if (account === props.depositor) {
          return handleOperate({ args, callback, onError, gasPrice });
        } else {
          const value = props.collateralAmount.toString();
          return handlePayableOperate({ args, callback, value, sendEthTo: account, gasPrice });
        }
      },
      // burn short, withdraw collateral + long
      burnAndWithdrawCollateral: async (props: burnAndWithdrawCollateralProps, callback?: any, onError?: any) => {
        const args = actions.burnAndWithdrawCollateral({ ...props, account });
        return handleOperate({ args, callback, onError, gasPrice });
      },
      depositCollateral: async (props: depositCollateralProps, callback?: any, onError?: any) => {
        if (props.asset !== wethAddress) {
          const args = actions.depositCollateral({ ...props, account });
          return handleOperate({ args, callback, onError, gasPrice });
        }

        const args = actions.depositCollateral({ ...props, from: payableProxyAddress, account });
        return handleOperateWeth({
          args,
          callback,
          onError,
          value: props.amount.toString(),
          gasPrice,
        });
      },
      withdrawCollateral: async (props: vaultActionProps, callback?: any, onError?: any) => {
        if (props.asset !== wethAddress) {
          const args = actions.withdrawCollateral({ ...props, account });
          return handleOperate({ args, callback, onError, gasPrice });
        }

        const args = actions.withdrawCollateral({ ...props, to: payableProxyAddress, account });
        return handleOperateWeth({
          args,
          callback,
          onError,
          value: 0,
          gasPrice,
        });
      },
      burnTokens: async (props: vaultActionProps, callback?: any, onError?: any) => {
        const args = actions.burnTokens({ ...props, account });
        return handleOperate({ args, callback, onError, gasPrice });
      },
      issueTokens: async (props: vaultActionProps, callback?: any, onError?: any) => {
        const args = actions.issueTokens({ ...props, account });
        return handleOperate({ args, callback, onError, gasPrice });
      },
      settleVault: async (props: settleVaultProps, callback?: any, onError?: any) => {
        const args = actions.settleVault({ ...props, account });
        return handleOperate({ args, callback, onError, gasPrice });
      },
      redeemTokens: async (props: redeemTokensProps, callback?: any, onError?: any) => {
        const args = actions.redeemTokens({ ...props, receiver: account });
        return handleOperate({ args, callback, onError, gasPrice });
      },
    };
  }, [
    account,
    handleOperate,
    handlePayableOperate,
    controller,
    positions,
    wethAddress,
    payableProxyAddress,
    handleOperateWeth,
    gasPrice,
  ]);

  return controllerActions;
};

export default useControllerActions;
