import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';

import { OToken } from '../../types';

const useStyles = makeStyles({
  table: {
    minWidth: 800,
    maxWidth: 1288,
    marginLeft: 24,
    marginTop: 16,
  },
});

const useToolbarStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(1),
    },
    title: {
      flex: '1 1 100%',
    },
  }),
);

function createData(type: string, amount: string, orderSubmission: string, totalPremium: number, unitPremium: number) {
  return { type, amount, orderSubmission, totalPremium, unitPremium };
}

const rows = [
  createData('Sell Put', '10', 'July 22, 2020 4:00PM UTC', 104.4, 10.44),
  createData('Buy Put', '10', 'July 20, 2020 4:00PM UTC', 92.4, 92.4),
];

type TradesTableProps = {
  otoken: OToken;
};

const EnhancedTableToolbar = ({ otoken }: TradesTableProps) => {
  const classes = useToolbarStyles();

  const type = otoken.isPut ? 'Put' : 'Call';

  return (
    <Toolbar>
      <Typography className={classes.title} id="tableTitle" component="div" align="left">
        Trades - {otoken.strikePrice.toString()} {new Date(otoken.expiry * 1000).toDateString()}{' '}
        {otoken.underlyingAsset.symbol} {type}
      </Typography>
    </Toolbar>
  );
};

const TradesTable = ({ otoken }: TradesTableProps) => {
  const classes = useStyles();

  return (
    <div>
      <TableContainer className={classes.table} component={Paper}>
        <EnhancedTableToolbar otoken={otoken} />
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Order Submission</TableCell>
              <Tooltip title="Total premium you either paid / earned" placement="top">
                <TableCell>Total Premium</TableCell>
              </Tooltip>
              <Tooltip title="Premium for a single option" placement="top">
                <TableCell>Unit Premium</TableCell>
              </Tooltip>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.type}>
                <TableCell component="th" scope="row">
                  {row.type}
                </TableCell>
                <TableCell>{row.amount}</TableCell>
                <TableCell>{row.orderSubmission}</TableCell>
                <TableCell>{row.totalPremium}</TableCell>
                <TableCell>{row.unitPremium}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default TradesTable;
