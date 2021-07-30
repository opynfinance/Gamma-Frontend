import React from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';

import { TradeAction } from '../../utils/constants';

export const useInputStyle = makeStyles(theme => ({
  input: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
}));

type InputProps = {
  firstAction: TradeAction;
  handleInputChange: any;
  isError: any;
  errorName: any;
  errorDescription: any;
  input: BigNumber;
  disabled: boolean;
};

const PositionSizeInput = ({
  disabled,
  handleInputChange,
  input,
  isError,
  errorName,
  errorDescription,
}: InputProps) => {
  const classes = useInputStyle();

  return (
    <TextField
      disabled={disabled}
      fullWidth
      size="small"
      id="outlined-basic"
      label={'Position Size'}
      error={isError}
      helperText={isError ? errorDescription : null}
      type="number"
      variant="outlined"
      className={classes.input}
      value={input.toNumber()}
      onChange={handleInputChange}
      InputProps={{
        endAdornment: <InputAdornment position="end">oTokens</InputAdornment>,
      }}
    />
  );
};

export default PositionSizeInput;
