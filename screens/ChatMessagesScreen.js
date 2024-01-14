import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import React, {
  useState,
  useContext,
  useLayoutEffect,
  useEffect,
  useRef,
} from "react";
import { Entypo, Feather } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";
import { UserType } from "./UserContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import moment from "moment-timezone";
import * as ImagePicker from "expo-image-picker";
const path = require("path");

const ChatMessagesScreen = () => {
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [recepientData, setRecepientData] = useState();
  const [selectedMessage, setSelectedMessage] = useState([]);
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const { userId, setUserId } = useContext(UserType);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const route = useRoute();
  const { recepientId } = route.params;
  const scrollViewRef = useRef();
  const handleEmojiPress = () => {
    setShowEmojiSelector(!showEmojiSelector);
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `http://192.168.40.158:8000/messages/${userId}/${recepientId}`
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data);
      } else {
        console.log("error showing messages", response.status.message);
      }
    } catch (err) {
      console.log("error fetching messages", err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const fetchRecepientData = async () => {
      try {
        const response = await fetch(
          `http://192.168.40.158:8000/user/${recepientId}`
        );

        // Check if the response is successful (status code 200)
        if (response.ok) {
          const data = await response.json();
          setRecepientData(data);
        } else {
          console.log("Error: Server response not okay");
        }
      } catch (err) {
        console.log("Error retrieving details", err);
      }
    };

    fetchRecepientData();
  }, [recepientId]);

  const handleSend = async (messageType, imageUri) => {
    try {
      const formData = new FormData();
      formData.append("senderId", userId);
      formData.append("recepientId", recepientId);

      //if the message type is image or a normal text
      if (messageType === "image") {
        formData.append("messageType", "image");
        formData.append("imageFile", {
          uri: imageUri,
          name: "image.jpg",
          type: "image/jpeg",
        });
      } else {
        formData.append("messageType", "text");
        formData.append("messageText", message);
      }

      const response = await fetch("http://192.168.40.158:8000/messages", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Clear the input fields
        setMessage("");
        setSelectedImage("");
        fetchMessages();
      }
    } catch (err) {
      console.log("error sending messages", err);
    }
  };

  // console.log("messages", selectedMessage);

  const formatTime = (time) => {
    const jakartaTime = moment(time).tz("Asia/Jakarta").format("HH:mm");
    return jakartaTime;
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    // console.log(result.assets[0].uri);
    if (!result.canceled) {
      handleSend("image", result.assets[0].uri);
    }
  };

  // console.log(result);

  const handleSelectMessage = (message) => {
    setSelectedMessage((previousMessages) => {
      const isSelected = previousMessages.includes(message._id);

      if (isSelected) {
        // If the message is already selected, remove it
        return previousMessages.filter((id) => id !== message._id);
      } else {
        // If the message is not selected, add it
        return [...previousMessages, message._id];
      }
    });
  };

  const deleteMessage = async (messageIds) => {
    try {
      const response = await fetch(
        "http://192.168.40.158:8000/deletemessages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: messageIds }),
        }
      );

      if (response.ok) {
        setSelectedMessage((previousMessages) =>
          previousMessages.filter((id) => !messageIds.includes(id))
        );

        fetchMessages();
      } else {
        console.log("error deleting message", response.status);
      }
    } catch (err) {
      console.log("error deleting message", err);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            onPress={() => navigation.goBack()}
            name="arrow-back"
            size={24}
            color="black"
          />

          {selectedMessage.length > 0 ? (
            <View>
              <Text style={{ fontSize: 16, fontWeight: "500" }}>
                {selectedMessage.length}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  resizeMode: "cover",
                  marginLeft: 10,
                }}
                source={{ uri: recepientData?.image }}
              />
              <Text style={{ fontWeight: "500", marginLeft: 5, fontSize: 15 }}>
                {recepientData?.name}
              </Text>
            </View>
          )}
        </View>
      ),

      headerRight: () =>
        selectedMessage.length > 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="arrow-redo-sharp" size={24} color="black" />
            <Ionicons name="arrow-undo-sharp" size={24} color="black" />
            <FontAwesome name="star" size={24} color="black" />
            <MaterialIcons
              onPress={() => deleteMessage(selectedMessage)}
              name="delete"
              size={24}
              color="black"
            />
          </View>
        ) : null,
    });
  }, [navigation, recepientData, selectedMessage]);

  console.log(selectedMessage);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current.scrollToEnd({ animated: true })
        }
      >
        {messages.map((item, index) => {
          if (item.messageType === "text") {
            const isSelected = selectedMessage.includes(item._id);
            const isCurrentUser = item?.senderId?._id === userId;

            return (
              <View
                key={index}
                style={{
                  marginTop: 5,
                  flex: 1,
                  position: "relative",
                  ...(isCurrentUser
                    ? {
                        alignSelf: "flex-end",
                        marginRight: 10,
                      }
                    : {
                        alignSelf: "flex-start",
                        marginLeft: 10,
                      }),
                }}
              >
                <Pressable
                  onPress={() => handleSelectMessage(item)}
                  style={{
                    backgroundColor: isCurrentUser ? "#DCF8C6" : "white",
                    padding: 8,
                    borderRadius: 7,
                    maxWidth: "70%",
                    marginBottom: 7,
                  }}
                >
                  <Text style={{ fontSize: 13, textAlign: "left" }}>
                    {item?.message}
                  </Text>
                  <Text
                    style={{
                      textAlign: isCurrentUser ? "right" : "left",
                      fontSize: 9,
                      color: "gray",
                      marginTop: 5,
                    }}
                  >
                    {formatTime(item.timeStamp)}
                  </Text>
                  {isSelected && (
                    <View
                      style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: "rgba(240, 255, 255, 0.7)",
                      }}
                    />
                  )}
                </Pressable>
              </View>
            );
          }
          if (item.messageType === "image") {
            const baseUrl = `D:/WEBSERVER/messenger/api/`;
            const imageUrl = item.imageUrl;
            const filename = imageUrl.replace(/\\/g, "/");
            const imagePath = path.join(baseUrl, filename);
            // Construct the image source URI for local files
            const imageSource = { uri: `file:///${imagePath}` };
            const isSelected = selectedMessage.includes(item._id);
            const isCurrentUser = item?.senderId?._id === userId;
            return (
              <Pressable
                onPress={() => handleSelectMessage(item)}
                key={index}
                style={{
                  marginTop: 5,
                  flex: 1,
                  position: "relative",
                  ...(isCurrentUser
                    ? {
                        alignSelf: "flex-end",
                        marginRight: 10,
                        padding: 8,
                        borderRadius: 7,
                        maxWidth: "70%",
                        marginBottom: 7,
                        backgroundColor: "#DCF8C6",
                      }
                    : {
                        alignSelf: "flex-start",
                        marginLeft: 10,
                        padding: 8,
                        borderRadius: 7,
                        maxWidth: "70%",
                        marginBottom: 7,
                        backgroundColor: "white",
                      }),
                }}
              >
                <View>
                  <Image
                    source={imageSource}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 7,
                      resizeMode: "cover",
                    }}
                    // onError={(err) =>
                    //   console.error("Image loading error:", err)
                    // }
                  />
                  <Text
                    style={{
                      textAlign: isCurrentUser ? "right" : "left",
                      fontSize: 9,
                      color: "gray",
                      marginTop: 5,
                    }}
                  >
                    {formatTime(item.timeStamp)}
                  </Text>
                </View>
                {isSelected && (
                  <View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      backgroundColor: "rgba(240, 255, 255, 0.7)",
                    }}
                  />
                )}
              </Pressable>
            );
          }
        })}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: "#dddddd",
          marginBottom: showEmojiSelector ? 0 : 25,
        }}
      >
        <Entypo
          onPress={handleEmojiPress}
          style={{ marginLeft: 3 }}
          name="emoji-happy"
          size={22}
          color="gray"
        />
        <TextInput
          value={message}
          onChangeText={(text) => setMessage(text)}
          style={{
            flex: 1,
            height: 40,
            borderWidth: 1,
            borderColor: "#dddddd",
            borderRadius: 20,
            paddingHorizontal: 10,
            marginHorizontal: 10,
          }}
          placeholder="Type Your message..."
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            marginRight: 7,
          }}
        >
          <Entypo onPress={pickImage} name="camera" size={24} color="gray" />
          <Feather name="mic" size={20} color="gray" />
        </View>
        <Pressable
          onPress={() => handleSend("text")}
          style={{
            backgroundColor: "#007bff",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 20,
            marginRight: 3,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </Pressable>
      </View>

      {showEmojiSelector && (
        <EmojiSelector
          onEmojiSelected={(emoji) => {
            setMessage((prevMessage) => prevMessage + emoji);
          }}
          style={{ height: 250 }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default ChatMessagesScreen;

const styles = StyleSheet.create({});
