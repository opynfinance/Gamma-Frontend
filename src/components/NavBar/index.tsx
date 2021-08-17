import React, { useCallback, useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Drawer from '@material-ui/core/Drawer';
import Box from '@material-ui/core/Box';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import WalletIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import IconButton from '@material-ui/core/IconButton';
import TradeIcon from '@material-ui/icons/Timeline';
import Dashboard from '@material-ui/icons/DashboardOutlined';
import Moon from '@material-ui/icons/Brightness4';
import Sun from '@material-ui/icons/Brightness7';
import clsx from 'clsx';

import WalletSelector from '../WalletSelector';
import { NavLink } from 'react-router-dom';
import logo from '../../img/logo.svg';
import logoDark from '../../img/logo_dark.svg';
import Rewards from '../../img/nav/rewards.svg';
import Analytics from '../../img/nav/analytics.svg';
import V1 from '../../img/nav/v1.svg';
import Faq from '../../img/nav/faq.svg';
import discord from '../../img/nav/discord.svg';
import github from '../../img/nav/github.svg';
import twitter from '../../img/nav/twitter.svg';
import { ClaimRewards, FAQ, v1 } from '../../utils/constants';
import AssetCard from '../AssetCard';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    bar: {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      boxShadow: 'none',
    },
    logo: {
      height: '60px',
    },
    navLink: {
      textDecoration: 'none',
      color: theme.palette.text.secondary,
      margin: theme.spacing(1, 2),
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      [theme.breakpoints.down('md')]: {
        margin: theme.spacing(2, 2),
      },
    },
    navLinkActive: {
      color: theme.palette.primary.main,
      '& p': {
        fontWeight: '500',
      },
    },
    navItems: {
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'flex-end',
      margin: theme.spacing(1),
    },
    menuText: {
      flexGrow: 1,
      display: 'flex',
      margin: theme.spacing(0.5),
      fontSize: 14,
    },
    navImg: {
      marginRight: theme.spacing(1),
      color: theme.palette.grey[600],
    },
    firstNav: {
      marginLeft: '9rem',
      [theme.breakpoints.down('sm')]: {
        marginLeft: '2rem',
      },
    },
    drawerBox: {
      margin: theme.spacing(1),
    },
    walletClose: {
      position: 'absolute',
      right: theme.spacing(2),
    },
    bottomOptions: {
      position: 'absolute',
      bottom: 10,
    },
  }),
);

type NavBarTypes = {
  mode: string;
  setMode: (mode: string) => void;
};

