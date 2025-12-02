import { StyleSheet, Text, View } from "react-native";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import React from "react";
import Add from "./Add";
import List from "./List";

export default function Acceuil(props) {
  const Tab = createMaterialBottomTabNavigator();
  const currentUserId = props.route.params.currentUserId;
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="List"
        component={List}
        initialParams={{ currentUserId: currentUserId }}
      />
      {/* <Tab.Screen name="Groups" component={List} /> */}
      <Tab.Screen
        name="Add"
        component={Add}
        initialParams={{ currentUserId: currentUserId }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({});
