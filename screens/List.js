import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import app from "../Config";

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
        user1IsTyping: false,
        user2IsTyping: false,
        lastMessage: "",
        lastTimestamp: Date.now(),
      });

      // Add room to each user's list
      // await db.ref(`usersChatrooms/${chatroomId}`).set(true);
    }

    return chatroomId;

    // const chatroomsRef = app.database().ref("chatrooms");

    // // 1) get all rooms
    // const snapshot = await chatroomsRef.once("value");
    // const rooms = snapshot.val() || {};

    // // 2) check if a room already exists
    // for (let roomId in rooms) {
    //   const members = rooms[roomId].members;
    //   if (members[currentUserId] && members[otherUserId]) {
    //     return roomId; // found existing room
    //   }
    // }

    // // 3) otherwise create a room
    // const newRoomRef = chatroomsRef.push();
    // const newRoomId = newRoomRef.key;

    // await newRoomRef.set({
    //   members: {
    //     [currentUserId]: true,
    //     [otherUserId]: true,
    //   },
    //   lastMessage: "",
    //   lastTimestamp: Date.now(),
    // });

    // // Register room for each user
    // await app
    //   .database()
    //   .ref(`usersChatrooms/${currentUserId}/${newRoomId}`)
    //   .set(true);
    // await app
    //   .database()
    //   .ref(`usersChatrooms/${otherUserId}/${newRoomId}`)
    //   .set(true);

    // return newRoomId;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View style={{ backgroundColor: "#93b8ddff", height: 30 }}></View>
      <Text>List</Text>
      <View style={{ flex: 1, padding: 20 }}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userBox}>
              <Text>{item.nom}</Text>
              <Text>{item.prenom}</Text>
              <Text>{item.numero}</Text>
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
                  source={require("../assets/call_icon.png")}
                  style={styles.icons}
                />
              </TouchableOpacity>
              <TouchableOpacity>
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
            auth.signOut().then(() => {
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
