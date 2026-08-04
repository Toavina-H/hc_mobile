import { DefaultTheme } from 'react-native-paper'

export const colors = {
  white: '#FFFFFF',

  purple1: '#F7F2FF',
  purple2: '#EEE5FE',
  purple3: '#C19CFC',
  purple4: '#6308F7',
  purple5: '#3C0594',

  blue1: '#F2FCFF',
  blue2: '#E5F8FF',
  blue3: '#66D6FF',
  blue4: '#00A7E5',
  blue5: '#007099',

  grey1: '#F7F7FC',
  grey2: '#EFF0F6',
  grey3: '#D9DBE9',
  grey4: '#A0A3BD',
  grey5: '#6E7191',
  grey6: '#4E4B66',
  grey7: '#262338',

  green1: '#F2FFF9',
  green2: '#E5FFF2',
  green3: '#00FE80',
  green4: '#00CC67',
  green5: '#00994D',

  red1: '#FFF2F9',
  red2: '#FFE5F2',
  red3: '#FF84B0',
  red4: '#E40173',
  red5: '#98014C',

  gold1: '#FEFAF1',
  gold2: '#FBF3E2',
  gold3: '#F3D9A5',
  gold4: '#E2A21F',
  gold5: '#5A400C',
}

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...colors,
    text: '#000000',
    primary: colors.purple4,
    secondary: colors.blue4,
    positive: colors.green4,
    error: colors.red4,
  },
}