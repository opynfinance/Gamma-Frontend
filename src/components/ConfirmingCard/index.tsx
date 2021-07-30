import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import { EtherscanPrefix } from '../../utils/constants';
import { useWallet } from '../../hooks';

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
  etherscan: {
    maxWidth: 275,
    marginTop: 4,
    fontSize: 14,
    marginBottom: 16,
  },
  link: {
    color: theme.palette.primary.main,
  },
}));

type ConfirmingProps = {
  handleNext?: any;
  description: any;
  txHash: string;
  confirmed?: boolean;
};

const ConfirmingHeader = () => <>Confirming...</>;

const ConfirmedHeader = () => (
  <>
    {'Confirmed '}
    <span role="img" aria-label="celebrate">
      🎉
    </span>
  </>
);

const ConfirmingCard = ({ handleNext, description, txHash, confirmed = false }: ConfirmingProps) => {
  const classes = useStyles();
  const { networkId } = useWallet();

  return (
    <CardContent>
      <Typography align="center" className={classes.subheader} variant="body2">
        {confirmed ? <ConfirmedHeader /> : <ConfirmingHeader />}
      </Typography>
      <br />
      <Typography align="center" className={classes.body} variant="body2">
        {description}
      </Typography>
      <br />
      <br />
      {txHash ? (
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
      ) : null}
    </CardContent>
  );
};

export default ConfirmingCard;
