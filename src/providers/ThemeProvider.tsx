"use client";
import React, { createContext, ReactNode, useContext, useState } from "react";
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
import colorConvert from "color-convert";
const ThemeContext = createContext<any>("blue-light");

export type ThemeProviderProps = {
  children: ReactNode;
  setCustomStyles?: (styles: React.CSSProperties) => void;
  customStyles?: React.CSSProperties;
  target?: string;
  initTheme?: string;
  useLocalStorage?: boolean;
  getColor: (colorToGet: string, opacity?: number) => string;
};

export function useOrbTheme() {
  const context = useContext<ThemeProviderProps>(ThemeContext);
  if (!context) {
    throw new Error("use orb theme must be used within a theme provider");
  }
  return context;
}

const OrbThemeProvider = (props: {
  children: ReactNode;
  customStyles?: React.CSSProperties;
  isDark?: boolean;
  primaryColor?: string;
}) => {
  const [customStyles, setCustomStyles] = useState(props.customStyles || {});

  React.useEffect(() => {
    // no keys in the customStyles object
    if (Object.keys(customStyles)?.length === 0) {
      // handle autogenerate by the primary color
      if (props.primaryColor) {
        switchCustomColorPallet(props.primaryColor);
      } else {
        // handle default theme
        switchCustomColorPallet("#0000FF");
      }
    }
  }, [customStyles, props.primaryColor, props.isDark]);

  function getColor(colorToGet: string, opacity?: number) {
    const element = document.getElementById("vg-theme-container");
    if (!element) return;
    const styles = window.getComputedStyle(element);
    const mainColorRaw = styles.getPropertyValue(`--vg-${colorToGet}`);
    const mainColorHsl = mainColorRaw
      .split(" ")
      .map((item) => Number(item.replaceAll(`%`, "")));
    if (opacity) {
      return `rgba(${colorConvert.hsl
        .rgb(mainColorHsl as any)
        .join(`,`)}, ${opacity})`;
    }
    const mainColorHex = colorConvert.hsl.hex(mainColorHsl as any);
    return `#${mainColorHex}`;
  }

  const handleAutoGenPallet = (rootColor: string, themeType?: string) => {
    const baseColorHSL: any = colorConvert.hex.hsl(rootColor);
    // console.log(baseColorHSL);
    if (baseColorHSL?.length) {
      const newHSLColorsArray: any = [];
      for (let i = 10; i > 0; i--) {
        const changePerIndex = 10;
        let newHslColor = baseColorHSL.slice(0, 2);
        const finalLuinousValue =
          i * changePerIndex === 100 ? 95 : i * changePerIndex || 5;
        newHslColor[2] = finalLuinousValue;
        newHSLColorsArray.push(newHslColor);
      }
      const nineColorPalletFinale =
        themeType === "light"
          ? newHSLColorsArray.slice().reverse()
          : newHSLColorsArray;
      return nineColorPalletFinale;
    }
  };

  function switchCustomColorPallet(customThemeJSONString: string) {
    let themeObject: {
      primary: string;
    } = {
      primary: props.primaryColor || "#0000FF",
    };
    try {
      themeObject = JSON.parse(customThemeJSONString);
    } catch (error) {
      themeObject = {
        primary: props.primaryColor || "#0000FF",
      };
    }
    try {
      // themeObject = JSON.parse(customThemeJSONString);
      // console.log(themeObject)
      const primaryHSL = colorConvert.hex.hsl(themeObject.primary);
      const nineCollorPallet = handleAutoGenPallet(
        themeObject.primary,
        props.isDark ? "dark" : "light"
      );
      // console.log(nineCollorPallet)
      setCustomStyles({
        "--vg-primary": primaryHSL
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-50": nineCollorPallet[0]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-100": nineCollorPallet[1]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-200": nineCollorPallet[2]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-300": nineCollorPallet[3]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-400": nineCollorPallet[4]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-500": nineCollorPallet[5]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-600": nineCollorPallet[6]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-700": nineCollorPallet[7]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-800": nineCollorPallet[8]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-900": nineCollorPallet[9]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
      } as any);
    } catch (error) {
      console.error(`Error parsing custom theme JSON: `, error);
    }
  }

  const setCustomTheme = (primaryHSL: any, nineCollorPallet?: any) => {
    // console.log(`custom theme triggered:: `, primaryHSL, nineCollorPallet)
    if (primaryHSL === false && !nineCollorPallet.length) {
      setCustomStyles({});
    }
    if (nineCollorPallet?.length) {
      // console.log('SETTING CUSTOM STYLES ')
      setCustomStyles({
        "--vg-primary": primaryHSL
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-50": nineCollorPallet[0]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-100": nineCollorPallet[1]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-200": nineCollorPallet[2]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-300": nineCollorPallet[3]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-400": nineCollorPallet[4]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-500": nineCollorPallet[5]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-600": nineCollorPallet[6]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-700": nineCollorPallet[7]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-800": nineCollorPallet[8]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
        "--vg-primary-900": nineCollorPallet[9]
          .map((item: any, index: number) => (index === 0 ? item : `${item}%`))
          .join(` `),
      } as any);
    }
  };

  const value = {
    customStyles,
    setCustomTheme,
    getColor,
    switchCustomColorPallet,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div id={"vg-theme-container"} style={customStyles}>
        {props.children}
      </div>
    </ThemeContext.Provider>
  );
};

export default OrbThemeProvider;