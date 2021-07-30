import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import clsx from 'clsx';

import { useWallet, useOrderTicketItemStyle } from '../../hooks';
import { EtherscanPrefix } from '../../utils/constants/links';
import { TwitterShareButton } from 'react-share';
import TwitterIcon from '../../img/twitter.svg';
import { PrimaryButton } from '../Buttons';
import { useHistory } from 'react-router';

const useStyles = makeStyles(theme => ({
  subheader: {
    marginTop: 36,
    marginBottom: 12,
    color: theme.palette.success.main,
    fontSize: 18,
  },
  body: {
    marginTop: 16,
    fontSize: 16,
  },
  box: {
    minHeight: '476px',
    // display: 'flex',
    // flexDirection: 'column',
    // alignItems: 'stretch',
    padding: 12,
  },
  button: {
    marginTop: 5,
    // paddingTop: 10,
    fontSize: 16,
    justifySelf: 'flex-end',
  },
  buttonWidth: {
    minWidth: 95,
  },
  tradeButton: {
    marginTop: 5,
    marginRight: 8,
    // paddingTop: 10,
    fontSize: 16,
    justifySelf: 'flex-end',
  },
  etherscan: {
    marginTop: 4,
    fontSize: 14,
    marginBottom: 16,
  },
  link: {
    color: theme.palette.primary.main,
    textAlign: 'center',
  },
  twitterHeader: {
    marginTop: 36,
    marginBottom: 30,
    fontSize: '.8rem',
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
  },
  twitterButton: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.primary.light,
      border: `1px solid ${theme.palette.primary.light}`,
    },
  },
  actionBox: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    height: '6rem',
  },
}));

type ConfirmedProps = {
  handleNext: any;
  description: any;
  txHash: string;
};

const ConfirmCard = ({ handleNext, description, txHash }: ConfirmedProps) => {
  const { networkId } = useWallet();
  const classes = useStyles();
  const orderClasses = useOrderTicketItemStyle();
  const history = useHistory();

  return (
    <Box display="flex" flexDirection="column" className={classes.box}>
      <Typography align="center" className={classes.subheader} variant="body2">
        Confirmed{' '}
        <span role="img" aria-label="celebrate">
          🎉
        </span>
      </Typography>
      <Typography align="center">{description}</Typography>
      <Typography align="center" className={classes.etherscan} variant="body2">
        <a
          className={classes.link}
          href={`${EtherscanPrefix[networkId]}${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on etherscan
        </a>
      </Typography>
      <Typography align="center" className={classes.twitterHeader} variant="caption">
        Let everyone know about your Opyn options trade
        <span role="img" aria-label="mushroom" style={{ color: '#fff', marginLeft: '4px' }}>
          🍄
        </span>
        <span role="img" aria-label="astronaut" style={{ color: '#fff' }}>
          {' '}
          👩‍🚀
        </span>
      </Typography>
      <TwitterShareButton
        url="https://opyn.co"
        title="I just completed an options trade with @opyn_, the most powerful, capital efficient #DeFi options protocol 🍄"
      >
        <Button fullWidth variant="contained" className={classes.twitterButton} disableElevation size="small">
          Tweet about it! <img src={TwitterIcon} style={{ marginLeft: '4px' }} alt="twitter-logo" />
        </Button>
      </TwitterShareButton>
      <Box className={clsx(orderClasses.actionButtonBox, classes.actionBox)}>
        <PrimaryButton onClick={() => history.push('/dashboard')}>Review on Dashboard</PrimaryButton>
        <Typography variant="caption" align="center">
          Or select another option to begin a new transaction.
        </Typography>
      </Box>
    </Box>
  );
};

export default ConfirmCard;
