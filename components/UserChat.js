import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { UserType } from "../screens/UserContext";
import moment from "moment-timezone";

const UserChat = ({ item }) => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const { userId, setUserId } = useContext(UserType);

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://192.168.40.158:8000/messages/${userId}/${item._id}`
        );
        const data = await response.json();
        if (response.ok && isMounted) {
          setMessages(data);
        } else {
          console.log("error showing messages", response.status.message);
        }
      } catch (err) {
        console.log("error fetching messages", err);
      }
    };

    if (isMounted) {
      fetchMessages();
    }

    return () => {
      // Cleanup function untuk dijalankan saat komponen di-unmount
      isMounted = false;
      setMessages([]); // Setel state messages ke kondisi awal
    };
  }, [userId, item._id]);

  const getLastMessage = () => {
    const userMessage = messages.filter(
      (message) => message.messageType === "text"
    );
    const n = userMessage.length;
    return userMessage[n - 1];
  };

  const formatTime = (time) => {
    const jakartaTime = moment(time).tz("Asia/Jakarta").format("HH:mm");
    return jakartaTime;
  };

  const lastMessage = getLastMessage();
  console.log("Last message:", lastMessage);

  // Check if item is defined before accessing its properties
  const itemName = item?.name || "Default Name"; // Replace "Default Name" with a suitable fallback
  const itemImage = item?.image || "default_image_url"; // Replace "default_image_url" with a suitable fallback

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("Messages", {
          recepientId: item._id,
        })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 0.7,
        borderColor: "#D0D0D0",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        padding: 10,
      }}
    >
      <Image
        style={{ width: 50, height: 50, borderRadius: 25, resizeMode: "cover" }}
        source={{ uri: itemImage }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500" }}>{itemName}</Text>
        {lastMessage && (
          <Text style={{ marginTop: 3, color: "gray", fontWeight: "500" }}>
            {lastMessage?.message}
          </Text>
        )}
      </View>

      <View>
        <Text style={{ fontSize: 11, fontWeight: "400", color: "#585858" }}>
          {lastMessage && formatTime(lastMessage?.timeStamp)}
        </Text>
      </View>
    </Pressable>
  );
};

export default UserChat;

const styles = StyleSheet.create({});
