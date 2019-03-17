import { Platform } from 'react-native';
import Settings from 'react-native-cross-settings';
import storage from 'redux-persist/lib/storage';
import iCloudStorage from 'react-native-icloudstore';

const ICLOUD_SYNC_SETTING = 'icloud_sync';

class HybridStorage {
  constructor() {
    if (Platform.OS === 'ios') {
      this._iCloudSyncSettingChanged = this.iCloudSyncSettingChanged.bind(this);
      Settings.watchKeys([ICLOUD_SYNC_SETTING], this._iCloudSyncSettingChanged);
      this.iCloudSyncSettingChanged();
    } else {
      this.iCloudSyncEnabled = false;
    }
  }

  iCloudSyncSettingChanged() {
    this.updateICloudSyncSettings(Settings.get(ICLOUD_SYNC_SETTING) === '1');
  }

  updateICloudSyncSettings(value) {
    this.iCloudSyncEnabled = value;
    console.log(`ICLOUD: setting is now ${this.iCloudSyncEnabled}`);
  }

  iCloudKey(key) {
    return key === 'persist:decks' || key === 'persist:campaigns';
  }

  getItem(key) {
    if (Platform.OS === 'ios' && this.iCloudSyncEnabled && this.iCloudKey(key)) {
      return iCloudStorage.getItem(key);
    }
    return storage.getItem(key);
  }

  setItem(key, value) {
    if (Platform.OS === 'ios' && this.iCloudSyncEnabled && this.iCloudKey(key)) {
      console.log(`ICLOUD: set ${key} to ${value}`);
      return iCloudStorage.setItem(key, value);
    }
    return storage.setItem(key, value);
  }

  removeItem(key, callback) {
    if (Platform.OS === 'ios' && this.iCloudSyncEnabled && this.iCloudKey(key)) {
      console.log(`ICLOUD: remove ${key}`);
      return iCloudStorage.removeItem(key);
    }
    return storage.removeItem(key);
  }
}

export default new HybridStorage();
