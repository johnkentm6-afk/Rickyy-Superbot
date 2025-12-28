module.exports = {
  config: {
    name: 'leave',
    eventType: ['log:unsubscribe'],
    description: 'Handles left participants silently'
  },
  
  async run({ api, event, send, Users, Threads, config }) {
    // Silent mode: Inalis ang lahat ng api.sendMessage at send.send 
    // para hindi na mag-spam sa Group Chat kapag may umaalis.
    return; 
  }
};
