import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BigNumber } from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Box from '@material-ui/core/Box';
import Popover from '@material-ui/core/Popover';
import SettingsIcon from '@material-ui/icons/Settings';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ReactGA from 'react-ga';

import BuyCheckout from '../BuyCheckout';
import CreateSpread from '../CreateSpread';
import SellCheckoutCallee from '../SellCheckoutCallee';
import CreateSpreadCallee from '../CreateSpreadCallee';
import OptionBlock from './OptionBlock';
import PositionSizeInput from './PositionSizeInput';
import PriceInput from './PriceInput';
import DeadlineInput from './DeadlineInput';
import ConfirmCard from '../ConfirmCard';
import { TradeAction, Errors } from '../../utils/constants';
import { OToken, ERC20 } from '../../types';
import { AntTabs, AntTab } from '../AntTab';
import { CreateMode } from '../../utils/constants';
import { Divider } from '../../components/ActionCard';
import { useTokenBalance, useError, useWallet, useOTokenBalances } from '../../hooks';
import { USDC_ADDRESS } from '../../utils/constants/addresses';
import { useQueryParams } from '../../hooks/useQueryParams';
import SellCheckout from '../SellCheckout';

type MainProps = {
  collateral: ERC20;
  underlying: ERC20;
  expiry: any;
  handleNext: any;
  firstAction: TradeAction;
  handleActionChange: any;
  handleInputChange: any;
  input: BigNumber;
  setInput: any;
  selectedOTokens: OToken[];
  step: Number;
  isPut: boolean;
  underlyingPrice: BigNumber;
  title: string;
};

