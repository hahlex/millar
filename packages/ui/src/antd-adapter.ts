import { MILLAR_DARK_TOKENS, MILLAR_LIGHT_TOKENS, MILLAR_Z_INDEX } from "@hahlex/millar-tokens/ts";

/**
 * Generates an Ant Design 6 ThemeConfig object using literal hex/rgba token values
 * (never var(--token) strings, which collapse @ant-design/colors generate()).
 * Drop-in adapter for hahlex-edu and future Ant Design Hahlex apps.
 */
export function createMillarAntdTheme(mode: "light" | "dark") {
  const t = mode === "dark" ? MILLAR_DARK_TOKENS : MILLAR_LIGHT_TOKENS;
  return {
    cssVar: { prefix: "millar-ant" },
    token: {
      colorPrimary: t.accent,
      colorPrimaryHover: t.accentHover,
      colorLink: t.fgAccent,
      colorLinkHover: t.fgAccentHover,
      colorBgBase: t.bgApp,
      colorBgContainer: t.bgSurface,
      colorBgElevated: t.bgElevated,
      colorBgLayout: t.bgApp,
      colorText: t.fgDefault,
      colorTextSecondary: t.fgMuted,
      colorTextTertiary: t.fgSubtle,
      colorBorder: t.borderDefault,
      colorBorderSecondary: t.borderSoft,
      colorSuccess: t.statusSuccess,
      colorWarning: t.statusWarning,
      colorError: t.statusError,
      fontFamily: "var(--font-sans)",
      fontFamilyCode: "var(--font-mono)",
      fontSize: 14,
      borderRadius: 10,
      borderRadiusSM: 8,
      borderRadiusLG: 12,
      controlHeight: 40,
      controlHeightSM: 32,
      controlHeightLG: 44,
      boxShadow: t.shadowCard,
      boxShadowSecondary: t.shadowPopover,
      zIndexPopupBase: MILLAR_Z_INDEX.drawer + 10,
    },
    components: {
      Button: {
        primaryShadow: "none",
        dangerShadow: "none",
        defaultShadow: "none",
        fontWeight: 500,
      },
      Tabs: {
        inkBarColor: t.fgAccent,
        itemSelectedColor: t.fgDefault,
        itemActiveColor: t.fgAccent,
      },
      Pagination: {
        itemActiveBg: t.toneBrandSoft,
      },
    },
  } as const;
}
