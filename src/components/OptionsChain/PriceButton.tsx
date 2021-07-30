import React, { MouseEvent } from 'react';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import ToggleButton from '@material-ui/lab/ToggleButton';
import CheckIcon from '@material-ui/icons/Check';
import PlusIcon from '@material-ui/icons/AddCircleOutline';
import Box from '@material-ui/core/Box';

const useButtonStyles = makeStyles(theme =>
  createStyles({
    button: {
      padding: 0,
      fontSize: '.75rem',
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      '&:disabled': {
        borderColor: theme.palette.action.disabled,
        color: theme.palette.action.disabled,
      },
      '&$selected': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText,
        },
      },
      minWidth: '6rem',
    },
    icon: {
      padding: '4px',
    },
    iconBox: {
      // width: 'min-content',
    },
    border: {
      borderColor: theme.palette.primary.main,
    },
    text: {
      paddingRight: '8px',
      paddingLeft: '8px',
      borderStyle: 'solid',
      borderWidth: '0 1px 0 0',
    },
    selected: {},
  }),
);

const PriceButton = ({
  children,
  disabled,
  selected,
  handleSelect,
}: {
  children?: React.ReactNode;
  disabled: Boolean;
  selected: Boolean;
  handleSelect: (event: MouseEvent<HTMLButtonElement>) => void;
}) => {
  const classes = useButtonStyles();

  return (
    <ToggleButton
      disabled={!!disabled}
      onClick={handleSelect}
      className={classes.button}
      value={selected}
      color="primary"
      size="small"
      selected={!!selected}
      classes={{ selected: classes.selected, root: 'button' }}
    >
      <Box flexGrow={1} className={[classes.text, disabled ? '' : classes.border].join(' ')}>
        {children}
      </Box>
      {selected ? (
        <Box className={classes.iconBox} display="flex" justifyContent="center" alignContent="center">
          <CheckIcon className={classes.icon} fontSize="small" />
        </Box>
      ) : (
        <Box className={classes.iconBox} display="flex" justifyContent="center" alignContent="center">
          <PlusIcon className={classes.icon} fontSize="small" />
        </Box>
      )}
    </ToggleButton>
  );
};

export default PriceButton;
