process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = "1";

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['babel-plugin-inline-import', { extensions: ['.sql'] }],
      'react-native-worklets-core/plugin',
      'react-native-reanimated/plugin'
    ]
  };
};
