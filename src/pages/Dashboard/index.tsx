import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@material-ui/core/Box';
import Hidden from '@material-ui/core/Hidden';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { NavLink } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import ActiveIcon from '@material-ui/icons/OfflineBoltOutlined';
import LimitIcon from '@material-ui/icons/AccessAlarm';
import DeleteIcon from '@material-ui/icons/DeleteOutlined';
import ClosedIcon from '@material-ui/icons/HighlightOffOutlined';
import Card from '@material-ui/core/Card';
import { orange } from '@material-ui/core/colors';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import KeyboardArrowDownOutlinedIcon from '@material-ui/icons/KeyboardArrowDownOutlined';
import NotificationsIcon from '@material-ui/icons/Notifications';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import IconButton from '@material-ui/core/IconButton';
import { Route, Switch, useLocation } from 'react-router';

import AssetCard, { CurrentPrices } from '../../components/AssetCard';
import { useWallet } from '../../hooks';
import { useActiveAndClosedPositions } from '../../hooks/useActiveAndClosedPositions';
import ActivePositions from '../../components/Positions/activepositions';
import LimitOrders from '../../components/Positions/limitOrders';
import ExpiredPositions from '../../components/Positions/expiredPositions';
import ClosedPositions from '../../components/Positions/closedpositions';
import { SecondaryButton } from '../../components/Buttons';
import usePositionHealth from '../../hooks/usePositionHealth';
import { ActivePositionWithPNL, VaultStatus } from '../../types';
import SafeIcon from '../../img/vault/icn-vault-safe.svg';
import DangerousIcon from '../../img/vault/icn-vault-dangerous.svg';
import WarningIcon from '../../img/vault/icn-vault-warning.svg';
import LiquidatedIcon from '../../img/vault/icn-vault-liquidated.svg';
import { useQueryParams } from '../../hooks/useQueryParams';
import useFcm from '../../hooks/useFcm';
import { PrimaryButton } from '../../components/Buttons';

const useStyles = makeStyles(theme =>
  createStyles({
    sideNav: {
      backgroundColor: theme.palette.background.paper,
      width: '13rem',
      position: 'fixed',
      minHeight: '100%',
      padding: theme.spacing(2),
      boxSizing: 'border-box',
    },
    tradeHome: {
      backgroundColor: theme.palette.background.default,
      width: '100%',
      marginLeft: '13rem',
      padding: theme.spacing(1),
      [theme.breakpoints.down('sm')]: {
        marginLeft: 0,
      },
    },
    root: {
      color: theme.palette.text.primary,
    },
    navMenu: {
      marginTop: theme.spacing(2),
    },
    navLink: {
      color: theme.palette.text.secondary,
      textDecoration: 'none',
      marginTop: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
    },
    navLinkActive: {
      color: theme.palette.primary.main,
    },
    navIcon: {
      fontSize: '1rem',
      marginRight: theme.spacing(0.5),
    },
    button: {
      background: theme.palette.background.paper,
      width: '100%',
      marginBottom: theme.spacing(1),
    },
    menuItem: {
      width: '100%',
    },
    widgets: {
      marginBottom: theme.spacing(2),
      display: 'flex',
    },
  }),
);

const Dashboard: React.FC = () => {
  const classes = useStyles();
  const { address: account } = useWallet();
  const { activePositions, closedPositions, expiredPositions, untradedPositions } = useActiveAndClosedPositions(
    account,
  );
  const activePositionWithHealth = usePositionHealth(activePositions);
  const untradedPositionsWithHealth = usePositionHealth(untradedPositions as any);

  const [selectedPosition, setSelectedPosition] = useState('');

  const handleRowClick = useCallback(
    (id: string | undefined) => {
      const positionId = selectedPosition !== id && id !== undefined ? id : '';
      setSelectedPosition(positionId);
    },
    [selectedPosition],
  );

  return (
    <Box display="flex" className={classes.root}>
      <Hidden smDown>
        <Box className={classes.sideNav}>
          <AssetCard />
          <Box className={classes.navMenu}>
            <PositionSelector />
          </Box>
        </Box>
      </Hidden>
      <Box className={classes.tradeHome}>
        <Hidden mdUp>
          <PositionSelector />
        </Hidden>
        <Hidden smDown>
          <Box className={classes.widgets}>
            <CurrentPrices />
            <VaultHealth positions={activePositionWithHealth} />
          </Box>
        </Hidden>
        <Switch>
          <Route exact path="/dashboard">
            <ActivePositions
              activePositions={activePositionWithHealth}
              handleRowClick={handleRowClick}
              selectedId={selectedPosition}
              untradedPositions={untradedPositionsWithHealth}
            />
          </Route>
          <Route exact path="/dashboard/limit">
            <LimitOrders
              activePositions={activePositions}
              handleRowClick={handleRowClick}
              selectedId={selectedPosition}
            />
          </Route>
          <Route exact path="/dashboard/expired">
            <ExpiredPositions
              expiredPositions={expiredPositions}
              handleRowClick={handleRowClick}
              selectedId={selectedPosition}
            />
          </Route>
          <Route exact path="/dashboard/closed">
            <ClosedPositions closedPositions={closedPositions} handleRowClick={() => console.log('')} selectedId={''} />
          </Route>
        </Switch>
      </Box>
    </Box>
  );
};

