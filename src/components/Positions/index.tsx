import React, { useState, useCallback, useMemo } from 'react';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import { makeStyles, Theme } from '@material-ui/core/styles';

import ActivePositions from './activepositions';
import ClosedPositions from './closedpositions';
import ExpiredPositions from './expiredPositions';
import PositionDetail from '../PositionDetail';
import EmptyState from './emptyState';
import { AntTab, AntTabs, TabPanel } from '../AntTab';
import { useActiveAndClosedPositions } from '../../hooks/useActiveAndClosedPositions';
import { useWallet } from '../../context/wallet';
import { PositionTab } from '../../utils/constants/enums';

const useStyles = makeStyles((theme: Theme) => ({
  positions: {
    marginTop: 64,
  },
  chart: {
    marginTop: 12,
  },
}));

function a11yProps(index: any) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const Positions = () => {
  const classes = useStyles();

  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [tabValue, setTabValue] = useState(PositionTab.ACTIVE);
  const { address: account } = useWallet();

  const { activePositions, closedPositions, expiredPositions } = useActiveAndClosedPositions(account);

  const handleRowClick = useCallback(
    (id?: string) => id && setSelectedPositionId(currentId => (id === currentId ? '' : id)),
    [],
  );

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    setSelectedPositionId('');
  };

  const selectedPosition = useMemo(() => {
    if (selectedPositionId === '') return undefined;
    if (tabValue === PositionTab.ACTIVE) return activePositions.find(position => position.id === selectedPositionId);
    if (tabValue === PositionTab.EXPIRED) return expiredPositions.find(position => position.id === selectedPositionId);
    return undefined;
  }, [activePositions, expiredPositions, selectedPositionId, tabValue]);

  return (
    <div>
      <div>
        <Typography variant="h5" className={classes.positions}>
          Positions
        </Typography>
        <Hidden only="xs">
          <AntTabs className={classes.chart} value={tabValue} onChange={handleTabChange} aria-label="position tabs">
            <AntTab label="Active Positions" {...a11yProps(PositionTab.ACTIVE)} />
            <AntTab label="Expired Positions" {...a11yProps(PositionTab.EXPIRED)} />
            <AntTab label="Closed Positions" {...a11yProps(PositionTab.CLOSED)} />
          </AntTabs>
        </Hidden>
        <Hidden smUp>
          <AntTabs className={classes.chart} value={tabValue} onChange={handleTabChange} aria-label="position tabs">
            <AntTab label="Active" {...a11yProps(PositionTab.ACTIVE)} />
            <AntTab label="Expired" {...a11yProps(PositionTab.EXPIRED)} />
            <AntTab label="Closed" {...a11yProps(PositionTab.CLOSED)} />
          </AntTabs>
        </Hidden>
        <TabPanel value={tabValue} index={0}>
          {activePositions.length === 0 ? (
            <Grid container justify="center" alignItems="center" direction="column">
              {' '}
              <EmptyState status="Active" />{' '}
            </Grid>
          ) : (
            <ActivePositions
              activePositions={activePositions}
              handleRowClick={handleRowClick}
              selectedId={selectedPositionId}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {expiredPositions.length === 0 ? (
            <Grid container justify="center" alignItems="center" direction="column">
              {' '}
              <EmptyState status="Expired" />{' '}
            </Grid>
          ) : (
            <ExpiredPositions
              expiredPositions={expiredPositions}
              handleRowClick={handleRowClick}
              selectedId={selectedPositionId}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {closedPositions.length === 0 ? (
            <Grid container justify="center" alignItems="center" direction="column">
              {' '}
              <EmptyState status="Closed" />{' '}
            </Grid>
          ) : (
            <ClosedPositions
              closedPositions={closedPositions}
              handleRowClick={handleRowClick}
              selectedId={selectedPositionId}
            />
          )}
        </TabPanel>
      </div>

      {tabValue === PositionTab.ACTIVE && selectedPosition !== undefined ? (
        <PositionDetail
          deselectPosition={() => setSelectedPositionId('')}
          navigateToClosedPositions={() => setTabValue(PositionTab.CLOSED)}
          position={selectedPosition}
        />
      ) : undefined}
      {tabValue === PositionTab.EXPIRED && selectedPosition !== undefined ? (
        <PositionDetail
          deselectPosition={() => setSelectedPositionId('')}
          navigateToClosedPositions={() => setTabValue(PositionTab.CLOSED)}
          position={selectedPosition}
        />
      ) : undefined}
      {/* {tabValue === 2 && selectedClosedPosition ? <PositionDetail position={selectedClosedPosition} /> : undefined} */}
    </div>
  );
};

export default Positions;
