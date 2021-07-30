/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import { yellow } from '@material-ui/core/colors';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import OpenIcon from '@material-ui/icons/OpenInNewOutlined';
import Slider from '../CustomSlider';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Tooltip from '@material-ui/core/Tooltip';

import { ERC20, OToken, VaultStatus } from '../../types';
import useMarginCalculator from '../../hooks/useMarginCalculator';
import { getVaultStatus, toTokenAmount } from '../../utils/calculations';
import { Errors } from '../../utils/constants';
import useChainLinkPrice from '../../hooks/useChainLinkPrice';

const usePartialStyles = makeStyles(theme =>
  createStyles({
    header: {
      marginTop: theme.spacing(2),
      display: 'flex',
      alignItems: 'center',
    },
    headerTxt: {
      fontWeight: theme.typography.fontWeightBold,
    },
    sliderBox: {
      display: 'flex',
      justifyContent: 'center',
    },
    danger: {
      color: theme.palette.error.main,
    },
    safe: {
      color: theme.palette.success.main,
    },
    neutral: {
      color: yellow[700],
    },
    collatInput: {
      marginTop: theme.spacing(2),
    },
    inputInfo: {
      color: theme.palette.text.secondary,
      marginLeft: theme.spacing(0.5),
      cursor: 'pointer',
      fontSize: '1rem',
    },
  }),
);

type PartialCollatTypes = {
  partialSelected: (isPartial: boolean) => void;
  setCollatPercent: (percentage: number) => void;
  oToken: OToken;
  collateral: ERC20;
  mintAmount: BigNumber;
  neededCollateral: BigNumber;
  underlyingPrice: BigNumber;
  setError: any;
  hideSwitch?: boolean;
  minimum?: number;
  maximum?: number;
};

