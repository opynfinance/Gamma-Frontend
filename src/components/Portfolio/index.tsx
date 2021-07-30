import React from 'react';
import Typography from '@material-ui/core/Typography';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  portfolio: {
    marginTop: 24,
  },
  price: {
    marginTop: 16,
  },
  priceChange: {
    marginTop: 4,
    marginBottom: 12,
  },
}));

const Portfolio: React.FC = () => {
  const classes = useStyles();
  const [time, setTime] = React.useState('Today');

  return (
    <Grid>
      <Typography variant="h5" className={classes.portfolio}>
        Portfolio
      </Typography>
      <Typography variant="h6" className={classes.price}>
        $576.79
      </Typography>
      <Grid container direction="row" justify="flex-start" alignItems="center" className={classes.priceChange}>
        <Typography variant="body1">+$140.11 (+5.27%)</Typography>
        <Typography variant="body1">&nbsp; {time}</Typography>
      </Grid>
      <ToggleButtonGroup
        value={time}
        onChange={(_, value) => setTime(value)}
        exclusive
        size="small"
        aria-label="outlined primary button group"
      >
        <ToggleButton value="Today">1D</ToggleButton>
        <ToggleButton value="1 Week">1W</ToggleButton>
        <ToggleButton value="3 Months">3M</ToggleButton>
        <ToggleButton value="1 Year">1Y</ToggleButton>
        <ToggleButton value="All time">ALL</ToggleButton>
      </ToggleButtonGroup>
    </Grid>
  );
};

export default Portfolio;
