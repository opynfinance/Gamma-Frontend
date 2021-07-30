import React from 'react';
import { Tab, Tabs, Box } from '@material-ui/core/';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';

export const AntTabs = withStyles(theme =>
  createStyles({
    root: {
      backgroundColor: theme.palette.background.lightStone,
    },
    indicator: {
      backgroundColor: theme.palette.background.lightStone,
      opacity: 0,
    },
  }),
)(Tabs);

export const AntTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      minWidth: 72,
      fontWeight: theme.typography.fontWeightRegular,
      margin: 0,
      // marginRight: theme.spacing(4),
      '&:hover': {
        opacity: 1,
      },
      '&$selected': {
        color: theme.palette.primary.main,
        fontWeight: theme.typography.fontWeightMedium,
        backgroundColor: theme.palette.background.paper,
      },
      '&:focus': {
        color: theme.palette.primary.main,
      },
    },
    selected: {},
  }),
)(Tab);

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

export const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box paddingTop={3}>
          <div>{children}</div>
        </Box>
      )}
    </div>
  );
};
