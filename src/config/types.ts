export interface ClientConfig {
  code: string;
  name: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    fontFamily?: string;
    /** Font family for body/UI text (Mare: Plus Jakarta Sans) */
    bodyFontFamily?: string;
    /** Font family for monospace/prices (Mare: JetBrains Mono) */
    monoFontFamily?: string;
  };
  texts: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    stampCardTitle: string;
    rewardsTitle: string;
  };
  rules: {
    stampsPerReward: number;
  };
  assets: {
    logo: string;
    favicon?: string;
    gallery?: string[];
    menuGallery?: { src: string; label: string }[];
  };
  social?: {
    instagram?: string;
    website?: string;
  };
  features: {
    showBuyButton?: boolean;
    externalMenuUrl?: string;
    showNewsFeed?: boolean;
    menuEnabled?: boolean;
    showAboutUs?: boolean;
    marketingEnabled?: boolean;
    adminSettingsEnabled?: boolean;
  };
}
