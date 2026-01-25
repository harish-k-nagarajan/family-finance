import { init } from '@instantdb/react';

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID;

if (!APP_ID) {
    throw new Error('VITE_INSTANT_APP_ID is not set. Please check your .env file.');
}

const db = init({ appId: APP_ID });

export { db };
export default db;
