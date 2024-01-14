import { StyleSheet, Text, View, Pressable, Image, Alert } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { UserType } from "../screens/UserContext";

const User = ({ item }) => {
  const { userId, setUserId } = useContext(UserType);
  const [requestSent, setRequestSent] = useState(false);
  const [userFriends, setUserFriends] = useState([]);
  const [friendsRequest, setFriendsRequest] = useState([]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(
          `http://192.168.40.158:8000/friend-requests/sent/${userId}`
        );
        const data = await response.json();
        if (response.ok) {
          setFriendsRequest(data);
        } else {
          console.log("error", response.status);
        }
      } catch (err) {
        console.log("error", err);
      }
    };
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    const fetchUserFriends = async () => {
      try {
        const response = await fetch(
          `http://192.168.40.158:8000/friends/${userId}`
        );
        const data = await response.json();
        if (response.ok) {
          setUserFriends(data);
        } else {
          console.log("error retieving friends", response.status);
        }
      } catch (err) {
        console.log("error", err);
      }
    };
    fetchUserFriends();
  }, []);

  console.log("friends sent", friendsRequest);
  console.log("user Friends ", userFriends);

  const sendFriendRequest = async (currentUserId, selectedUserId) => {
    try {
      const response = await fetch(
        "http://192.168.40.158:8000/friend-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentUserId, selectedUserId }),
        }
      );

      if (response.ok) {
        setRequestSent(true);
        Alert.alert(
          "Requests sent",
          "Wait for the friend request to be accepted"
        );
      }
    } catch (err) {
      console.log("error message", err);
    }
  };
  return (
    <Pressable
      style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
    >
      <Image
        style={{ width: 50, height: 50, borderRadius: 25, resizeMode: "cover" }}
        source={{ uri: item.image }}
      />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontWeight: "bold" }}>{item?.name}</Text>
        <Text style={{ marginTop: 4, color: "gray" }}>{item?.email}</Text>
      </View>

      {userFriends.includes(item._id) ? (
        <Pressable
          disabled={true}
          style={{
            backgroundColor: "#82CD47",
            padding: 10,
            width: 105,
            borderRadius: 6,
          }}
        >
          <Text style={{ textAlign: "center", color: "white" }}>Friends</Text>
        </Pressable>
      ) : requestSent ||
        friendsRequest.some((friend) => friend._id === item._id) ? (
        <Pressable
          disabled={true}
          style={{
            backgroundColor: "gray",
            padding: 10,
            width: 105,
            borderRadius: 6,
          }}
        >
          <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
            Request Sent
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => sendFriendRequest(userId, item._id)}
          style={{
            backgroundColor: "#567189",
            padding: 10,
            borderRadius: 6,
            width: 105,
          }}
        >
          <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
            Invite Friends
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export default User;

const styles = StyleSheet.create({});
