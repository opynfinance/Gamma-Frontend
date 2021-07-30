import firebase from "firebase/app";
import "firebase/messaging";
import "firebase/auth";
import "firebase/firestore";
import { useEffect, useState } from "react";
import { useWallet } from "../context/wallet";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGE_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};
const initializedFirebaseApp = firebase.initializeApp(firebaseConfig);

let messaging: firebase.messaging.Messaging | undefined;
try {
  messaging = initializedFirebaseApp.messaging();
} catch(e) {
  console.log('Browser not supported', e);
}
const auth = initializedFirebaseApp.auth();
const db = initializedFirebaseApp.firestore();



function useFcm() {
  const { connected, address } = useWallet();
  const [isNotificationSupported, setNotificationSupported] = useState(false);
  const [permission, setPermission] = useState('denied');

  useEffect(() => {
    if('Notification' in window && process.env.REACT_APP_ENABLE_NOTIFICATION === 'true') {
      setNotificationSupported(true)
    }
  }, []);

  useEffect(() => {
    if (!isNotificationSupported) return;

    setPermission(Notification.permission);
  }, [isNotificationSupported])

  useEffect(() => {
    if (!connected || !isNotificationSupported) return;

    auth.signInAnonymously().then(() => {
      if(permission === 'granted' && messaging) {
        messaging
          .getToken({vapidKey: process.env.REACT_APP_VAPID_KEY })
          .then(token => {
            console.log('Browser registered with FCM: ', token)
            db.collection('push-tokens').doc(address).set({ token })
          });
      }
    });
    
  }, [address, connected, isNotificationSupported, permission]);

  const enableNotification = () => {
    if (!isNotificationSupported) return;

    Notification.requestPermission().then((p) => {
      setPermission(p);
      if (p === 'granted') {
        new Notification('You will be notified if the vault health is dangerous!')
      }
    }).catch(console.log)
  };

  return { messaging, db, auth, notificationGranted: permission === 'granted', enableNotification, isNotificationSupported };
}

export default useFcm;
    