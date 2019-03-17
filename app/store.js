import { filter } from 'lodash';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { createOffline } from '@redux-offline/redux-offline';
import offlineConfig from '@redux-offline/redux-offline/lib/defaults';
import loggerMiddleware from 'redux-logger';
import { createMigrate, persistStore, persistReducer } from 'redux-persist';

import reducers from '../reducers';
import HybridStorage from '../reducers/HybridStorage';

/**
 * How to refresh discarded offline tokens properly.
const discard = async (error, _action, _retries) => {
  if (!status in error) return false;

  if (error.status === 401) {
    const newAccessToken = await refreshAccessToken();
    localStorage.set('accessToken', newAccessToken);
    return newAccessToken == null;
  }

  return 400 <= error.status && error.status < 500;
}
*/

export default function configureStore(initialState, migrateCampaignData) {
  const offline = createOffline({
    ...offlineConfig,
    persist: false,
  });

  const migrations = {
    0: (state) => {
      const newState = Object.assign({}, state);
      delete newState.weaknesses;
      return newState;
    },
    1: (state) => {
      const newState = Object.assign({}, state);
      if (newState.campaigns) {
        migrateCampaignData(newState.campaigns);
        delete newState.campaigns;
      }
      return newState;
    },
  };

  const persistConfig = {
    key: 'persist',
    version: 1,
    storage: HybridStorage,
    // These three have some transient fields and are handled separately.
    blacklist: ['cards', 'campaigns', 'decks', 'packs', 'signedIn'],
    migrate: createMigrate(migrations, { debug: false }),
  };

  const reducer = persistReducer(
    persistConfig,
    offline.enhanceReducer(reducers)
  );

  const store = createStore(
    reducer,
    initialState,
    compose(
      applyMiddleware(
        ...filter([
          thunk,
          offline.middleware,
          (__DEV__ && loggerMiddleware),
        ], Boolean)),
      offline.enhanceStore)
  );
  const persistor = persistStore(store, { debug: true }, () => {
    console.log('PersistStore loaded.');
  });

  return { store, persistor };
}
