import Constants from "expo-constants";

export const IS_PUBLIC_APP = Constants.expoConfig?.extra?.appVariant === "public";

export const WEB_PORTAL_URL = (process.env.EXPO_PUBLIC_SITE_URL || "https://gallos-eta.vercel.app").replace(/\/$/, "");
