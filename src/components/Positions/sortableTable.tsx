import React, { useState, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TablePagination from '@material-ui/core/TablePagination';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme =>
  createStyles({
    table: {
      minWidth: 650,
      [theme.breakpoints.down('sm')]: {
        minWidth: 0,
      },
    },
    tableRow: {
      '&$selected, &$selected:hover': {
        backgroundColor: '#E0E0E0',
      },
    },
    tableCellHeader: {
      backgroundColor: theme.palette.background.paper,
    },
    title: {
      paddingLeft: theme.spacing(1),
    },
    hover: {},
    selected: {},
    headerBox: {
      display: 'flex',
      padding: theme.spacing(1),
      justifyContent: 'space-between',
    },
  }),
);

type Orders = 'desc' | 'asc';

function descendingComparator(a: any, b: any, orderBy: any) {
  const elementA = a[orderBy];
  const elementB = b[orderBy];
  // sorting boolean
  if (typeof elementA === 'boolean') {
    if (elementA === elementB) return 0;
    if (a[orderBy]) return 1;
    return -1;
  }
  // sorting bigNumber
  if (elementA instanceof BigNumber) {
    if (elementB.lt(elementA)) return -1;
    if (elementB.gt(elementA)) return 1;
    return 0;
  }

  // sort by ERC20 object
  if (elementA?.symbol) {
    if (elementB.symbol < elementA.symbol) return -1;
    if (elementB.symbol > elementA.symbol) return 1;
  }
  // default sorting
  if (elementB < elementA) return -1;
  if (elementB > elementA) return 1;
  return 0;
}

function getComparator(order: Orders, orderBy: any) {
  return order === 'desc'
    ? (a: any, b: any) => descendingComparator(a, b, orderBy)
    : (a: any, b: any) => -descendingComparator(a, b, orderBy);
}

function stableSort(array: any[], comparator: Function) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

type HeadCell = {
  id: string;
  label: string;
  tooltip: string | null;
  sortable: boolean;
};

type SortableTableProps = {
  headCells: HeadCell[];
  rows: any[];
  renderRow: any;
  title?: string;
  selectable?: boolean;
  selectAll?: (selected: boolean) => void;
  selectedCount?: Number;
  header?: JSX.Element;
};

const SortableTable = ({
  headCells,
  rows,
  renderRow,
  title,
  selectable,
  selectAll,
  selectedCount,
  header,
}: SortableTableProps) => {
  const classes = useStyles();

  const [order, setOrder] = useState<Orders>('asc');
  const [orderBy, setOrderBy] = useState('expiry');

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [page, setPage] = useState(0);

  const handleRequestSort = (event: any, property: any) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property: any) => (event: any) => {
    handleRequestSort(event, property);
  };

  const handleChangeRowsPerPage = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return (
    <Card>
      <TableContainer>
        <Box className={classes.headerBox}>
          <Typography variant="h6" className={classes.title}>
            {title}
          </Typography>
          {header}
        </Box>
        <Table className={classes.table} aria-label="Position table" stickyHeader>
          <TableHead>
            <TableRow>
              {selectable ? (
                <TableCell className={classes.tableCellHeader} key="select">
                  <Checkbox
                    onChange={() => selectAll?.(selectedCount !== rows.length)}
                    checked={selectedCount === rows.length}
                    color="primary"
                  />
                </TableCell>
              ) : null}
              {headCells.map(headCell => (
                <Tooltip title={headCell.tooltip || ''} placement="top" key={headCell.id}>
                  <TableCell
                    className={classes.tableCellHeader}
                    key={headCell.id}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {' '}
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={createSortHandler(headCell.id)}
                      >
                        {' '}
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                </Tooltip>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {stableSort(rows, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(renderRow)}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.length > rowsPerPage && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={(event, newPage) => setPage(newPage)}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      )}
    </Card>
  );
};

export default SortableTable;
