import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

// Send notification to all users subscribed to a topic
app.post("/send", async (req, res) => {
  const { title, body, topic, token } = req.body;

  const message = {
    notification: { title, body },
  };

  if (topic) message.topic = topic;
  if (token) message.token = token;

  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Live Notification API running successfully");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
