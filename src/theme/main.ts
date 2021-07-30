import { createMuiTheme, ThemeOptions } from '@material-ui/core/styles';

const getTheme = (mode: string) => {
  const palette = mode === 'light' ? lightPalette : darkPalete;

  return createMuiTheme({
    ...palette,
    typography: {
      fontWeightBold: 500,
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Segoe UI Emoji"',
      ].join(','),
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    props: {
      MuiButtonBase: {
        disableRipple: true,
      }
    },
    overrides: {
      MuiTableCell: {
        root: {
          fontSize: '.7rem',
          padding: '8px',
          border: 'none',
        }
      },
      MuiCard: {
        root: {
          boxShadow: mode === 'light' ? '0px 4px 10px rgba(222, 222, 222, 0.5)' : '0px 4px 10px rgb(37 37 37 / 50%)',
        }
      }
    }
  });
}

const lightPalette: ThemeOptions = {
  palette: {
    type: 'light',
    primary: {
      main: '#4DADF3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: '#B2F0C5',
      main: '#49D273',
      contrastText: '#FFFFFF',
    },
    error: {
      light: '#F2F2F2',
      main: '#EC7987',
      dark: '#BDBDBD',
    },
    warning: {
      light: '#F5B07326',
      main: '#F5B073',
    },
    success: {
      main: '#49D273',
      light: '#B2F0C5',

    },
    background: {
      default: '#F8F8F9',
      stone: '#DCDAE9',
      lightStone: '#DCDAE94D',
      tooltip: '#77757E80'
    }
  },
}

const darkPalete: ThemeOptions = {
  palette: {
    type: 'dark',
    primary: {
      main: '#4DADF3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: '#B2F0C5',
      main: '#49D273',
      contrastText: '#FFFFFF',
    },
    error: {
      light: '#F2F2F2',
      main: '#EC7987',
      dark: '#BDBDBD',
    },
    warning: {
      light: '#F5B07326',
      main: '#F5B073',
    },
    success: {
      main: '#49D273',
      light: '#B2F0C5'
    },
    background: {
      stone: 'rgba(255, 255, 255, 0.12)',
      lightStone: 'rgba(255, 255, 255, 0.08)',
      tooltip: 'rgba(255, 255, 255, 0.12)'
    }
  },
}

export default getTheme;
