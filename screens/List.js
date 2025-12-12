import {
  Alert,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import app from "../Config";
import call from "react-native-phone-call";

export default function List(props) {
  const auth = app.auth();
  const [data, setData] = React.useState([]);
  const ref_all_users = app.database().ref().child("profils");

  const currentUserId = props.route.params.currentUserId;

  useEffect(() => {
    ref_all_users.on("value", (snapshot) => {
      var d = [];
      snapshot.forEach((one_user) => {
        d.push(one_user.val());
      });
      setData(d);
    });
  }, []);

  async function startChatWith(currentUserId, otherUserId) {
    const db = app.database();

    // make the room id
    const user1 = currentUserId < otherUserId ? currentUserId : otherUserId;
    const user2 = currentUserId < otherUserId ? otherUserId : currentUserId;
    const chatroomId = `${user1}_${user2}`;

    const chatroomRef = db.ref(`chatrooms/${chatroomId}`);

    // check if room exists
    const snapshot = await chatroomRef.once("value");

    if (!snapshot.exists()) {
      // create the room
      await chatroomRef.set({
        lastMessage: "",
        lastTimestamp: Date.now(),
      });
    }
    return chatroomId;
  }

  async function callPhoneNumber(phoneNumber) {
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      console.error("Error making call:", error);
      Alert.alert("Error", "Unable to make a call");
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View style={{ backgroundColor: "#93b8ddff", height: 30 }}></View>
      <View
        style={{
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Friend List</Text>
      </View>
      <View style={{ flex: 1, padding: 20 }}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userBox}>
              <View style={{ marginRight: 10 }}>
                <Image
                  source={{ uri: item.profilePicture }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 25,
                    backgroundColor: "#ccc",
                  }}
                />

                {/* green dot */}
                {item.connected === true && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "limegreen",
                      borderWidth: 2,
                      borderColor: "white",
                    }}
                  />
                )}
              </View>

              <Text>{item.nom}</Text>
              <Text>{item.prenom}</Text>
              <Text>{item.numero}</Text>

              <TouchableOpacity onPress={() => callPhoneNumber(item.numero)}>
                <Image
                  source={require("../assets/call_icon.png")}
                  style={styles.icons}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const otherUserId = item.id;
                  const roomId = await startChatWith(
                    currentUserId,
                    otherUserId
                  );

                  props.navigation.navigate("Chat", {
                    currentUserId: currentUserId,
                    otherUserId: otherUserId,
                    roomId: roomId,
                  });
                }}
              >
                <Image
                  source={require("../assets/messageIcon.png")}
                  style={styles.icons}
                />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
      <TouchableHighlight
        activeOpacity={0.5}
        underlayColor="navy"
        title="log out"
      >
        <Text
          onPress={() => {
            auth
              .signOut()
              .then(() => {
                try {
                  app
                    .database()
                    .ref("profils/" + currentUserId)
                    .update({
                      connected: false,
                    });
                } catch (err) {
                  console.log("Error updating connected status:", err);
                }
              })
              .then(() => {
                props.navigation.replace("Auth");
              });
          }}
        >
          Log out
        </Text>
      </TouchableHighlight>
      <Text>User ID: {currentUserId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  userBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f1f1f1",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  icons: {
    width: 30,
    height: 30,
  },
});
