import React from 'react';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import emptyState from '../../img/EmptyWallet.svg';

const useStyles = makeStyles(theme =>
  createStyles({
    emptyContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      textAlign: 'center',
    },
  }),
);

const EmptyView: React.FC<{ actionTxt: string }> = ({ actionTxt }) => {
  const classes = useStyles();

  return (
    <div className={classes.emptyContainer}>
      <div>
        <img src={emptyState} alt="Empty State" />
        <Typography variant="body1" align="center">
          {actionTxt}
        </Typography>
      </div>
    </div>
  );
};

export default EmptyView;
