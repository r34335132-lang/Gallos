const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const supabaseCjsPath = path.resolve(
  require.resolve("@supabase/supabase-js/package.json"),
  "../dist/index.cjs"
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@supabase/supabase-js") {
    return {
      type: "sourceFile",
      filePath: supabaseCjsPath,
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
