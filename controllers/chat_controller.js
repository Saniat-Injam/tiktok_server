export const createMessageObject = ({ from, to, text }) => {
    return {
      id: Date.now().toString(),
      from,
      to,
      text,
      timestamp: new Date().toISOString(),
    };
  };
  