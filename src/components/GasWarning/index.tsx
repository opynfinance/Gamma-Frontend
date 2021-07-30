import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
  icon: {
    padding: '5px',
  },
  notice: {
    maxWidth: 275,
    marginTop: 16,
    marginBottom: 12,
    color: '#333333',
    fontWeight: 500,
  },
  link: {
    color: '#828282',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
}));

type GasWarningProps = {
  action: String;
};

const GasWarning = ({ action }: GasWarningProps) => {
  const classes = useStyles();

  return (
    <>
      <Typography align="center" className={classes.notice} variant="body2">
        <span role="img" aria-label="gas" className={classes.icon}>
          ⛽️
        </span>{' '}
        Do not change the gas price to {action}, otherwise the transaction will fail.
      </Typography>
    </>
  );
};

export default GasWarning;
