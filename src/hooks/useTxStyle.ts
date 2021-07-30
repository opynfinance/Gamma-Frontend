import { createStyles, makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => createStyles({
  txBox: {
    borderRadius: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
  txCard: {
    backgroundColor: theme.palette.background.lightStone,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(0.5, 0.5, 0, 0),
  },
  txConsolidated: {
    backgroundColor: theme.palette.background.stone,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0, 0, 0.5, 0.5),
  },
}));

export function useTxStyle() {
  const classes = useStyles();

  return classes;
}
