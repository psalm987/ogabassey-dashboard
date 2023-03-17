import { Palette, PaletteOptions } from "@mui/material";
import type {} from "@mui/lab/themeAugmentation";
import { createTheme, lighten } from "@mui/material/styles";
import { Typography } from "@mui/material/styles/createTypography";
import { blue, orange } from "@mui/material/colors";

// declare module "@mui/material/styles" {
//   interface Theme {
//     palette: Palette;
//     typography: Typography;
//   }
//   // allow configuration using `createTheme`
//   interface ThemeOptions {
//     palette?: PaletteOptions;
//   }
// }

const theme = createTheme({
  palette: {
    primary: {
      main: blue.A700,
    },
    secondary: {
      light: orange[100],
      main: orange[900],
    },
    text: {
      primary: "rgba(0,0,0,0.87)",
      secondary: "rgba(0,0,0,0.6)",
    },
    background: {
      paper: "#fff",
      default: lighten(orange[50], 0.7),
    },
  },
  typography: {
    fontFamily: "'Raleway', 'Poppins', 'Arial', sans-serif",
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow:
            "0px 2px 4px -1px #802d0002, 0px 4px 5px 0px #802d0014, 0px 1px 10px 0px #802d0014;",
        },
      },
    },
  },
});

export default theme;
