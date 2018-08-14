import React from 'react';
import PropTypes from 'prop-types';
import { concat, flatMap, map, pullAt, shuffle, range, without } from 'lodash';
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import withPlayerCards from '../withPlayerCards';
import CardSearchResult from '../CardSearchResult';

class DrawSimulatorView extends React.Component {
  static propTypes = {
    slots: PropTypes.object,
    cards: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      shuffledDeck: this.shuffleFreshDeck(),
      drawnCards: [],
      selectedCards: [],
    };

    this._toggleSelection = this.toggleSelection.bind(this);
    this._renderHeader = this.renderHeader.bind(this);
    this._renderCardItem = this.renderCardItem.bind(this);

    this._drawOne = this.draw.bind(this, 1);
    this._drawTwo = this.draw.bind(this, 2);
    this._drawFive = this.draw.bind(this, 5);
    this._drawAll = this.draw.bind(this, 'all');

    this._resetDeck = this.resetDeck.bind(this);
    this._redrawSelected = this.redrawSelected.bind(this);
    this._reshuffleSelected = this.reshuffleSelected.bind(this);
  }

  resetDeck() {
    this.setState({
      shuffledDeck: this.shuffleFreshDeck(),
      drawnCards: [],
      selectedCards: [],
    });
  }

  reshuffleSelected() {
    const {
      shuffledDeck,
      selectedCards,
      drawnCards,
    } = this.state;

    const selectedIndexes = map(selectedCards, key => key.split('-')[0]);
    const selectedCardIds = map(selectedCards, key => key.split('-')[1]);

    const newDrawnCards = drawnCards.slice();
    pullAt(newDrawnCards, selectedIndexes);
    this.setState({
      shuffledDeck: shuffle(concat(shuffledDeck, selectedCardIds)),
      drawnCards: newDrawnCards,
      selectedCards: [],
    });
  }

  redrawSelected() {
    const {
      selectedCards,
    } = this.state;
    const {
      drawnCards,
      shuffledDeck,
    } = this.drawHelper(selectedCards.length);

    const selectedIndexes = map(selectedCards, key => key.split('-')[0]);
    const selectedCardIds = map(selectedCards, key => key.split('-')[1]);

    const newDrawnCards = drawnCards.slice();
    pullAt(newDrawnCards, selectedIndexes);
    this.setState({
      shuffledDeck: shuffle(concat(shuffledDeck, selectedCardIds)),
      drawnCards: newDrawnCards,
      selectedCards: [],
    });
  }

  drawHelper(count) {
    const {
      drawnCards,
      shuffledDeck,
    } = this.state;
    if (count === 'all') {
      return {
        drawnCards: [
          ...drawnCards,
          ...shuffledDeck,
        ],
        shuffledDeck: [],
      };
    }

    return {
      drawnCards: [
        ...drawnCards,
        ...shuffledDeck.slice(0, count),
      ],
      shuffledDeck: shuffledDeck.slice(count),
    };
  }

  draw(count) {
    this.setState(this.drawHelper(count));
  }

  shuffleFreshDeck() {
    const {
      cards,
      slots,
    } = this.props;
    return shuffle(
      flatMap(
        Object.keys(slots),
        cardId => {
          const card = cards[cardId];
          // DUKE=02014
          if (card.permanent || card.double_sided || card.code === '02014') {
            return [];
          }
          return range(0, slots[cardId]).map(() => cardId);
        }));
  }

  toggleSelection(id) {
    const {
      selectedCards,
    } = this.state;
    if (selectedCards.indexOf(id) !== -1) {
      this.setState({
        selectedCards: without(selectedCards, id),
      });
    } else {
      this.setState({
        selectedCards: [
          ...selectedCards,
          id,
        ],
      });
    }
  }

  renderHeader() {
    const {
      shuffledDeck,
      drawnCards,
      selectedCards,
    } = this.state;
    const deckEmpty = shuffledDeck.length === 0;
    const noSelection = selectedCards.length === 0;
    return (
      <View style={styles.controlsContainer}>
        <View style={styles.drawButtonRow}>
          <Text style={styles.text}>Draw: </Text>
          <Button title="1" disabled={deckEmpty} onPress={this._drawOne} />
          <Button title="2" disabled={deckEmpty} onPress={this._drawTwo} />
          <Button title="5" disabled={deckEmpty} onPress={this._drawFive} />
          <Button title="All" disabled={deckEmpty} onPress={this._drawAll} />
        </View>
        <View style={styles.wrapButtonRow}>
          <Button
            title="Redraw"
            disabled={noSelection}
            onPress={this._redrawSelected} />
          <Button
            title="Reshuffle"
            disabled={noSelection}
            onPress={this._reshuffleSelected} />
          <Button
            title="Reset"
            disabled={drawnCards.length === 0}
            onPress={this._resetDeck} />
        </View>
      </View>
    );
  }

  renderCardItem({ item, index }) {
    const card = this.props.cards[item.id];
    return (
      <View style={item.selected ? styles.selected : {}}>
        <CardSearchResult
          id={`${index}-${item.id}`}
          card={card}
          onPress={this._toggleSelection}
        />
      </View>
    );
  }

  render() {
    const {
      drawnCards,
      selectedCards,
    } = this.state;
    const data = map(drawnCards, (cardId, idx) => {
      const key = `${idx}-${cardId}`;
      return {
        key,
        id: cardId,
        selected: selectedCards.indexOf(key) !== -1,
      };
    });
    return (
      <View style={styles.container}>
        { this.renderHeader() }
        <FlatList
          data={data}
          renderItem={this._renderCardItem}
        />
      </View>
    );
  }
}

export default withPlayerCards(DrawSimulatorView);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  controlsContainer: {
    flexDirection: 'column',
  },
  drawButtonRow: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f6f6f6',
  },
  wrapButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f6f6f6',
    flexWrap: 'wrap',
  },
  text: {
    fontFamily: 'System',
    fontSize: 18,
    lineHeight: 22,
  },
  selected: {
    backgroundColor: '#ddd',
  },
});
