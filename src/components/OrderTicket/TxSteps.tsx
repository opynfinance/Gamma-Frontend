import React from 'react';
import Typography from '@material-ui/core/Typography';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import ToggleIcon from '@material-ui/icons/ToggleOffOutlined';
import CheckIcon from '@material-ui/icons/CheckCircleOutlineOutlined';
import clsx from 'clsx';

const useStyles = makeStyles(theme =>
  createStyles({
    txHeader: {
      color: theme.palette.text.secondary,
      marginTop: theme.spacing(2),
    },
    stepContent: {
      fontSize: '.8rem',
      display: 'flex',
      justifyItems: 'center',
      marginTop: theme.spacing(1),
      color: theme.palette.text.secondary,
      fontWeight: theme.typography.fontWeightBold,
    },
    stepDone: {
      color: theme.palette.text.primary,
    },
    currentStep: {
      color: theme.palette.primary.main,
    },
    stepIcon: {
      fontSize: '1rem',
    },
    stepTxt: {
      marginLeft: theme.spacing(1),
    },
  }),
);

export type TxStepType = {
  step: string;
  type: 'APPROVE' | 'ACTION';
};

type TxStepsProps = {
  steps: Array<TxStepType>;
  currentStep: number;
};

const TxSteps: React.FC<TxStepsProps> = ({ steps, currentStep }) => {
  const classes = useStyles();
  const stepDone = clsx(classes.stepContent, classes.stepDone);
  const currentStepCls = clsx(classes.stepContent, classes.currentStep);

  return (
    <>
      <Typography variant="body2" className={classes.txHeader}>
        TX Action
      </Typography>
      {steps.map((stepItem, index) => {
        return (
          <Typography
            className={index < currentStep ? stepDone : index === currentStep ? currentStepCls : classes.stepContent}
            component="div"
            key={stepItem.step}
          >
            {stepItem.type === 'APPROVE' ? (
              <ToggleIcon fontSize="small" className={classes.stepIcon} />
            ) : (
              <CheckIcon fontSize="small" className={classes.stepIcon} />
            )}{' '}
            <span className={classes.stepTxt}>
              {`${index + 1}. `} {stepItem.step}
            </span>
          </Typography>
        );
      })}
    </>
  );
};

export default TxSteps;
