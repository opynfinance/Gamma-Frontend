import React from 'react';
import BigNumber from 'bignumber.js';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';

import { useInputStyle } from './PositionSizeInput';

type InputProps = {
  handleInputChange: any;
  input: BigNumber;
  disabled?: boolean;
};

const PriceInput = ({ disabled, handleInputChange, input }: InputProps) => {
  const classes = useInputStyle();

  return (
    <TextField
      disabled={disabled}
      fullWidth
      size="small"
      id="outlined-basic"
      label={'Limit Price'}
      type="number"
      variant="outlined"
      className={classes.input}
      value={input.toNumber()}
      onChange={handleInputChange}
      InputProps={{
        endAdornment: <InputAdornment position="end">USDC</InputAdornment>,
      }}
    />
  );
};

export default PriceInput;
