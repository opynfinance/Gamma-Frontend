import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Typography from '@material-ui/core/Typography';
import KeyboardArrowDownOutlinedIcon from '@material-ui/icons/KeyboardArrowDownOutlined';

import { Series } from '../../types';
import { SecondaryButton } from '../Buttons';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      background: theme.palette.background.paper,
      marginLeft: theme.spacing(2),
      [theme.breakpoints.down('xs')]: {
        marginLeft: 0,
      },
    },
  }),
);

type SeriesSelectorProps = {
  handleSeriesChange: (index: number) => void;
  selectedIndex: number;
  allSeries: Series[];
};

const SeriesSelector = ({ handleSeriesChange, allSeries, selectedIndex }: SeriesSelectorProps) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<(EventTarget & HTMLButtonElement) | null>();
  const [currentSeries, setCurrentSeries] = useState<string | null>();

  const handleMenuItemClick = (_: any, index: number) => {
    handleSeriesChange(index);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (allSeries.length && allSeries[selectedIndex]) {
      setCurrentSeries(allSeries[selectedIndex].label);
    }
  }, [allSeries, selectedIndex]);

  return (
    <>
      <SecondaryButton
        onClick={evt => setAnchorEl(evt.currentTarget)}
        className={classes.button}
        endIcon={<KeyboardArrowDownOutlinedIcon color="primary" />}
      >
        {currentSeries || <Typography>Series</Typography>}
      </SecondaryButton>
      <Menu id="lock-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        {allSeries.map((series, index) => (
          <MenuItem
            key={series.label}
            selected={index === selectedIndex}
            onClick={event => handleMenuItemClick(event, index)}
          >
            {series.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default SeriesSelector;
