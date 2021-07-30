import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import List from '@material-ui/core/List';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles(theme => ({
  root: {
    minWidth: 275,
  },
  listItem: {
    padding: theme.spacing(0, 0),
    fontSize: 14,
    color: '#BDBDBD',
  },
  listItemText: {
    fontSize: 14,
  },
  listItemTotal: {
    padding: theme.spacing(0, 0),
    marginTop: 16,
    fontSize: 14,
    color: '#BDBDBD',
  },
  maxButton: {
    backgroundColor: '#BDBDBD',
    color: '#FFFFFF',
    marginTop: 8,
    marginLeft: 4,
  },
  textField: {
    maxWidth: 200,
  },
  bottomButton: {
    marginTop: 85,
  },
}));

type MainProps = {
  handleNext: any;
  type: any;
  expiry: any;
  strike: any;
  asset: any;
  handleInputChange: any;
  input: any;
  isError: any;
  errorName: any;
  errorDescription: any;
};

const Main = ({
  handleNext,
  type,
  expiry,
  strike,
  asset,
  handleInputChange,
  input,
  isError,
  errorName,
  errorDescription,
}: MainProps) => {
  const classes = useStyles();

  return (
    <div>
      <CardContent>
        <Grid container direction="row">
          <Grid item>
            {' '}
            <TextField
              className={classes.textField}
              size="small"
              id="outlined-basic"
              label={isError ? errorName : 'Amount to add'}
              error={isError}
              helperText={isError ? errorDescription : null}
              type="number"
              variant="outlined"
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">options</InputAdornment>,
              }}
            />{' '}
          </Grid>
          <Grid item>
            {' '}
            <Button variant="contained" disableElevation size="small" className={classes.maxButton}>
              {' '}
              Max{' '}
            </Button>{' '}
          </Grid>
        </Grid>
        <List disablePadding>
          {/* {type.includes(TradePosition.CREDIT) ? (
            //TODO: replace price with dynamic data
            <SellCheckout price={'10'} collateral={'USDC'} input={input} strike={strike} inputSelector={'complex'} />
          ) : (
            //TODO: replace price with dynamic data
            <BuyCheckout price={'10'} input={input} inputSelector={'complex'} />
          )} */}
        </List>
      </CardContent>
      <CardActions>
        <Button
          className={classes.bottomButton}
          fullWidth
          variant="contained"
          color="primary"
          disableElevation
          size="medium"
          onClick={handleNext}
        >
          Submit Order
        </Button>
      </CardActions>
    </div>
  );
};

export default Main;
