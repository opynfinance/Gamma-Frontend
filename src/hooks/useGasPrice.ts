import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';

/**
 * get gas price from ETH station. (In GWei)
 * @param refetchIntervalSec refetch interval in seconds
 */
export const useGasPrice = (
  refetchIntervalSec: number,
): { fast: BigNumber; fastest: BigNumber; safeLow: BigNumber; average: BigNumber } => {
  const [fast, setFast] = useState(new BigNumber(0));
  const [fastest, setFastest] = useState(new BigNumber(0));
  const [safeLow, setSafeLow] = useState(new BigNumber(0));
  const [average, setAverage] = useState(new BigNumber(0));

  useEffect(() => {
    let isCancelled = false;

    async function update() {
      const response = await getGasPrice();
      if (isCancelled) return;

      // convert to gwei
      setFast(new BigNumber(response.fast).div(1e9));
      setFastest(new BigNumber(response.rapid).div(1e9));
      setSafeLow(new BigNumber(response.slow).div(1e9));
      setAverage(new BigNumber(response.standard).div(1e9));
    }
    update();
    const id = setInterval(update, refetchIntervalSec * 1000);

    // cleanup function: remove interval
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [refetchIntervalSec]);

  return { fast, fastest, safeLow, average };
};

const getGasPrice = async (): Promise<{ fast: number; rapid: number; slow: number; standard: number }> => {
  try {
    const gasData = await getGasNowPrice();
    if (gasData.fast) return gasData;
  } catch (e) {
    console.log('Error in fetching Gas price using gas now', e);
  }

  return getEthStationGasPrice();
};

const getGasNowPrice = async (): Promise<{ fast: number; rapid: number; slow: number; standard: number }> => {
  const url = 'https://www.gasnow.org/api/v3/gas/price?';
  const res = await fetch(url);
  const { data } = await res.json();
  return data;
};

const getEthStationGasPrice = async (): Promise<{ fast: number; rapid: number; slow: number; standard: number }> => {
  const url = 'https://ethgasstation.info/api/ethgasAPI.json?';
  const res = await fetch(url);
  const data = await res.json();
  return { fast: data.fast, rapid: data.fastest, slow: data.safeLow, standard: data.average };
};