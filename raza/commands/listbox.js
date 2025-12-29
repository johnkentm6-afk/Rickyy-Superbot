module.exports = {
  config: {
    name: 'listbox',
    version: '1.0.1',
    role: 2, // Admin only dahil sensitive ang command na ito
    author: 'Priyansh / Edited for Raza',
    description: 'Ilista ang lahat ng grupong sinalihan ng bot at pwede itong i-out o i-ban.',
    category: 'Admin',
    usages: 'listbox',
    cooldowns: 5,
    prefix: false
  },

  async handleReply({ api, event, Threads, handleReply }) {
    const { threadID, messageID, body, senderID } = event;

    // Siguraduhin na ang sumagot sa listahan ay ang nag-command nito
    if (parseInt(senderID) !== parseInt(handleReply.author)) return;

    const args = body.split(" ");
    const action = args[0].toLowerCase();
    const index = parseInt(args[1]) - 1;
    const targetID = handleReply.groupid[index];

    if (!targetID) return api.sendMessage("❌ Invalid number. Pili ka lang sa listahan sa taas.", threadID, messageID);

    switch (handleReply.type) {
      case "reply": {
        if (action === "ban") {
          try {
            const data = (await Threads.getData(targetID)).data || {};
            data.banned = true;
            await Threads.setData(targetID, { data });
            
            // I-remove ang bot pagkatapos i-ban
            api.removeUserFromGroup(api.getCurrentUserID(), targetID);
            
            api.sendMessage(`🚫 Na-ban at lumabas na ang bot sa group: ${targetID}`, threadID, messageID);
          } catch (e) {
            api.sendMessage(`❌ Error sa pag-ban: ${e.message}`, threadID, messageID);
          }
        }

        if (action === "out") {
          api.removeUserFromGroup(api.getCurrentUserID(), targetID, (err) => {
            if (err) return api.sendMessage(`❌ Hindi makalabas sa GC: ${err.message}`, threadID, messageID);
            api.sendMessage(`✅ Matagumpay na lumabas ang bata mo sa group sir ID: ${targetID}`, threadID, messageID);
          });
        }
        break;
      }
    }
  },

  async run({ api, event, client }) {
    const { threadID, messageID, senderID } = event;

    try {
      // Kunin ang listahan ng lahat ng GC
      const inbox = await api.getThreadList(100, null, ['INBOX']);
      let list = inbox.filter(group => group.isSubscribed && group.isGroup);

      let listthread = [];
      for (let groupInfo of list) {
        listthread.push({
          id: groupInfo.threadID,
          name: groupInfo.name || "Unnamed Group",
          count: groupInfo.participantIDs.length
        });
      }

      // I-sort mula pinaka-maraming members
      listthread.sort((a, b) => b.count - a.count);

      let msg = '📋 LISTAHAN NG MGA BATA MO SIR:\n\n';
      let groupid = [];
      let i = 1;

      for (let group of listthread) {
        msg += `${i}. ${group.name}\n🧩 TID: ${group.id}\n👥 Members: ${group.count}\n\n`;
        groupid.push(group.id);
        i++;
      }

      if (groupid.length === 0) return api.sendMessage("wala ka pang nasasalihan na gc sir", threadID, messageID);

      return api.sendMessage(msg + '𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆: 𝗥𝗶𝗰𝗸𝘆𝘆 𝗗. 𝗞𝗮𝗻𝘁𝘂𝘁𝗲𝗿𝗼.', threadID, (err, info) => {
        if (client.replies) {
          client.replies.set(info.messageID, {
            commandName: 'listbox',
            author: senderID,
            messageID: info.messageID,
            groupid,
            type: 'reply'
          });
        }
      }, messageID);

    } catch (e) {
      return api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
    }
  }
};
