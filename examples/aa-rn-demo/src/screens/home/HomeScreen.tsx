import React, { useCallback, useEffect, useMemo } from "react";
import { FlatList, Linking, Platform, SafeAreaView, View } from "react-native";
import * as NavigationService from "react-navigation-helpers";

/**
 * ? Local Imports
 */
import createStyles from "./HomeScreen.style";
import CardItem from "./components/card-item/CardItem";
import MockData from "./mock/MockData";
/**
 * ? Shared Imports
 */
import type { ICardItem } from "@models";
import FormImage from "@shared-components/atom/FormImage";
import type { OwnedNft } from "alchemy-sdk";
import { Routes } from "types/navigation";

interface HomeScreenProps {}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const styles = useMemo(() => createStyles(), []);

  const handleItemPress = (item: OwnedNft | ICardItem) => {
    NavigationService.push(Routes.Detail, { item, mintable: true });
  };

  /* -------------------------------------------------------------------------- */
  /*                               Render Methods                               */
  /* -------------------------------------------------------------------------- */

  const Header = () => (
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 16,
      }}
    >
      <FormImage
        source={require("../../assets/images/demo.png")}
        width={200}
        height={25}
      />
      <FormImage
        source={require("../../assets/images/powered_by.png")}
        width={150}
        height={20}
      />
    </View>
  );

  const List = () => (
    <View style={styles.listContainer}>
      <FlatList
        data={MockData}
        renderItem={({ item }) => (
          <CardItem data={item} onPress={() => handleItemPress(item)} />
        )}
      />
    </View>
  );

  const Content = () => (
    <View style={styles.contentContainer}>
      <List />
    </View>
  );

  const handleInitialUrl = (url: string | null) => {
    if (url === null) return;

    const route = url.replace(/.*?:\/\//g, "");
    // eslint-disable-next-line no-useless-escape
    const tokens = route.match(/\/([^\/]+)\/?$/) || [];
    const id = tokens.length > 0 ? tokens[1] : null;
    if (id === null) {
      console.log(`Deeplink: Invalid deeplink url ${url}`);
      return;
    }

    // app link
    let routeName;
    if (url.startsWith("https://")) {
      const [, _routeName] = route.split("/");
      routeName = _routeName;
    } else {
      const [_routeName] = route.split("/");
      routeName = _routeName;
    }

    console.log(`Deeplink: ${routeName} ${id}`);
    if (routeName === "nft") {
      NavigationService.push(Routes.Detail, {
        item: MockData[Number(id)],
        mintable: true,
      });
    } else {
      console.log(`Deeplink: Unable to find route ${url}`);
    }
  };

  const handleOpenUrl = useCallback((event: { url: string | null }) => {
    handleInitialUrl(event.url);
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      Linking.getInitialURL().then((url) => {
        handleInitialUrl(url);
      });
      return;
    }
    const subscription = Linking.addEventListener("url", handleOpenUrl);
    return () => {
      if (subscription) subscription.remove();
    };
  }, [handleOpenUrl]);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Content />
    </SafeAreaView>
  );
};

export default HomeScreen;
