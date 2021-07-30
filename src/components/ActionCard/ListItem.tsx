import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const useStyles = makeStyles(theme => ({
  text: {
    fontSize: 14,
    padding: 0,
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 14,
    padding: 0,
  },
  error: {
    fontSize: 14,
    color: '#FF5733',
  },
}));

const Item = ({
  label,
  value,
  bold = false,
  isError,
}: {
  label: string;
  value?: string;
  bold?: boolean;
  isError?: boolean;
}) => {
  const classes = useStyles();
  return (
    <ListItem className={classes.text}>
      <ListItemText primary={<Typography className={bold ? classes.bold : classes.text}>{label}</Typography>} />
      {value ? (
        <Typography className={isError ? classes.error : bold ? classes.bold : classes.text}>{value}</Typography>
      ) : null}
    </ListItem>
  );
};

export default Item;
