import { Theme, ThemeOptions } from "@material-ui/core/styles";
import {
  IPaletteOptions,
  PaletteOptions,
} from "@material-ui/core/styles/createPalette";

// type TLayout = {
//   primary: string;
//   secondary: string;
// };

declare module "@material-ui/core/styles/createPalette" {
  export interface IPaletteOptions extends PaletteOptions {
    // layout: TLayout;
  }
}

declare module "@material-ui/core/styles" {
  export type ITheme = Theme & {
    palette: IPaletteOptions;
  };

  export function createMuiTheme(
    options?: ThemeOptions,
    ...args: object[]
  ): ITheme;

  export function useTheme<T = ITheme>(): T;
}
