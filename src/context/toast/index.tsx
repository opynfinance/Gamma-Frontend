import React, { useState, useContext, FunctionComponent, useCallback } from 'react';

type Severity = 'error' | 'success' | 'info' | 'warning' | undefined;

type toastProps = {
  open: boolean;
  message: string;
  setIsOpen: Function;
  error: any;
  success: any;
  severity: Severity;
};

const initialContext: toastProps = {
  open: false,
  message: '',
  setIsOpen: () => {},
  error: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  severity: 'error',
};

const toastContext = React.createContext<toastProps>(initialContext);

const useToast = () => useContext(toastContext);

const ToastProvider: FunctionComponent = ({ children }) => {
  const [severity, setSeverity] = useState<Severity>('error');
  const [message, setMessage] = useState('');

  const [open, setIsOpen] = useState(false);

  const error = useCallback((msg: string) => {
    setIsOpen(true);
    setMessage(msg);
    setSeverity('error');
  }, []);

  const success = useCallback((msg: string) => {
    setIsOpen(true);
    setMessage(msg);
    setSeverity('success');
  }, []);

  return (
    <toastContext.Provider
      value={{
        setIsOpen,
        open,
        message,
        severity,
        error,
        success,
      }}
    >
      {children}
    </toastContext.Provider>
  );
};

export { ToastProvider, useToast };
