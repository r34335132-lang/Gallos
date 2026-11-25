import { Alert, Platform, type AlertButton } from "react-native";

// react-native-web implementa Alert.alert como una funcion vacia: en el navegador
// ningun aviso ni confirmacion aparece. Lo redirigimos a los dialogos del navegador.
if (Platform.OS === "web") {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    if (typeof window === "undefined") return;
    const text = [title, message].filter(Boolean).join("\n\n");
    const options = buttons || [];
    const cancel = options.find((button) => button.style === "cancel");
    const actions = options.filter((button) => button !== cancel);

    if (actions.length === 0 || (actions.length === 1 && !cancel)) {
      window.alert(text);
      actions[0]?.onPress?.();
      return;
    }

    if (window.confirm(text)) actions[actions.length - 1]?.onPress?.();
    else cancel?.onPress?.();
  };
}
