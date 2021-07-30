/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Tooltip from '@material-ui/core/Tooltip';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import Typography from '@material-ui/core/Typography';

import { OTokenWithTradeDetail } from '../../types';
import EmptyView from '../EmptyView';
import { AntTab, AntTabs } from '../../components/AntTab';
import { TradeAction } from '../../utils/constants';
import HistoricalPrice from './HistoricalPrice';
import Payout from './Payout';

const useStyles = makeStyles(theme =>
  createStyles({
    container: {
      height: '35vh',
      marginRight: '16rem',
      padding: theme.spacing(1),
      [theme.breakpoints.down('md')]: {
        marginRight: '15rem',
      },
      [theme.breakpoints.down('sm')]: {
        maxWidth: '100%',
        marginRight: '0',
      },
    },
    emptyContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
    selectorCard: {
      marginLeft: theme.spacing(1),
    },
    header: {
      display: 'flex',
      alignItems: 'center',
    },
    tabRoot: {
      minHeight: '20px',
    },
    tabItem: {
      minHeight: '20px',
    },
    info: {
      color: theme.palette.text.secondary,
      marginLeft: theme.spacing(1),
    },
  }),
);

type chartTypes = {
  oTokens: OTokenWithTradeDetail[];
  firstAction: TradeAction;
};

const payout = 3;

const Charts: React.FC<chartTypes> = ({ oTokens, firstAction }) => {
  const classes = useStyles();
  const [tab, setTab] = useState(0);

  return (
    <Card className={classes.container}>
      {oTokens.length ? (
        <div>
          <div className={classes.header}>
            <Card className={classes.selectorCard}>
              <AntTabs
                variant="fullWidth"
                value={tab}
                onChange={(_, val) => setTab(val)}
                aria-label="limit-orders"
                classes={{ root: classes.tabRoot }}
              >
                {oTokens.map((oToken, index) => (
                  <AntTab
                    key={oToken.id}
                    label={oToken.symbol.split('-')[2]}
                    value={index}
                    classes={{ root: classes.tabItem }}
                  />
                ))}
                <AntTab label="Payout" value={payout} classes={{ root: classes.tabItem }} />
              </AntTabs>
            </Card>
            <Tooltip
              title={
                <>
                  <Typography variant="caption" component="p">
                    - Showing payout for one option
                  </Typography>
                  <Typography variant="caption" component="p">
                    - Payout does not include 0x fees
                  </Typography>
                </>
              }
            >
              <InfoIcon className={classes.info} fontSize="small" />
            </Tooltip>
          </div>

          {tab === payout ? (
            <Payout oTokens={oTokens} action={firstAction} />
          ) : (
            <HistoricalPrice oToken={oTokens[tab]} />
          )}
        </div>
      ) : (
        <EmptyView actionTxt="Select an option" />
      )}
    </Card>
  );
};

export default Charts;
