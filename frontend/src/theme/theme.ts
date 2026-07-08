import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#005AC1',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D8E2FF',
    onPrimaryContainer: '#001A41',
    secondary: '#575E71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DBE2F9',
    onSecondaryContainer: '#141B2C',
    tertiary: '#715573',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FBD7FC',
    onTertiaryContainer: '#29132D',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FEFBFF',
    onBackground: '#1B1B1F',
    surface: '#FEFBFF',
    onSurface: '#1B1B1F',
    surfaceVariant: '#E1E2EC',
    onSurfaceVariant: '#44474F',
    outline: '#74777F',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ADC6FF',
    onPrimary: '#002E69',
    primaryContainer: '#004494',
    onPrimaryContainer: '#D8E2FF',
    secondary: '#BFC6DC',
    onSecondary: '#293041',
    secondaryContainer: '#3F4759',
    onSecondaryContainer: '#DBE2F9',
    tertiary: '#DEBCDF',
    onTertiary: '#402843',
    tertiaryContainer: '#583E5B',
    onTertiaryContainer: '#FBD7FC',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#1B1B1F',
    onBackground: '#E3E2E6',
    surface: '#1B1B1F',
    onSurface: '#E3E2E6',
    surfaceVariant: '#44474F',
    onSurfaceVariant: '#C4C6D0',
    outline: '#8E9099',
  },
};
export const softSlateTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    primaryContainer: '#DBEAFE',
    onPrimaryContainer: '#1E3A8A',
    secondary: '#14B8A6',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CCFBF1',
    onSecondaryContainer: '#134E4A',
    background: '#F1F5F9', // slate-100
    onBackground: '#0F172A',
    surface: '#FFFFFF',
    onSurface: '#0F172A',
    surfaceVariant: '#E2E8F0', // slate-200
    onSurfaceVariant: '#334155',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F8FAFC',
      level3: '#F1F5F9',
      level4: '#E2E8F0',
      level5: '#CBD5E1',
    }
  },
};

export const warmCreamTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#EA580C',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFEDD5',
    onPrimaryContainer: '#7C2D12',
    secondary: '#D97706',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FEF3C7',
    onSecondaryContainer: '#78350F',
    background: '#FFF7ED', // orange-50
    onBackground: '#27272A',
    surface: '#FFFFFF',
    onSurface: '#27272A',
    surfaceVariant: '#FFEDD5', // orange-100
    onSurfaceVariant: '#3F3F46',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFF7ED',
      level3: '#FFEDD5',
      level4: '#FED7AA',
      level5: '#FDBA74',
    }
  },
};

export const midnightNavyTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6',
    onPrimary: '#FFFFFF',
    primaryContainer: '#1E3A8A',
    onPrimaryContainer: '#DBEAFE',
    secondary: '#2DD4BF',
    onSecondary: '#000000',
    secondaryContainer: '#134E4A',
    onSecondaryContainer: '#CCFBF1',
    background: '#0F172A',
    onBackground: '#F8FAFC',
    surface: '#1E293B',
    onSurface: '#F8FAFC',
    surfaceVariant: '#334155',
    onSurfaceVariant: '#CBD5E1',
  },
};

export const graphiteTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6366F1',
    onPrimary: '#FFFFFF',
    primaryContainer: '#3730A3',
    onPrimaryContainer: '#E0E7FF',
    secondary: '#A855F7',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#581C87',
    onSecondaryContainer: '#F3E8FF',
    background: '#18181B',
    onBackground: '#FAFAFA',
    surface: '#27272A',
    onSurface: '#FAFAFA',
    surfaceVariant: '#3F3F46',
    onSurfaceVariant: '#D4D4D8',
  },
};

export const themes = {
  'classic-light': lightTheme,
  'soft-slate': softSlateTheme,
  'warm-cream': warmCreamTheme,
  'classic-dark': darkTheme,
  'midnight-navy': midnightNavyTheme,
  'graphite': graphiteTheme,
};
