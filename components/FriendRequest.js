import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import React, { useContext } from "react";
import { UserType } from "../screens/UserContext";
import { useNavigation } from "@react-navigation/native";

const FriendRequest = ({ item, friendRequests, setFriendRequests }) => {
  const { userId, setUserId } = useContext(UserType);
  const navigation = useNavigation();
  const acceptRequest = async (friendRequestId) => {
    try {
      const response = await fetch(
        "http://192.168.40.158:8000/friend-request/accept",
        {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify({
            senderId: friendRequestId,
            recepientId: userId,
          }),
        }
      );

      if (response.ok) {
        // Assuming the backend returns data about the accepted request
        const responseData = await response.json();
        console.log(responseData);
        // Remove the friend request from the list
        setFriendRequests(
          friendRequests.filter((request) => request._id !== friendRequestId)
        );

        // Navigate to the desired screen (e.g., "Chats")
        navigation.navigate("Chats");
      } else {
        console.log("Friend request acceptance failed");
      }
    } catch (err) {
      console.log("Error accepting the friend request", err);
    }
  };

  //   console.log(userId);
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 10,
      }}
    >
      <Image
        style={{ width: 50, height: 50, borderRadius: 25 }}
        source={{ uri: item.image }}
      />

      <Text style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: "bold" }}>{item?.name} </Text>
        <Text>sent you a friend request !!!</Text>
      </Text>

      <Pressable
        onPress={() => acceptRequest(item._id)}
        style={{ backgroundColor: "#0066b2", padding: 10, borderRadius: 6 }}
      >
        <Text style={{ textAlign: "center", color: "white" }}>Accept</Text>
      </Pressable>
    </Pressable>
  );
};

export default FriendRequest;

const styles = StyleSheet.create({});
