import React from 'react';
import clsx from 'clsx';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/core/styles';
import Collapse from '@material-ui/core/Collapse';
import Grid from '@material-ui/core/Grid';

import ManageoTokensCard from '../ManageoTokensCard';
import AdjustCollateralCard from '../AdjustCollateralCard';
import ClosePositionCard from '../ClosePositionCard';
import useShortPosition, { ShortPositionProps } from './useShortPosition';

const ShortPositionDetail = (props: ShortPositionProps) => {
  const shortPosition = useShortPosition(props);

  const useStyles = makeStyles(theme => ({
    expand: {
      transform: 'rotate(270deg)',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(360deg)',
    },
    expandPos: {
      // marginLeft: 100,
    },
    title: {
      fontSize: 24,
      marginTop: 12,
      marginBottom: 6,
      marginLeft: 16,
      fontWeight: 700,
    },
  }));

  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <>
      <Grid container alignItems={'flex-start'} direction="row">
        <ClosePositionCard position={shortPosition.position} />
        <IconButton
          className={clsx(classes.expand, {
            [classes.expandOpen]: expanded,
          })}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon fontSize="large" />
        </IconButton>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Grid container direction="row">
            <ManageoTokensCard {...shortPosition} />
            <AdjustCollateralCard {...shortPosition} />
          </Grid>
        </Collapse>
      </Grid>
    </>
  );
};

export default ShortPositionDetail;
