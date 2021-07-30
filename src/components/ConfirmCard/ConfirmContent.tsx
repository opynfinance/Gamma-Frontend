import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import { EtherscanPrefix } from '../../utils/constants';
import { useWallet } from '../../hooks';

const useStyles = makeStyles(theme => ({
  subheader: {
    marginTop: 36,
    marginBottom: 10,
    color: '#4FC2A0',
    fontSize: 18,
    paddingRight: '1em',
  },
  etherscan: {
    maxWidth: 275,
    marginTop: 4,
    fontSize: 14,
    marginBottom: 16,
  },
  link: {
    color: '#4FC2A0',
  },
}));

type ConfirmingProps = {
  description: any;
  txHash: string;
};

const ConfirmContent = ({ description, txHash }: ConfirmingProps) => {
  const classes = useStyles();

  const { networkId } = useWallet();

  return (
    <CardContent>
      <Typography align="center" className={classes.subheader} variant="body2">
        Confirmed
        <span role="img" aria-label="celebrate">
          🎉
        </span>
      </Typography>
      <br />
      {description}
      <Typography align="center" className={classes.etherscan} variant="body2">
        <a
          className={classes.link}
          href={`${EtherscanPrefix[networkId]}${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Etherscan
        </a>
      </Typography>
    </CardContent>
  );
};

export default ConfirmContent;