const PartialCollat: React.FC<PartialCollatTypes> = ({
  partialSelected,
  setCollatPercent,
  oToken,
  collateral,
  mintAmount,
  underlyingPrice,
  neededCollateral,
  setError,
  hideSwitch,
  minimum,
  maximum,
}) => {
  const [isPartial, setIsPartial] = useState(false);
  const [isPartialEnabled, setIsPartialEnabled] = useState(false);
  const maximumPercent = maximum ? maximum : 100;
  const [collatValue, setCollatValue] = useState(maximumPercent);
  const [collatInput, setCollatInput] = useState(maximumPercent);
  const [spot, setSpot] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);

  const classes = usePartialStyles();

  const chainPrice = useChainLinkPrice(oToken.underlyingAsset.id);

  const {
    marginRequired,
    spotShock,
    dustRequired,
    timesToExpiry,
    maxPrice,
    nakedBalance,
    nakedCap,
  } = useMarginCalculator({
    underlying: oToken.underlyingAsset.id,
    strikeAsset: oToken.strikeAsset.id,
    collateral: collateral.id,
    shortAmount: mintAmount,
    strikePrice: oToken.strikePrice,
    underlyingPrice: chainPrice,
    isPut: oToken.isPut,
    shortExpiryTimestamp: oToken.expiry,
    collateralDecimals: collateral.decimals,
  });

  const solveLiqPriceWithCollat = useCallback(
    (_collatValue: number) => {
      let _liqPrice = new BigNumber(0);
      if (oToken.isPut) {
        _liqPrice = oToken.strikePrice
          .multipliedBy(_collatValue / 100 - 1)
          .dividedBy(spotShock.multipliedBy(maxPrice.minus(1)));
      } else {
        if (_collatValue < 100) {
          _liqPrice = oToken.strikePrice
            .multipliedBy(spotShock)
            .multipliedBy(maxPrice.minus(1))
            .div(_collatValue / 100 - 1);
        }
      }
      const _liquidationPrice = _liqPrice.integerValue(BigNumber.ROUND_CEIL).toNumber();
      if (_liquidationPrice) {
        setLiquidationPrice(_liquidationPrice);
        const _spotPercent = new BigNumber(_liquidationPrice).dividedBy(underlyingPrice).minus(1).multipliedBy(100);
        setSpot(_spotPercent.integerValue(BigNumber.ROUND_CEIL).toNumber());
      } else {
        setLiquidationPrice(Infinity);
        setSpot(Infinity);
      }
    },
    [maxPrice, oToken.isPut, oToken.strikePrice, spotShock, underlyingPrice],
  );

  const solveLiqPriceWithSpot = useCallback(
    (_spot: number) => {
      const _liqPrice = underlyingPrice.multipliedBy(1 + _spot / 100);
      let _collatRatio = 0;
      if (oToken.isPut) {
        _collatRatio =
          maxPrice
            .multipliedBy(BigNumber.min(oToken.strikePrice, spotShock.multipliedBy(_liqPrice)))
            .plus(BigNumber.max(oToken.strikePrice.minus(spotShock.multipliedBy(_liqPrice)), 0))
            .toNumber() / oToken.strikePrice.toNumber();
      } else {
        _collatRatio = maxPrice
          .multipliedBy(BigNumber.min(1, oToken.strikePrice.dividedBy(_liqPrice.dividedBy(spotShock))))
          .plus(BigNumber.max(new BigNumber(1).minus(oToken.strikePrice.dividedBy(_liqPrice.dividedBy(spotShock))), 0))
          .toNumber();
      }
      setLiquidationPrice(_liqPrice.integerValue(BigNumber.ROUND_CEIL).toNumber());
      const _collatPercent = parseFloat((_collatRatio * 100).toFixed(1));
      setCollatValue(_collatPercent);
      setCollatInput(_collatPercent);
    },
    [maxPrice, oToken.isPut, oToken.strikePrice, spotShock, underlyingPrice],
  );

  useEffect(() => {
    if (timesToExpiry.length === 0) return;

    // If biggest timesToExpiry value is greater than oToken's to expiry
    const isEnabled =
      timesToExpiry.length > 0 &&
      new BigNumber(timesToExpiry[timesToExpiry.length - 1].toString()).toNumber() > oToken.expiry - Date.now() / 1000;
    setIsPartialEnabled(isEnabled);
    setIsPartial(isEnabled);
  }, [timesToExpiry.length]);

  const minCollatRatio = useMemo(() => {
    if (minimum) return minimum;
    return marginRequired
      .div(toTokenAmount(neededCollateral, oToken.collateralAsset.decimals))
      .multipliedBy(100)
      .integerValue(BigNumber.ROUND_CEIL)
      .toNumber();
  }, [marginRequired, minimum, neededCollateral, oToken.collateralAsset.decimals]);

  const marks = useMemo(() => {
    if (minCollatRatio > 0 && minCollatRatio !== Infinity) {
      return [
        {
          value: 0,
          label: (
            <Tooltip title="Collateralization ratio">
              <span>0%</span>
            </Tooltip>
          ),
        },
        {
          value: minCollatRatio,
          label: (
            <Tooltip title="Minimum collateralization ratio">
              <span>{minCollatRatio}%</span>
            </Tooltip>
          ),
        },
        { value: 100, label: '100%' },
      ];
    } else {
      return [
        { value: 0, label: '0%' },
        { value: 100, label: '100%' },
      ];
    }
  }, [minCollatRatio]);

  useEffect(() => {
    partialSelected(isPartial);
  }, [isPartial]);

  useEffect(() => {
    setCollatPercent(collatValue);
  }, [collatValue]);

  const sliderClass = useMemo(() => {
    if (collatValue === 100) return classes.safe;
    const health = getVaultStatus(oToken.isPut, spot);
    return health === VaultStatus.SAFE
      ? classes.safe
      : health === VaultStatus.DANGER
      ? classes.danger
      : classes.neutral;
  }, [classes.danger, classes.neutral, classes.safe, oToken.isPut, spot]);

  const changeSlider = useCallback(
    (val: number[]) => {
      let _collatValue = val[1];
      if (val[1] >= maximumPercent) {
        _collatValue = maximumPercent;
        setCollatValue(maximumPercent);
        setCollatInput(maximumPercent);
      } else if (val[1] >= minCollatRatio) {
        _collatValue = val[1];
        setCollatValue(val[1]);
        setCollatInput(val[1]);
      } else {
        _collatValue = minCollatRatio;
        setCollatValue(minCollatRatio);
        setCollatInput(val[1]);
      }
      solveLiqPriceWithCollat(_collatValue);
    },
    [minCollatRatio, solveLiqPriceWithCollat],
  );

  const updateSpot = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const _spot = parseInt(evt.target.value);
      if (_spot < -100) {
        setSpot(-100);
        return;
      }
      if (isNaN(_spot)) {
        oToken.isPut ? setSpot(-0) : setSpot(0);
      } else {
        setSpot(_spot);
        solveLiqPriceWithSpot(_spot);
      }
    },
    [oToken.isPut, solveLiqPriceWithSpot],
  );

  useEffect(() => {
    if (
      dustRequired.gt(toTokenAmount(neededCollateral, oToken.collateralAsset.decimals).multipliedBy(collatValue / 100))
    ) {
      setError(Errors.SMALL_COLLATERAL);
    } else if (
      nakedCap.minus(nakedBalance).isLessThan(toTokenAmount(neededCollateral, oToken.collateralAsset.decimals))
    ) {
      setError(Errors.MAX_CAP_REACHED);
    } else {
      setError(Errors.NO_ERROR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collatValue, dustRequired.toNumber(), neededCollateral.toNumber(), nakedBalance.toNumber(), nakedCap.toNumber()]);

  const ThumbComponent = React.memo((props: any) => {
    if (props['data-index'] === 0) {
      props.style.backgroundColor = 'grey';
      props.style.height = 10;
      props.style.marginTop = '-2px';

      return (
        <Tooltip title="Minimum collateralization ratio">
          <span {...props}></span>
        </Tooltip>
      );
    }

    return <span {...props}></span>;
  });

  if (!isPartialEnabled) return null;

  return (
    <Box>
      {!hideSwitch ? (
        <Box className={classes.header}>
          <Typography variant="body2" className={classes.headerTxt}>
            Partial collateralization
          </Typography>
          <Tooltip title="Learn how to use partial collateralization">
            <a href="https://www.youtube.com/watch?v=4Rvy-XOcg3Y" target="_blank" rel="noopener noreferrer">
              <OpenIcon className={classes.inputInfo} fontSize="small" />
            </a>
          </Tooltip>
          <Switch
            checked={isPartial}
            size="small"
            onChange={(_, checked) => setIsPartial(checked)}
            color="primary"
            name="Partial collateralization"
            inputProps={{ 'aria-label': 'Partial collateralization checkbox' }}
          />
        </Box>
      ) : null}
      {isPartial ? (
        <>
          <Box className={classes.sliderBox}>
            <Slider
              value={[minCollatRatio, collatValue]}
              ThumbComponent={ThumbComponent}
              onChange={(_, val) => changeSlider(val as number[])}
              step={0.1}
              style={{ width: '90%' }}
              classes={{ thumb: sliderClass, track: sliderClass }}
              marks={marks}
            />
          </Box>
          <TextField
            type="number"
            size="small"
            value={collatInput}
            variant="outlined"
            label="Collateralization Ratio"
            className={classes.collatInput}
            onChange={evt => changeSlider([0, parseFloat(evt.target.value)])}
            InputProps={{
              endAdornment: (
                <>
                  <Typography variant="caption">%</Typography>
                  <Tooltip title="Percentage of collateral needed">
                    <InfoIcon className={classes.inputInfo} fontSize="small" />
                  </Tooltip>
                </>
              ),
            }}
            error={collatInput < minCollatRatio && minCollatRatio !== Infinity}
            helperText={
              collatInput < minCollatRatio && minCollatRatio !== Infinity
                ? `Collateral ratio should be greater than ${minCollatRatio}%`
                : null
            }
          />
          <TextField
            type="number"
            size="small"
            value={spot === 0 && oToken.isPut ? '-0' : spot}
            variant="outlined"
            label="Spot change"
            className={classes.collatInput}
            onChange={updateSpot}
            InputProps={{
              endAdornment: (
                <>
                  <Typography variant="caption">%</Typography>
                  <Tooltip title="Asset price change at which vault will be liquidated">
                    <InfoIcon className={classes.inputInfo} fontSize="small" />
                  </Tooltip>
                </>
              ),
            }}
          />
          <TextField
            size="small"
            disabled
            value={liquidationPrice}
            variant="outlined"
            label="Liquidation Price"
            className={classes.collatInput}
            InputProps={{
              startAdornment: <Typography variant="body2">$</Typography>,
              endAdornment: (
                <Tooltip title="Underlying price at which vault will be liquidated">
                  <InfoIcon className={classes.inputInfo} fontSize="small" />
                </Tooltip>
              ),
            }}
          />
        </>
      ) : null}
    </Box>
  );
};

export default PartialCollat;
