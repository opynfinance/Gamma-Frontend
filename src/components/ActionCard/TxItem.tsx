import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import InfoIcon from '@material-ui/icons/InfoOutlined';

const useStyles = makeStyles(theme => ({
  txLabel: {
    color: theme.palette.text.secondary,
    fontSize: '.8rem',
    fontWeight: theme.typography.fontWeightBold,
    display: 'flex',
    alignItems: 'center',
  },
  txValue: {
    fontSize: '.9rem',
  },
  txSymbol: {
    color: theme.palette.text.secondary,
    fontSize: '.7rem',
    marginLeft: '.2rem',
  },
  txItem: {
    marginTop: theme.spacing(1),
  },
}));

const Item = ({
  label,
  value,
  symbol,
  showInfo,
}: {
  label: string;
  value?: string;
  symbol?: string;
  showInfo?: boolean;
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.txItem}>
      <Typography variant="body1" className={classes.txLabel}>
        {label}
        {showInfo ? <InfoIcon style={{ fontSize: '.8rem', marginLeft: '4px' }} /> : null}
      </Typography>
      <Box style={{ display: 'flex', alignItems: 'baseline' }}>
        <Typography variant="body1" className={classes.txValue}>
          {value}
        </Typography>
        <Typography variant="body1" className={classes.txSymbol}>
          {symbol}
        </Typography>
      </Box>
    </Box>
  );
};

export default Item;
