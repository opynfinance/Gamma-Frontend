import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import MaterialDivider from '@material-ui/core/Divider';

const useStyles = makeStyles(theme => ({
  divider: {
    marginTop: 5,
    marginBottom: 5,
  },
}));

const Divider = () => {
  const classes = useStyles();
  return <MaterialDivider className={classes.divider} />;
};

export default Divider;
