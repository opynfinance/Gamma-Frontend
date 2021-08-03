/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Card from '@material-ui/core/Card';
import Hidden from '@material-ui/core/Hidden';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import BackIcon from '@material-ui/icons/KeyboardBackspace';

import { DashedCard } from '../../components/Cards';
import wallet from '../../img/connectWallet.svg';
import { useSeries, useTokenPrice, useWallet } from '../../hooks';
import { CollateralTypesEnum, ERC20, OTokenWithTradeDetail, SeriesTokens } from '../../types';
import SeriesSelector from '../../components/SeriesSelector';
import ExpirySelector from '../../components/ExpirySelector';
import AssetCard from '../../components/AssetCard';
import OptionsChain from '../../components/OptionsChain';
import { handleSelectProps } from '../../components/OptionsChain/OptionCell';
import { OToken } from '../../types';
import { defaultSeries, TradeAction } from '../../utils/constants';
import OrderTicket from '../../components/OrderTicket';
import { PrimaryButton } from '../../components/Buttons';
import { AntTab, AntTabs } from '../../components/AntTab';
import OrderBook from '../../components/Orderbook';
import MobileModal from '../../components/MobileModal';
import orderbookImg from '../../img/orderbook.svg';
import { useQueryParams } from '../../hooks/useQueryParams';
import RightNav from '../../components/Help/RightNav';
import Charts from '../../components/Charts';
import { useMemo } from 'react';

const useStyles = makeStyles(theme =>
  createStyles({
    sideNav: {
      backgroundColor: theme.palette.background.paper,
      width: '13rem',
      position: 'fixed',
      padding: theme.spacing(2),
      boxSizing: 'border-box',
      height: '100%',
    },
    tradeHome: {
      backgroundColor: theme.palette.background.default,
      width: '100%',
      marginLeft: '13rem',
      [theme.breakpoints.down('md')]: {
        marginLeft: 0,
        marginBottom: '5rem',
      },
    },
    optionChain: {
      padding: theme.spacing(1),
    },
    optionsSelector: {
      backgroundColor: theme.palette.background.stone,
      width: '100%',
      padding: theme.spacing(1, 0),
      [theme.breakpoints.down('xs')]: {
        display: 'flex',
        justifyContent: 'space-evenly',
      },
    },
    root: {
      color: theme.palette.text.primary,
    },
    emptyWalletImg: {
      height: '70px',
    },
    emptyWallet: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    connectButton: {
      cursor: 'pointer',
      textDecoration: 'underline',
    },
    orderTicket: {
      zIndex: theme.zIndex.appBar - 1,
      width: '16rem',
      paddingTop: theme.spacing(7),
      overflow: 'auto',
      [theme.breakpoints.down('md')]: {
        width: '15rem',
      },
      [theme.breakpoints.down('sm')]: {
        width: '100%',
        padding: theme.spacing(7),
      },
      [theme.breakpoints.down('xs')]: {
        width: '100%',
        paddingTop: theme.spacing(7),
        padding: theme.spacing(1),
      },
    },
    mobileProceed: {
      position: 'fixed',
      width: '100%',
      padding: theme.spacing(1),
      display: 'flex',
      bottom: 0,
      backgroundColor: theme.palette.background.paper,
      justifyContent: 'space-around',
    },
  }),
);

const useSideNavStyles = makeStyles(theme =>
  createStyles({
    orderBox: {
      marginTop: theme.spacing(2),
    },
  }),
);

type State = {
  selectedOTokens: OTokenWithTradeDetail[];
  firstAction: TradeAction;
  isPut: boolean;
  expiry: number;
};

type Action = {
  type: ActionType;
  payload?: any;
};

const initialState: State = {
  selectedOTokens: [] as OTokenWithTradeDetail[],
  firstAction: TradeAction.BUY,
  isPut: false,
  expiry: 0,
};

enum ActionType {
  setFirstAction,
  setSecondAction,
  selectCell,
  deselectCell,
  deselectAllCells,
}

const computeSelectedState = (state: State, action: Action) => {
  if (state.isPut === action.payload.token.isPut && state.expiry === action.payload.token.expiry) {
    // we want the two strikes in order
    if (
      state.selectedOTokens.length === 1 &&
      action.payload.token.strikePrice.lt(state.selectedOTokens[0].strikePrice)
    ) {
      // if we need to put the option first
      return {
        selectedOTokens: [action.payload.token, ...state.selectedOTokens],
      };
    } else {
      // if we need to put it second
      return {
        selectedOTokens: [...state.selectedOTokens, action.payload.token],
      };
    }
  } else {
    return {
      isPut: action.payload.token.isPut,
      expiry: action.payload.token.expiry,
      selectedOTokens: [action.payload.token],
    };
  }
};

