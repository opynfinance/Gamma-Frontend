import BigNumber from 'bignumber.js';

import { ActionArg } from '../../types';
import { ActionType, SupportedNetworks } from '../../utils/constants';
import { PERMIT_CALLEE, ZERO_ADDR } from '../../utils/constants/addresses';

type BasicArgs = {
  account: string;
  vaultId: number;
};

type OpenArgs = BasicArgs & {
  data?: string;
};

type PermitArgs = Args & {
  networkId: SupportedNetworks;
  data: string;
};

type Args = {
  account: string;
  vaultId: number;
  asset: string;
  amount: BigNumber;
};

type DepositArgs = Args & { from?: string };
type WithdrawArgs = Args & { to?: string };
type SettleVaultArgs = BasicArgs & { to?: string };

type RedeemArgs = {
  receiver: string;
  otoken: string;
  amount: BigNumber;
};

export type permitProps = {
  networkId: SupportedNetworks;
  dataPayment?: any; //for USDC for payment token if add 0xCallee
  dataShort?: any; //for if add 0xCallee to approve oToken to sell 
  dataLong?: any; //oToken collateral for spreads
  dataCollateral?: any; //USDC for sell and spreads 
};

export type burnAndWithdrawCollateralProps = {
  account: string;
  vaultId: number;
  shortAsset: string;
  burnAmount: BigNumber;
  collateralAsset: string;
  collateralAmount: BigNumber;
  longAsset: string;
  longAmount: BigNumber;
};

export type depositAndMintProps = {
  account: string;
  depositor: string;
  vaultId: number;
  oToken: string;
  mintAmount: BigNumber;
  collateralAsset: string;
  depositAmount: BigNumber;
};

export type permitDepositAndMintProps = depositAndMintProps & permitProps;

const argCreators = {
  openVault: ({ account, vaultId, data }: OpenArgs): ActionArg => {
      return {
      actionType: ActionType.OpenVault,
      owner: account,
      secondAddress: account,
      asset: ZERO_ADDR,
      vaultId: String(vaultId),
      amount: '0',
      index: '0',
      data: data || ZERO_ADDR,
    }
  },
  depositCollateral: ({ account, vaultId, asset, amount, from }: DepositArgs) => ({
    actionType: ActionType.DepositCollateral,
    owner: account,
    secondAddress: from ?? account,
    asset: asset,
    vaultId: String(vaultId),
    amount: amount.toString(),
    index: '0',
    data: ZERO_ADDR,
  }),
  withdrawCollateral: ({ account, vaultId, asset, amount, to }: WithdrawArgs) => ({
    actionType: ActionType.WithdrawCollateral,
    owner: account,
    secondAddress: to ?? account,
    asset: asset,
    vaultId: String(vaultId),
    amount: amount.toString(),
    index: '0',
    data: ZERO_ADDR,
  }),
  mintShortOption: ({ account, vaultId, asset, amount }: Args): ActionArg => ({
    actionType: ActionType.MintShortOption,
    owner: account,
    secondAddress: account,
    asset,
    vaultId: String(vaultId),
    amount: amount.toString(),
    index: '0',
    data: ZERO_ADDR,
  }),
  burnShortOption: ({ account, vaultId, asset, amount }: Args): ActionArg => ({
    actionType: ActionType.BurnShortOption,
    owner: account,
    secondAddress: account,
    asset,
    vaultId: String(vaultId),
    amount: amount.toString(),
    index: '0',
    data: ZERO_ADDR,
  }),
  depositLongOption: ({ account, from, vaultId, asset, amount }: DepositArgs): ActionArg => ({
    actionType: ActionType.DepositLongOption,
    owner: account,
    secondAddress: from ?? account,
    asset,
    vaultId: String(vaultId),
    amount: amount.toString(),
    index: '0',
    data: ZERO_ADDR,
  }),
  withdrawLongOption: ({ account, to, vaultId, asset, amount }: WithdrawArgs): ActionArg => ({
    actionType: ActionType.WithdrawLongOption,
    owner: account,
    secondAddress: to ?? account,
    asset,
    vaultId: String(vaultId),
    amount: amount.toString(),
    index: '0',
    data: ZERO_ADDR,
  }),
  permit: ({ account, data, vaultId, asset, amount, networkId }: PermitArgs): ActionArg => ({
    actionType: ActionType.Call,
    owner: account,
    secondAddress: PERMIT_CALLEE[networkId],
    asset: ZERO_ADDR,
    vaultId: String(vaultId),
    amount: '0',
    index: '0',
    data: data,
  }),
  settleVault: ({ account, to, vaultId }: SettleVaultArgs): ActionArg => ({
    actionType: ActionType.SettleVault,
    owner: account,
    secondAddress: to ?? account,
    asset: ZERO_ADDR,
    vaultId: String(vaultId),
    amount: '0',
    index: '0',
    data: ZERO_ADDR,
  }),
  redeem: ({ receiver, otoken, amount }: RedeemArgs): ActionArg => ({
    actionType: ActionType.Redeem,
    owner: ZERO_ADDR,
    // receiver
    secondAddress: receiver,
    // otoken
    asset: otoken,
    vaultId: '0',
    amount: amount.toString(),
    index: '0',
    data: ZERO_ADDR,
  }),
};

