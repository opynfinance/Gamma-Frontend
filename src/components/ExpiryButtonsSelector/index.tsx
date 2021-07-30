import React, { useEffect } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import { OToken } from '../../types';
import { toUTCDateString } from '../../utils/time';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    margin: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
    marginButton: {
      marginRight: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
  }),
);

type ExpirySelectorProps = {
  handleExpiryChange: any;
  selectedExpiry: number;
  oTokens: OToken[];
};

const ExpirySelector = ({ handleExpiryChange, selectedExpiry, oTokens }: ExpirySelectorProps) => {
  const classes = useStyles();

  const uniqueExpires = Array.from(new Set(oTokens.map(otoken => otoken.expiry))).sort((a, b) => (a > b ? 1 : -1));

  const menuItems = uniqueExpires.map(expiry => (
    <Button
      onClick={() => handleExpiryChange(expiry)}
      variant={expiry !== selectedExpiry ? 'outlined' : 'contained'}
      color="primary"
      className={classes.marginButton}
      key={expiry}
      value={expiry}
      disableElevation
    >
      {toUTCDateString(expiry)}
    </Button>
  ));

  useEffect(() => {
    if (uniqueExpires.length > 0) {
      if (selectedExpiry === 0 || !uniqueExpires.includes(selectedExpiry)) handleExpiryChange(uniqueExpires[0]);
    }
  }, [selectedExpiry, uniqueExpires, handleExpiryChange]);

  return (
    <div id="expiryButtonsSelector" className={classes.margin}>
      {menuItems}
    </div>
  );
};

export default ExpirySelector;
