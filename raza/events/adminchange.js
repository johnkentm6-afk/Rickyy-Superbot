module.exports = {
  config: {
    name: 'adminchange',
    eventType: ['log:thread-admins'],
    description: 'Handles admin changes silently'
  },
  
  async run({ api, event, send, Users }) {
    // Ang logic na ito ay ginawang silent. 
    // Inalis ang send.send para hindi na mag-post sa Group Chat.
    return; 
  }
};