const PositionSelector: React.FC = () => {
  const classes = useStyles();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<(EventTarget & HTMLButtonElement) | null>();
  const [selectedPosition, setSelectedPosition] = useState<String | null>();

  const handleMenuItemClick = () => {
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (location.pathname.includes('limit')) {
      setSelectedPosition('Limit Orders');
    } else if (location.pathname.includes('expired')) {
      setSelectedPosition('Expired Positions');
    } else if (location.pathname.includes('closed')) {
      setSelectedPosition('Closed Positions');
    } else {
      setSelectedPosition('Active Positions');
    }
  }, [location]);

  return (
    <>
      <Hidden smDown>
        <NavLink exact to="/dashboard" className={classes.navLink} activeClassName={classes.navLinkActive}>
          <ActiveIcon fontSize="small" className={classes.navIcon} />
          <Typography variant="body1">Active Positions</Typography>
        </NavLink>
        <NavLink to="/dashboard/limit" className={classes.navLink} activeClassName={classes.navLinkActive}>
          <LimitIcon fontSize="small" className={classes.navIcon} />
          <Typography variant="body1">Limit Orders</Typography>
        </NavLink>
        <NavLink to="/dashboard/expired" className={classes.navLink} activeClassName={classes.navLinkActive}>
          <DeleteIcon fontSize="small" className={classes.navIcon} />
          <Typography variant="body1">Expired</Typography>
        </NavLink>
        <NavLink to="/dashboard/closed" className={classes.navLink} activeClassName={classes.navLinkActive}>
          <ClosedIcon fontSize="small" className={classes.navIcon} />
          <Typography variant="body1">Closed</Typography>
        </NavLink>
      </Hidden>
      <Hidden mdUp>
        <SecondaryButton
          onClick={evt => setAnchorEl(evt.currentTarget)}
          className={classes.button}
          endIcon={<KeyboardArrowDownOutlinedIcon color="primary" />}
        >
          {selectedPosition}
        </SecondaryButton>
        <Menu
          id="position-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
          className={classes.menuItem}
          classes={{ paper: classes.menuItem }}
        >
          <MenuItem onClick={() => handleMenuItemClick()} className={classes.menuItem}>
            <NavLink exact to="/dashboard" className={classes.navLink} activeClassName={classes.navLinkActive}>
              <ActiveIcon fontSize="small" className={classes.navIcon} />
              <Typography variant="body1">Active Positions</Typography>
            </NavLink>
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick()} className={classes.menuItem}>
            <NavLink to="/dashboard/limit" className={classes.navLink} activeClassName={classes.navLinkActive}>
              <LimitIcon fontSize="small" className={classes.navIcon} />
              <Typography variant="body1">Limit Orders</Typography>
            </NavLink>
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick()} className={classes.menuItem}>
            <NavLink to="/dashboard/expired" className={classes.navLink} activeClassName={classes.navLinkActive}>
              <DeleteIcon fontSize="small" className={classes.navIcon} />
              <Typography variant="body1">Expired Positions</Typography>
            </NavLink>
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick()} className={classes.menuItem}>
            <NavLink to="/dashboard/closed" className={classes.navLink} activeClassName={classes.navLinkActive}>
              <ClosedIcon fontSize="small" className={classes.navIcon} />
              <Typography variant="body1">Closed Positions</Typography>
            </NavLink>
          </MenuItem>
        </Menu>
      </Hidden>
    </>
  );
};

export default Dashboard;

const useHealthStyles = makeStyles(theme =>
  createStyles({
    currentAssetCard: {
      minWidth: '20rem',
      padding: theme.spacing(1),
      marginLeft: theme.spacing(1),
    },
    title: {
      fontWeight: theme.typography.fontWeightBold,
    },
    danger: {
      color: theme.palette.error.main,
    },
    safe: {
      color: theme.palette.success.main,
    },
    liquidated: {
      color: theme.palette.text.secondary,
    },
    warning: {
      color: orange[500],
    },
    vaultItem: {
      display: 'flex',
      alignItems: 'center',
      marginTop: theme.spacing(1),
      justifyContent: 'space-between',
    },
    img: {
      marginRight: theme.spacing(1),
      height: 20,
      width: 20,
    },
    healthItem: {
      display: 'flex',
      alignItems: 'center',
    },
    linkTxt: {
      textDecoration: 'none',
      color: theme.palette.primary.main,
      marginRight: theme.spacing(1),
    },
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paper: {
      backgroundColor: theme.palette.background.paper,
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4),
      borderRadius: theme.spacing(1),
      width: '40rem',
    },
    modelItemTitle: {
      marginTop: theme.spacing(2),
    },
  }),
);

