import React from 'react';
import PropTypes from 'prop-types';
import { head, flatMap, keys, map, range } from 'lodash';
import { StyleSheet, View } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { updateCampaign } from './actions';
import NavButton from '../core/NavButton';
import ToggleFilter from '../core/ToggleFilter';
import { parseDeck } from '../parseDeck';
import * as Actions from '../../actions';
import { iconsMap } from '../../app/NavIcons';
import { saveDeck } from '../../lib/authApi';
import DeckValidation from '../../lib/DeckValidation';
import { getCampaign, getAllDecks } from '../../reducers';
import WeaknessDrawComponent from '../weakness/WeaknessDrawComponent';
import withPlayerCards from '../withPlayerCards';

const RANDOM_BASIC_WEAKNESS = '01000';

class CampaignDrawWeaknessDialog extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    campaignId: PropTypes.number.isRequired,
    // From redux
    weaknessSet: PropTypes.object.isRequired,
    latestDeckIds: PropTypes.array,
    decks: PropTypes.object,
    updateCampaign: PropTypes.func.isRequired,
    updateDeck: PropTypes.func.isRequired,
    // From realm
    investigators: PropTypes.object,
    cards: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedDeckId: head(props.latestDeckIds),
      replaceRandomBasicWeakness: true,
      saving: false,
    };

    this._selectDeck = this.selectDeck.bind(this);
    this._updateDrawnCard = this.updateDrawnCard.bind(this);
    this._onPressInvestigator = this.onPressInvestigator.bind(this);
    this._toggleReplaceRandomBasicWeakness = this.toggleReplaceRandomBasicWeakness.bind(this);
    props.navigator.setButtons({
      rightButtons: [{
        icon: iconsMap.edit,
        id: 'edit',
      }],
    });
    props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  onNavigatorEvent(event) {
    const {
      navigator,
      campaignId,
    } = this.props;
    if (event.type === 'NavBarButtonPress') {
      if (event.id === 'edit') {
        navigator.push({
          screen: 'Dialog.CampaignEditWeakness',
          passProps: {
            campaignId: campaignId,
          },
        });
      }
    }
  }

  toggleReplaceRandomBasicWeakness() {
    this.setState({
      replaceRandomBasicWeakness: !this.state.replaceRandomBasicWeakness,
    });
  }

  selectDeck(deckId) {
    this.setState({
      selectedDeckId: deckId,
    });
  }

  onPressInvestigator() {
    const {
      navigator,
      latestDeckIds,
      campaignId,
    } = this.props;
    navigator.showModal({
      screen: 'Dialog.DeckSelector',
      passProps: {
        campaignId: campaignId,
        onDeckSelect: this._selectDeck,
        selectedDeckIds: latestDeckIds,
        showOnlySelectedDeckIds: true,
      },
    });
  }

  updateDrawnCard(nextCard, assignedCards) {
    const {
      campaignId,
      weaknessSet,
      updateCampaign,
      updateDeck,
      decks,
      cards,
      investigators,
    } = this.props;
    const {
      selectedDeckId,
      replaceRandomBasicWeakness,
    } = this.state;
    const deck = selectedDeckId && decks[selectedDeckId];
    if (deck) {
      this.setState({
        saving: true,
      });
      const previousDeck = decks[deck.previous_deck];
      const investigator = investigators[deck.investigator_code];
      const newSlots = Object.assign({}, deck.slots);
      if (!newSlots[nextCard]) {
        newSlots[nextCard] = 0;
      }
      newSlots[nextCard]++;
      if (replaceRandomBasicWeakness && newSlots[RANDOM_BASIC_WEAKNESS] > 0) {
        newSlots[RANDOM_BASIC_WEAKNESS]--;
        if (!newSlots[RANDOM_BASIC_WEAKNESS]) {
          delete newSlots[RANDOM_BASIC_WEAKNESS];
        }
      }
      const parsedDeck = parseDeck(deck, newSlots, cards, previousDeck);
      const validator = new DeckValidation(investigator);
      const problemObj = validator.getProblem(flatMap(keys(newSlots), code => {
        const card = cards[code];
        return map(range(0, newSlots[code]), () => card);
      }));
      const problem = problemObj ? problemObj.reason : '';

      saveDeck(
        deck.id,
        deck.name,
        newSlots,
        problem,
        parsedDeck.spentXp
      ).then(deck => {
        updateDeck(deck.id, deck, true);
        this.setState({
          saving: false,
        });
      });
    }
    updateCampaign(
      campaignId,
      { weaknessSet: Object.assign({}, weaknessSet, { assignedCards }) }
    );
  }

  renderInvestigatorChooser() {
    const {
      decks,
      investigators,
    } = this.props;
    const {
      selectedDeckId,
      replaceRandomBasicWeakness,
    } = this.state;
    const deck = selectedDeckId && decks[selectedDeckId];
    const investigator = deck && investigators[deck.investigator_code];
    const message = `Investigator: ${investigator ? investigator.name : ''}`;
    const hasRandomBasicWeakness = deck && deck.slots[RANDOM_BASIC_WEAKNESS] > 0;
    return (
      <View>
        <NavButton
          text={message}
          onPress={this._onPressInvestigator}
        />
        { hasRandomBasicWeakness && (
          <ToggleFilter
            style={styles.toggleRow}
            label="Replace Random Weakness"
            setting="replaceRandomBasicWeakness"
            value={replaceRandomBasicWeakness}
            onChange={this._toggleReplaceRandomBasicWeakness}
          />
        ) }
      </View>
    );
  }

  render() {
    const {
      navigator,
      weaknessSet,
    } = this.props;

    const {
      saving,
    } = this.state;

    if (!weaknessSet) {
      return null;
    }

    return (
      <WeaknessDrawComponent
        navigator={navigator}
        customHeader={this.renderInvestigatorChooser()}
        weaknessSet={weaknessSet}
        updateDrawnCard={this._updateDrawnCard}
        saving={saving}
      />
    );
  }
}

function mapStateToProps(state, props) {
  const campaign = getCampaign(state, props.campaignId);
  return {
    weaknessSet: campaign.weaknessSet,
    latestDeckIds: campaign.latestDeckIds,
    decks: getAllDecks(state),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    Object.assign({}, Actions, { updateCampaign }),
    dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(
  withPlayerCards(CampaignDrawWeaknessDialog)
);

const styles = StyleSheet.create({
  toggleRow: {
    paddingTop: 4,
    width: '100%',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#bdbdbd',
  },
});
