// APP_VARIANT=public: build informativa para App Store / Play Store.
// Solo incluye las rutas de app-public/ (noticias, eventos, galeria, contacto...).
// Registro de beneficiarios, expedientes, documentos y paneles internos
// quedan fuera del binario y solo existen en el portal web (rutas de app/).
const IS_PUBLIC_APP = process.env.APP_VARIANT === "public";

module.exports = ({ config }) => {
  if (!IS_PUBLIC_APP) {
    return config;
  }

  const {
    NSPhotoLibraryUsageDescription,
    NSCameraUsageDescription,
    NSDocumentsFolderUsageDescription,
    ...infoPlist
  } = config.ios?.infoPlist || {};

  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist,
    },
    android: {
      ...config.android,
      permissions: [],
      blockedPermissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
      ],
    },
    extra: {
      ...config.extra,
      appVariant: "public",
      router: {
        ...config.extra?.router,
        root: "app-public",
      },
    },
  };
};
