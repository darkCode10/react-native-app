require('dotenv').config();

export default {
  expo: {
    name: "FreelanceSync",
    slug: "freelancesync-mobile",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#0532A9"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.freelancesync.mobile"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#0532A9"
      },
      package: "com.freelancesync.mobile"
    },
    web: {
      bundler: "metro",
      build: {
        babel: {
          include: ['dotenv']
        }
      }
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseApiKey: process.env.EXPO_PUBLIC_SUPABASE_API_KEY || '',
      eas: {
        projectId: "your-project-id"
      }
    }
  }
};



