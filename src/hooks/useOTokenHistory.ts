import { loader } from 'graphql.macro';
import { useQuery } from '@apollo/client';

const historyQuery = loader('../queries/oTokenHistory.graphql');

const useOTokenHistory = (id: string) => {
  const { data, loading } = useQuery(historyQuery, { 
    variables: { otokenId: id }
  });

  return { optionHistory: data?.otokenTrades || [] , loading }
};

export default useOTokenHistory;
