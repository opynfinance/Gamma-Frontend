/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import { makeStyles, createStyles } from '@material-ui/core/styles';

import { OTokenWithTradeDetail } from '../../types';
import { getPayoutDetails } from '../../utils/calculations';
import { TradeAction } from '../../utils/constants';

const useStyles = makeStyles(theme =>
  createStyles({
    container: {
      display: 'flex',
      marginLeft: theme.spacing(2),
      width: '100%',
      marginTop: '10px',
      height: document.documentElement.clientHeight * 0.25,
    },
    card: {
      marginBottom: theme.spacing(1),
      padding: theme.spacing(1),
    },
    payoutContainer: {
      width: '30%',
      padding: theme.spacing(2),
    },
    chartContainer: {
      width: '65%',
    },
  }),
);

const chartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  title: { display: false },
  legend: { display: false },
  scales: {
    yAxes: [
      {
        display: true,
        gridLines: {
          zeroLineWidth: 1,
          zeroLineColor: '#77757E80',
          lineWidth: 0,
        },
        ticks: {
          display: true,
        },
        scaleLabel: {
          labelString: 'Profit / Loss (USDC)',
          display: true,
        },
      },
    ],
    xAxes: [
      {
        display: true,
        scaleLabel: {
          labelString: 'Asset Price (USDC)',
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
  animation: { duration: 0 },
  hover: { animationDuration: 0, intersect: false },
  onHover: (_: any, elements: any) => {
    if (elements && elements.length) {
      const chartElem = elements[0];
      const chart = chartElem._chart;
      const ctx = chart.ctx;

      ctx.globalCompositeOperation = 'destination-over';
      const x = chartElem._view.x;
      //const y = chartElem._view.y;
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

type PayoutTypes = {
  oTokens: OTokenWithTradeDetail[];
  action: TradeAction;
};

const Payout: React.FC<PayoutTypes> = ({ oTokens, action }) => {
  const classes = useStyles();
  const { labels, values, gain, loss, breakeven } = useMemo(() => getPayoutDetails(oTokens, action), [
    oTokens.length,
    action,
  ]);

  const getData = useCallback(
    (canvas: any) => {
      const ctx = canvas.getContext('2d');
      const gradientStartColor = '#4DADF3BF';
      const gradientStopColor = '#4DADF333';
      let gradient = ctx.createLinearGradient(0, 0, 0, 250);
      gradient.addColorStop(0, gradientStartColor);
      gradient.addColorStop(1, gradientStopColor);
      const splitPoint = values.findIndex(val => val === 0);
      const firstHalf = [...values.slice(0, splitPoint + 1), ...new Array(values.length - splitPoint - 1).fill(NaN)];
      const secondHalf = [...new Array(splitPoint).fill(NaN), ...values.slice(splitPoint)];

      return {
        labels,
        datasets: [
          {
            label: 'Profit',
            data: values[0] > 0 ? firstHalf : secondHalf,
            fill: false,
            borderColor: '#49D273',
            pointHoverBorderColor: '#49D273',
            pointHoverBackgroundColor: '#49D273',
            pointBackgroundColor: 'rgba(0, 0, 0, 0)',
            pointBorderColor: 'rgba(0, 0, 0, 0)',
            hitRadius: 5,
            pointHitRadius: 5,
            hoverRadius: 4,
          },
          {
            label: 'Loss',
            data: values[0] > 0 ? secondHalf : firstHalf,
            fill: false,
            borderColor: '#EC7987',
            pointHoverBorderColor: '#EC7987',
            pointHoverBackgroundColor: '#EC7987',
            pointBackgroundColor: 'rgba(0, 0, 0, 0)',
            pointBorderColor: 'rgba(0, 0, 0, 0)',
            hitRadius: 5,
            pointHitRadius: 5,
            hoverRadius: 4,
          },
        ],
      };
    },
    [labels, values],
  );

  return (
    <div className={classes.container}>
      <div className={classes.chartContainer}>
        <Line
          data={getData}
          type="line"
          width={300}
          height={document.documentElement.clientHeight * 0.25}
          options={chartOptions}
        />
      </div>
      <div className={classes.payoutContainer}>
        <Card className={classes.card}>
          <Typography variant="body2">Max Gain</Typography>
          <Typography variant="body2">{gain} USDC</Typography>
        </Card>
        <Card className={classes.card}>
          <Typography variant="body2">Max Loss</Typography>
          <Typography variant="body2">{loss} USDC</Typography>
        </Card>
        <Card className={classes.card}>
          <Typography variant="body2">Breakeven</Typography>
          <Typography variant="body2">{breakeven} USDC</Typography>
        </Card>
      </div>
    </div>
  );
};

export default Payout;
