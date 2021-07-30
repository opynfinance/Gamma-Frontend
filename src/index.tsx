import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

import { WalletProvider, useWallet } from './context/wallet';
import { ControllerProvider } from './context/controller';
import { ZeroXProvider } from './context/zerox';
import { ToastProvider } from './context/toast';
import { SubgraphEndpoint } from './utils/constants/links';
import App from './pages/App';
import './index.css';

if ('serviceWorker' in navigator && process.env.REACT_APP_ENABLE_NOTIFICATION === 'true') {
  navigator.serviceWorker
    .register(
      `./firebase-messaging-sw.js?api=${process.env.REACT_APP_FIREBASE_API_KEY}&authDomain=${process.env.REACT_APP_AUTH_DOMAIN}&projectId=${process.env.REACT_APP_PROJECT_ID}&storageBucket=${process.env.REACT_APP_STORAGE_BUCKET}&messagingSenderId=${process.env.REACT_APP_MESSAGE_SENDER_ID}&appId=${process.env.REACT_APP_APP_ID}`,
    )
    .then(function (registration) {
      console.log('Registration successful, scope is:', registration.scope);
    })
    .catch(function (err) {
      console.log('Service worker registration failed, error:', err);
    });
}

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  autoSessionTracking: true,
  integrations: [new Integrations.BrowserTracing()],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

ReactDOM.render(
  <WalletProvider>
    <SubApp />
  </WalletProvider>,
  document.getElementById('root'),
);

function SubApp() {
  const { networkId } = useWallet();

  // You should replace this uri with your own and put it into a .env file
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: SubgraphEndpoint[networkId],
        cache: new InMemoryCache(),
      }),
    [networkId],
  );

  return (
    <ApolloProvider client={client}>
      <ToastProvider>
        <ControllerProvider>
          <ZeroXProvider>
            <App />
          </ZeroXProvider>
        </ControllerProvider>
      </ToastProvider>
    </ApolloProvider>
  );
}
