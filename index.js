import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { RealmProvider } from 'react-native-realm';
import { Navigation } from 'react-native-navigation';

import { registerScreens } from './app/screens';
import configureStore from './app/store';
import App from './app/App';
import { MIGRATE_CAMPAIGN_DATA } from './actions/types';
import realm from './data';

class MyProvider extends React.Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
  };

  render() {
    return (
      <RealmProvider realm={realm}>
        <Provider store={this.props.store}>
          { this.props.children }
        </Provider>
      </RealmProvider>
    );
  }
}

class CampaignMigrator {
  constructor() {
    this.store = null;
    this.campaigns = null;
  }

  migrateCampaignData(campaigns) {
    this.campaigns = campaigns;
    if (this.store) {
      this.dispatch();
    }
  }

  setStore(store) {
    this.store = store;
    if (this.campaigns) {
      this.dispatch();
    }
  }

  dispatch() {
    this.store.dispatch({
      type: MIGRATE_CAMPAIGN_DATA,
      state: this.campaigns,
    });
    this.campaigns = null;
  }
}
const campaignMigrator = new CampaignMigrator();

const { store /* , persistor */ } = configureStore({}, campaignMigrator.migrateCampaignData.bind(campaignMigrator));
campaignMigrator.setStore(store);
registerScreens(MyProvider, store);

/* eslint-disable no-unused-vars */
let app = null;
Navigation.events().registerAppLaunchedListener(() => {
  app = new App(store);
});
