import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { FIREBASE, loadFirebaseConfig } from "./config.js";

export const initFirebaseApp = async () => {
  await loadFirebaseConfig();

  if (
    !(
      FIREBASE.API_KEY &&
      FIREBASE.AUTH_DOMAIN &&
      FIREBASE.PROJECT_ID &&
      FIREBASE.STORAGE_BUCKET &&
      FIREBASE.MESSAGING_SENDER_ID &&
      FIREBASE.APP_ID
    )
  ) {
    return null;
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    apiKey: FIREBASE.API_KEY,
    authDomain: FIREBASE.AUTH_DOMAIN,
    projectId: FIREBASE.PROJECT_ID,
    storageBucket: FIREBASE.STORAGE_BUCKET,
    messagingSenderId: FIREBASE.MESSAGING_SENDER_ID,
    appId: FIREBASE.APP_ID,
    measurementId: FIREBASE.MEASUREMENT_ID,
  });
};

export const initFirebaseAnalytics = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const app = await initFirebaseApp();
  if (!app) {
    return null;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return null;
  }

  return getAnalytics(app);
};