const useStyles = makeStyles(theme => ({
  body: {
    maxWidth: 275,
    marginTop: 12,
    marginLeft: 10,
    color: '#828282',
    fontSize: 14,
  },
  card: {
    padding: theme.spacing(1),
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  checkoutCard: {
    marginTop: theme.spacing(1),
    marginBottom: '4rem',
  },
  title: {
    fontWeight: 600,
    paddingBottom: 4,
  },
  settingsButton: {
    padding: 0,
    backgroundColor: 'transparent',
    transition: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  popoverBox: {
    width: '15rem',
    padding: theme.spacing(1),
  },
}));

const Main = ({
  collateral,
  underlying,
  expiry,
  selectedOTokens,
  isPut,
  firstAction,
  handleActionChange,
  handleInputChange,
  setInput,
  input,
  underlyingPrice,
  title,
}: MainProps) => {
  const classes = useStyles();

  const { address: account, networkId, walletType } = useWallet();
  const collateralBalance = useTokenBalance(collateral.id, account, 20);
  const underlyingBalance = useTokenBalance(underlying.id, account, 20);
  const queryParams = useQueryParams();

  const [mode, setMode] = useState<CreateMode>(queryParams.get('limit') ? CreateMode.Limit : CreateMode.Market);
  const [isApprove, setIsApprove] = useState(walletType === 'hardware' ? true : false);

  const handleTabChange = useCallback((event: React.ChangeEvent<{}>, newValue: CreateMode) => {
    setMode(newValue);
    ReactGA.event({
      category: 'Trade',
      action: `selectedTab${newValue === 1 ? 'Limit' : 'Market'}`,
    });
  }, []);

  // set price for limit order
  const [price, setPrice] = useState<BigNumber>(new BigNumber(0));

  // deadline in second for limit order
  const [deadline, setDeadline] = useState<number>(300);

  const handlePriceChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (value >= 0) setPrice(new BigNumber(value));
  }, []);

  const USDCBalance = useTokenBalance(USDC_ADDRESS[networkId], account, 20);

  const { isError, errorType, errorName, errorDescription, setErrorType } = useError(collateral.symbol);

  useEffect(() => {
    if (selectedOTokens.length === 0) {
      setErrorType(Errors.NO_ERROR);
    }
  }, [selectedOTokens, setErrorType]);

  const { address } = useWallet();
  const { balances } = useOTokenBalances(address);

  // for confirm card
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [finalTxHash, setFinalTxHash] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');

  const otokenBalances = useMemo(() => {
    return selectedOTokens.map(otoken => {
      const balanceObj = balances.find(balanceObj => balanceObj.token.id === otoken.id);
      if (!balanceObj) return new BigNumber(0);
      return balanceObj.balance;
    });
  }, [selectedOTokens, balances]);

  return (
    <>
      {isConfirmed ? (
        <ConfirmCard
          handleNext={() => {
            setIsConfirmed(false);
          }}
          description={confirmDescription}
          txHash={finalTxHash}
        />
      ) : (
        <>
          <Card className={classes.card}>
            <Box className={classes.cardHeader}>
              <Typography variant="subtitle2" className={classes.title}>
                {title}
              </Typography>
              {selectedOTokens.length === 1 && firstAction === TradeAction.SELL ? (
                <ApproveSettings isApprove={isApprove} setIsApprove={setIsApprove} />
              ) : null}
            </Box>
            {selectedOTokens.map((option: OToken, i) => (
              <Box key={option.id}>
                <OptionBlock
                  key={option.id}
                  strikePrice={option.strikePrice}
                  action={i === 0 ? firstAction : firstAction === TradeAction.BUY ? TradeAction.SELL : TradeAction.BUY}
                  handleActionChange={handleActionChange}
                  index={i}
                  expiry={expiry}
                  isPut={isPut}
                  showSpread={selectedOTokens.length === 1 && input.isZero()}
                />
                {selectedOTokens.length > 1 && i === 0 ? <Divider /> : null}
              </Box>
            ))}
          </Card>
          <Card className={classes.checkoutCard}>
            {selectedOTokens.length === 1 && (
              <AntTabs variant="fullWidth" value={mode} onChange={handleTabChange} aria-label="market-or-limit">
                <AntTab label="Market" />
                <AntTab label="Limit" />
              </AntTabs>
            )}
            {/* Only show selectino when it's a buy or sell */}
            <Box className={classes.card}>
              <PositionSizeInput
                disabled={selectedOTokens.length === 0}
                firstAction={firstAction}
                isError={isError || errorType === Errors.LARGE_MARKET_IMPACT}
                errorName={errorName}
                errorDescription={errorDescription}
                input={input}
                handleInputChange={handleInputChange}
              />
              {mode === CreateMode.Limit && <PriceInput input={price} handleInputChange={handlePriceChange} />}
              {mode === CreateMode.Limit && <DeadlineInput deadline={deadline} setDeadline={setDeadline} />}

              {selectedOTokens.length === 0 ? (
                <Typography className={classes.body}> Please select an option to proceed</Typography>
              ) : selectedOTokens.length === 2 ? (
                selectedOTokens[0].isPermit && selectedOTokens[1].isPermit ? (
                  <CreateSpreadCallee
                    underlyingPrice={underlyingPrice}
                    collateral={collateral}
                    collateralBalance={collateralBalance}
                    setError={setErrorType}
                    isError={isError}
                    firstAction={firstAction}
                    otokens={selectedOTokens}
                    otokenBalances={otokenBalances}
                    USDCBalance={USDCBalance}
                    underlyingBalance={underlyingBalance}
                    input={input}
                    setInput={setInput}
                    setIsConfirmed={setIsConfirmed}
                    setTxHash={setFinalTxHash}
                    setConfirmDescription={setConfirmDescription}
                  />
                ) : (
                  <CreateSpread
                    underlyingPrice={underlyingPrice}
                    collateral={collateral}
                    collateralBalance={collateralBalance}
                    setError={setErrorType}
                    isError={isError}
                    firstAction={firstAction}
                    otokens={selectedOTokens}
                    otokenBalances={otokenBalances}
                    USDCBalance={USDCBalance}
                    underlyingBalance={underlyingBalance}
                    input={input}
                    setInput={setInput}
                    setIsConfirmed={setIsConfirmed}
                    setTxHash={setFinalTxHash}
                    setConfirmDescription={setConfirmDescription}
                  />
                )
              ) : firstAction === TradeAction.BUY ? (
                <BuyCheckout
                  underlyingPrice={underlyingPrice}
                  mode={mode}
                  setError={setErrorType}
                  isError={isError}
                  otoken={selectedOTokens[0]}
                  // setInput={setInput}
                  input={input}
                  otokenBalance={otokenBalances[0]}
                  USDCBalance={USDCBalance}
                  underlyingBalance={underlyingBalance}
                  // for confirm card
                  setIsConfirmed={setIsConfirmed}
                  setTxHash={setFinalTxHash}
                  setConfirmDescription={setConfirmDescription}
                  // for limit order
                  price={price}
                  deadline={deadline}
                />
              ) : isApprove ? (
                <SellCheckout
                  underlyingPrice={underlyingPrice}
                  mode={mode}
                  collateralBalance={collateralBalance}
                  collateral={collateral}
                  input={input}
                  setInput={setInput}
                  otokenBalance={otokenBalances[0]}
                  usdcBalance={USDCBalance}
                  underlyingBalance={underlyingBalance}
                  otoken={selectedOTokens[0]}
                  setError={setErrorType}
                  isError={isError}
                  errorType={errorType}
                  // for confirm card
                  setIsConfirmed={setIsConfirmed}
                  setTxHash={setFinalTxHash}
                  setConfirmDescription={setConfirmDescription}
                  // for limit order
                  price={price}
                  deadline={deadline}
                />
              ) : (
                <SellCheckoutCallee
                  underlyingPrice={underlyingPrice}
                  mode={mode}
                  collateralBalance={collateralBalance}
                  collateral={collateral}
                  input={input}
                  setInput={setInput}
                  otokenBalance={otokenBalances[0]}
                  usdcBalance={USDCBalance}
                  underlyingBalance={underlyingBalance}
                  otoken={selectedOTokens[0]}
                  setError={setErrorType}
                  isError={isError}
                  errorType={errorType}
                  // for confirm card
                  setIsConfirmed={setIsConfirmed}
                  setTxHash={setFinalTxHash}
                  setConfirmDescription={setConfirmDescription}
                  // for limit order
                  price={price}
                  deadline={deadline}
                />
              )}
            </Box>
          </Card>
        </>
      )}
    </>
  );
};

type ApproveSettingsProps = {
  isApprove: boolean;
  setIsApprove: (val: boolean) => void;
};

const ApproveSettings: React.FC<ApproveSettingsProps> = ({ isApprove, setIsApprove }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<(EventTarget & HTMLButtonElement) | null>();

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton className={classes.settingsButton} onClick={evt => setAnchorEl(evt.currentTarget)}>
        <SettingsIcon fontSize="small" />
      </IconButton>
      <Popover id="approve-popover" anchorEl={anchorEl} onClose={handleClose} open={Boolean(anchorEl)}>
        <Box className={classes.popoverBox}>
          <Typography variant="caption">
            You can choose to send approve transaction instead of permit signatures, if you have a wallet that doesn't
            support signatures
          </Typography>
          <ToggleButtonGroup
            style={{ marginTop: '8px' }}
            exclusive
            value={isApprove}
            onChange={(_, value) => setIsApprove(value)}
          >
            <ToggleButton size="small" value={false}>
              Permit
            </ToggleButton>
            <ToggleButton size="small" value={true}>
              Approve
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Popover>
    </>
  );
};

export default Main;
