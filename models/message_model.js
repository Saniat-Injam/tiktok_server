// export class ChatMessage {
//     constructor({ from, to, text, timestamp }) {
//       this.id = Date.now().toString();
//       this.from = from;
//       this.to = to;
//       this.text = text;
//       this.timestamp = timestamp || new Date().toISOString();
//     }
//   }
  

// models/message_model.js

// Message class (optional)
export class ChatMessage {
  constructor({ from, to, text, timestamp }) {
    this.id = Date.now().toString();
    this.from = from;
    this.to = to;
    this.text = text;
    this.timestamp = timestamp || new Date().toISOString();
  }
}

// Named export function
export const createMessageObject = ({ from, to, text }) => {
  return {
    id: Date.now().toString(),
    from,
    to,
    text,
    timestamp: new Date().toISOString(),
  };
};
