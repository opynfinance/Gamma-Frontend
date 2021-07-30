import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  listItem: {
    padding: theme.spacing(0, 0),
    fontSize: 14,
    color: '#BDBDBD',
  },
  pos: {
    marginTop: 16,
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
  total: {
    fontWeight: 500,
    fontSize: 14,
    color: '#828282',
  },
  notice: {
    marginTop: 16,
    color: '#828282',
    paddingTop: 8,
    paddingBottom: 8,
  },
  step: {
    fontSize: 14,
    color: '#4FC2A0',
    marginTop: 12,
  },
  bar: {
    marginBottom: 12,
  },
  header: {
    fontWeight: 700,
    fontSize: 14,
  },
  actionButtonBox: {
    position: 'fixed',
    zIndex:theme.zIndex.drawer,
    bottom: 0,
    right: 0,
    height: '4rem',
    padding: theme.spacing(1),
    width: '16rem',
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.background.lightStone}`,
    [theme.breakpoints.down('md')]: {
      width: '15rem',
    },
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  }
}));

export function useOrderTicketItemStyle() {
  const classes = useStyles();

  return classes;
}
