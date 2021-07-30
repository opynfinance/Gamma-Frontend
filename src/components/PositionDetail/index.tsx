import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import BackIcon from '@material-ui/icons/KeyboardBackspace';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import LinearProgress from '@material-ui/core/LinearProgress';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import orange from '@material-ui/core/colors/orange';
import { useHistory } from 'react-router';

import RedeemCard from '../RedeemCard';
import SellCard from '../SellCard';
import ClosePositionCard from '../ClosePositionCard';
import RedeemBalanceCard from '../RedeemBalanceCard';
import { TradePosition, defaultERC20, VaultType } from '../../utils/constants';
import { Position, OToken, ERC20, VaultStatus } from '../../types';
import { toDateString } from '../../utils/time';
import { PrimaryButton } from '../Buttons';
import AdjustCollateralCard from '../AdjustCollateralCard';
import useShortPosition, { ShortPositionProps } from '../ShortPositionDetail/useShortPosition';
import ManageoTokensCard from '../ManageoTokensCard';
import { calculateSimpleCollateral, getVaultStatus, toTokenAmount } from '../../utils/calculations';
import useMarginCalculator from '../../hooks/useMarginCalculator';
import SafeIcon from '../../img/vault/icn-vault-safe.svg';
import DangerousIcon from '../../img/vault/icn-vault-dangerous.svg';
import WarningIcon from '../../img/vault/icn-vault-warning.svg';
import LiquidatedIcon from '../../img/vault/icn-vault-liquidated.svg';
import useChainLinkPrice from '../../hooks/useChainLinkPrice';

