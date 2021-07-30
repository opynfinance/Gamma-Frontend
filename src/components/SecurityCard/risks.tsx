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
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(2),
      top: theme.spacing(2),
      color: theme.palette.grey[500],
    },
  });

const useStyles = makeStyles({
  checkbox: {
    marginLeft: 12,
  },
});

export interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string;
  children: React.ReactNode;
  onClose: () => void;
}

const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
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

const DialogContent = withStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(3),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme: Theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

type RisksProps = {
  open: any;
  handleNext: any;
};

const Risks = ({ open, handleNext }: RisksProps) => {
  const classes = useStyles();
  const [checked, setCheck] = React.useState(false);

  const handleClose = () => {
    if (checked) localStorage.setItem('agree-security-card', 'true');
    handleNext();
  };

  const handleDontShowAgainCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheck(event.target.checked);
  };

  return (
    <div>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={handleClose}>
          Security Warning (2/2)
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            We encourage our users to be mindful of risk and only use funds they can afford to lose.
          </Typography>
          <Typography gutterBottom>
            Options are complex instruments that when understood correctly can be powerful hedges. Smart contracts are
            still new and experimental technology.
          </Typography>
          <Typography gutterBottom>
            We want to remind our users to be optimistic about innovation while remaining cautious about where they put
            their money.
          </Typography>
        </DialogContent>
        <FormControlLabel
          className={classes.checkbox}
          control={<Checkbox checked={checked} onChange={handleDontShowAgainCheck} color="primary" />}
          label="Don't show again"
        />
        <DialogActions>
          <Button autoFocus onClick={handleClose} color="primary">
            I understand and agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Risks;
