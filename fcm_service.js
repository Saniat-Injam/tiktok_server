
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




// fcm_service.js (Your file — DO NOT CHANGE)
import admin from "firebase-admin";

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
    android: { priority: "high", notification: { sound: "default" } },
    apns: { payload: { aps: { sound: "default" } } },
  };

  try {
    await admin.messaging().send(message);
    console.log(`[FCM SUCCESS] → ${data.callerName}`);
  } catch (error) {
    console.error("[FCM FAILED]", error.message);
  }
};