import React from 'react';
import PropTypes from 'prop-types';
import {
  ActivityIndicator,
  Button,
  Text,
  StyleSheet,
  View,
} from 'react-native';

import typography from '../../styles/typography';

export default function SettingsItem({ loading, text, onPress }) {
  if (loading || !onPress) {
    return (
      <View style={styles.wrapper}>
        <Text style={[typography.text, styles.text]}>{ text }</Text>
        { !!loading && <ActivityIndicator style={styles.spinner} size="small" animating /> }
      </View>
    );
  }
  return (
    <View style={styles.wrapper}>
      <Button onPress={onPress} title={text} />
    </View>
  );
}

SettingsItem.propTypes = {
  loading: PropTypes.bool,
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 40,
  },
  text: {
    marginLeft: 8,
  },
  spinner: {
    height: 20,
    marginLeft: 16,
  },
});
