import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { TextInput } from "react-native-paper";
import initApp from "../Config";
import { serverTimestamp, serverTimeStamp } from "firebase/database";

export default function Chat(props) {
  const database = initApp.database();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  // const currentUserId = "Linabs";
  // const roomId = "chat_room_1";
  const roomId = props.route.params.roomId;
  const otherUserId = props.route.params.otherUserId;
  const currentUserId = props.route.params.currentUserId;

  const flatListRef = React.useRef();

  async function sendMessage() {
    if (message.trim() === "") return;
    // try {
    //   const newMessage = database.ref(`messages/${roomId}`).push();
    //   await newMessage.set({
    //     senderId: currentUserId,
    //     text: message,
    //     timestamp: serverTimestamp(),
    //     // timestamp: Date.now(),
    //   });
    // } catch (error) {
    //   console.error("Error sending message:", error);
    //   alert("Failed to send message: " + error.message);
    // }

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

  useEffect(() => {
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
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages]);
  // message bubble
  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;

    const timeString = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isMe ? "flex-end" : "flex-start",
          paddingHorizontal: 10,
          marginVertical: 4,
        }}
      >
        <View
          style={{
            maxWidth: "70%",
            backgroundColor: isMe ? "#0A8F08" : "#e6e6e6",
            padding: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: isMe ? "white" : "black" }}>{item.text}</Text>

          {/* TIME BELOW MESSAGE */}
          <Text
            style={{
              fontSize: 10,
              color: isMe ? "white" : "black",
              opacity: 0.6,
              marginTop: 4,
              alignSelf: "flex-end", // time inside message bubble
            }}
          >
            {timeString}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 🔵 Header */}
      <View
        style={{
          padding: 15,
          backgroundColor: "#0A8F08",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
          {currentUserId}
        </Text>
      </View>

      {/* 🟢 Chat messages */}
      {/* <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={{ flex: 1, padding: 10 }}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#DCF8C6",
              padding: 10,
              marginVertical: 5,
              borderRadius: 7,
              alignSelf: "flex-start",
              maxWidth: "80%",
            }}
          >
            <Text>{item.text}</Text>
          </View>
        )}
      /> */}

      <View style={{ flex: 1, backgroundColor: "white" }}>
        {/* 💬 Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 10 }}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />

        {/* 📝 Message input */}
        <View
          style={{
            flexDirection: "row",
            padding: 10,
            borderTopWidth: 1,
            borderColor: "#ddd",
          }}
        ></View>
      </View>

      {/* 🔻 Input area */}
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
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderRadius: 20,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: "#ddd",
          }}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity
          onPress={sendMessage}
          style={{
            backgroundColor: "#0A8F08",
            paddingHorizontal: 20,
            marginLeft: 10,
            justifyContent: "center",
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
