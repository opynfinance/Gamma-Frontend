import React, { useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from '@material-ui/core';

import { FAQ } from '../../utils/constants';

const useStyles = makeStyles(theme => ({
  highlighted: {
    color: '#4FC2A0',
  },
  link: {
    color: theme.palette.text.secondary,
  },
}));

export default function LearnMore({ h1, highlight = true }: { h1?: string; highlight?: boolean }) {
  const sub = useMemo(() => {
    switch (h1) {
      case 'spread': {
        return '#what-is-a-spread';
      }
      case 'exercise': {
        return '#how-does-auto-exercise-work';
      }
      case 'oracle': {
        return '#how-do-the-oracles-work';
      }
      case 'operations': {
        return '#what-kind-of-options-are-available-on-opyn';
      }
      case 'small limit': {
        return '#why-are-small-limit-orders-less-likely-to-be-taken';
      }
      default:
        return '#';
    }
  }, [h1]);

  const href = useMemo(() => `${FAQ}/${sub}`, [sub]);

  const classes = useStyles();
  return (
    <Link
      underline={highlight ? 'none' : 'always'}
      className={highlight ? classes.highlighted : classes.link}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      Learn more
    </Link>
  );
}
