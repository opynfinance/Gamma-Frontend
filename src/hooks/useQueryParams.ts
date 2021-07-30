import { useLocation } from 'react-router-dom';

export const useQueryParams = () => {
  const search = useLocation().search;
  const queryParams = new URLSearchParams(search);
  return queryParams;
};