export default function NavBar({ mode, setMode }: NavBarTypes) {
  const classes = useStyles();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [walletOpened, setWalletOpened] = useState(false);

  return (
    <AppBar className={classes.bar}>
      <Toolbar>
        <NavLink to="/">
          <img src={mode === 'light' ? logo : logoDark} alt="Opyn" className={classes.logo} />
        </NavLink>
        <Hidden xsDown>
          <NavLink
            exact
            to="/"
            className={clsx(classes.navLink, classes.firstNav)}
            activeClassName={classes.navLinkActive}
          >
            <Typography variant="body1">Trade</Typography>
          </NavLink>
          <NavLink to="/dashboard" className={classes.navLink} activeClassName={classes.navLinkActive}>
            <Typography variant="body1">Dashboard</Typography>
          </NavLink>
        </Hidden>

        <Hidden mdDown>
          <div className={classes.navItems}>
            <WalletSelector />
            <Hidden lgUp>
              <IconButton onClick={() => setWalletOpened(true)}>
                <WalletIcon />
              </IconButton>
            </Hidden>
          </div>
        </Hidden>

        <Hidden lgUp>
          <div className={classes.navItems}>
            <IconButton onClick={() => setWalletOpened(true)}>
              <WalletIcon />
            </IconButton>
          </div>
        </Hidden>

        <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
          {mode === 'light' ? <Moon color="action" /> : <Sun color="action" />}
        </IconButton>

        <IconButton onClick={() => setDrawerOpened(true)}>
          <MenuIcon />
        </IconButton>

        <Drawer anchor="right" open={drawerOpened} onClose={() => setDrawerOpened(false)}>
          <Box className={classes.drawerBox}>
            <Hidden lgUp>
              <WalletSelector buttonClicked={useCallback(() => setDrawerOpened(false), [setDrawerOpened])} />
            </Hidden>
            <Hidden smUp>
              <NavLink
                exact
                to="/"
                className={classes.navLink}
                activeClassName={classes.navLinkActive}
                onClick={() => setDrawerOpened(false)}
              >
                <TradeIcon className={classes.navImg} fontSize="small" />
                <Typography className={classes.menuText} variant="body1">
                  Trade
                </Typography>
              </NavLink>
              <NavLink
                to="/dashboard"
                className={classes.navLink}
                activeClassName={classes.navLinkActive}
                onClick={() => setDrawerOpened(false)}
              >
                <Dashboard className={classes.navImg} fontSize="small" />
                <Typography className={classes.menuText} variant="body1">
                  Dashboard
                </Typography>
              </NavLink>
            </Hidden>
            <a href={ClaimRewards} target="_blank" rel="noopener noreferrer" className={classes.navLink}>
              <img src={Rewards} alt="Rewards" className={classes.navImg} />
              <Typography className={classes.menuText} variant="body1">
                Claim Rewards
              </Typography>
            </a>
            <a href={FAQ} target="_blank" rel="noopener noreferrer" className={classes.navLink}>
              <img src={Faq} alt="Rewards" className={classes.navImg} />
              <Typography className={classes.menuText} variant="body1">
                FAQ
              </Typography>
            </a>
            <NavLink
              to="/gvol"
              className={classes.navLink}
              activeClassName={classes.navLinkActive}
              onClick={() => setDrawerOpened(false)}
            >
              <img src={Analytics} alt="Rewards" className={classes.navImg} />
              <Typography className={classes.menuText} variant="body1">
                Option Analytics
              </Typography>
            </NavLink>
            <a href={v1} target="_blank" rel="noopener noreferrer" className={classes.navLink}>
              <img src={V1} alt="Rewards" className={classes.navImg} />
              <Typography className={classes.menuText} variant="body1">
                Opyn V1
              </Typography>
            </a>
            <Box className={classes.bottomOptions}>
              <a
                href="http://tiny.cc/opyndiscord"
                target="_blank"
                rel="noopener noreferrer"
                className={classes.navLink}
              >
                <Typography className={classes.menuText} variant="body1">
                  Chat with us
                </Typography>
              </a>
              <a
                href="https://opyn.gitbook.io/opyn/security"
                target="_blank"
                rel="noopener noreferrer"
                className={classes.navLink}
              >
                <Typography className={classes.menuText} variant="body1">
                  Security
                </Typography>
              </a>
              <a
                href="https://opyn.gitbook.io/opyn/getting-started/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className={classes.navLink}
              >
                <Typography className={classes.menuText} variant="body1">
                  Developer
                </Typography>
              </a>
              <a href="https://medium.com/opyn" target="_blank" rel="noopener noreferrer" className={classes.navLink}>
                <Typography className={classes.menuText} variant="body1">
                  Blog
                </Typography>
              </a>
              <a
                href="https://angel.co/company/opyn-4/jobs"
                target="_blank"
                rel="noopener noreferrer"
                className={classes.navLink}
              >
                <Typography className={classes.menuText} variant="body1">
                  Careers
                </Typography>
              </a>
              <Box style={{ display: 'flex' }}>
                <a
                  href="https://twitter.com/opyn_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.navLink}
                >
                  <img src={twitter} alt="twitter" className={classes.navImg} />
                </a>
                <a
                  href="https://github.com/opynfinance/GammaProtocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.navLink}
                >
                  <img src={github} alt="github" className={classes.navImg} />
                </a>
                <a
                  href="https://discord.gg/2NFdXaE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.navLink}
                >
                  <img src={discord} alt="discord" className={classes.navImg} />
                </a>
              </Box>
            </Box>
          </Box>
        </Drawer>

        <Drawer anchor="bottom" open={walletOpened} onClose={() => setWalletOpened(false)}>
          <Box className={classes.drawerBox}>
            <IconButton onClick={() => setWalletOpened(false)} className={classes.walletClose}>
              <CloseIcon color="primary" />
            </IconButton>
            <AssetCard />
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}
