import React from 'react';
import Button from '@material-ui/core/Button';

export default function TradeButton({
  buttonLabel,
  disabled,
  onClick,
}: {
  buttonLabel: string;
  disabled: boolean;
  onClick: any;
}) {
  return (
    <Button
      fullWidth
      variant="contained"
      color="primary"
      disableElevation
      disabled={disabled}
      size="medium"
      onClick={onClick}
    >
      {buttonLabel}
    </Button>
  );
}
