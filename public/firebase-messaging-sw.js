/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/8.7.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.7.0/firebase-messaging.js");

const urlParams = new URLSearchParams(location.search);

const defaultConfig = {
  apiKey: true,
  projectId: true,
  messagingSenderId: true,
  appId: true,
};

firebase.initializeApp(urlParams.get('api') ? {
  apiKey: urlParams.get('api'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
} : defaultConfig);

try {
  firebase.messaging();
} catch(e) {
  console.log('Notification is not supported in this browser');
}
