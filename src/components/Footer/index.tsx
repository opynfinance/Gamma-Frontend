import React from 'react';
import { createStyles, makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Tab from '@material-ui/core/Tab';
import Grid from '@material-ui/core/Grid';
import TwitterIcon from '@material-ui/icons/Twitter';
import GitHubIcon from '@material-ui/icons/GitHub';
import ChatBubbleIcon from '@material-ui/icons/ChatBubble';

import {
  FAQ,
  Security,
  Terms,
  Privacy,
  Docs,
  Defipulse,
  Twitter,
  Github,
  Discord,
  Medium,
  careers,
} from '../../utils/constants';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: 12,
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    buttonColor: {
      color: '#BDBDBD',
    },
    typography: {
      flexGrow: 1,
    },
    fixedbar: {
      paddingLeft: '1%',
      paddingRight: '1%',
      width: '98%',
      bottom: 0,
      background: 'transparent',
      boxShadow: 'none',
    },
    bar: {
      padding: '1%',
      background: 'transparent',
      boxShadow: 'none',
    },
    tabText: {
      textDecoration: 'none',
    },
  }),
);

const AntTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      minWidth: 72,
      fontWeight: theme.typography.fontWeightRegular,
      color: '#BDBDBD',
      marginLeft: theme.spacing(1),
      fontSize: 14,
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

export default function Footer({ sticky = true }: { sticky?: boolean }) {
  const classes = useStyles();

  // `;
  return (
    <div className={sticky ? classes.fixedbar : classes.root}>
      <AppBar position="static" className={classes.bar}>
        <Toolbar>
          <Grid container direction="row" justify="space-between">
            <Grid>
              <a href={Docs} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                {' '}
                <AntTab label="Developers" />{' '}
              </a>
              <a href={Medium} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                {' '}
                <AntTab label="Blog" />{' '}
              </a>
              <a href={FAQ} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                {' '}
                <AntTab label="FAQ" />{' '}
              </a>
              <a href={Security} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                {' '}
                <AntTab label="Security" />{' '}
              </a>
              <a href={Defipulse} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                {' '}
                <AntTab label="DeFi Pulse" />{' '}
              </a>

              <a href={Terms} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                {' '}
                <AntTab label="Terms" />{' '}
              </a>

              <a href={Privacy} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                {' '}
                <AntTab label="Privacy Policy" />{' '}
              </a>

              <a href={careers} target="_blank" rel="noopener noreferrer" className={classes.tabText}>
                {' '}
                <AntTab label="Careers" />{' '}
              </a>
            </Grid>
            <Grid>
              <IconButton target="_blank" href={Twitter} rel="noopener noreferrer" className={classes.buttonColor}>
                <TwitterIcon />
              </IconButton>
              <IconButton target="_blank" href={Github} rel="noopener noreferrer" className={classes.buttonColor}>
                <GitHubIcon />
              </IconButton>
              <IconButton target="_blank" href={Discord} rel="noopener noreferrer" className={classes.buttonColor}>
                <ChatBubbleIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    </div>
  );
}
