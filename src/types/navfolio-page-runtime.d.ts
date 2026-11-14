declare module 'virtual:navfolio/page-runtime' {
  export const BaseHead: typeof import('../modules/page-runtime').BaseHead;
  export const Footer: typeof import('../modules/page-runtime').Footer;
  export const FormattedDate: typeof import('../modules/page-runtime').FormattedDate;
  export const SmartImage: typeof import('../modules/page-runtime').SmartImage;
  export const BlogTopNav: typeof import('../modules/page-runtime').BlogTopNav;
  export const ZoomableImage: typeof import('../modules/page-runtime').ZoomableImage;
  export const getSiteConfig: typeof import('../modules/page-runtime').getSiteConfig;
  export const getHtmlLang: typeof import('../modules/page-runtime').getHtmlLang;
  export const getUiText: typeof import('../modules/page-runtime').getUiText;
  export const getI18n: typeof import('../modules/page-runtime').getI18n;
  export const vibeFlightIconUrl: typeof import('../modules/page-runtime').vibeFlightIconUrl;
}
