import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { TextInput } from "react-native-paper";
import initApp from "../Config";
import { serverTimestamp, serverTimeStamp, set } from "firebase/database";

export default function Chat(props) {
  const database = initApp.database();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  // const currentUserId = "Linabs";
  // const roomId = "chat_room_1";
  const roomId = props.route.params.roomId;
  const otherUserId = props.route.params.otherUserId;
  const currentUserId = props.route.params.currentUserId;
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const [currentUserProfileInfo, setCurrentUserProfileInfo] = useState(null);
  const [otherUserProfileInfo, setOtherUserProfileInfo] = useState(null);
  const [otherUserConnected, setOtherUserConnected] = React.useState(false);

  const flatListRef = React.useRef();
  const typingTimeout = React.useRef(null);

  async function loadUserProfilePictures() {
    try {
      const currentUserSnap = await database
        .ref(`profils/${currentUserId}`)
        .once("value");

      const otherUserSnap = await database
        .ref(`profils/${otherUserId}`)
        .once("value");

      setCurrentUserProfileInfo(currentUserSnap.val() || null);
      setOtherUserProfileInfo(otherUserSnap.val() || null);
    } catch (error) {
      console.error("Error loading profile pictures:", error);
    }
  }

  async function sendMessage() {
    if (message.trim() === "") return;
    try {
      const messagesRef = database.ref(`chatrooms/${roomId}/messages`);
      const newMessageRef = messagesRef.push();
      const messageKey = newMessageRef.key;

      const messageData = {
        senderId: currentUserId,
        receiverId: otherUserId,
        text: message,
        timestamp: Date.now(),
        key: messageKey,
      };
      await newMessageRef.set(messageData);

      await database.ref(`chatrooms/${roomId}`).update({
        lastMessage: message,
        lastTimestamp: Date.now(),
      });

      setMessage("");
    } catch (error) {
      alert("Error sending message: " + error.message);
    }
  }

  const handleLongPress = (messageId) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMessage(messageId),
        },
      ]
    );
  };

  function deleteMessage(messageId) {
    const messageRef = database.ref(
      `chatrooms/${roomId}/messages/${messageId}`
    );
    messageRef.remove().catch((error) => {
      console.error("Error deleting message:", error);
    });
  }

  function setTyping(isTyping) {
    database.ref(`chatrooms/${roomId}/${currentUserId}_isTyping`).set(isTyping);
  }

  function internetCall() {
    
  }

  useEffect(() => {
    loadUserProfilePictures();

    const messagesRef = database
      .ref(`chatrooms/${roomId}/messages`)
      .orderByChild("timestamp");

    const listener = messagesRef.on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        // Sort by timestamp
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        msgs.reverse();

        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });

    return () => messagesRef.off("value", listener);
  }, [roomId]);

  useEffect(() => {
    if (!otherUserId) return;

    const otherUserRef = database.ref(`profils/${otherUserId}/connected`);

    const listener = otherUserRef.on("value", (snapshot) => {
      const isConnected = snapshot.val() === true;
      setOtherUserConnected(isConnected);
    });

    return () => otherUserRef.off("value", listener);
  }, [otherUserId]);

  useEffect(() => {
    const otherIsTyping = database.ref(
      `chatrooms/${roomId}/${otherUserId}_isTyping`
    );
    const typingListener = otherIsTyping.on("value", (snapshot) => {
      const isTyping = snapshot.val();
      setOtherUserTyping(isTyping);
    });
    return () => otherIsTyping.off("value", typingListener);
  }, [otherUserId, roomId]);

  // message bloc
  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;

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
        {/* profile pic */}
        <Image
          source={{
            uri: isMe
              ? currentUserProfileInfo.profilePicture
              : otherUserProfileInfo.profilePicture,
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            marginHorizontal: 6,
            backgroundColor: "#ddd",
          }}
        />
        <TouchableWithoutFeedback onLongPress={() => handleLongPress(item.key)}>
          <View
            style={{
              maxWidth: "70%",
              backgroundColor: isMe ? "#0A8F08" : "#e6e6e6",
              padding: 10,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: isMe ? "white" : "black" }}>{item.text}</Text>

            {/* time */}
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
        </TouchableWithoutFeedback>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ backgroundColor: "#0A8F08", height: 30 }}></View>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: currentUserProfileInfo?.profilePicture }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            marginHorizontal: 6,
            backgroundColor: "#ddd",
          }}
        />
        <View>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
            {otherUserProfileInfo?.prenom} {otherUserProfileInfo?.nom}
          </Text>

          <Text style={{ color: "white", fontSize: 12 }}>
            {otherUserConnected ? "Online" : "Offline"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => internetCall()}>
        <Image
          source={require("../assets/call_icon.png")}
          style={{ width: 25, height: 25, marginLeft: "auto" }}
        />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: "white" }}>
        {/*  Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 10 }}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToIndex({ index: 0, animated: true });
            }
          }}
        />
        {otherUserTyping && <Text style={styles.typingBtn}>Typing...</Text>}
      </View>

      {/*  Input area */}
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

            setTyping(true);

            if (typingTimeout.current) {
              clearTimeout(typingTimeout.current);
            }

            typingTimeout.current = setTimeout(() => {
              setTyping(false);
            }, 1500);
          }}
        />

        <TouchableOpacity onPress={sendMessage} style={styles.sendMsgBtn}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
      <View style={{ backgroundColor: "#f9f9f9", height: 40 }}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 15,
    backgroundColor: "#0A8F08",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
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
