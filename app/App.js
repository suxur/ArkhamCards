import { forEach, keys } from 'lodash';
import { Linking, NativeEventEmitter, Platform, YellowBox } from 'react-native';
import { Navigation } from 'react-native-navigation';
import DeepLinking from 'react-native-deep-linking';
import iCloudStorage from 'react-native-icloudstore';

import L, { changeLocale } from './i18n';
import { iconsLoaded, iconsMap } from './NavIcons';
import { COLORS } from '../styles/colors';
import { REMOTE_DECKS_UPDATE, REMOTE_CAMPAIGNS_UPDATE } from '../actions/types';
import HybridStorage from '../reducers/HybridStorage';

export default class App {
  constructor(store) {
    this.started = false;
    this.currentLang = null;
    store.subscribe(this.onStoreUpdate.bind(this, store));
    this._handleUrl = this.handleUrl.bind(this);
    this._iCloudStoreChangedRemotely = this.iCloudStoreChangedRemotely.bind(this);

    Navigation.setDefaultOptions({
      topBar: {
        buttonColor: COLORS.lightBlue,
        background: {
          color: 'white',
        },
      },
      layout: {
        backgroundColor: 'white',
      },
      bottomTab: {
        textColor: COLORS.darkGray,
        selectedIconColor: COLORS.lightBlue,
        selectedTextColor: COLORS.lightBlue,
      },
    });

    if (Platform.OS === 'ios') {
      this.eventEmitter = new NativeEventEmitter(iCloudStorage);
      this.eventEmitter.addListener('iCloudStoreDidChangeRemotely', this._iCloudStoreChangedRemotely);
    }

    this.onStoreUpdate(store);
  }

  onStoreUpdate(store) {
    this.store = store;
    const {
      lang,
    } = store.getState().cards;

    // handle a root change
    // if your app doesn't change roots in runtime, you can remove onStoreUpdate() altogether
    if (!this.started || this.currentLang !== lang) {
      this.started = true;
      this.currentLang = lang;
      iconsLoaded.then(() => {
        this.startApp(lang || 'en');
      }).catch(error => console.log(error));
    }
  }

  iCloudStoreChangedRemotely(userInfo) {
    const changedKeys = userInfo.changedKeys;
    if (changedKeys != null && HybridStorage.iCloudSyncEnabled) {
      const iCloudKeys = {
        'persist:decks': REMOTE_DECKS_UPDATE,
        'persist:campaigns': REMOTE_CAMPAIGNS_UPDATE,
      };
      forEach(keys(iCloudKeys), key => {
        if (changedKeys.includes(key)) {
          console.log(`ICLOUD: ${key} changed remotely`);
          iCloudStorage.getItem(key)
            .then(result => {
              this.store.dispatch({
                type: iCloudKeys[key],
                cloudState: JSON.parse(result),
              });
            });
        }
      });
    }
  }

  handleUrl({ url }) {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        DeepLinking.evaluateUrl(url);
      }
    });
  }

  startApp(lang) {
    changeLocale(lang);
    YellowBox.ignoreWarnings([
      'Warning: `flexWrap: `wrap`` is not supported with the `VirtualizedList` components.' +
      'Consider using `numColumns` with `FlatList` instead.',
      'Warning: Failed prop type: Invalid prop `rules.emMarkdown.order` of type `number` supplied to `MarkdownView`, expected `function`.',
      'Warning: Failed prop type: Invalid prop `rules.uTag.order` of type `number` supplied to `MarkdownView`, expected `function`.',
      'Warning: isMounted(...) is deprecated',
    ]);

    // const isIpad = Platform.OS === 'ios' && Platform.isPad;

    /*
    isIpad ? {
      splitView: {
        id: 'BROWSE_TAB',
        master: {
          stack: {
            id: 'BROWSE_TAB_FILTERS_VIEW',
            children: [
              {
                component: {
                  name: 'Settings',
                },
              },
            ],
          },
        },
        detail: {
          stack: {
            id: 'BROWSE_TAB_CARD_VIEW',
            children: [{
              component: {
                name: 'Browse.Cards',
                options: {
                  topBar: {
                    title: {
                      text: L('Player Cards'),
                    },
                  },
                },
              },
            }],
          },
        },
        options: {
          splitView: {
            displayMode: 'visible',
            primaryEdge: 'trailing',
            minWidth: 100,
          },
          bottomTab: {
            text: L('Cards'),
            icon: iconsMap.cards,
          },
        },
      },
    } :*/
    const browseTab = {
      stack: {
        children: [{
          component: {
            name: 'Browse.Cards',
            options: {
              topBar: {
                title: {
                  text: L('Player Cards'),
                },
              },
            },
          },
        }],
        options: {
          bottomTab: {
            text: L('Cards'),
            icon: iconsMap.cards,
          },
        },
      },
    };
    const tabs = [browseTab, {
      stack: {
        children: [{
          component: {
            name: 'My.Decks',
            options: {
              topBar: {
                title: {
                  text: L('Decks'),
                },
                rightButtons: [{
                  icon: iconsMap.add,
                  id: 'add',
                  color: COLORS.navButton,
                }],
              },
            },
          },
        }],
        options: {
          bottomTab: {
            text: L('Decks'),
            icon: iconsMap.deck,
          },
        },
      },
    }, {
      stack: {
        children: [{
          component: {
            name: 'My.Campaigns',
            options: {
              topBar: {
                title: {
                  text: L('Campaigns'),
                },
                rightButtons: [{
                  icon: iconsMap.add,
                  id: 'add',
                  color: COLORS.navButton,
                }],
              },
            },
          },
        }],
        options: {
          bottomTab: {
            text: L('Campaigns'),
            icon: iconsMap.book,
          },
        },
      },
    }, {
      stack: {
        children: [{
          component: {
            name: 'Settings',
            options: {
              topBar: {
                title: {
                  text: L('Settings'),
                },
              },
            },
          },
        }],
        options: {
          bottomTab: {
            text: L('Settings'),
            icon: iconsMap.settings,
          },
        },
      },
    }];

    Navigation.setRoot({
      root: {
        bottomTabs: {
          children: tabs,
        },
      },
    });
    Linking.addEventListener('url', this._handleUrl);

    // We handle scrollapp and https (universal) links
    DeepLinking.addScheme('arkhamcards://');

    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleUrl({ url });
      }
    });
  }
}
