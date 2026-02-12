import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import app from "../Config";

export default function GroupChatScreen(props) {
  const groupId = props.route.params.groupId;
  const currentUserId = props.route.params.currentUserId;

  const [messages, setMessages] = useState([]);
  const [groupInfo, setGroupInfo] = useState({});
  const [membersInfo, setMembersInfo] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);

  const [message, setMessage] = useState("");

  const flatListRef = useRef();
  const typingTimeout = useRef(null);

  const [showMembersModal, setShowMembersModal] = useState(false);

  //group info
  useEffect(() => {
    const ref = app.database().ref(`groups/${groupId}`);
    ref.on("value", (snap) => {
      if (snap.exists()) setGroupInfo(snap.val());
    });
    return () => ref.off();
  }, []);

  //  load group members + their profile info

  useEffect(() => {
    const ref = app.database().ref(`groupMembers/${groupId}`);

    ref.on("value", async (snap) => {
      if (!snap.exists()) return;

      const memberIds = Object.keys(snap.val());

      // get members profiles
      const promises = memberIds.map(async (uid) => {
        const p = await app.database().ref(`profils/${uid}`).once("value");
        return { uid, ...p.val() };
      });

      const result = await Promise.all(promises);

      // convert to object
      const info = {};
      result.forEach((u) => (info[u.uid] = u));
      setMembersInfo(info);
    });

    return () => ref.off();
  }, []);

  // Load messages

  useEffect(() => {
    const ref = app
      .database()
      .ref(`groupMessages/${groupId}`)
      .orderByChild("timestamp");

    ref.on("value", (snapshot) => {
      if (!snapshot.exists()) {
        setMessages([]);
        return;
      }

      const msgs = Object.keys(snapshot.val()).map((key) => ({
        id: key,
        ...snapshot.val()[key],
      }));

      msgs.sort((a, b) => b.timestamp - a.timestamp); 

      setMessages(msgs);
    });

    return () => ref.off();
  }, []);

  //  typing indicators

  useEffect(() => {
    const ref = app.database().ref(`groupTyping/${groupId}`);

    ref.on("value", (snap) => {
      const data = snap.val() || {};
      const typing = Object.keys(data).filter(
        (uid) => data[uid] === true && uid !== currentUserId
      );
      setTypingUsers(typing);
    });

    return () => ref.off();
  }, []);

  //  Send message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const ref = app.database().ref(`groupMessages/${groupId}`).push();

    await ref.set({
      text: message,
      senderId: currentUserId,
      timestamp: Date.now(),
    });

    setMessage("");

    // stop typing
    app.database().ref(`groupTyping/${groupId}/${currentUserId}`).set(false);
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const sender = membersInfo[item.senderId];
    const timeString = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        style={{
          flexDirection: isMe ? "row-reverse" : "row",
          alignItems: "flex-start",
          paddingHorizontal: 10,
          marginVertical: 4,
        }}
      >
        {/* Profile picture */}
        <Image
          source={{ uri: sender?.profilePicture }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            marginHorizontal: 6,
            backgroundColor: "#ddd",
          }}
        />
        <View style={{ maxWidth: "70%" }}>
          {!isMe && (
            <Text style={{ marginLeft: 6, fontSize: 12, color: "#555" }}>
              {sender?.prenom} {sender?.nom}
            </Text>
          )}
          {/* Message */}
          <View
            style={{
              backgroundColor: isMe ? "#0A8F08" : "#e6e6e6",
              padding: 10,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: isMe ? "white" : "black" }}>{item.text}</Text>

            {/* Time */}
            <Text
              style={{
                fontSize: 10,
                color: isMe ? "white" : "black",
                opacity: 0.6,
                marginTop: 4,
                alignSelf: "flex-end",
              }}
            >
              {timeString}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  //   typing text

  const typingDisplay =
    typingUsers.length === 1
      ? `${membersInfo[typingUsers[0]]?.prenom} is typing...`
      : typingUsers.length > 1
      ? "Several people are typing..."
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* HEADER */}
      <View style={{ backgroundColor: "#0A8F08", height: 30 }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          backgroundColor: "#0A8F08",
        }}
      >
        <Image
          source={{ uri: groupInfo.picture }}
          style={{
            width: 45,
            height: 45,
            borderRadius: 22,
            marginRight: 10,
            backgroundColor: "#ddd",
          }}
        />

        <View>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
            {groupInfo.name}
          </Text>
          <TouchableOpacity onPress={() => setShowMembersModal(true)}>
            <Text style={{ color: "white", fontSize: 12 }}>
              {Object.keys(membersInfo).length} members
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MESSAGE LIST */}
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 10 }}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        />
      </View>

      {typingDisplay && <Text style={styles.typingBtn}>{typingDisplay}</Text>}

      <View
        style={{
          flexDirection: "row",
          padding: 10,
          borderTopWidth: 1,
          borderColor: "#ddd",
          backgroundColor: "#f9f9f9",
        }}
      >
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            app
              .database()
              .ref(`groupTyping/${groupId}/${currentUserId}`)
              .set(true);

            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
              app
                .database()
                .ref(`groupTyping/${groupId}/${currentUserId}`)
                .set(false);
            }, 1500);
          }}
        />

        <TouchableOpacity onPress={sendMessage} style={styles.sendMsgBtn}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: "#f9f9f9", height: 40 }} />
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "80%",
              maxHeight: "70%",
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
            >
              Group Members
            </Text>

            <FlatList
              data={Object.values(membersInfo)}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: 5,
                  }}
                >
                  <Image
                    source={{ uri: item.profilePicture }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#ddd",
                      marginRight: 10,
                    }}
                  />
                  <Text>
                    {item.prenom} {item.nom}
                  </Text>
                </View>
              )}
            />

            <TouchableOpacity
              onPress={() => setShowMembersModal(false)}
              style={{
                marginTop: 15,
                alignSelf: "center",
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: "#0A8F08",
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  typingBtn: {
    color: "gray",
    marginLeft: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 20,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: 700,
    backgroundColor: "#292929ff",
    color: "#ffffffff",
  },
  sendMsgBtn: {
    backgroundColor: "#0A8F08",
    paddingHorizontal: 20,
    marginLeft: 10,
    justifyContent: "center",
    borderRadius: 20,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
