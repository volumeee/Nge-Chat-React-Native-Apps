const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const multer = require("multer");
const moment = require("moment-timezone");
const path = require("path");

const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

const jwt = require("jsonwebtoken");

mongoose
  .connect("mongodb+srv://mrvolumee:mrvolumee@cluster0.t45gjjv.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully");
  })
  .catch((err) => {
    console.log("Error", err);
  });

app.listen(port, () => {
  console.log("server running port " + port);
});

const User = require("./models/user");
const Message = require("./models/message");

//endpoint for registration of the user

app.post("/register", (req, res) => {
  const { name, email, password, image } = req.body;

  //create a new user object
  const newUser = new User({
    name: name,
    email: email,
    password: password,
    image: image,
  });

  //save the new user to database
  newUser
    .save()
    .then(() => {
      res.status(200).json({
        message: "user registered successfully",
      });
    })
    .catch((err) => {
      console.log("error creating", err);
      res.status(500).json({ message: "error registering user", err });
    });
});

//function to createtoken for the user
const createToken = (userId) => {
  //set the token payload
  const payload = {
    userId: userId,
  };
  const token = jwt.sign(payload, "Q$r2K6W8n!jCW%Zk", { expiresIn: "1h" });

  return token;
};

//endpoint for logging in of that particular user
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  //check if the email n password are provided
  if (!email || !password) {
    return res
      .status(404)
      .json({ message: "Email and the password are required" });
  }

  //check for that user in the database
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        //user not found
        return res.status(404).json({ message: "user not found" });
      }

      //compare the provided password with the password in the database
      if (user.password !== password) {
        return res.status(404).json({ message: "Invalid password" });
      }

      const token = createToken(user._id);
      res.status(200).json({ token });
    })
    .catch((err) => {
      console.log("error in finding the user");
      res.status(500).json({ message: "internal server error" });
    });
});

//endpoint to access all the users except the user who's is currently logged in
app.get("/users/:userId", (req, res) => {
  const loggedInUserId = req.params.userId;

  User.find({ _id: { $ne: loggedInUserId } })
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      console.error("Error retrieving users", err);
      res.status(500).json({ message: "Error retrieving users" });
    });
});

//endpoint to send a request to a user
app.post("/friend-request", async (req, res) => {
  const { currentUserId, selectedUserId } = req.body;

  try {
    //update the recepients friend request array
    await User.findByIdAndUpdate(selectedUserId, {
      $push: { friendRequest: currentUserId },
    });

    //create the senders sentFriendRequest array
    await User.findByIdAndUpdate(currentUserId, {
      $push: { sentFriendRequest: selectedUserId },
    });

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

//endpoint to show all the friend-request of a particular user
app.get("/friend-request/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Server received userId:", userId);
    //fetch the user document based on the user id
    const user = await User.findById(userId)
      .populate("friendRequest", "name email image")
      .lean();
    const friendRequest = user.friendRequest;

    res.json(friendRequest);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//endpoint to accept a friend request  of particular person
app.post("/friend-request/accept", async (req, res) => {
  try {
    const { senderId, recepientId } = req.body;

    // Retrieve the document of sender and the recipient
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recepientId);

    // Update friends and friend requests
    sender.friends.push(recepientId);
    recipient.friends.push(senderId);

    // Remove the accepted friend request from recipient's friendRequest
    recipient.friendRequest = recipient.friendRequest.filter(
      (request) => request.toString() !== senderId.toString()
    );

    // Remove the accepted friend request from sender's sentFriendRequest
    sender.sentFriendRequest = sender.sentFriendRequest.filter(
      (request) => request.toString() !== recepientId.toString()
    );

    await sender.save();
    await recipient.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server error" });
  }
});

//endpoint to access all the friends of the logged in user
app.get("/accepted-friends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "friends",
      "name email image"
    );
    const acceptedFriends = user.friends;
    res.json(acceptedFriends);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server error" });
  }
});

// Define storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "files/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// // Add this middleware to serve static files from the 'files' directory
// app.use("/files", express.static(path.join(__dirname, "files")));

// Endpoint to post messages and store them in the backend
app.post("/messages", upload.single("imageFile"), async (req, res) => {
  console.log(req.file); // Log the uploaded file information
  try {
    const { senderId, recepientId, messageType, messageText } = req.body;

    let imageUrl = "false";

    // Check if the message type is image and if a file is uploaded
    if (messageType === "image" && req.file) {
      imageUrl = req.file.path;
    }

    const newMessage = new Message({
      senderId,
      recepientId,
      messageType,
      message: messageText,
      timeStamp: new Date(),
      imageUrl,
    });

    await newMessage.save();
    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//endpoint to get the userDetails to design the chat room header
app.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    //fetch the user data from the user Id
    const recepientId = await User.findById(userId);

    res.json(recepientId);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error" });
  }
});

//endpoint to fetch the messages between two users in the chatroom
app.get("/messages/:senderId/:recepientId", async (req, res) => {
  try {
    const { senderId, recepientId } = req.params;

    const messages = await Message.find({
      $or: [
        {
          senderId: senderId,
          recepientId: recepientId,
        },
        { senderId: recepientId, recepientId: senderId },
      ],
    }).populate("senderId", "_id name");

    res.json(messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//endpoint to delete the messages
app.post("/deleteMessages", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "invalid req body" });
    }

    await Message.deleteMany({ _id: { $in: messages } });

    res.json({ message: "messages deleted success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "internal server error" });
  }
});

//endpoint friend
app.get("/friend-requests/sent/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("sentFriendRequest", "name email image")
      .lean();

    const sentFriendRequest = user.sentFriendRequest;
    res.json(sentFriendRequest);
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "internal server error" });
  }
});

app.get("/friends/:userId", (req, res) => {
  try {
    const { userId } = req.params;

    User.findById(userId)
      .populate("friends")
      .then((user) => {
        if (!user) {
          return res.status(404).json({ message: "user not found" });
        }

        const friendIds = user.friends.map((friend) => friend._id);
        res.status(200).json(friendIds);
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "internal server error" });
  }
});