const VaultHealth: React.FC<{ positions: Array<ActivePositionWithPNL> }> = ({ positions }) => {
  const classes = useHealthStyles();
  const queryParams = useQueryParams();
  const filter = queryParams.get('filter');
  const { notificationGranted, enableNotification, isNotificationSupported } = useFcm();

  const [notificationModalOpened, setNotificationModalOpened] = useState(false);

  const healthDetails = useMemo(() => {
    return positions.reduce(
      (acc, position) => {
        if (position.vaultStatus !== undefined) {
          const key =
            position.vaultStatus === VaultStatus.DANGER
              ? 'danger'
              : position.vaultStatus === VaultStatus.WARNING
              ? 'warning'
              : position.vaultStatus === VaultStatus.SAFE
              ? 'safe'
              : 'liquidated';
          acc[key] = acc[key] + 1;
        }
        return acc;
      },
      { safe: 0, warning: 0, danger: 0, liquidated: 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions.length]);

  return (
    <Card className={classes.currentAssetCard}>
      <div className={classes.vaultItem}>
        <Typography variant="subtitle1" className={classes.title}>
          Vault Health
        </Typography>
        {!notificationGranted && isNotificationSupported ? (
          <IconButton onClick={() => setNotificationModalOpened(true)}>
            <NotificationsIcon />
          </IconButton>
        ) : null}
        {filter ? (
          <NavLink to="/dashboard" className={classes.linkTxt}>
            <Typography variant="caption">Clear filter</Typography>
          </NavLink>
        ) : null}
      </div>
      <div className={classes.vaultItem}>
        <div className={classes.healthItem}>
          <img src={DangerousIcon} className={classes.img} alt="danger icon" />
          <Typography className={classes.danger}>{healthDetails.danger} Dangerous</Typography>
        </div>
        <NavLink to="/dashboard?filter=danger" className={classes.linkTxt}>
          <Typography variant="caption">View</Typography>
        </NavLink>
      </div>
      <div className={classes.vaultItem}>
        <div className={classes.healthItem}>
          <img src={WarningIcon} className={classes.img} alt="vault icon" />
          <Typography className={classes.warning}>{healthDetails.warning} Warning</Typography>
        </div>
        <NavLink to="/dashboard?filter=warning" className={classes.linkTxt}>
          <Typography variant="caption">View</Typography>
        </NavLink>
      </div>
      <div className={classes.vaultItem}>
        <div className={classes.healthItem}>
          <img src={SafeIcon} className={classes.img} alt="vault icon" />
          <Typography className={classes.safe}>{healthDetails.safe} Safe</Typography>
        </div>
        <NavLink to="/dashboard?filter=safe" className={classes.linkTxt}>
          <Typography variant="caption">View</Typography>
        </NavLink>
      </div>
      <div className={classes.vaultItem}>
        <div className={classes.healthItem}>
          <img src={LiquidatedIcon} className={classes.img} alt="vault icon" />
          <Typography className={classes.liquidated}>{healthDetails.liquidated} Liquidated</Typography>
        </div>
        <NavLink to="/dashboard?filter=liquidated" className={classes.linkTxt}>
          <Typography variant="caption">View</Typography>
        </NavLink>
      </div>
      <Modal
        aria-labelledby="enable-notification"
        open={notificationModalOpened}
        className={classes.modal}
        onClose={() => setNotificationModalOpened(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={notificationModalOpened}>
          <div className={classes.paper}>
            <Typography variant="h6" className={classes.title}>
              Enable notification
            </Typography>
            <Typography variant="body1">
              Get in-browser notifications when your vault nears liquidation. Note that these notifications will only
              appear when your browser is open.
            </Typography>
            <Typography variant="body2" className={classes.modelItemTitle}>
              Click on the enable button.
            </Typography>
            <Typography variant="body2">
              If that does not work, Click on the info button near address bar and allow notification.
            </Typography>
            <PrimaryButton className={classes.modelItemTitle} size="small" onClick={() => enableNotification()}>
              Enable
            </PrimaryButton>
          </div>
        </Fade>
      </Modal>
    </Card>
  );
};
