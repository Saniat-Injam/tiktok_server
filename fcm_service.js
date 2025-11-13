// import admin from "firebase-admin";

// export const sendCallNotification = async (fcmToken, data) => {
//   try {
//     const message = {
//       token: fcmToken,
//       notification: {
//         title: data.isVideo ? "📹 Incoming Video Call" : "📞 Incoming Audio Call",
//         body: `${data.callerName} is calling you`,
//       },
//       data: {
//         type: "incoming_call",
//         callerId: data.callerId,
//         callerName: data.callerName,
//         roomId: data.roomId,
//         isVideo: String(data.isVideo),
//       },
//     };

//     await admin.messaging().send(message);
//     console.log(`✅ Call notification sent to ${data.receiverId}`);
//   } catch (error) {
//     console.error("❌ FCM send error:", error);
//   }
// };


// import admin from "firebase-admin";

// export const sendCallNotification = async (fcmToken, data) => {
//   try {
//     const message = {
//       token: fcmToken,
//       notification: {
//         title: data.isVideo ? "📹 Incoming Video Call" : "📞 Incoming Audio Call",
//         body: `${data.callerName} is calling you`,
//       },
//       data: {
//         type: "incoming_call",
//         from: data.from,
//         callerName: data.callerName,
//         roomId: data.roomId,
//         isVideo: String(data.isVideo),
//       },
//     };
//     await admin.messaging().send(message);
//     console.log(`✅ Call notification sent to ${data.receiverId}`);
//   } catch (error) {
//     console.error("❌ FCM send error:", error);
//   }
// };





// import admin from "firebase-admin";

// export const sendCallNotification = async (fcmToken, data) => {
//   try {
//     const message = {
//       token: fcmToken,
//       notification: {
//         title: data.isVideo ? "📹 Incoming Video Call" : "📞 Incoming Audio Call",
//         body: `${data.callerName} is calling you`,
//       },
//       data: {
//         type: "incoming_call",
//         from: data.from,
//         callerName: data.callerName,
//         roomId: data.roomId,
//         isVideo: String(data.isVideo),
//       },
//     };
//     await admin.messaging().send(message);
//     console.log(`✅ Call notification sent to ${data.receiverId}`);
//   } catch (error) {
//     console.error("❌ FCM send error:", error);
//   }
// };



// import admin from "firebase-admin";

// export const sendCallNotification = async (fcmToken, data) => {
//   try {
//     const message = {
//       token: fcmToken,
//       notification: {
//         title: data.isVideo ? "📹 Incoming Video Call" : "📞 Incoming Audio Call",
//         body: `${data.callerName} is calling you`,
//       },
//       data: {
//         type: "incoming_call",
//         from: data.from,
//         callerName: data.callerName,
//         isVideo: String(data.isVideo),
//         sdp: data.sdp,
//         type: data.type,
//       },
//     };
//     await admin.messaging().send(message);
//     console.log(`✅ Call notification sent to ${data.to}`);
//   } catch (error) {
//     console.error("❌ FCM send error:", error);
//   }
// };






// fcm_service.js
import admin from "firebase-admin";

/**
 * Sends FCM call notification with full SDP & call data
 */
export const sendCallNotification = async (token, data) => {
  const message = {
    token,
    notification: {
      title: data.isVideo ? "Incoming Video Call" : "Incoming Audio Call",
      body: `${data.callerName} is calling you`,
    },
    data: {
      type: "incoming_call",
      from: data.from,
      callerName: data.callerName,
      isVideo: String(data.isVideo),
      sdp: data.sdp,
      type: data.type,
      callId: data.callId,
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          category: "CALL_CATEGORY",
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("FCM sent:", response);
  } catch (error) {
    console.error("FCM send failed:", error.message);
    if (error.code === "messaging/registration-token-not-registered") {
      // Optional: Remove invalid token from Firestore
      console.log("Invalid token, consider cleanup");
    }
  }
};