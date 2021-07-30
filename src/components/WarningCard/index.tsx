import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import WarningItem from '@material-ui/icons/ReportProblemOutlined';

import LearnMore from '../LearnMore';

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(1),
      backgroundColor: theme.palette.warning.light,
      color: theme.palette.warning.main,
      fontWeight: theme.typography.fontWeightBold,
      display: 'flex',
    },
    warningTxt: {
      fontSize: '.75rem',
      marginLeft: theme.spacing(0.5),
      fontWeight: theme.typography.fontWeightBold,
    },
  }),
);

const WarningCard: React.FC<{ warning: string; learnMore?: string }> = ({ warning, learnMore }) => {
  const classes = useStyles();
  return (
    <Paper className={classes.root} elevation={0}>
      <WarningItem fontSize="small" />
      <Typography variant="body2" className={classes.warningTxt} component="span">
        {warning} {learnMore ? <LearnMore h1={learnMore} highlight={false} /> : null}
      </Typography>
    </Paper>
  );
};

export default WarningCard;
