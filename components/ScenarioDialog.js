import React from 'react';
import PropTypes from 'prop-types';

import DialogPicker from './core/DialogPicker';

export default class ScenarioDialog extends React.Component {
  static propTypes = {
    navigator: PropTypes.object.isRequired,
    scenarioChanged: PropTypes.func.isRequired,
    selected: PropTypes.string.isRequired,
    scenarios: PropTypes.array.isRequired,
  };

  render() {
    const {
      navigator,
      scenarioChanged,
      selected,
      scenarios,
    } = this.props;

    return (
      <DialogPicker
        navigator={navigator}
        header="Scenario"
        options={scenarios}
        onSelectionChanged={scenarioChanged}
        selectedOption={selected}
        noCapitalize
      />
    );
  }
}
