import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect } from "react";
import Icon, { IconType } from "react-native-dynamic-vector-icons";
import { isReadyRef, navigationRef } from "react-navigation-helpers";
/**
 * ? Local & Shared Imports
 */
import { DarkTheme, LightTheme, palette } from "@theme/themes";
// ? Screens
import { useWalletContext } from "@context/wallet";
import { useCredentialProvider } from "@hooks/useCredentialProvider";
import { NavigationContainer, type RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DetailScreen from "@screens/detail/DetailScreen";
import HomeScreen from "@screens/home/HomeScreen";
import LoginScreen from "@screens/login/LoginScreen";
import PinScreen from "@screens/pin/PinScreen";
import ProfileScreen from "@screens/profile/ProfileScreen";
import SettingsScreen from "@screens/settings/SettingsScreen";
import * as NavigationService from "react-navigation-helpers";
import { Routes, type ParamListBase } from "types/navigation";

// ? If you want to use stack or tab or both
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

const Navigation = () => {
  const isDarkMode = false;

  const { scaAddress } = useWalletContext();

  React.useEffect((): any => {
    return () => (isReadyRef.current = false);
  }, []);

  const renderTabIcon = (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    route: RouteProp<ParamListBase, string>,
    _focused: boolean,
    color: string,
    size: number,
  ) => {
    let iconName = "home";
    switch (route.name) {
      case Routes.Home:
        iconName = "home";
        break;
      case Routes.Profile:
        iconName = "user-circle";
        break;
      default:
        iconName = "home";
        break;
    }
    return (
      <Icon
        name={iconName}
        type={IconType.FontAwesome5}
        size={size}
        color={color}
      />
    );
  };

  const AuthNavigation = () => {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) =>
            renderTabIcon(route, focused, color, size),
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: "gray",
          tabBarStyle: {
            backgroundColor: isDarkMode ? palette.black : palette.white,
            paddingTop: 4,
            marginBottom: 8,
            height: 60,
          },
        })}
      >
        <Tab.Screen name={Routes.Login} component={LoginScreen} />
      </Tab.Navigator>
    );
  };

  const TabNavigation = () => {
    const { getPin } = useCredentialProvider();

    useEffect(() => {
      const checkPin = async (): Promise<void> => {
        const isPinConfigured = (await getPin()) !== "";

        if (!isPinConfigured) {
          NavigationService.navigate(Routes.Pin, {
            type: "set",
            result: async (result: boolean): Promise<void> => {
              result && NavigationService.pop();
              return Promise.resolve();
            },
          });
        }
      };
      setTimeout(checkPin, 100);
    }, [getPin]);

    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) =>
            renderTabIcon(route, focused, color, size),
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: "gray",
          tabBarStyle: {
            backgroundColor: isDarkMode ? palette.black : palette.white,
            paddingTop: 4,
            marginBottom: 8,
            height: 60,
          },
        })}
      >
        <Tab.Screen name={Routes.Home} component={HomeScreen} />
        <Tab.Screen name={Routes.Profile} component={ProfileScreen} />
      </Tab.Navigator>
    );
  };

  const MainNavigation = () => {
    return (
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={Routes.Tab} component={TabNavigation} />
        <Stack.Screen name={Routes.Detail} component={DetailScreen} />
        <Stack.Screen name={Routes.Setting} component={SettingsScreen} />
      </MainStack.Navigator>
    );
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        isReadyRef.current = true;
      }}
      theme={isDarkMode ? DarkTheme : LightTheme}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {scaAddress ? (
          <Stack.Screen name={Routes.Main} component={MainNavigation} />
        ) : (
          <Stack.Screen name={Routes.Auth} component={AuthNavigation} />
        )}
        <Stack.Screen name={Routes.Pin} component={PinScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
