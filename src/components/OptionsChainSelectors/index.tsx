import React, { useEffect, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

import { Series, OToken, ERC20 } from '../../types';
import { useTokenPrice } from '../../hooks/useTokenPrice';
import SeriesSelector from '../SeriesSelector';
import ExpirySelector from '../ExpirySelector';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    priceHeader: {
      marginLeft: theme.spacing(0),
    },
    priceColor: {
      color: '#BDBDBD',
    },
  }),
);

type OptionsChainSelectorsProps = {
  handleSeriesChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
  allSeries: Series[];
  selectedSeriesIndex: number;
  underlying: ERC20;
  handleExpiryChange: Function;
  selectedExpiry: number;
  oTokens: OToken[];
  setSpotPrice: any;
};

const OptionsChainSelectors = ({
  oTokens,
  handleSeriesChange,
  allSeries,
  underlying,
  selectedSeriesIndex,
  handleExpiryChange,
  selectedExpiry,
  setSpotPrice,
}: OptionsChainSelectorsProps) => {
  const classes = useStyles();

  const underlyingSpotPrice = useTokenPrice(underlying.id, 10);

  const seriesLabels = allSeries.filter(series => series.underlying.id === underlying.id).map(series => series.label);

  // update global spot price.
  useEffect(() => {
    setSpotPrice(underlyingSpotPrice);
    return () => {};
  }, [underlyingSpotPrice, setSpotPrice]);

  const oTokensInSelectedSeries = useMemo(
    () =>
      oTokens.filter(
        o => allSeries.length === 0 || o.underlyingAsset.id === allSeries[selectedSeriesIndex].underlying.id,
      ),
    [allSeries, selectedSeriesIndex, oTokens],
  );

  return (
    <Grid container direction="column">
      <Grid container direction="row" justify="flex-start" alignItems="center" className={classes.priceHeader}>
        {/* <Typography variant="h6">{underlying.symbol}</Typography> */}
        <Typography variant="h6">{seriesLabels}</Typography>
        <Typography variant="h6" className={classes.priceColor}>
          &nbsp; ${underlyingSpotPrice.toString()}
        </Typography>
      </Grid>

      <Grid container direction="row">
        <SeriesSelector
          selectedIndex={selectedSeriesIndex}
          handleSeriesChange={() => console.log('will not work here after')}
          allSeries={allSeries}
        />

        <ExpirySelector
          oTokens={oTokensInSelectedSeries}
          handleExpiryChange={() => console.log('will not work here after')}
          selectedExpiry={selectedExpiry}
        />

        {/* <ExpiryButtonsSelector
          oTokens={oTokensInSelectedSeries}
          handleExpiryChange={handleExpiryChange}
          selectedExpiry={selectedExpiry}
        /> */}
      </Grid>
    </Grid>
  );
};

export default OptionsChainSelectors;
