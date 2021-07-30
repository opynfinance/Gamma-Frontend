import React, { useState, useCallback, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import { useInputStyle } from './PositionSizeInput';

type InputProps = {
  setDeadline: any;
  deadline: number;
  disabled?: boolean;
};

const options = ['seconds', 'minutes', 'hours', 'days'];

const DeadlineInput = ({ disabled, setDeadline, deadline }: InputProps) => {
  const [formInput, setFormInput] = useState(deadline);

  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    const deadlineInSec = formInput * multiplier;
    setDeadline(deadlineInSec);
  }, [multiplier, formInput, setDeadline]);

  const classes = useInputStyle();

  return (
    <TextField
      disabled={disabled}
      fullWidth
      size="small"
      id="expiry"
      label={'Deadline'}
      type="number"
      className={classes.input}
      value={formInput}
      variant="outlined"
      onChange={e => {
        if (Number(e.target.value) >= 0) setFormInput(Number(e.target.value));
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Selection setMultiplier={setMultiplier} />
          </InputAdornment>
        ),
      }}
    />
  );
};

const Selection = ({ setMultiplier }: { setMultiplier: any }) => {
  const [idx, setIdx] = useState(0);

  const handleChange = useCallback(
    event => {
      const idx = event.target.value;
      const unit = options[idx];
      setIdx(idx);
      switch (unit) {
        case 'seconds': {
          setMultiplier(1);
          break;
        }
        case 'minutes': {
          setMultiplier(60);
          break;
        }
        case 'hours': {
          setMultiplier(3600);
          break;
        }
        case 'days': {
          setMultiplier(86400);
          break;
        }
      }
    },
    [setMultiplier],
  );

  const listItems = options.map((unit, idx) => {
    return (
      <MenuItem key={idx} value={idx}>
        {unit}
      </MenuItem>
    );
  });

  return (
    <FormControl>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="demo-simple-select-outlined"
        value={idx}
        onChange={handleChange}
        label="unit"
      >
        {listItems}
      </Select>
    </FormControl>
  );
};

export default DeadlineInput;