const depositCollateral = (props: DepositArgs): ActionArg[] => [argCreators.depositCollateral(props)];
const withdrawCollateral = (props: WithdrawArgs): ActionArg[] => [argCreators.withdrawCollateral(props)];
const openVault = (props: OpenArgs): ActionArg[] => [argCreators.openVault(props)];
const burnTokens = (props: Args): ActionArg[] => [argCreators.burnShortOption(props)];
const issueTokens = (props: Args): ActionArg[] => [argCreators.mintShortOption(props)];
const settleVault = (props: SettleVaultArgs): ActionArg[] => [argCreators.settleVault(props)];
const redeemTokens = (props: RedeemArgs): ActionArg[] => [argCreators.redeem(props)];
const permit = (props: PermitArgs): ActionArg[] => [argCreators.permit(props)];

const burnAndWithdrawCollateral = ({
  account,
  vaultId,
  shortAsset,
  burnAmount,
  collateralAsset,
  collateralAmount,
  longAmount,
  longAsset,
}: burnAndWithdrawCollateralProps): ActionArg[] => {
  const args = [argCreators.burnShortOption({ account, vaultId, asset: shortAsset, amount: burnAmount })];
  if (!collateralAmount.isZero())
    args.push(
      argCreators.withdrawCollateral({
        account,
        vaultId,
        asset: collateralAsset,
        amount: collateralAmount,
      }),
    );
  if (!longAmount.isZero())
    args.push(
      argCreators.withdrawLongOption({
        account,
        vaultId,
        asset: longAsset,
        amount: longAmount,
      }),
    );
  return args;
};
const depositAndMint = ({
  account,
  vaultId,
  oToken,
  mintAmount,
  collateralAsset,
  depositAmount,
  depositor,
}: depositAndMintProps): ActionArg[] => [
  argCreators.mintShortOption({ account, vaultId, asset: oToken, amount: mintAmount }),
  argCreators.depositCollateral({ from: depositor, account, vaultId, asset: collateralAsset, amount: depositAmount }),
];

const permitDepositAndMint = ({
  account,
  vaultId,
  oToken,
  mintAmount,
  collateralAsset,
  depositAmount,
  depositor,
  dataCollateral,
  networkId,
}: permitDepositAndMintProps): ActionArg[] => [
  argCreators.permit({ account, data: dataCollateral, vaultId, asset: ZERO_ADDR, amount: new BigNumber(0), networkId }),
  argCreators.mintShortOption({ account, vaultId, asset: oToken, amount: mintAmount }),
  argCreators.depositCollateral({ from: depositor, account, vaultId, asset: collateralAsset, amount: depositAmount }),
];

export type createSpreadProps = {
  account: string;
  vaultId: number;
  shortOToken: string;
  shortAmount: BigNumber;
  longOToken: string;
  longAmount: BigNumber;
  collateralAsset: string;
  collateralAmount: BigNumber;
  depositor: string;
};

export type permitAndCreateSpreadProps = createSpreadProps & permitProps;

const createSpread = ({
  account,
  vaultId,
  shortOToken,
  shortAmount,
  collateralAsset,
  collateralAmount,
  longOToken,
  longAmount,
  depositor,
}: createSpreadProps): ActionArg[] => {
  const args = [];
  if (collateralAmount.gt(0)) {
    args.push(
      argCreators.depositCollateral({
        account,
        vaultId,
        asset: collateralAsset,
        amount: collateralAmount,
        from: depositor,
      }),
    );
  }
  args.push(
    argCreators.depositLongOption({
      account,
      vaultId,
      asset: longOToken,
      amount: longAmount,
    }),
  );
  args.push(
    argCreators.mintShortOption({
      account,
      vaultId,
      asset: shortOToken,
      amount: shortAmount,
    }),
  );
  return args;
};

const permitAndCreateSpread = ({
  account,
  vaultId,
  shortOToken,
  shortAmount,
  collateralAsset,
  collateralAmount,
  longOToken,
  longAmount,
  depositor,
  networkId,
  dataPayment,
  dataShort,
  dataLong,
  dataCollateral,
}: permitAndCreateSpreadProps): ActionArg[] => {
  const args = [];
  if (dataPayment && dataPayment !== '') {
    args.push(
      argCreators.permit({
        account,
        data: dataPayment,
        vaultId,
        asset: ZERO_ADDR,
        amount: new BigNumber(0),
        networkId,
      }),
    );
  }
  if (dataShort && dataShort !== '') {
    args.push(
      argCreators.permit({
        account,
        data: dataShort,
        vaultId,
        asset: ZERO_ADDR,
        amount: new BigNumber(0),
        networkId,
      }),
    );
  }
  if (dataLong && dataLong !== '') {
    args.push(
      argCreators.permit({
        account,
        data: dataLong,
        vaultId,
        asset: ZERO_ADDR,
        amount: new BigNumber(0),
        networkId,
      }),
    );
  }
  if (dataCollateral && dataCollateral !== '') {
    args.push(
      argCreators.permit({
        account,
        data: dataCollateral,
        vaultId,
        asset: ZERO_ADDR,
        amount: new BigNumber(0),
        networkId,
      }),
    );
  }
  if (collateralAmount.gt(0)) {
    args.push(
      argCreators.depositCollateral({
        account,
        vaultId,
        asset: collateralAsset,
        amount: collateralAmount,
        from: depositor,
      }),
    );
  }
  args.push(
    argCreators.depositLongOption({
      account,
      vaultId,
      asset: longOToken,
      amount: longAmount,
    }),
  );
  args.push(
    argCreators.mintShortOption({
      account,
      vaultId,
      asset: shortOToken,
      amount: shortAmount,
    }),
  );
  return args;
};

export {
  depositCollateral,
  withdrawCollateral,
  openVault,
  permit,
  burnAndWithdrawCollateral,
  depositAndMint,
  burnTokens,
  issueTokens,
  // depositAndMintFromOperator,

  createSpread,
  redeemTokens,
  settleVault,
  permitDepositAndMint,
  permitAndCreateSpread,
};

