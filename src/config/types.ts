export interface ClientConfig {
  code: string;
  name: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    fontFamily?: string;
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
  };
  social?: {
    instagram?: string;
  };
  features: {
    showBuyButton?: boolean;
    externalMenuUrl?: string;
    showNewsFeed?: boolean;
    menuEnabled?: boolean;
    showAboutUs?: boolean;
  };
}
