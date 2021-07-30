import React from 'react';

import Risks from './risks';
import Tutorial from './tutorial';

const SecurityCard = () => {
  const [activeStep, setActiveStep] = React.useState(0);
  const [open, setOpen] = React.useState(window.localStorage.getItem('agree-security-card') !== 'true');

  const handleNext = () => {
    if (activeStep === 1) {
      setOpen(false);
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  function getStepContent(step: number): any {
    switch (step) {
      case 0:
        return <Tutorial open={open} handleNext={handleNext} />;
      case 1:
        return <Risks open={open} handleNext={handleNext} />;
      default:
        throw new Error('Unknown step');
    }
  }

  return <div>{getStepContent(activeStep)}</div>;
};

export default SecurityCard;
