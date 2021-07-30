import React from 'react';
import { makeStyles, createStyles, Theme, withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';

const useStyles = makeStyles({
  table: {
    minWidth: 0,
    minHeight: 471, //TODO, 5 row baseline of 402: 402 + (69 * (numRows-5))
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

const StyledTableCell = withStyles((theme: Theme) =>
  createStyles({
    head: {
      backgroundColor: theme.palette.primary.light,
    },
  }),
)(TableCell);

function createData(strike: number) {
  return { strike };
}

const rows = [createData(170), createData(180), createData(190), createData(200), createData(210), createData(220)];

const EnhancedTableToolbar = () => {
  const classes = useToolbarStyles();

  return (
    <Toolbar>
      <Typography className={classes.title} variant="h6" id="tableTitle" component="div" align="center"></Typography>
    </Toolbar>
  );
};

type StrikesProps = {
  underlying: any;
  expiry: any;
};

const Strikes = ({ underlying, expiry }: StrikesProps) => {
  const classes = useStyles();

  return (
    <TableContainer component={Paper}>
      <EnhancedTableToolbar />
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <Tooltip title="Price at which the option can be exercised" placement="top">
              <StyledTableCell>Strike</StyledTableCell>
            </Tooltip>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, id) => (
            <TableRow key={id}>
              <StyledTableCell style={{ backgroundColor: '#D3EFE7' }} align="center" component="th" scope="row">
                {row.strike}
              </StyledTableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Strikes;
