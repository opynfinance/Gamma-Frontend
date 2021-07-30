import React from 'react';
import { createStyles, makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import { TradeAction } from '../../utils/constants';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    buttonBuy: {
      flexGrow: 1,
      border: `1px solid ${theme.palette.success.main}`,
      color: theme.palette.success.main,
      '&.Mui-selected': {
        backgroundColor: theme.palette.success.main,
        color: '#fff',
        '&:hover': {
          backgroundColor: theme.palette.success.main,
        },
      },
      '&:hover': {
        backgroundColor: `${theme.palette.success.main}33`,
      },
    },
    buttonSell: {
      flexGrow: 1,
      border: `1px solid ${theme.palette.error.main}`,
      color: theme.palette.error.main,
      '&.Mui-selected': {
        backgroundColor: theme.palette.error.main,
        color: '#fff',
        '&:hover': {
          backgroundColor: theme.palette.error.main,
        },
      },
      '&:hover': {
        backgroundColor: `${theme.palette.error.main}33`,
      },
    },
    button: {
      flexGrow: 1,
    },
    buttonGroup: {
      paddingTop: theme.spacing(0.5),
      paddingBottom: theme.spacing(1.5),
    },
  }),
);

const StyledToggleButtonGroup = withStyles(theme => ({
  grouped: {
    '&:not(:first-child)': {
      marginLeft: theme.spacing(0.5),
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.error.main}`,
    },
    '&:first-child': {
      marginRight: theme.spacing(0.5),
      borderRadius: theme.shape.borderRadius,
    },
  },
  root: {
    width: '100%',
    padding: 0,
  },
}))(ToggleButtonGroup);

type ToggleSelectProps<T extends string> = {
  onChange: (value: T) => void;
  values: T[];
  value: T;
  compact?: boolean;
};

const ToggleSelect = <T extends string>({ onChange, value, values, compact }: ToggleSelectProps<T>) => {
  const classes = useStyles();

  const handleChange = (e: React.MouseEvent, value: T) => {
    if (value != null) onChange(value);
  };

  return (
    <StyledToggleButtonGroup
      className={classes.buttonGroup}
      style={compact ? { paddingBottom: 0 } : {}}
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="text alignment"
    >
      {values.map((value: string, i: number) => (
        <ToggleButton
          className={
            value === TradeAction.BUY
              ? classes.buttonBuy
              : value === TradeAction.SELL
              ? classes.buttonSell
              : classes.button
          }
          key={i}
          value={value}
          size="small"
        >
          {value}
        </ToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
};

export default ToggleSelect;
