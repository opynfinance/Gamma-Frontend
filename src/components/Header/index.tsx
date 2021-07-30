import React from 'react';
import { createStyles, makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import { NavLink } from 'react-router-dom';
import { HashRouter as Router, useLocation } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Tab from '@material-ui/core/Tab';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Hidden from '@material-ui/core/Hidden';

import logo from '../../img/logo.svg';
import { FAQ, v1, ClaimRewards } from '../../utils/constants';
import WalletSelector from '../WalletSelector';
import Banner from './banner';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    grow: {
      flexGrow: 1,
    },
    bar: {
      background: 'transparent',
      boxShadow: 'none',
      color: '#000000',
    },
    banner: {
      backgroundColor: '#00947c',
      width: '100vw',
      marginLeft: -20,
      paddingTop: 10,
      paddingBottom: 10,
    },
    linkBanner: {
      color: '#d6d6d6',
    },
    tabText: {
      textDecoration: 'none',
      color: '#000000',
    },
    selectedTabText: {
      textDecoration: 'none',
      color: '#4FC2A0',
    },
    logo: {
      marginTop: 12,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
  }),
);

const AntTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      minWidth: 72,
      fontWeight: theme.typography.fontWeightRegular,
      fontSize: 18,
      paddingRight: '1rem',
      paddingLeft: '1rem',
      '&:hover': {
        color: '#4FC2A0',
        opacity: 1,
      },
      '&$selected': {
        color: '#4FC2A0',
        fontWeight: theme.typography.fontWeightMedium,
      },
      '&:focus': {
        color: '#4FC2A0',
      },
    },
    selected: {},
  }),
)(Tab);

export default function ButtonAppBar() {
  const classes = useStyles();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Banner />
      <AppBar position="static" className={classes.bar}>
        <Toolbar disableGutters>
          <Router>
            <NavLink to="/">
              <img className={classes.logo} src={logo} alt="Opyn" />
            </NavLink>

            <Hidden smDown>
              <div className={classes.grow} />
              <NavLink
                to="/trade"
                className={location.pathname === '/trade' ? classes.selectedTabText : classes.tabText}
              >
                <AntTab label="Trade" />
              </NavLink>
              <NavLink
                to="/dashboard"
                className={location.pathname === '/dashboard' ? classes.selectedTabText : classes.tabText}
              >
                <AntTab label="Dashboard" />
              </NavLink>
              <a href={ClaimRewards} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                <AntTab label="Claim Rewards" />
              </a>
              <NavLink to="/gvol" className={location.pathname === '/gvol' ? classes.selectedTabText : classes.tabText}>
                <AntTab label="Option Analytics" />
              </NavLink>
              <a href={FAQ} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                <AntTab label="FAQ" />
              </a>
              <a href={v1} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                <AntTab label="Opyn V1" />
              </a>
            </Hidden>

            <Hidden smUp>
              <div className={classes.grow} />
              <IconButton
                edge="start"
                className={classes.menuButton}
                color="inherit"
                aria-label="menu"
                onClick={handleClick}
              >
                <MenuIcon />
              </IconButton>

              <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItem onClick={handleClose}>
                  <NavLink
                    to="/trade"
                    className={location.pathname === '/dashboard' ? classes.tabText : classes.selectedTabText}
                  >
                    <AntTab label="Trade" />
                  </NavLink>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <NavLink
                    to="/dashboard"
                    className={location.pathname === '/trade' ? classes.tabText : classes.selectedTabText}
                  >
                    <AntTab label="Dashboard" />
                  </NavLink>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <a href={FAQ} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                    <AntTab label="FAQ" />
                  </a>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <a href={v1} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                    <AntTab label="Opyn V1" />
                  </a>
                </MenuItem>
              </Menu>
            </Hidden>
          </Router>
          <Hidden smDown>
            <WalletSelector />
          </Hidden>
        </Toolbar>
      </AppBar>
    </div>
  );
}
