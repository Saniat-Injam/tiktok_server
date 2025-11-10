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





import admin from "firebase-admin";

export const sendCallNotification = async (fcmToken, data) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: data.isVideo ? "📹 Incoming Video Call" : "📞 Incoming Audio Call",
        body: `${data.callerName} is calling you`,
      },
      data: {
        type: "incoming_call",
        from: data.from,
        callerName: data.callerName,
        roomId: data.roomId,
        isVideo: String(data.isVideo),
      },
    };
    await admin.messaging().send(message);
    console.log(`✅ Call notification sent to ${data.receiverId}`);
  } catch (error) {
    console.error("❌ FCM send error:", error);
  }
};
