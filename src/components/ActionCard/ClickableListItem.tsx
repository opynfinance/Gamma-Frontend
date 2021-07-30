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
  link: {
    fontSize: 14,
    padding: 0,
    paddingLeft: '3px',
    cursor: 'pointer',
    color: '#828282',
    textDecoration: 'underline',
  },
  error: {
    fontSize: 14,
    color: '#FF5733',
  },
}));

const ClickableItem = ({
  label,
  value,
  symbol,
  onClick,
  isError,
}: {
  label: string;
  value?: string;
  symbol?: string;
  onClick?: any;
  isError?: boolean;
}) => {
  const classes = useStyles();
  return (
    <ListItem className={classes.text}>
      <ListItemText primary={<Typography className={classes.text}>{label}</Typography>} />
      {value ? (
        <Typography component="div" style={{ display: 'flex' }} className={isError ? classes.error : classes.text}>
          {value}{' '}
          <Typography className={classes.link} onClick={onClick}>
            {symbol}
          </Typography>
        </Typography>
      ) : null}
    </ListItem>
  );
};

export default ClickableItem;
