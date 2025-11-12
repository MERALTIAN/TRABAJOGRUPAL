import React from 'react';
import { Text } from 'react-native';
import formatField from '../utils/formatField';

// SafeText: formats objects and other non-primitive values before rendering inside <Text>
const SafeText = ({ children, style, ...rest }) => {
  let value = children;
  try {
    // If children is a single React node, try to extract primitive
    if (typeof children === 'object') {
      value = formatField(children);
    }
  } catch (e) {
    value = '';
  }
  return (
    <Text style={style} {...rest}>{String(value)}</Text>
  );
};

export default SafeText;
