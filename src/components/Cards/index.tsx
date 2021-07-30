import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';

export const DashedCard = withStyles(theme => ({
  root: {
    color: theme.palette.text.disabled,
    backgroundColor: theme.palette.background.paper,
    border: `1px dashed ${theme.palette.action.disabled}`,
    padding: theme.spacing(2, 2),
  },
}))(Paper);
