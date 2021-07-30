import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { Line } from 'react-chartjs-2';
import Typography from '@material-ui/core/Typography';
import { createStyles, makeStyles } from '@material-ui/core/styles';

import useOTokenHistory from '../../hooks/useOTokenHistory';
import { OToken } from '../../types';
import { useCallback } from 'react';
import EmptyView from '../EmptyView';

const useStyles = makeStyles(theme =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
  }),
);

type historicalPriceType = {
  oToken: OToken;
};

const primaryColor = '#4DADF3';
const chartOptions = {
  maintainAspectRatio: false,
  title: { display: false },
  legend: { display: false },
  scales: {
    yAxes: [
      {
        display: true,
        gridLines: {
          zeroLineWidth: 0,
          lineWidth: 0,
        },
        ticks: {
          display: true,
        },
        scaleLabel: {
          labelString: 'Option price (USDC)',
          display: true,
        },
      },
    ],
    xAxes: [
      {
        display: true,
        scaleLabel: {
          labelString: 'Date',
          display: true,
        },
        ticks: {
          display: false,
        },
        gridLines: {
          lineWidth: 0,
          zeroLineWidth: 0,
        },
      },
    ],
  },
  tooltips: {
    enabled: true,
    intersect: false,
    mode: 'index',
  },
  hover: { animationDuration: 0, intersect: false },
  onHover: (_: any, elements: any) => {
    if (elements && elements.length) {
      const chartElem = elements[0];
      const chart = chartElem._chart;
      const ctx = chart.ctx;

      ctx.globalCompositeOperation = 'destination-over';
      const x = chartElem._view.x;
      const topY = chart.scales['y-axis-0'].top;
      const bottomY = chart.scales['y-axis-0'].bottom;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#77757E80';
      ctx.stroke();
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';
    }
  },
};

const HistoricalPrice: React.FC<historicalPriceType> = ({ oToken }) => {
  const { optionHistory, loading } = useOTokenHistory(oToken.id);

  const { labels, values } = useMemo(() => {
    const sortedArray = [...optionHistory].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
    // Sort with timestamp and use one price for a day.
    return sortedArray.reduce(
      (acc, history) => {
        const d = new Date(parseInt(history.timestamp) * 1000);
        const [, month, date] = d.toDateString().split(' ');
        const dateLabel = `${month} ${date}`;
        const index = acc.labels.indexOf(dateLabel);
        if (index === -1) {
          acc.labels.push(dateLabel);
          acc.values.push(
            new BigNumber(history.paymentTokenAmount)
              .multipliedBy(100)
              .div(new BigNumber(history.oTokenAmount))
              .integerValue(BigNumber.ROUND_CEIL)
              .toNumber(),
          );
        }
        return acc;
      },
      { labels: [], values: [] } as any,
    );
  }, [optionHistory]);

  const getData = useCallback(
    (canvas: any) => {
      const ctx = canvas.getContext('2d');
      const gradientStartColor = '#4DADF3CC';
      const gradientStopColor = '#4DADF300';
      let gradient = ctx.createLinearGradient(0, 0, 0, 250);
      gradient.addColorStop(0, gradientStartColor);
      gradient.addColorStop(1, gradientStopColor);
      return {
        labels,
        datasets: [
          {
            label: 'Price',
            data: values,
            fill: true,
            backgroundColor: gradient,
            borderColor: primaryColor,
            pointHoverBorderColor: primaryColor,
            pointHoverBackgroundColor: primaryColor,
            pointBackgroundColor: 'rgba(0, 0, 0, 0)',
            pointBorderColor: 'rgba(0, 0, 0, 0)',
            pointHoverRadius: 5,
            pointHitRadius: 30,
          },
        ],
      };
    },
    [labels, values],
  );

  return (
    <div style={{ height: '100%', marginTop: '10px' }}>
      {loading ? (
        <LoadingView />
      ) : labels.length ? (
        <Line data={getData} type="line" height={document.documentElement.clientHeight * 0.25} options={chartOptions} />
      ) : (
        <EmptyView actionTxt="No Historical price available" />
      )}
    </div>
  );
};

const LoadingView = () => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <Typography>Loading...</Typography>
    </div>
  );
};

export default HistoricalPrice;
