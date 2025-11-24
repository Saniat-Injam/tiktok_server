export class ChatMessage {
    constructor({ from, to, text, timestamp }) {
      this.id = Date.now().toString();
      this.from = from;
      this.to = to;
      this.text = text;
      this.timestamp = timestamp || new Date().toISOString();
    }
  }
  