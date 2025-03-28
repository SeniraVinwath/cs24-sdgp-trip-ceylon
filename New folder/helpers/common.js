import { Dimensions } from 'react-native';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

export const hp = (percentage) => {
  return Number((percentage * deviceHeight) / 100);
};

export const wp = (percentage) => {
  return Number((percentage * deviceWidth) / 100);
};
