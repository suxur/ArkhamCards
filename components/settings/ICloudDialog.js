import React from 'react';
import PropTypes from 'prop-types';
import { keys } from 'lodash';
import {
  ActivityIndicator,
  NativeEventEmitter,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DialogComponent from 'react-native-dialog';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ImageCacheManager } from 'react-native-cached-image';
import { Navigation } from 'react-native-navigation';
import iCloudStorage from 'react-native-icloudstore';

import L from '../../app/i18n';
import Dialog from '../core/Dialog';

const CAMPAIGNS_KEY = 'campaigns';

class ICloudDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      storage: null,
    };

    this._loadData = this.loadData.bind(this);
  }

  componentDidMount() {
    this.eventEmitter = new NativeEventEmitter(iCloudStorage);
    this.eventEmitter.addListener('iCloudStoreDidChangeRemotely', this._loadData);

    iCloudStorage.getItem(CAMPAIGNS_KEY).then(result => {
      this.setState({
        storage: result,
        loading: false,
      });
    });
  }

  loadData(userInfo) {
    const changedKeys = userInfo.changedKeys;
    if (changedKeys != null && changedKeys.includes(CAMPAIGNS_KEY)) {
      iCloudStorage.getItem(CAMPAIGNS_KEY)
        .then(result => this.setState({
          storage: result,
          loading: false,
        }));
    }
  }

  saveData() {
    iCloudStorage.setItem(CAMPAIGNS_KEY,
    )
  }

  renderContent() {
    const {
      storage,
      loading,
    } = this.state;
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          animating
        />
      );
    }

    if (!storage) {
      return (
        <React.Fragment>
          <DialogComponent.Description>
            {L('No iCloud backup found.')}
          </DialogComponent.Description>
          <DialogComponent.Button>

          </DialogComponent.Button>
        </React.Fragment>
      );
    }

    return (
      <DialogComponent.Description>
        {L('Cloud data exists!')}
      </DialogComponent.Description>
    );
  }

  render() {
    return (
      <Dialog title="iCloud Sync" visible>
        <DialogComponent.Description>
          You can use this to synchronize your campaign and local decks
          between multiple devices.
        </DialogComponent.Description>
        {this.renderContent()}
      </Dialog>
    );
  }
}


function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ICloudDialog);
