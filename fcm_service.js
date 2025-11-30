
// import admin from "firebase-admin";

// export const sendCallNotification = async (token, data) => {
//   const message = {
//     token,
//     notification: {
//       title: data.isVideo ? "Incoming Video Call" : "Incoming Audio Call",
//       body: `${data.callerName} is calling you`,
//     },
//     data: {
//       type: "incoming_call",
//       from: data.from,
//       callerName: data.callerName,
//       isVideo: String(data.isVideo),
//       sdp: data.sdp,
//       type: data.type,
//       callId: data.callId,
//     },
//     android: { priority: "high", notification: { sound: "default" } },
//     apns: { payload: { aps: { sound: "default" } } },
//   };

//   try {
//     await admin.messaging().send(message);
//     console.log(`[FCM SUCCESS] → ${data.callerName}`);
//   } catch (error) {
//     console.error("[FCM FAILED]", error.message);
//   }
// };



// import admin from "firebase-admin";

// export const sendCallNotification = async (token, data) => {
//   const message = {
//     token,
//     notification: {
//       title: data.isVideo ? "Incoming Video Call" : "Incoming Audio Call",
//       body: `${data.callerName} is calling you`,
//     },
//     data: {
//       type: "incoming_call",
//       from: data.from,
//       callerName: data.callerName,
//       isVideo: String(data.isVideo),
//       sdp: data.sdp,
//       offerType: data.type,
//       callId: data.callId,
//     },
//     android: { priority: "high", notification: { sound: "default" } },
//     apns: { payload: { aps: { sound: "default" } } },
//   };

//   try {
//     await admin.messaging().send(message);
//     console.log(`[FCM SUCCESS] → ${data.callerName}`);
//   } catch (error) {
//     console.error("[FCM FAILED]", error.message);
//   }
// };




// import admin from "firebase-admin";

// export const sendCallNotification = async (token, data) => {
//   if (!token) return;

//   const message = {
//     token,
//     notification: {
//       title: data.isVideo === "true" || data.isVideo === true
//         ? "Incoming Video Call"
//         : "Incoming Audio Call",
//       body: `${data.callerName || "Someone"} is calling you`,
//     },
//     data: {
//       type: "incoming_call",
//       from: data.from,
//       callerName: data.callerName,
//       isVideo: String(data.isVideo),
//       sdp: data.sdp,
//       offerType: data.type,
//       callId: data.callId,
//     },
//     android: { priority: "high", notification: { sound: "default" } },
//     apns: { payload: { aps: { sound: "default" } } },
//   };

//   try {
//     await admin.messaging().send(message);
//     console.log(`[FCM SUCCESS] → ${data.callerName}`);
//   } catch (error) {
//     console.error("[FCM FAILED]", error.message);
//   }
// };


// import admin from "firebase-admin";

// export const sendCallNotification = async (token, data) => {
//   if (!token) return;

//   const message = {
//     token,
//     notification: {
//       title: data.isVideo === "true" || data.isVideo === true
//         ? "Incoming Video Call"
//         : "Incoming Audio Call",
//       body: `${data.callerName || "Someone"} is calling you`,
//     },
//     data: {
//       type: "incoming_call",
//       from: data.from,
//       callerName: data.callerName,
//       isVideo: String(data.isVideo),
//       sdp: data.sdp,
//       offerType: data.type,
//       callId: data.callId,
//     },
//     android: { priority: "high", notification: { sound: "default" } },
//     apns: { payload: { aps: { sound: "default" } } },
//   };

//   try {
//     await admin.messaging().send(message);
//     console.log(`[FCM SUCCESS] → ${data.callerName}`);
//   } catch (error) {
//     console.error("[FCM FAILED]", error.message);
//   }
// };



// fcm_service.js
import admin from "firebase-admin";

export const sendCallNotification = async (token, data) => {
  if (!token) return;

  const message = {
    token,
    notification: {
      title: data.isVideo ? "Incoming Video Call" : "Incoming Audio Call",
      body: `${data.callerName || "Someone"} is calling you`,
    },
    data: {
      type: "incoming_call",
      from: data.from,
      callerName: data.callerName || "User",
      isVideo: String(!!data.isVideo),
      callId: data.callId || "",
    },
    android: { priority: "high", notification: { sound: "default" } },
    apns: { payload: { aps: { sound: "default" } } },
  };

  try {
    await admin.messaging().send(message);
    console.log(`[FCM] Call notification sent to ${data.callerName}`);
  } catch (error) {
    console.error("[FCM ERROR]", error.message);
  }
};