const useStyles = makeStyles(theme => ({
  positionDetail: {
    padding: theme.spacing(1, 2),
  },
  root: {
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-around',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      display: 'block',
    },
  },
  actionTitle: {
    fontWeight: theme.typography.fontWeightBold,
  },
  actionItem: {
    fontWeight: theme.typography.fontWeightBold,
    marginTop: theme.spacing(2),
  },
  actionTxt: {
    marginTop: theme.spacing(0.5),
  },
  actionBtn: {
    marginTop: theme.spacing(0.5),
    minWidth: '11rem',
    [theme.breakpoints.down('sm')]: {
      minWidth: '8rem',
    },
  },
  actionCard: {
    width: '16rem',
    marginBottom: '5rem',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  drawer: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  vault: {
    width: '30%',
    maxWidth: '25rem',
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

enum PositionActions {
  SELL_OTOKENS = 1,
  BUY_BACK = 2,
  MANAGE_OTOKENS = 3,
  ADJUST_COLLATERAL = 4,
  REDEEM = 5,
  MARKET_LIMIT_SELL = 6,
}

type Action = {
  action: PositionActions;
  title: string;
  label: string;
  subTxt: string;
};

const activeActions = {
  Long: [
    {
      action: PositionActions.SELL_OTOKENS,
      title: 'Sell oTokens',
      label: 'Close Position',
      subTxt: 'Sell oTokens to reduce or close your position',
    },
  ],
  Short: [
    {
      action: PositionActions.BUY_BACK,
      title: 'Buy Back and Redeem oTokens',
      label: 'Close Position',
      subTxt: 'Burn oTokens and redeem collateral to reduce or close your position.',
    },
    {
      action: PositionActions.ADJUST_COLLATERAL,
      title: 'Adjust collateral',
      label: 'Adjust Collateral',
      subTxt: 'Add or remove collateral. This is an advanced action',
    },
    {
      action: PositionActions.MANAGE_OTOKENS,
      title: 'Manage oTokens',
      label: 'Manage oTokens',
      subTxt: 'Issue or burn oTokens. This is an advanced action',
    },
  ],
  Untraded: [
    {
      action: PositionActions.MARKET_LIMIT_SELL,
      title: 'Sell untraded oTokens',
      label: 'Market sell',
      subTxt:
        'oTokens have been minted for this position, but not traded. Select Market Sell or Limit Sell to trade this position.',
    },
    {
      action: PositionActions.BUY_BACK,
      title: 'Burn and Redeem oTokens',
      label: 'Close Position',
      subTxt: 'You can close this position. This action burns your oTokens and redeems your collateral.',
    },
    {
      action: PositionActions.ADJUST_COLLATERAL,
      title: 'Adjust collateral',
      label: 'Adjust Collateral',
      subTxt: 'Add or remove collateral. This is an advanced action',
    },
    {
      action: PositionActions.MANAGE_OTOKENS,
      title: 'Manage oTokens',
      label: 'Manage oTokens',
      subTxt: 'Issue or burn oTokens. This is an advanced action',
    },
  ],
  Spread: [
    {
      action: PositionActions.BUY_BACK,
      title: 'Buy Back and Burn Short oTokens',
      label: 'Buy back + burn',
      subTxt:
        'Buying back your short oTokens and burning them will close the short side of the spread, turning this position into a Long Call Position.',
    },
  ],
};

type PositionDetailProps = {
  position: Position;
  navigateToClosedPositions: () => void;
  deselectPosition: () => void;
  untraded?: boolean;
};

const PositionDetail = ({ position, navigateToClosedPositions, deselectPosition, untraded }: PositionDetailProps) => {
  const classes = useStyles();
  const history = useHistory();

  const [type, setType] = useState('Put');
  const [strikeStr, setStrikeString] = useState('0');
  const [underlying, setUnderlying] = useState(defaultERC20);
  const [expiry, setExpiry] = useState(0);
  const [isWaitingPeriod, setIsWaitingPeriod] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [action, setAction] = useState<PositionActions>();
  const [actionTitle, setActionTitle] = useState('');

  // update type, strikeStr, underlying type and expiry string
  useEffect(() => {
    if (!position) return;
    const long = position.longOToken;
    const short = position.shortOToken;
    switch (position.type) {
      case TradePosition.Long: {
        setStrikeString(long?.strikePrice.toString() as string);
        setUnderlying(long?.underlyingAsset as ERC20);
        setExpiry(long?.expiry as number);
        setType(long?.isPut ? 'Put' : 'Call');
        break;
      }
      case TradePosition.Short: {
        setStrikeString(short?.strikePrice.toString() as string);
        setUnderlying(short?.underlyingAsset as ERC20);
        setExpiry(short?.expiry as number);
        setType(short?.isPut ? 'Put' : 'Call');
        break;
      }
      default: {
        setExpiry(short?.expiry as number);
        setUnderlying(short?.underlyingAsset as ERC20);
        const isDebit = position.type === TradePosition.DEBIT;
        if (position.longOToken?.isPut) {
          setStrikeString(
            isDebit
              ? `${short?.strikePrice.toString()} / ${long?.strikePrice.toString()}`
              : `${long?.strikePrice.toString()} / ${short?.strikePrice.toString()}`,
          );
          setType(position.type === TradePosition.DEBIT ? 'Put Debit Spread' : 'Put Credit Spread');
        } else {
          setStrikeString(
            isDebit
              ? `${long?.strikePrice.toString()} / ${short?.strikePrice.toString()}`
              : `${short?.strikePrice.toString()} / ${long?.strikePrice.toString()}`,
          );
          setType(position.type === TradePosition.DEBIT ? 'Call Debit Spread' : 'Call Credit Spread');
        }
      }
    }
  }, [position]);

  //calculate the settlement window
  useEffect(() => {
    //TODO: Add generalizeable dispute and locking period instead of hardcoding
    const tempInitialDate = new Date(expiry * 1000);
    const tempHours = new Date(tempInitialDate.setHours(tempInitialDate.getHours() + 2));
    const settlement = new Date(tempHours.setMinutes(tempHours.getMinutes() + 5));

    setIsWaitingPeriod(new Date(expiry * 1000).getTime() <= Date.now() && Date.now() <= settlement.getTime());
  }, [expiry]);

  const expired = useMemo(() => (position && position.expiry ? position.expiry < Date.now() / 1000 : true), [position]);

  const oTokenUrl = useMemo(
    () =>
      `/?series=${position.underlying.symbol}&oTokenId=${
        position.longOToken?.id || position.shortOToken?.id
      }&sell=true`,
    [position],
  );

  const title = (
    <>
      <Typography variant="h6" className={classes.positionDetail}>
        {actionTitle}
      </Typography>
      <Typography variant="subtitle1" className={classes.positionDetail}>
        {strikeStr} {underlying.symbol} {type} {toDateString(expiry)}
      </Typography>
    </>
  );

  const handleClosePosition = useCallback(() => {
    navigateToClosedPositions();
    deselectPosition();
  }, [deselectPosition, navigateToClosedPositions]);
  const collateral = useMemo(() => {
    return position.collateral
      ? position.collateral
      : position.shortOToken
      ? position.shortOToken.collateralAsset
      : position.longOToken
      ? position.longOToken.collateralAsset
      : null;
  }, [position]);

  const positionType = useMemo(() => {
    if (position.type === TradePosition.Long || (position.type === TradePosition.Short && !untraded))
      return position.type;
    if (untraded) return 'Untraded';
    return 'Spread';
  }, [position.type, untraded]);

  const setActionType = useCallback((act: Action) => {
    setActionTitle(act.title);
    setAction(act.action);
    setOpenDrawer(true);
  }, []);

  const ActionComponent = useMemo(() => {
    if (action === PositionActions.SELL_OTOKENS) {
      return <SellCard longAmount={position.longAmount} otoken={position.longOToken as OToken} />;
    } else if (action === PositionActions.BUY_BACK) {
      return <ClosePositionCard position={position} />;
    } else if (action === PositionActions.ADJUST_COLLATERAL || action === PositionActions.MANAGE_OTOKENS) {
      return (
        <ShortPosition
          position={position}
          collateral={collateral as ERC20}
          vaultId={position.vaultId}
          otoken={position.shortOToken as OToken}
          shortAmount={position.shortAmount}
          collateralAmount={position.collateralAmount}
          manage={action === PositionActions.MANAGE_OTOKENS}
          vaultType={position.vaultType}
        />
      );
    } else if (action === PositionActions.REDEEM) {
      if (positionType === TradePosition.Long) {
        return (
          <RedeemCard
            longAmount={position.longAmount}
            otoken={position.longOToken as OToken}
            handleClosePosition={handleClosePosition}
            isWaitingPeriod={isWaitingPeriod}
          />
        );
      } else if (positionType === TradePosition.Short) {
        if (collateral === null) return null;
        if (position.vaultType === VaultType.NAKED_MARGIN && position.shortAmount.isZero()) {
          return (
            <ShortPosition
              position={position}
              collateral={collateral as ERC20}
              vaultId={position.vaultId}
              otoken={position.shortOToken as OToken}
              shortAmount={position.shortAmount}
              collateralAmount={position.collateralAmount}
              manage={false}
              vaultType={position.vaultType}
            />
          );
        }
        return (
          <RedeemBalanceCard
            asset={position.underlying}
            vaultId={position.vaultId}
            collateral={collateral as ERC20}
            handleClosePosition={handleClosePosition}
            isWaitingPeriod={isWaitingPeriod}
          />
        );
      } else {
        if (collateral === null) return null;
        return (
          <RedeemBalanceCard
            asset={underlying.symbol}
            vaultId={position.vaultId}
            collateral={collateral}
            handleClosePosition={handleClosePosition}
            isWaitingPeriod={isWaitingPeriod}
          />
        );
      }
    }
    return null;
  }, [action, collateral, handleClosePosition, isWaitingPeriod, position, positionType, underlying.symbol]);

  const actionArray = useMemo(() => {
    if (positionType === TradePosition.Short && position.liquidationStarted && position.shortAmount.isZero()) {
      const _newArray = [...activeActions[positionType]];
      _newArray.shift();
      return _newArray;
    }
    return activeActions[positionType];
  }, [position.liquidationStarted, position.shortAmount, positionType]);

  return (
    <Box className={classes.root}>
      {positionType === TradePosition.Long || TradePosition.Short ? (
        <Box className={classes.vault}>
          <Typography variant="body1" className={classes.actionTitle}>
            Vault
          </Typography>
          <VaultCard position={position} positionType={positionType} />
        </Box>
      ) : null}
      <Box className={classes.vault}>
        <Typography variant="body1" className={classes.actionTitle}>
          Actions
        </Typography>
        {expired ? (
          <Box>
            <Typography variant="body2" className={classes.actionItem}>
              Redeem
            </Typography>
            <Typography variant="caption" className={classes.actionTxt} component="div">
              You can redeem here. This action burns your oTokens and redeems your collateral. This action needs to be
              taken in order to redeem payout.
            </Typography>
            <PrimaryButton
              className={classes.actionBtn}
              onClick={() => setActionType({ action: PositionActions.REDEEM, title: 'Redeem', subTxt: '', label: '' })}
            >
              Redeem Payout
            </PrimaryButton>
          </Box>
        ) : (
          <>
            {actionArray.map((action: Action) => {
              return (
                <Box key={action.action}>
                  <Typography variant="body2" className={classes.actionItem}>
                    {action.title}
                  </Typography>
                  <Typography variant="caption" className={classes.actionTxt} component="div">
                    {action.subTxt}
                  </Typography>
                  {action.action === PositionActions.MARKET_LIMIT_SELL ? (
                    <Box style={{ display: 'flex' }}>
                      <PrimaryButton className={classes.actionBtn} onClick={() => history.push(oTokenUrl)}>
                        Market Sell
                      </PrimaryButton>
                      <PrimaryButton
                        className={classes.actionBtn}
                        style={{ marginLeft: '16px' }}
                        onClick={() => history.push(`${oTokenUrl}&limit=true`)}
                      >
                        Limit Sell
                      </PrimaryButton>
                    </Box>
                  ) : (
                    <PrimaryButton className={classes.actionBtn} onClick={() => setActionType(action)}>
                      {action.label}
                    </PrimaryButton>
                  )}
                </Box>
              );
            })}
          </>
        )}
      </Box>
      <Drawer open={openDrawer} onClose={() => setOpenDrawer(false)} anchor="right" classes={{ paper: classes.drawer }}>
        <Box className={classes.actionCard}>
          <Hidden mdUp>
            <Box style={{ display: 'flex' }}>
              <IconButton onClick={() => setOpenDrawer(false)}>
                <BackIcon />
              </IconButton>
            </Box>
          </Hidden>
          {title}
          {ActionComponent}
        </Box>
      </Drawer>
    </Box>
  );
};

const useVaultStyles = makeStyles(theme => ({
  vaultCollat: {
    fontSize: '1.4rem',
  },
  vaultCard: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      backgroundColor: theme.palette.background.default,
    },
  },
  progressBar: {
    marginTop: theme.spacing(1),
  },
  barDanger: {
    borderRadius: 5,
    backgroundColor: theme.palette.error.main,
  },
  barSafe: {
    borderRadius: 5,
    backgroundColor: theme.palette.success.main,
  },
  barWarning: {
    borderRadius: 5,
    backgroundColor: orange[500],
  },
  barRoot: {
    height: 10,
    borderRadius: 5,
  },
  colorPrimary: {
    backgroundColor: theme.palette.grey[theme.palette.type === 'light' ? 200 : 700],
  },
  priceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
    alignItems: 'center',
  },
  priceItemText: {
    display: 'flex',
    alignItems: 'center',
  },
  inputInfo: {
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(0.5),
    cursor: 'pointer',
    fontSize: '1rem',
  },
}));

export const VaultCard: React.FC<{ position: Position; positionType: TradePosition | 'Untraded' | 'Spread' }> = ({
  position,
  positionType,
}) => {
  const classes = useVaultStyles();
  const underlyingSpotPrice = useChainLinkPrice(position.underlying.id);

  const [spotPercent, setSpotPercent] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(new BigNumber(0));

  const { getSpotPercent, spotShock, getLiquidationPrice, maxPrice } = useMarginCalculator({
    underlying: position.underlying.id,
    strikeAsset: position.shortOToken?.strikeAsset.id || '',
    collateral: position.collateral?.id || '',
    shortAmount: position.shortAmount,
    strikePrice: position.shortOToken?.strikePrice || new BigNumber(0),
    underlyingPrice: underlyingSpotPrice,
    shortExpiryTimestamp: position.shortOToken?.expiry || 0,
    collateralDecimals: position.collateral?.decimals || 0,
    isPut: position.isPut.valueOf(),
  });

  const neededCollateral = useMemo(
    () =>
      position.shortOToken ? calculateSimpleCollateral(position.shortOToken, position.shortAmount) : new BigNumber(0),
    [position.shortAmount, position.shortOToken],
  );

  const collatPercent = useMemo(() => {
    return position.collateralAmount.div(neededCollateral).multipliedBy(100).toNumber();
  }, [neededCollateral, position.collateralAmount]);

  const vaultStatus = useMemo(() => {
    if (collatPercent === 100) return VaultStatus.SAFE;
    return getVaultStatus(position.isPut.valueOf(), spotPercent);
  }, [collatPercent, position.isPut, spotPercent]);

  const barClass = useMemo(() => {
    return vaultStatus === VaultStatus.SAFE
      ? classes.barSafe
      : vaultStatus === VaultStatus.WARNING
      ? classes.barWarning
      : classes.barDanger;
  }, [vaultStatus, classes.barSafe, classes.barWarning, classes.barDanger]);

  const vaultImg = useMemo(() => {
    if (position.liquidationStarted) return LiquidatedIcon;
    return vaultStatus === VaultStatus.SAFE
      ? SafeIcon
      : vaultStatus === VaultStatus.WARNING
      ? WarningIcon
      : DangerousIcon;
  }, [position.liquidationStarted, vaultStatus]);

  useEffect(() => {
    if (position.shortOToken && position.collateral && !spotShock.isZero()) {
      setLiquidationPrice(getLiquidationPrice(collatPercent).integerValue(BigNumber.ROUND_CEIL));
      setSpotPercent(getSpotPercent(collatPercent));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.id, spotShock.toNumber(), maxPrice.toNumber()]);

  return (
    <Paper className={classes.vaultCard} elevation={0}>
      {positionType === TradePosition.Long || position.vaultType !== VaultType.NAKED_MARGIN ? (
        positionType === TradePosition.Long ? (
          <Typography>No Vault for this position</Typography>
        ) : (
          <Typography>Fully collateralized vault</Typography>
        )
      ) : (
        <div>
          <Box className={classes.priceItem}>
            <Typography className={classes.vaultCollat}>
              {toTokenAmount(position.collateralAmount, position.collateral?.decimals || 0).toNumber()}
              <Typography variant="caption" style={{ marginLeft: '4px' }}>
                {position.collateral?.symbol}
              </Typography>
            </Typography>
            <img src={vaultImg} alt="vault icon" />
          </Box>
          {position.liquidationStarted && position.shortAmount.isZero() ? (
            <>
              <Box className={classes.priceItem}>
                {position.shortAmount.isZero() ? (
                  <Typography variant="body2">Vault liquidated</Typography>
                ) : (
                  <Typography variant="body2">Vault partially liquidated</Typography>
                )}
              </Box>
            </>
          ) : (
            <>
              {position.liquidationStarted ? <Typography variant="body2">Vault partially liquidated</Typography> : null}
              <LinearProgress
                className={classes.progressBar}
                classes={{ bar: barClass, root: classes.barRoot, colorPrimary: classes.colorPrimary }}
                value={spotPercent ? collatPercent : 0}
                variant="determinate"
              />
              <Box className={classes.priceItem}>
                <Typography variant="body2">Collateral Ratio</Typography>
                <Typography variant="body2">{collatPercent.toFixed(1)}%</Typography>
              </Box>
              <Box className={classes.priceItem}>
                <div className={classes.priceItemText}>
                  <Typography variant="body2">Liquidation price</Typography>
                  <Tooltip title="Underlying price at which vault will be liquidated">
                    <InfoIcon className={classes.inputInfo} fontSize="small" />
                  </Tooltip>
                </div>
                <Typography variant="body2">${liquidationPrice.toString()}</Typography>
              </Box>
              <Box className={classes.priceItem}>
                <div className={classes.priceItemText}>
                  <Typography variant="body2">Spot change</Typography>
                  <Tooltip title="Asset price change at which vault will be liquidated">
                    <InfoIcon className={classes.inputInfo} fontSize="small" />
                  </Tooltip>
                </div>
                <Typography variant="body2">{spotPercent}%</Typography>
              </Box>
            </>
          )}
        </div>
      )}
    </Paper>
  );
};

const ShortPosition: React.FC<ShortPositionProps & { manage: boolean }> = props => {
  const shortPosition = useShortPosition(props);

  if (props.manage) {
    return <ManageoTokensCard {...shortPosition} />;
  }
  return <AdjustCollateralCard {...shortPosition} />;
};

export default PositionDetail;
