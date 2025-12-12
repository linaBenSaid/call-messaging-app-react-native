import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import app from "../Config";
import { TextInput } from "react-native-paper";

export default function SelectUsersScreen({ navigation, route }) {
  const currentUserId = route.params.currentUserId;
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");

  // Load users list
  useEffect(() => {
    const ref = app.database().ref("profils");

    ref.on("value", (snapshot) => {
      if (snapshot.exists()) {
        const list = Object.keys(snapshot.val()).map((id) => ({
          id,
          ...snapshot.val()[id],
        }));

        // remove yourself
        setUsers(list.filter((u) => u.id !== currentUserId));
      }
    });

    return () => ref.off();
  }, []);

  const toggleUser = (userId) => {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Create group
  const createGroup = async () => {
    if (selected.length < 1) {
      alert("Select at least 1 person");
      return;
    }

    const groupId = app.database().ref().push().key;

    await app.database().ref(`groups/${groupId}`).set({
      name: groupName || "New Group",
      picture: null,
      createdAt: Date.now(),
      createdBy: currentUserId,
    });

    // Add members to groupMembers
    const allMembers = [...selected, currentUserId];

    allMembers.forEach((uid) => {
      app.database().ref(`groupMembers/${groupId}/${uid}`).set(true);
      app.database().ref(`userGroups/${uid}/${groupId}`).set(true);
    });

    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        placeholder="Group name..."
        value={groupName}
        onChangeText={setGroupName}
        style={{
          marginTop: 20,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 10,
          marginBottom: 20,
        }}
      />

      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        Select Users
      </Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: "#f2f2f2",
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
            onPress={() => toggleUser(item.id)}
          >
            <Text>{item.nom + " " + item.prenom}</Text>

            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: "#000",
                backgroundColor: selected.includes(item.id) ? "green" : "white",
              }}
            />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        onPress={createGroup}
        style={{
          padding: 15,
          backgroundColor: "green",
          borderRadius: 10,
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
          Create Group
        </Text>
      </TouchableOpacity>
    </View>
  );
}
