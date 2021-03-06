import React from 'react';
import {
  Text,
} from 'react-native';

import SetupStepWrapper from '../SetupStepWrapper';
import BulletsComponent from './BulletsComponent';
import { RuleReminderStep } from 'data/scenario/types';
import CardTextComponent from 'components/card/CardTextComponent';
import typography from 'styles/typography';

interface Props {
  step: RuleReminderStep;
}

export default class GenericStepComponent extends React.Component<Props> {
  render() {
    const { step } = this.props;
    return (
      <SetupStepWrapper>
        { !!step.title && (
          <Text style={[typography.bigGameFont, { color: '#2E5344' }]}>
            { step.title }
          </Text>
        ) }
        <CardTextComponent text={step.text.replace(/\n/g, '\n\n')} />
        <BulletsComponent bullets={step.bullets} />
        { !!step.example && <CardTextComponent text={step.example} /> }
      </SetupStepWrapper>
    );
  }
}
