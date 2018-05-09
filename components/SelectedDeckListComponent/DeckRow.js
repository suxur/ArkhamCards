import React from 'react';
import PropTypes from 'prop-types';
import { find, flatten, forEach, keys, map, head, sum, values } from 'lodash';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { connectRealm } from 'react-native-realm';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';

import XpComponent from '../XpComponent';
import * as Actions from '../../actions';
import { getDeck } from '../../reducers';
import InvestigatorImage from '../core/InvestigatorImage';
import LabeledTextBox from '../core/LabeledTextBox';
import typography from '../../styles/typography';

class DeckRow extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    deck: PropTypes.object,
    updates: PropTypes.object,
    remove: PropTypes.func.isRequired,
    updatesChanged: PropTypes.func,
    fetchDeck: PropTypes.func.isRequired,
    // From realm
    investigator: PropTypes.object,
    exileCards: PropTypes.object,
    hasExile: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this._updateExiles = this.updateExiles.bind(this);
    this._updateXp = this.updateXp.bind(this);
    this._updateTrauma = this.updateTrauma.bind(this);
    this._onRemove = this.onRemove.bind(this);
    this._showTraumaDialog = this.showTraumaDialog.bind(this);
    this._showExileDialog = this.showExileDialog.bind(this);
  }

  showExileDialog() {
    const {
      navigator,
      id,
      updates,
    } = this.props;
    navigator.push({
      screen: 'Dialog.ExileCards',
      passProps: {
        id,
        updateExiles: this._updateExiles,
        exiles: updates.exiles,
      },
    });
  }

  showTraumaDialog() {
    const {
      navigator,
      updates,
    } = this.props;
    navigator.showLightBox({
      screen: 'Dialog.EditTrauma',
      passProps: {
        updateTrauma: this._updateTrauma,
        trauma: updates.trauma,
      },
      style: {
        backgroundColor: 'rgba(128,128,128,.75)',
      },
    });
  }

  updateExiles(exiles) {
    const {
      id,
      updatesChanged,
      updates,
    } = this.props;
    updatesChanged(id, Object.assign({}, updates, { exiles }));
  }

  updateXp(xp) {
    const {
      id,
      updatesChanged,
      updates,
    } = this.props;
    updatesChanged(id, Object.assign({}, updates, { xp }));
  }

  updateTrauma(trauma) {
    const {
      id,
      updatesChanged,
      updates,
    } = this.props;
    updatesChanged(id, Object.assign({}, updates, { trauma }));
  }

  onRemove() {
    const {
      remove,
      id,
    } = this.props;
    remove(id);
  }

  componentDidMount() {
    const {
      id,
      deck,
      fetchDeck,
    } = this.props;
    if (!deck) {
      fetchDeck(id, false);
    }
  }

  renderXp() {
    const {
      updatesChanged,
      updates: {
        xp,
      },
    } = this.props;
    if (!updatesChanged) {
      return null;
    }
    return <XpComponent xp={xp} onChange={this._updateXp} />;
  }

  traumaText() {
    const {
      updates: {
        trauma: {
          physical = 0,
          mental = 0,
          killed = false,
          insane = false,
        },
      },
    } = this.props;
    if (killed) {
      return 'Killed';
    }
    if (insane) {
      return 'Insane';
    }
    if (mental === 0 && physical === 0) {
      return 'None';
    }
    return flatten([
      (physical === 0 ? [] : [`Physical: ${physical}`]),
      (mental === 0 ? [] : [`Mental: ${mental}`]),
    ]).join(', ');
  }

  renderTrauma() {
    if (!this.props.updatesChanged) {
      return null;
    }
    return (
      <View style={styles.row}>
        <LabeledTextBox
          label="Trauma"
          onPress={this._showTraumaDialog}
          value={this.traumaText()}
        />
      </View>
    );
  }

  exileText() {
    const {
      exileCards,
      updates: {
        exiles,
      },
    } = this.props;
    const numCards = keys(exiles).length;
    switch (numCards) {
      case 0: return 'None';
      case 1:
        return map(keys(exiles), code => {
          const count = exiles[code];
          const card = exileCards[code];
          if (count === 1) {
            return card.name;
          }
          return `${count}x ${card.name}`;
        }).join(', ');
      default: {
        // No room to print more than one card name, so just sum it
        const totalCount = sum(values(exiles));
        return `${totalCount} cards`;
      }
    }
  }

  renderExile() {
    if (!this.props.updatesChanged || !this.props.hasExile) {
      return null;
    }
    return (
      <View style={styles.row}>
        <LabeledTextBox
          label="Exiled Cards"
          onPress={this._showExileDialog}
          value={this.exileText()}
        />
      </View>
    );
  }

  renderTitle() {
    const {
      deck,
    } = this.props;
    return (
      <View style={styles.row}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={typography.bigLabel}>
          { deck.name }
        </Text>
      </View>
    );
  }

  render() {
    const {
      investigator,
    } = this.props;
    return (
      <View style={styles.container}>
        <View style={styles.deleteIcon}>
          <TouchableOpacity onPress={this._onRemove}>
            <MaterialCommunityIcons name="close" size={24} color="#444" />
          </TouchableOpacity>
        </View>
        <View style={styles.investigatorImage}>
          <InvestigatorImage card={investigator} />
        </View>
        <View style={styles.column}>
          { this.renderTitle() }
          { this.renderXp() }
          { this.renderTrauma() }
          { this.renderExile() }
        </View>
      </View>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    deck: getDeck(state, props.id),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(
  connectRealm(DeckRow, {
    schemas: ['Card'],
    mapToProps(results, realm, props) {
      const {
        deck,
      } = props;
      const exileCards = {};
      forEach(results.cards.filtered('exile == true'), card => {
        exileCards[card.code] = card;
      });
      if (!deck || !deck.investigator_code) {
        return {
          exileCards,
          investigator: null,
          hasExile: false,
        };
      }
      const allExileCards = new Set(keys(exileCards));
      const hasExile = !!find(keys(deck.slots), code => allExileCards.has(code));
      const query = `code == "${deck.investigator_code}"`;
      return {
        exileCards,
        investigator: head(results.cards.filtered(query)),
        hasExile,
      };
    },
  }),
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#000000',
    paddingLeft: 8,
    paddingRight: 8,
  },
  investigatorImage: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    height: '100%',
  },
  column: {
    flexDirection: 'column',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 8,
    marginRight: 8,
  },
  deleteIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
  },
  row: {
    paddingBottom: 4,
    width: '100%',
  },
});