const fromMeta = (key) =>
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] || import.meta.env[`VITE_${key}`] : undefined;
const fromProcess = (key) => (typeof process !== 'undefined' && process.env ? process.env[key] : undefined);
const fromWindow = (key) => (typeof window !== 'undefined' && window.FIREBASE_ENV ? window.FIREBASE_ENV[key] : undefined);

const getEnv = (key) => fromMeta(key) || fromProcess(key) || fromWindow(key) || '';

export const firebaseConfig = {
    apiKey: getEnv('FIREBASE_API_KEY'),
    authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('FIREBASE_APP_ID'),
    measurementId: getEnv('FIREBASE_MEASUREMENT_ID'),
};

if (!firebaseConfig.projectId) {
    console.warn('Firebase config missing projectId; set values in .env or window.FIREBASE_ENV to enable Firestore.');
}
