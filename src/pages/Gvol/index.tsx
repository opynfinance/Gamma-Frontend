import React from 'react';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import PageBox from '../../components/PageBox';
import Footer from '../../components/Footer';

const useStyles = makeStyles(() =>
  createStyles({
    mainSection: {
      display: 'flex',
      minHeight: 'calc(100vh - 100px)',
      flexDirection: 'column',
    },
    iframeContainer: {
      overflow: 'hidden',
      paddingTop: '56.25%',
      position: 'relative',
    },
    gvolFrame: {
      border: '0',
      height: '100%',
      left: '0',
      position: 'absolute',
      top: '0',
      width: '100%',
    },
    header: {
      paddingTop: '20px',
      paddingBottom: '20px',
    },
  }),
);

const Gvol: React.FC = () => {
  const classes = useStyles();

  return (
    <PageBox>
      <div className={classes.mainSection}>
        <Typography variant="body1" className={classes.header}>
          Centralized options trading analytics from <a href="https://gvol.io/">Genesis Volatility</a> to provide
          additional information for traders.
        </Typography>
        <div className={classes.iframeContainer}>
          <iframe
            title="Genesis Volatility Analytics"
            className={classes.gvolFrame}
            src="https://defi.gvol.io/?pri=4dc3a0&sec=c1c2c2&thi=d3efe7"
          />
        </div>
      </div>
      <Footer />
    </PageBox>
  );
};

export default Gvol;
