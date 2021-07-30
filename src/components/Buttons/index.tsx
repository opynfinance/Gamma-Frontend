import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

export const PrimaryButton = withStyles(theme => ({
  root: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}))(Button);

export const SecondaryButton = withStyles(theme => ({
  root: {
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.action.hover,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
}))(Button);
