import React, { useCallback } from 'react';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';

type ErrorToastProps = {
  severity?: 'error' | 'success' | 'info' | 'warning' | undefined;
  message: string;
  open: boolean;
  setOpen: any;
};

export default function Toast({ severity = 'error', message, open, setOpen }: ErrorToastProps) {
  // const [open, setOpen] = useState(false)

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <Snackbar open={open} autoHideDuration={20000} onClose={handleClose}>
      <Alert severity={severity} onClose={handleClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}
