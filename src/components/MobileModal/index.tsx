import React from 'react';
import Drawer from '@material-ui/core/Drawer';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import BackIcon from '@material-ui/icons/KeyboardBackspace';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      zIndex: theme.zIndex.appBar - 1,
      width: '100%',
      height: '100%',
      paddingTop: theme.spacing(7),
      overflow: 'auto',
      padding: theme.spacing(1),
    },
    headerBox: {
      display: 'flex',
      alignItems: 'center',
    },
    contentBox: {
      padding: theme.spacing(1),
    },
  }),
);

type ModalProps = {
  onBackPress: () => void;
  show: boolean;
  title?: string;
};

const MobileModal: React.FC<ModalProps> = ({ show, onBackPress, title, children }) => {
  const classes = useStyles();

  return (
    <Drawer variant="persistent" open={show} onClose={onBackPress} anchor="bottom" classes={{ paper: classes.root }}>
      <Box className={classes.headerBox}>
        <IconButton onClick={onBackPress}>
          <BackIcon />
        </IconButton>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Box className={classes.contentBox}>{children}</Box>
    </Drawer>
  );
};

export default MobileModal;
