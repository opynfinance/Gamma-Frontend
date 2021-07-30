import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import emptyState from '../../img/EmptyState.svg';

const useStyles = makeStyles(theme => ({
  notice: {
    maxWidth: 275,
    marginTop: 16,
    marginBottom: 12,
    color: '#333333',
    fontWeight: 500,
  },
}));

const ComingSoon = () => {
  const classes = useStyles();

  return (
    <>
      <img src={emptyState} alt="Empty State" />
      <Typography align="center" className={classes.notice} variant="body2">
        Coming soon{' '}
        <span role="img" aria-label="eyes">
          👀
        </span>
      </Typography>
    </>
  );
};

export default ComingSoon;
