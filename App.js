import { StyleSheet, Text, View } from "react-native";
import Auth from "./screens/Auth";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { enableScreens } from "react-native-screens";
import Info from "./screens/Info";
import Acceuil from "./screens/Acceuil";
import Chat from "./screens/Chat";
import Groups from "./screens/Groups";
import SelectUsersScreen from "./screens/SelectUsersScreen";
import GroupChat from "./screens/GroupChat";

enableScreens();
const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={Auth}></Stack.Screen>
        <Stack.Screen name="Info" component={Info}></Stack.Screen>
        <Stack.Screen
          name="Acceuil"
          component={Acceuil}
          // options={{headerShown: true}}
        ></Stack.Screen>
        <Stack.Screen name="Chat" component={Chat}></Stack.Screen>
        <Stack.Screen name="Groups" component={Groups}></Stack.Screen>
        <Stack.Screen name="SelectUsersScreen" component={SelectUsersScreen}></Stack.Screen>
        <Stack.Screen name="GroupChat" component={GroupChat}></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
    // <Auth></Auth>
  );
}

const styles = StyleSheet.create({});
