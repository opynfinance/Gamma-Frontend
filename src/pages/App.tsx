import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { createStyles, makeStyles, ThemeProvider } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import getTheme from '../theme';
import { useToast } from '../context/toast';
import Toast from '../components/Toast';
import useLiveOptions from '../hooks/useLiveOptions';
import GA from '../utils/GoogleAnalytics';
import NavBar from '../components/NavBar';
import useFcm from '../hooks/useFcm';

const useStyles = makeStyles(theme =>
  createStyles({
    offset: {
      ...theme.mixins.toolbar,
      minHeight: '64px',
    },
    loadingBox: {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.secondary,
      display: 'flex',
      flexDirection: 'column',
      paddingTop: theme.spacing(3),
      alignItems: 'center',
    },
  }),
);

const Trade = React.lazy(() => import('./Trade'));
const Dashboard = React.lazy(() => import('./Dashboard'));
const Gvol = React.lazy(() => import('./Gvol'));

const RouteLoading: React.FC = () => {
  const classes = useStyles();

  return (
    <Box className={classes.loadingBox}>
      <Typography variant="h6">Loading...</Typography>
    </Box>
  );
};

const App: React.FC = () => {
  const { seriesTokens } = useLiveOptions();
  const classes = useStyles();
  const { message, open, setIsOpen, severity, error } = useToast();
  const { messaging } = useFcm();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(localStorage.getItem('mode') || 'light');
  const [theme, setTheme] = useState(getTheme(mode));

  useEffect(() => {
    setTheme(getTheme(mode));
  }, [mode]);

  useEffect(() => {
    if (!localStorage.getItem('mode')) {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);

  const updateMode = useCallback((mode: string) => {
    setMode(mode);
    localStorage.setItem('mode', mode);
  }, []);

  messaging?.onMessage(payload => {
    console.log('Message received. ', payload);
    const {
      notification: { body },
    } = payload;
    error(body);
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box>
            <NavBar mode={mode} setMode={updateMode} />
          </Box>
          <div className={classes.offset} />
          {GA.init() && <GA.RouteTracker />}
          <Suspense fallback={<RouteLoading />}>
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route exact path="/gvol" component={Gvol} />
              <Route path="/">
                <Trade seriesTokens={seriesTokens} />
              </Route>
            </Switch>
          </Suspense>
        </Router>
        <Toast severity={severity} message={message} open={open} setOpen={setIsOpen} />
      </ThemeProvider>
    </>
  );
};

export default App;
