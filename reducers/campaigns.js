import { find, forEach, keys, map } from 'lodash';

import {
  LOGOUT,
  NEW_CAMPAIGN,
  UPDATE_CAMPAIGN,
  DELETE_CAMPAIGN,
  ADD_CAMPAIGN_SCENARIO_RESULT,
  SET_ALL_CAMPAIGNS,
  REPLACE_LOCAL_DECK,
  REMOTE_CAMPAIGNS_UPDATE,
  FLUSH,
  MIGRATE_CAMPAIGN_DATA,
} from '../actions/types';

// Campaign: {
//   id: '',
//   name: '',
//   cycleCode: '',
//   lastUpdated: Date,
//   dateCreated: Date (added later),
//   showInterludes: true,
//   baseDeckIds: [],
//   latestDeckIds: [], /* deprecated */
//   investigatorData: {
//     investigator_code: {
//       physical: #,
//       mental: #,
//       killed: bool,
//       insane: bool,
//     },
//   },
//   chaosBag: {},
//   weaknessSet: {
//     packCodes: [],
//     assignedCards: {},
//   },
//   campaignNotes: {
//     sections: [
//       { title: 'Campaign Notes', notes: [] },
//       { title: 'Section Title', notes: [], custom: true },
//     ],
//     counts: [
//       { title: 'Doubt', count: 2 },
//     ],
//     // Not the data, just the config.
//     investigatorNotes: {
//       sections: [
//         { title: 'Supplies', notes: { investigatorCodes: [] } },
//         { title: 'Custom Something', notes: { investigatorCodes: [] }, custom: true },
//       ],
//       counts: [
//         { title: 'Vengeance', counts: { investigatorCodes: # } },
//       ],
//     },
//   },
//   scenarioResults: [{
//     scenario: '',
//     scenarioCode: '',
//     resolution: '',
//     xp: #,
//   },{
//     scenario: '',
//     scenarioCode: '',
//   }],
// }
const DEFAULT_CAMPAIGNS_STATE = {
  all: {},
  deleted: {
    // id: dateCreated,
  },
};

export default function(state = DEFAULT_CAMPAIGNS_STATE, action) {
  if (action.type === MIGRATE_CAMPAIGN_DATA) {
    // This data came from the old-store, so just take it as is.
    // Should be a one time operation.
    return Object.assign({}, state, action.state);
  }
  if (action.type === REMOTE_CAMPAIGNS_UPDATE) {
    const newCampaigns = [];
    const mergedCampaigns = {};
    forEach(keys(action.cloudState.all || {}), id => {
      const campaign = action.cloudState.all[id];
      if (state.all[id]) {
        if (state.all[id].dateCreated === campaign.dateCreated) {
          // Same create date, means same campaign.
          // Keep whichever has a newer update date.
          if (state.all[id].lastUpdated.getTime() > campaign.lastUpdated.getTime()) {
            // Local one is newer.
            mergedCampaigns[id] = state.all[id];
          } else {
            mergedCampaigns[id] = campaign;
          }
        } else {
          // They seem to be different campaigns, that somehow have the same ID?
          mergedCampaigns[id] = state.all[id];
          newCampaigns.push(campaign);
        }
      } else {

      }
    });
    deepDiff(state, action.cloudState);
    return state;
  }
  if (action.type === FLUSH) {
    return Object.assign(
      {},
      state,
      { iCloudSync: action.iCloudSync },
    );
  }
  if (action.type === LOGOUT) {
    return DEFAULT_CAMPAIGNS_STATE;
  }
  if (action.type === SET_ALL_CAMPAIGNS) {
    const all = {};
    forEach(action.campaigns, campaign => {
      all[campaign.id] = campaign;
    });
    return {
      all,
    };
  }
  if (action.type === DELETE_CAMPAIGN) {
    const deleted = Object.assign({}, state.deleted || {});
    const newCampaigns = Object.assign({}, state.all);
    // TODO: figure out how to encode deleted campaigns.
    // if (newCampaigns[action.id]) {
    //  deleted[action.id] = newCampaign[action.id].dateCreated
    //}
    delete newCampaigns[action.id];
    return Object.assign({},
      state,
      { all: newCampaigns },
    );
  }
  if (action.type === NEW_CAMPAIGN) {
    const campaignNotes = {};
    campaignNotes.sections = map(action.campaignLog.sections || [], section => {
      return { title: section, notes: [] };
    });
    campaignNotes.counts = map(action.campaignLog.counts || [], section => {
      return { title: section, count: 0 };
    });
    campaignNotes.investigatorNotes = {
      sections: map(action.campaignLog.investigatorSections || [], section => {
        return { title: section, notes: {} };
      }),
      counts: map(action.campaignLog.investigatorCounts || [], section => {
        return { title: section, counts: {} };
      }),
    };

    const newCampaign = {
      id: action.id,
      name: action.name,
      showInterludes: true,
      cycleCode: action.cycleCode,
      difficulty: action.difficulty,
      chaosBag: Object.assign({}, action.chaosBag),
      campaignNotes,
      weaknessSet: action.weaknessSet,
      baseDeckIds: action.baseDeckIds,
      dateCreated: action.now,
      lastUpdated: action.now,
      investigatorData: {},
      scenarioResults: [],
    };
    return Object.assign({},
      state,
      { all: Object.assign({}, state.all, { [action.id]: newCampaign }) },
    );
  }
  if (action.type === UPDATE_CAMPAIGN) {
    const campaign = Object.assign(
      {},
      state.all[action.id],
      { lastUpdated: action.now }
    );
    forEach(keys(action.campaign), key => {
      campaign[key] = action.campaign[key];
    });
    return Object.assign({},
      state,
      { all: Object.assign({}, state.all, { [action.id]: campaign }) },
    );
  }
  if (action.type === REPLACE_LOCAL_DECK) {
    const all = Object.assign(
      {},
      state.all
    );
    forEach(keys(all), campaignId => {
      const campaign = all[campaignId];
      if (find(campaign.baseDeckIds || [], deckId => deckId === action.localId)) {
        all[campaignId] = Object.assign({},
          campaign,
          {
            baseDeckIds: map(campaign.baseDeckIds, deckId => {
              if (deckId === action.localId) {
                return action.deck.id;
              }
              return deckId;
            }),
          }
        );
      }
    });
    return Object.assign({},
      state,
      { all },
    );
  }
  if (action.type === ADD_CAMPAIGN_SCENARIO_RESULT) {
    const campaign = Object.assign({}, state.all[action.id]);
    const scenarioResults = [
      ...campaign.scenarioResults || [],
      Object.assign({}, action.scenarioResult),
    ];
    const updatedCampaign = Object.assign(
      {},
      campaign,
      {
        scenarioResults,
        lastUpdated: action.now,
      },
    );
    return Object.assign({},
      state,
      { all: Object.assign({}, state.all, { [action.id]: updatedCampaign }) },
    );
  }
  return state;
}
