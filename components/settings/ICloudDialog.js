import React from 'react';
import { keys } from 'lodash';
import {
  ActivityIndicator,
  Alert,
  NativeEventEmitter,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import DialogComponent from 'react-native-dialog';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import iCloudStorage from 'react-native-icloudstore';
import deepEquals from 'fast-deep-equal';
import deepDiff from 'deep-diff';

import L from '../../app/i18n';
import Dialog from '../core/Dialog';
import { getLocalDecks } from '../../reducers';

const CAMPAIGNS_KEY = 'campaigns';

class ICloudDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      storage: null,
      errorMessage: null,
    };

    this._onClose = this.onClose.bind(this);
    this._loadData = this.loadData.bind(this);
    this._saveData = this.saveData.bind(this);
  }

  componentDidMount() {
    this.eventEmitter = new NativeEventEmitter(iCloudStorage);
    this.eventEmitter.addListener('iCloudStoreDidChangeRemotely', this._loadData);

    this.refreshData();
  }

  onClose() {
    Navigation.dismissOverlay(this.props.componentId);
  }

  refreshData() {
    iCloudStorage.getItem(CAMPAIGNS_KEY)
      .then(result => {
        const parsed = JSON.parse(result);
        if (parsed.decks && parsed.campaigns && parsed.deviceName) {
          this.setState({
            storage: parsed,
            loading: false,
          });
        } else {
          this.setState({
            storage: null,
            loading: false,
          });
        }
      }, err => {
        this.setState({
          loading: false,
          errorMessage: err.message || err,
        });
      });
  }

  loadData(userInfo) {
    const changedKeys = userInfo.changedKeys;
    if (changedKeys !== null && changedKeys.includes(CAMPAIGNS_KEY)) {
      this.refreshData();
    }
  }

  saveData() {
    const {
      campaigns,
      decks,
    } = this.props;
    const deviceName = DeviceInfo.getDeviceName();
    iCloudStorage.setItem(CAMPAIGNS_KEY, JSON.stringify({
      campaigns,
      decks,
      deviceName,
    })).then(
      this._onClose,
      err => Alert.alert(err.message)
    );
  }

  renderContent() {
    const {
      campaigns,
      decks,
    } = this.props;
    const {
      storage,
      loading,
      errorMessage,
    } = this.state;
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          animating
        />
      );
    }
    if (errorMessage) {
      return (
        <React.Fragment>
          <DialogComponent.Description>
            { errorMessage }
          </DialogComponent.Description>
        </React.Fragment>
      );
    }

    if (!storage) {
      return (
        <React.Fragment>
          <DialogComponent.Description>
            { L('No iCloud backup found.') }
          </DialogComponent.Description>
        </React.Fragment>
      );
    }

    const differentModel = DeviceInfo.getDeviceName() !== storage.deviceName;
    const campaignDifferences = deepDiff(campaigns, storage.campaigns);
    const deckDifferences = deepDiff(decks, storage.decks);
    const noChanges = !campaignDifferences && !deckDifferences && !differentModel;
    if (noChanges) {
      return (
        <DialogComponent.Description>
          { L('All data is up to date.') }
        </DialogComponent.Description>
      );
    }
    if (differentModel) {
      return (
        <DialogComponent.Description>
          { L('Contains backup from {{ deviceName }}.', { deviceName: storage.deviceName }) }
        </DialogComponent.Description>
      );
    }

    if (deckDifferences) {
      return (
        <DialogComponent.Description>
          { JSON.stringify(deckDifferences).substring(0, 100) }
        </DialogComponent.Description>
      );
    }

    if (campaignDifferences) {
      return (
        <DialogComponent.Description>
          { JSON.stringify(campaignDifferences).substring(0, 100) }
        </DialogComponent.Description>
      );
    }
    return (
      <DialogComponent.Description>
        Unknown differenes.
      </DialogComponent.Description>
    );
  }

  render() {
    return (
      <Dialog title="iCloud Sync" visible>
        <DialogComponent.Description>
          { L('Backup your decks and campaigns to iCloud to sync between devices.') }
        </DialogComponent.Description>
        { this.renderContent() }
        <DialogComponent.Button
          label={L('Save to iCloud')}
          onPress={this._saveData}
        />
        <DialogComponent.Button
          label={L('Cancel')}
          onPress={this._onClose}
        />
      </Dialog>
    );
  }
}


function mapStateToProps(state) {
  return {
    campaigns: state.campaigns.all,
    decks: getLocalDecks(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ICloudDialog);
