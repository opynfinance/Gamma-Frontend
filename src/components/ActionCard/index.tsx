import React, { useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';

import Divider from './Divider';
import ListItem from './ListItem';
import TxItem from './TxItem';

const useStyles = makeStyles(theme => ({
  root: {},
  sticky: {
    position: 'sticky',
    top: 0,
  },
  box: {
    minHeight: '476px',
    padding: 12,
  },
  title: {
    fontSize: '1em',
    fontWeight: 600,
    paddingBottom: 4,
  },
  button: {
    marginTop: 4,
    fontSize: 16,
    justifySelf: 'flex-end',
  },
  buttonBox: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    height: '4rem',
    padding: theme.spacing(1),
    width: '16rem',
    opacity: 1,
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.background.lightStone}`,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

export enum TransactionState {
  Idle,
  Waiting,
  Confirmed,
}

type ActionCardProps = {
  title?: string;
  buttonText?: string;
  handleConfirm?: any;
  isDisabled?: boolean;
  noMargin?: boolean;
  noButton?: boolean;
  noStick?: boolean;
};

const ActionCard: React.FC<ActionCardProps> = ({
  noMargin = false,
  noButton = false,
  noStick = true,
  handleConfirm = () => {},
  title = '',
  buttonText = '',
  isDisabled = true,
  children,
}) => {
  const classes = useStyles();

  return (
    <Box
      className={
        noStick && noMargin
          ? classes.root
          : !noStick && noMargin
          ? classes.root + ' ' + classes.sticky
          : !noStick && !noMargin
          ? classes.root + ' ' + classes.sticky
          : classes.root + ' '
      }
    >
      <Box display="flex" flexDirection="column" className={classes.box}>
        {children}
        {noButton ? undefined : (
          <Box className={classes.buttonBox}>
            <Button
              className={classes.button}
              fullWidth
              variant="contained"
              color="primary"
              disableElevation
              size="medium"
              disabled={isDisabled}
              onClick={handleConfirm}
            >
              {buttonText}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

type ActionCardState = {
  title: string;
  buttonText: string;
  isDisabled?: boolean;
};
const useActionCard = ({ title, buttonText, isDisabled = false }: ActionCardState) => {
  const [state, setState] = useState<ActionCardState>({
    title,
    buttonText,
    isDisabled,
  });
  const [transactionState, setTransactionState] = useState<TransactionState>(TransactionState.Idle);

  const setText = useCallback(
    (text: string) =>
      setState(state => ({
        ...state,
        buttonText: text,
      })),
    [setState],
  );

  const setDisabled = useCallback(
    (isDisabled: boolean) =>
      setState(state => ({
        ...state,
        isDisabled,
      })),
    [setState],
  );
  return {
    actionCardState: state,
    setActionText: setText,
    setActionDisabled: setDisabled,
    transactionState,
    setTransactionState,
  };
};

export { useActionCard, Divider, ListItem, TxItem };
export default ActionCard;
