import React from 'react';
import { map } from 'lodash';
import { SettingsPicker } from 'react-native-settings-components';
import { t } from 'ttag';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';

import { FactionCodeType, FACTION_COLORS } from 'constants';
import { COLORS } from 'styles/colors';

interface Props {
  name: string;
  sizes: string[];
  selection?: string;
  onChange: (selection: string) => void;
  investigatorFaction?: FactionCodeType;
  disabled?: boolean;
  editWarning: boolean;
}

export default class DeckSizeSelectPicker extends React.Component<Props> {
  ref?: SettingsPicker<string>;

  _captureRef = (ref: SettingsPicker<string>) => {
    this.ref = ref;
  };

  _onChange = (selection: string) => {
    this.ref && this.ref.closeModal();
    const {
      onChange,
    } = this.props;
    onChange(selection);
  };

  _codeToLabel = (size?: string) => {
    return size || t`Select Deck Size`;
  };

  render() {
    const {
      sizes,
      selection,
      name,
      investigatorFaction,
      disabled,
      editWarning,
    } = this.props;
    const options = map(sizes, size => {
      return {
        label: this._codeToLabel(size),
        value: size,
      };
    });
    const color = investigatorFaction ?
      FACTION_COLORS[investigatorFaction] :
      COLORS.lightBlue;
    return (
      <SettingsPicker
        ref={this._captureRef}
        disabled={disabled}
        dialogDescription={editWarning ? t`Note: Deck size should only be selected at deck creation time, not between scenarios.` : undefined}
        disabledOverlayStyle={{
          backgroundColor: 'rgba(255,255,255,0.0)',
        }}
        valueStyle={{
          color: COLORS.darkGray,
        }}
        title={name}
        value={selection}
        valueFormat={this._codeToLabel}
        onValueChange={this._onChange}
        modalStyle={{
          header: {
            wrapper: {
              backgroundColor: color,
            },
            description: {
              paddingTop: 8,
            },
          },
          list: {
            itemColor: color,
          },
        }}
        options={options}
        containerStyle={{
          backgroundColor: 'transparent',
        }}
        widget={
          <MaterialIcons
            name="keyboard-arrow-right"
            size={30}
            color={COLORS.darkGray}
          />
        }
      />
    );
  }
}
