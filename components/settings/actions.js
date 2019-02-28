import {
 SAVE_TO_ICLOUD,
 RESTORE_FROM_ICLOUD,
} from './types';

import { getAccessToken, signInFlow, signOutFlow } from '../lib/auth';
import { decks, loadDeck } from '../lib/authApi';



export function saveToICloud(timestamp) {
  return {
    type: SAVE_TO_ICLOUD,
    timestamp,
  };
}

export function restoreFromICloud({ timestamp, campaigns, decks }) {
  return {
    type: RESTORE_FROM_ICLOUD,
    timestamp: new Date(timestamp),
    campaigns,
    decks,
  };
}

export default {
  saveToICloud,
  restoreFromICloud,
};