const computeDeselectedState = (state: State, action: Action) => {
  // if there are two selected, keep the other one
  if (state.selectedOTokens.length === 2) {
    if (state.selectedOTokens[0].id === action.payload.token.id)
      // if deselecting the first, keep the second
      return {
        selectedOTokens: [state.selectedOTokens[1]],
      };
    else
      return {
        selectedOTokens: [state.selectedOTokens[0]],
      };
  }
  // otherwise return empty
  else
    return {
      selectedOTokens: [],
    };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.setFirstAction:
      return { ...state, firstAction: action.payload };
    case ActionType.setSecondAction:
      return { ...state, firstAction: action.payload === TradeAction.BUY ? TradeAction.SELL : TradeAction.BUY };
    case ActionType.selectCell:
      // if we are not switching option types
      return { ...state, ...computeSelectedState(state, action) };
    case ActionType.deselectCell:
      return {
        ...state,
        ...computeDeselectedState(state, action),
      };
    case ActionType.deselectAllCells:
      return {
        ...state,
        selectedOTokens: [],
      };
    default:
      throw new Error();
  }
};

export default function Trade({ seriesTokens }: { seriesTokens: SeriesTokens }) {
  const classes = useStyles();
  const { handleSelectWallet, connected, networkId } = useWallet();
  const { series: allSeries } = useSeries();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryParams = useQueryParams();
  const oTokenId = queryParams.get('oTokenId');
  const isSell = queryParams.get('sell');
  const series = queryParams.get('series') || 'WETH';

  const [state, dispatch] = useReducer(reducer, initialState);
  const [selectedSeriesIndex, setSelectedSeriesIndex] = useState<number>(-1);
  const [selectedExpiry, setSelectedExpiry] = useState<number>(0);
  const [underlying, setUnderlying] = useState<ERC20>(defaultSeries.underlying);
  const underlyingPrice = useTokenPrice(allSeries[selectedSeriesIndex]?.underlying.id);
  const [mobileProceed, setMobileProceed] = useState(false);
  const [openOrderBook, setOpenOrderBook] = useState(false);
  const [selectedOToken, setSelectedOToken] = useState<OToken | null | undefined>();

  useEffect(() => {
    dispatch({ type: ActionType.deselectAllCells });
    setMobileProceed(false);
  }, [networkId, selectedExpiry, selectedOToken]);

  useEffect(() => {
    setUnderlying(allSeries[selectedSeriesIndex]?.underlying || defaultSeries.underlying);
    dispatch({ type: ActionType.deselectCell });
    setMobileProceed(false);
  }, [allSeries, selectedSeriesIndex]);

  useEffect(() => {
    if (selectedOToken) {
      dispatch({ type: ActionType.selectCell, payload: { selected: true, token: selectedOToken } });
    }
  }, [selectedOToken]);

  useEffect(() => {
    if (series) {
      const seriesIndex = allSeries.findIndex(
        seriesObj =>
          seriesObj.underlying.symbol.toLowerCase() === series.toLowerCase() &&
          seriesObj.collateralType.type !== CollateralTypesEnum.yvToken,
      );
      if (seriesIndex >= 0) {
        setSelectedSeriesIndex(seriesIndex);
        if (oTokenId && allSeries[seriesIndex].underlying) {
          const oTokens = seriesTokens[allSeries[seriesIndex].underlying.id];
          const token = oTokens?.find(oT => oT.id === oTokenId);
          if (token) {
            setSelectedExpiry(token.expiry);
            setSelectedOToken(token);
            if (isSell) handleActionChange(TradeAction.SELL, 0);
          }
        }
      }
    } else {
      setSelectedSeriesIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oTokenId, allSeries, series, seriesTokens, selectedOToken]);

  const seriesId = useMemo(() => {
    const selectedSeries = allSeries[selectedSeriesIndex];
    if (!selectedSeries) return '';
    return selectedSeries.collateralType.label === ''
      ? underlying.id
      : `${underlying.id}-${selectedSeries.collateralType.label}`;
  }, [selectedSeriesIndex, underlying, allSeries]);

  const isSelected = useCallback(
    (cellToken: OToken, action?: TradeAction) => {
      const index = state.selectedOTokens.findIndex(o => o.id === cellToken.id);
      if (index >= 0 && cellToken.isPut === state.isPut && cellToken.expiry === state.expiry) {
        return !action || (index === 0 ? state.firstAction === action : state.firstAction !== action);
      }
      return false;
    },
    [state.expiry, state.firstAction, state.isPut, state.selectedOTokens],
  );

  const isDisabled = useCallback((cellToken: OToken) => !isSelected(cellToken) && state.selectedOTokens.length === 2, [
    isSelected,
    state.selectedOTokens.length,
  ]);

  const handleActionChange = useCallback((value: TradeAction, index: number) => {
    dispatch({
      type: index === 0 ? ActionType.setFirstAction : ActionType.setSecondAction,
      payload: value,
    });
  }, []);

  const handleSelect = useCallback(
    ({ selected, token, action }: handleSelectProps): void => {
      const index = state.selectedOTokens.findIndex(o => o.id === token.id);
      if (index >= 0 && !selected) {
        handleActionChange(action ? action : TradeAction.BUY, index);
      } else {
        dispatch({
          type: selected ? ActionType.deselectCell : ActionType.selectCell,
          payload: {
            token,
            selected,
          },
        });
        if (action) {
          handleActionChange(action, 0);
        }
      }
    },
    [handleActionChange, state.selectedOTokens],
  );

  return (
    <Box display="flex" className={classes.root}>
      <Hidden mdDown>
        <Box className={classes.sideNav}>
          {!connected ? (
            <DashedCard variant="outlined" className={classes.emptyWallet}>
              <img className={classes.emptyWalletImg} src={wallet} alt="Wallet empty" />
              <Typography variant="caption">
                <Typography onClick={handleSelectWallet} variant="caption" className={classes.connectButton}>
                  Connect your account
                </Typography>{' '}
                to view your crypto assets & positons.
              </Typography>
            </DashedCard>
          ) : (
            <SideNav selectedOTokens={state.selectedOTokens} />
          )}
        </Box>
      </Hidden>
      <Box className={classes.tradeHome}>
        <Box>
          <Box className={classes.optionsSelector}>
            <SeriesSelector
              selectedIndex={selectedSeriesIndex}
              handleSeriesChange={setSelectedSeriesIndex}
              allSeries={allSeries}
            />
            <ExpirySelector
              oTokens={seriesTokens[seriesId] || []}
              handleExpiryChange={expiry => {
                setSelectedExpiry(expiry);
              }}
              selectedExpiry={selectedExpiry}
            />
          </Box>
          <Hidden smDown>
            <Box className={classes.optionChain}>
              <Charts oTokens={state.selectedOTokens} firstAction={state.firstAction} />
            </Box>
          </Hidden>
          <Box className={classes.optionChain}>
            <OptionsChain
              selectedSeriesIndex={selectedSeriesIndex}
              allSeries={allSeries}
              oTokens={seriesTokens[seriesId] || []}
              expiry={selectedExpiry}
              handleSelect={handleSelect}
              isSelected={isSelected}
              isDisabled={isDisabled}
              spotPrice={useTokenPrice(underlying.id)}
              underlyingName={underlying.symbol}
            />
          </Box>
        </Box>

        <Hidden mdUp>
          {state.selectedOTokens.length ? (
            <Box className={classes.mobileProceed}>
              <IconButton onClick={() => setOpenOrderBook(true)}>
                <img src={orderbookImg} alt="orderbook" />
              </IconButton>
              <PrimaryButton onClick={() => setMobileProceed(true)} style={{ width: '60%' }}>
                Proceed
              </PrimaryButton>
            </Box>
          ) : null}
          <MobileModal show={openOrderBook} onBackPress={() => setOpenOrderBook(false)} title="Orderbook">
            <Orders selectedOTokens={state.selectedOTokens} />
          </MobileModal>
        </Hidden>

        {!isMobile || (isMobile && mobileProceed) ? (
          <Drawer variant="persistent" open anchor="right" classes={{ paper: classes.orderTicket }}>
            <Hidden mdUp>
              <Box style={{ display: 'flex' }}>
                <IconButton onClick={() => setMobileProceed(false)}>
                  <BackIcon />
                </IconButton>
              </Box>
            </Hidden>
            {state.selectedOTokens.length > 0 ? (
              <OrderTicket
                underlyingPrice={underlyingPrice}
                underlying={underlying}
                collateral={state.selectedOTokens[0].collateralAsset}
                expiry={selectedExpiry}
                isPut={state.isPut}
                selectedOTokens={state.selectedOTokens}
                firstAction={state.firstAction}
                handleActionChange={handleActionChange}
              />
            ) : (
              <RightNav />
            )}
          </Drawer>
        ) : null}
      </Box>
    </Box>
  );
}

function SideNav({ selectedOTokens }: { selectedOTokens: OToken[] }) {
  return (
    <>
      <AssetCard />
      <Orders selectedOTokens={selectedOTokens} />
    </>
  );
}

function Orders({ selectedOTokens }: { selectedOTokens: OToken[] }) {
  const [tab, setTab] = useState(0);
  const classes = useSideNavStyles();

  const handleTabChange = useCallback((event: React.ChangeEvent<{}>, newValue: any) => {
    setTab(newValue);
  }, []);

  useEffect(() => {
    if (selectedOTokens.length === 1) {
      setTab(0);
    }
  }, [selectedOTokens]);

  return (
    <Box className={classes.orderBox}>
      {selectedOTokens.length > 0 ? (
        <>
          <Hidden smDown>
            <Typography>Orderbook</Typography>
          </Hidden>
          <Card style={{ marginTop: '8px' }}>
            <AntTabs variant="fullWidth" value={tab} onChange={handleTabChange} aria-label="limit-orders">
              {selectedOTokens.map((oToken, index) => (
                <AntTab key={oToken.id} label={oToken.symbol.split('-')[2]} value={index} />
              ))}
            </AntTabs>
            <OrderBook otoken={selectedOTokens[tab]} />
          </Card>
        </>
      ) : null}
    </Box>
  );
}
