import React from 'react';
import PropTypes from 'prop-types';
import { keys } from 'lodash';
import {
  ActivityIndicator,
  Alert,
} from 'react-native';
import Settings from 'react-native-cross-settings';
import DialogComponent from 'react-native-dialog';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import deepEquals from 'fast-deep-equal';
import deepDiff from 'deep-diff';
import iCloudStorage from 'react-native-icloudstore';

import HybridStorage from '../../reducers/HybridStorage';
import { flush } from './actions';
import L from '../../app/i18n';
import Dialog from '../core/Dialog';
import { getLocalDecks } from '../../reducers';

const CAMPAIGNS_KEY = 'campaigns';

class ICloudDialog extends React.Component {
  static propTypes = {
    componentId: PropTypes.string.isRequired,
    flush: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props);

    this._onClose = this.onClose.bind(this);
    this._enable = this.enable.bind(this);
    this._disable = this.disable.bind(this);
  }

  enable() {
    Settings.set({ 'icloud_sync': '1' });
    HybridStorage.iCloudSyncSettingChanged();
    this.props.flush(true);
    this.onClose();
  }

  disable() {
    Settings.set({ 'icloud_sync': '0' });
    HybridStorage.iCloudSyncSettingChanged();
    this.props.flush(false);
    this.onClose();
  }

  onClose() {
    Navigation.dismissOverlay(this.props.componentId);
  }

  render() {
    const iCloudSyncEnabled = Settings.get('icloud_sync') === '1';
    return (
      <Dialog title="iCloud Sync" visible>
        <DialogComponent.Description>
          { iCloudSyncEnabled ?
              L('iCloud sync is enabled on this device.') :
              L('You can enable iCloud sync to synchronize campaign data and decks between devices.')
          }
        </DialogComponent.Description>
        { iCloudSyncEnabled ?
          <DialogComponent.Button
            label={L('Disable iCloud sync')}
            onPress={this._disable}
          /> :
          <DialogComponent.Button
            label={L('Enable iCloud sync')}
            onPress={this._enable}
          />
        }
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
  return bindActionCreators({ flush }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ICloudDialog);
