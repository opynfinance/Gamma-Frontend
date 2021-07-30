import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import Main from './main';
import ConfirmingCard from '../ConfirmingCard';
import ConfirmCard from '../ConfirmCard';
import { getCollateralAsset, parseNumber } from '../../utils/parse';
import { roundTwoDecimals } from '../../utils/calculations';
import { useError } from '../../hooks/useError';
import { Errors } from '../../utils/constants';

const useStyles = makeStyles(theme => ({
  root: {
    minWidth: 275,
    maxWidth: 300,
    marginTop: 16,
    marginLeft: 24,
    minHeight: 375,
    maxHeight: 375,
  },
  body: {
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 12,
  },
}));

type AddSpreadCardProps = {
  asset: any;
  expiry: any;
  type: any;
  strike: any;
};

const AddSpreadCard = ({ asset, expiry, type, strike }: AddSpreadCardProps) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const [input, setInput] = React.useState('');

  //TODO: Logic to determine error type
  // var errorType = 'valid';
  const { isError, errorName, errorDescription, setErrorType } = useError(getCollateralAsset(asset, type));

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
    // todo: remove this example:
    if (event.target.value && Number(event.target.value) > 10) setErrorType(Errors.INSUFFICIENT_BALANCE);
  };

  const handleNext = () => {
    if (activeStep === 2) {
      setActiveStep(0);
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const description = () => {
    //TODO: get actual premium from real data
    return (
      <Typography align="center" className={classes.body} variant="body2">
        Added {input} {asset} {type}s for {parseNumber(roundTwoDecimals(Number(input) * 10.44))} USDC
      </Typography>
    );
  };

  const txHash = 'temp';

  function getStepContent(step: number): any {
    switch (step) {
      case 0:
        return (
          <Main
            handleNext={handleNext}
            type={type}
            asset={asset}
            expiry={expiry}
            strike={strike}
            handleInputChange={handleInputChange}
            input={input}
            isError={isError}
            errorName={errorName}
            errorDescription={errorDescription}
          />
        );
      case 1:
        return <ConfirmingCard handleNext={handleNext} description={description()} txHash={txHash} />;
      case 2:
        return <ConfirmCard handleNext={handleNext} description={description()} txHash={txHash} />;
      default:
        throw new Error('Unknown step');
    }
  }

  return (
    <Card className={classes.root} variant="outlined">
      <Typography className={classes.title}>Add {type}</Typography>
      <Divider />
      {getStepContent(activeStep)}
    </Card>
  );
};

export default AddSpreadCard;
