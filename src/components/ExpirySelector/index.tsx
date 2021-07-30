import React, { useEffect, useState, useCallback } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import KeyboardArrowDownOutlinedIcon from '@material-ui/icons/KeyboardArrowDownOutlined';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';

import { OToken } from '../../types';
import { toUTCDateString } from '../../utils/time';
import { SecondaryButton } from '../Buttons';
import { useZeroX } from '../../hooks';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      background: theme.palette.background.paper,
      marginLeft: theme.spacing(2),
    },
  }),
);

type ExpirySelectorProps = {
  handleExpiryChange: (expiry: number) => void;
  selectedExpiry: number;
  oTokens: OToken[];
};

const ExpirySelector = ({ handleExpiryChange, selectedExpiry, oTokens }: ExpirySelectorProps) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<(EventTarget & HTMLButtonElement) | null>();
  const [uniqueExpires, setUniqueExpires] = useState<number[]>([]);

  const { isLoadingOrderBook, liquidityExpiryMap } = useZeroX();

  const handleMenuItemClick = (expiry: number) => {
    handleExpiryChange(expiry);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getMostLiquidityExpiry = useCallback(() => {
    const underlying = oTokens[0]?.underlyingAsset.id;
    if (!underlying) return;
    let expiry;
    let amt = 0;
    for (const key of Object.keys(liquidityExpiryMap[underlying])) {
      if (amt < liquidityExpiryMap[underlying][key]) {
        amt = liquidityExpiryMap[underlying][key];
        expiry = key;
      }
    }
    return expiry;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liquidityExpiryMap]);

  useEffect(() => {
    if (isLoadingOrderBook) return;

    if (uniqueExpires.length > 0) {
      if (selectedExpiry === 0 || !uniqueExpires.includes(selectedExpiry)) {
        const mostLiquidExpiry = getMostLiquidityExpiry();

        if (mostLiquidExpiry) {
          handleExpiryChange(parseInt(mostLiquidExpiry));
        } else {
          handleExpiryChange(uniqueExpires[0]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExpiry, uniqueExpires.length, isLoadingOrderBook, liquidityExpiryMap]);

  useEffect(() => {
    const expires = Array.from(new Set(oTokens.map(otoken => otoken.expiry))).sort((a, b) => (a > b ? 1 : -1));
    setUniqueExpires(expires);
  }, [oTokens]);

  return (
    <>
      <SecondaryButton
        onClick={evt => setAnchorEl(evt.currentTarget)}
        className={classes.button}
        endIcon={<KeyboardArrowDownOutlinedIcon color="primary" />}
      >
        {selectedExpiry ? (
          <>
            <Hidden xsDown>Expires</Hidden>
            {` ${toUTCDateString(selectedExpiry)}`}
          </>
        ) : (
          <Typography>Expiry</Typography>
        )}
      </SecondaryButton>
      <Menu id="lock-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        {uniqueExpires.map((expiry, index) => (
          <MenuItem key={expiry} selected={expiry === selectedExpiry} onClick={() => handleMenuItemClick(expiry)}>
            {toUTCDateString(expiry)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ExpirySelector;
