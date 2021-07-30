import React, { useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles(theme => ({
  button: {
    // backgroundColor: '#323ea3',
    color: 'black',
    borderColor: 'black',
    // marginTop: 24,
    marginRight: -10,
    marginLeft: 10,
    width: 'auto',
    height: '2em',
    // flexGrow: 1,
  },
  container: {},
  textField: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      maxWidth: '100%',
    },
  },
}));

type BigNumberInputProps = {
  onChange: any;
  label: any;
  adornment: any;
  isError: boolean;
  errorName: string | null;
  errorDescription: string | null;
  max?: BigNumber;
  decimals?: number;
  initValue?: BigNumber;
  value?: BigNumber;
};

const BigNumberInput = ({
  onChange,
  label,
  isError,
  errorName,
  errorDescription,
  adornment,
  max,
  initValue,
  decimals = 0,
  value,
}: BigNumberInputProps) => {
  const classes = useStyles();
  // const [error, setError] = useState<string | null>(null);
  const [input, setInputValue] = useState<number | ''>(initValue ? initValue.div(10 ** decimals).toNumber() : 0);
  const [lastKeyWasDot, setLastKeyWasDot] = useState<boolean>(false);

  const inputValue = useMemo(() => {
    if (!value) return input;

    return value.div(10 ** decimals).toNumber();
  }, [decimals, input, value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const float = parseFloat(value);

    if (value.length === 0) {
      onChange(new BigNumber(0));
      setInputValue('');
    } else if (float >= 0) {
      setInputValue(float);
      onChange(new BigNumber(float * 10 ** decimals));
    }
  };

  // specific key handling to improve ux of the input component
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;
    // only digits, backspace, delete, and . are allowed, all other keys are ignored
    if (isNaN(Number(key)) && !['Backspace', 'Delete', '.'].includes(key)) {
      event.preventDefault();
    } else if (key === '.') {
      // if the last key pressed was . we ignore subsequent .
      if (lastKeyWasDot) event.preventDefault();
      // if the input is not empty, but it already has a decimal, we ignore
      else if (inputValue !== '' && !Number.isInteger(inputValue)) event.preventDefault();
      // other we let the key through and set that the last key was .
      else setLastKeyWasDot(true);
    } else {
      setLastKeyWasDot(false);
    }
  };

  const handleSetMax = () => {
    if (max) {
      setInputValue(max.dividedBy(10 ** decimals).toNumber());
      onChange(new BigNumber(max));
    }
  };

  return (
    <Grid className={classes.container} container wrap={'nowrap'} alignContent="stretch" direction="row">
      <TextField
        value={inputValue}
        className={classes.textField}
        size="small"
        id="outlined-basic"
        label={isError ? errorName : label}
        error={isError}
        helperText={isError ? errorDescription : null}
        type="number"
        variant="outlined"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography style={{ fontSize: '.7rem' }}>
                {adornment}
                {max && (
                  <Button
                    style={{ fontSize: '.7rem' }}
                    variant="contained"
                    // color={yellow}
                    disableElevation
                    size="small"
                    className={classes.button}
                    onClick={handleSetMax}
                  >
                    Max
                  </Button>
                )}
              </Typography>
            </InputAdornment>
          ),
        }}
      />
    </Grid>
  );
};

export default BigNumberInput;
