import React from 'react';
import { createStyles, Theme, withStyles, WithStyles, makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';

import { FAQ } from '../../utils/constants';
import {
  europeanDescription,
  autoExerciseDescription,
  generalCashSettleDescription,
} from '../../utils/constants/description';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  });

export const useStyles = makeStyles(theme => ({
  link: {
    color: '#4FC2A0',
  },
  bold: {
    fontWeight: 'bold',
  },
  margin: {
    marginBottom: theme.spacing(2),
  },
}));

export interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

export const DialogContent = withStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(4),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme: Theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
}))(MuiDialogActions);

type TutorialProps = {
  open: any;
  handleNext: any;
};

const Tutorial = ({ open, handleNext }: TutorialProps) => {
  const classes = useStyles();

  return (
    <div>
      <Dialog onClose={handleNext} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={handleNext}>
          Opyn v2 Options{' '}
          <span role="img" aria-label="celebrate">
            🎉
          </span>{' '}
          (1/2)
        </DialogTitle>
        <DialogContent dividers>
          <Typography className={classes.margin} gutterBottom>
            <Typography className={classes.bold}>Option types:</Typography> You can buy or sell put options, call
            options, put spreads, and call spreads.
          </Typography>
          <Typography className={classes.margin} gutterBottom>
            <Typography className={classes.bold}>European:</Typography> {europeanDescription}
          </Typography>
          <Typography className={classes.margin} gutterBottom>
            <Typography className={classes.bold}>Auto-Exercise:</Typography> {autoExerciseDescription}
            <a className={classes.link} href={FAQ} target="_blank" rel="noopener noreferrer">
              Learn more.{' '}
            </a>
          </Typography>
          <Typography className={classes.margin} gutterBottom>
            <Typography className={classes.bold}>Cash Settled:</Typography> {generalCashSettleDescription}
          </Typography>
          <Typography className={classes.margin} gutterBottom>
            <Typography className={classes.bold}>Learn more:</Typography> You can learn more about options, the Opyn v2
            protocol, and access an interface tutorial{' '}
            <a className={classes.link} href={FAQ} target="_blank" rel="noopener noreferrer">
              here.{' '}
            </a>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleNext} color="primary">
            I understand and agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Tutorial;
