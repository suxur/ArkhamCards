import { filter, forEach, map, reverse } from 'lodash';

import {
  MY_DECKS_START_REFRESH,
  MY_DECKS_ERROR,
  SET_MY_DECKS,
  NEW_DECK_AVAILABLE,
  UPDATE_DECK,
  CLEAR_DECKS,
} from '../actions/types';

const DEFAULT_DECK_STATE = {
  all: {},
  myDecks: [],
  dateUpdated: null,
  refreshing: false,
  error: null,
};

function updateDeck(state, action) {
  const deck = Object.assign({}, action.deck);
  let scenarioCount = 0;
  let currentDeck = deck;
  while (currentDeck && currentDeck.previous_deck) {
    scenarioCount ++;
    currentDeck = state.all[currentDeck.previous_deck];
  }
  deck.scenarioCount = scenarioCount;
  return deck;
}

export default function(state = DEFAULT_DECK_STATE, action) {
  if (action.type === MY_DECKS_START_REFRESH) {
    return Object.assign({},
      state,
      {
        refreshing: true,
        error: null,
      },
    );
  }
  if (action.type === MY_DECKS_ERROR) {
    return Object.assign({},
      state,
      {
        refreshing: false,
        error: action.error,
      },
    );
  }
  if (action.type === SET_MY_DECKS) {
    const allDecks = Object.assign({}, state.all);
    forEach(action.decks, deck => {
      allDecks[deck.id] = deck;
    });
    forEach(action.decks, deck => {
      let scenarioCount = 0;
      let currentDeck = deck;
      while (currentDeck && currentDeck.previous_deck) {
        scenarioCount ++;
        currentDeck = allDecks[currentDeck.previous_deck];
      }
      deck.scenarioCount = scenarioCount;
    });
    return Object.assign({},
      state,
      {
        all: allDecks,
        myDecks: reverse(map(filter(action.decks, deck => !deck.next_deck), deck => deck.id)),
        dateUpdated: (new Date()).getTime(),
        refreshing: false,
        error: null,
      },
    );
  }
  if (action.type === UPDATE_DECK) {
    const deck = updateDeck(state, action);
    const newState = Object.assign({},
      state,
      {
        all: Object.assign(
          {},
          state.all,
          { [action.id]: deck },
        ),
      },
    );
    if (action.isWrite) {
      // Writes get moved to the head of the list.
      newState.myDecks = [
        action.id,
        ...filter(state.myDecks, deckId => deckId !== action.id),
      ];
    }
    return newState;
  }
  if (action.type === NEW_DECK_AVAILABLE) {
    const deck = updateDeck(state, action);
    const newState = Object.assign({},
      state,
      {
        all: Object.assign(
          {},
          state.all,
          { [action.id]: deck },
        ),
      });
    newState.myDecks = [
      action.id,
      ...filter(state.myDecks, deckId => deck.previous_deck !== deckId),
    ];
    return newState;
  } else if (action.type === CLEAR_DECKS) {
    return DEFAULT_DECK_STATE;
  }
  return state;
}