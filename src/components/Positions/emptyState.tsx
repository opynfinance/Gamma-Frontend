import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { useHistory } from 'react-router-dom';

import emptyState from '../../img/EmptyWallet.svg';
import { PrimaryButton } from '../Buttons';

const useStyles = makeStyles(theme => ({
  notice: {
    marginTop: 16,
    marginBottom: 12,
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  link: {
    color: '#4FC2A0',
    textDecoration: 'none',
  },
  img: {
    marginTop: '5rem',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

type EmptyStateProps = {
  status: String;
};

const EmptyState = ({ status }: EmptyStateProps) => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <Box className={classes.root}>
      <img src={emptyState} alt="Empty State" className={classes.img} />
      <Typography className={classes.notice} variant="body2">
        You don't have any {status}
      </Typography>
      <PrimaryButton onClick={() => history.push('/')}>Start trading</PrimaryButton>
    </Box>
  );
};

export default EmptyState;
