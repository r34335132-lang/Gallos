import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePublicPushNotifications() {
  useEffect(() => {
    registerDeviceAsync().catch((error) => console.log("No se pudo registrar para notificaciones:", error));
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const openFromNotification = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === "string" && url.startsWith("/")) {
        router.push(url as any);
      }
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) openFromNotification(lastResponse.notification);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response.notification);
    });
    return () => subscription.remove();
  }, []);
}

async function registerDeviceAsync() {
  if (Platform.OS === "web" || !Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Noticias y eventos",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { error } = await supabase.rpc("register_public_push_token", {
    p_token: token,
    p_platform: Platform.OS,
  });
  if (error) throw error;
}
