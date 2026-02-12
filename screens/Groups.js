import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { TextInput } from "react-native-paper";
import app from "../Config";

export default function Groups(props) {
  const currentUserId = props.route.params.currentUserId;
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const ref = app.database().ref(`userGroups/${currentUserId}`);

    ref.on("value", async (snapshot) => {
      if (!snapshot.exists()) {
        setGroups([]);
        return;
      }

      const groupIds = Object.keys(snapshot.val());

      // group details
      const groupPromises = groupIds.map(async (groupId) => {
        const groupSnap = await app
          .database()
          .ref(`groups/${groupId}`)
          .once("value");

        return { id: groupId, ...groupSnap.val() };
      });

      const results = await Promise.all(groupPromises);
      setGroups(results);
    });

    return () => ref.off();
  }, []);

  const handleLeaveGroup = (groupId, groupName) => {
    Alert.alert("Leave Group", `Do you want to leave "${groupName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await app
              .database()
              .ref(`groupMembers/${groupId}/${currentUserId}`)
              .remove();

            await app
              .database()
              .ref(`userGroups/${currentUserId}/${groupId}`)
              .remove();

            const membersSnap = await app
              .database()
              .ref(`groupMembers/${groupId}`)
              .once("value");

            if (!membersSnap.exists()) {
              await app.database().ref(`groups/${groupId}`).remove();
            }

            Alert.alert("Left Group", `You left "${groupName}".`);
          } catch (err) {
            console.log("Leave group failed:", err);
            Alert.alert("Error", "Could not leave the group.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={{ height: 30 }}></View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Groups</Text>

        <TouchableOpacity
          onPress={() =>
            props.navigation.navigate("SelectUsersScreen", { currentUserId })
          }
          style={{
            backgroundColor: "green",
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 24 }}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: "#eee",
              borderRadius: 10,
              marginBottom: 10,
            }}
            onPress={() =>
              props.navigation.navigate("GroupChat", {
                currentUserId,
                groupId: item.id,
              })
            }
            onLongPress={() => handleLeaveGroup(item.id, item.name)}
          >
            <Text style={{ fontSize: 18, fontWeight: "500" }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
