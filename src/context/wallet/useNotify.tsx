import { useEffect, useState, useCallback } from 'react';
import Notify, { API } from 'bnc-notify';

import { EtherscanPrefix } from '../../utils/constants';
import { SupportedNetworks } from '../../utils/constants/';

const dappId = process.env.REACT_APP_BLOCKNATIVE_DAPP_ID;

const useNotify = (networkId: SupportedNetworks) => {
  const [notify, setNotify] = useState<API | null>(null);

  useEffect(
    () =>
      setNotify(
        Notify({
          dappId,
          networkId,
          desktopPosition: 'bottomLeft',
        }),
      ),
    [networkId],
  );

  const handleNotify = useCallback(
    ({ hash, onConfirm }: { hash: string; onConfirm?: any }) => {
      function logAndReturnLink(transaction: any) {
        console.log(transaction);
        return {
          link: `${EtherscanPrefix[networkId]}${transaction.hash}`,
        };
      }

      if (notify) {
        const { emitter } = notify.hash(hash);
        emitter.on('txSent', logAndReturnLink);
        emitter.on('txPool', logAndReturnLink);

        emitter.on('txConfirmed', transaction => {
          if (typeof onConfirm === 'function') onConfirm();
          return {
            link: `${EtherscanPrefix[networkId]}${transaction.hash}`,
          };
        });
        // emitter.on('txSpeedUp', console.log);
        emitter.on('txCancel', logAndReturnLink);
        emitter.on('txFailed', logAndReturnLink);
      } else {
        console.error('useNotify: notify is null');
      }
    },
    [networkId, notify],
  );

  return {
    handleNotify,
  };
};

export default useNotify;
