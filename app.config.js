require('dotenv').config();

export default {
  expo: {
    name: "FreelanceSync",
    slug: "freelancesync-mobile",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    icon: "./src/asset/Logo.png",
    plugins: [
      "expo-font"
    ],
    splash: {
      image: "./src/asset/Logo.png",
      resizeMode: "contain",
      backgroundColor: "#0532A9"
    },
    assetBundlePatterns: [
      "**/*",
      "src/asset/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.freelancesync.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./src/asset/Logo.png",
        backgroundColor: "#0532A9"
      },
      package: "com.freelancesync.mobile",
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
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
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qpzilvhpcpcwsuuqhjwv.supabase.co',
      supabaseApiKey: process.env.EXPO_PUBLIC_SUPABASE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwemlsdmhwY3Bjd3N1dXFoand2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDk5NzQsImV4cCI6MjA3NTM4NTk3NH0.S0D5cbVS36ROGIv1dW311ZEmYCr1fq_AbRgFOtMqHdY',
      eas: {
        projectId: "2c97a3cb-c34a-4494-8944-62f59d90f85e"
      }
    }
  }
};



