import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import { RewardsBlog } from '../../utils/constants';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    wrapper: {
      display: 'flex',
      marginLeft: '-20px',
      marginRight: '-20px',
    },
    banner: {
      backgroundColor: '#d2efe6',
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 20,
      paddingRight: 20,
      color: theme.palette.grey[900],
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(0),
      top: theme.spacing(0),
      color: theme.palette.grey[900],
    },
  }),
);

export default function ButtonAppBar() {
  const classes = useStyles();

  const [anchorEl, setAnchorEl] = React.useState<boolean>(localStorage.getItem('hideBannerReward') ? false : true);

  const handleClose = () => {
    localStorage.setItem('hideBannerReward', true.toString());
    setAnchorEl(false);
  };

  return (
    <div className={classes.wrapper}>
      {anchorEl && (
        <AppBar position="relative" elevation={0} className={classes.banner}>
          <Typography align="center">
            <span role="img" aria-label="opyn">
              🍄
            </span>
            {} We are running a USDC Liquidity Rewards Program. {}
            <Link href={RewardsBlog} target="_blank" color="primary">
              Learn More
            </Link>
            <IconButton aria-label="close" className={classes.closeButton} onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Typography>
        </AppBar>
      )}
    </div>
  );
}
