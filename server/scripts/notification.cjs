const axios = require('axios')
const fs = require('fs')

class Notification {
  constructor() {}

  async toTelegram({ logPath, tgInfo }) {
    console.log('Sending a message notification ...')
    const message = this.generateMessage(logPath)
    const tgBotMessager = new TgBotMessager()
    await tgBotMessager.sendMessage(message, { tgInfo })
  }

  async toLark({ logPath, larkInfo }) {
    // ...
  }

  generateMessage(logPath) {
    // test-data
    // logPath = '/Users/zerol/Desktop/workspace/auto-test-stake/logs/auto-test-stake-2024_09_23-17_07_31.log'
    try {
      const message = fs.readFileSync(logPath)
      return message.toString()
    } catch (err) {
      console.log('generateMessage err: ', err)
      return 'Read log file failed!'
    }
  }
}

/**
 * Supports sending to bots or channels
 */
class TgBotMessager {
  constructor() {
    this.tgUrlPlaceholder = '<token>'
    this.sendTgTemplateUrl = `https://api.telegram.org/bot${this.tgUrlPlaceholder}/sendMessage`
    this.getChatIdTemplateUrl = `https://api.telegram.org/bot${this.tgUrlPlaceholder}/getUpdates`
  }

  // There are two options for sending here
  // One is to send to the conversation:
  //  each person needs to establish a conversation with the robot in advance (send a sentence),
  //  the robot will send a message to each person individually
  // Second is send a message to the Telegram channel:
  //  and everyone in the channel can see it (with private channels, 
  //  you need to add a Bot admin to get the channel ID and send the message)
  // The default is to send to channel
  async sendMessage(message, { tgInfo, isSendToChannel = true }) {
    try {
      const url = this.sendTgTemplateUrl.replace(this.tgUrlPlaceholder, tgInfo.botToken)
      let chatIds = []

      if (isSendToChannel) {
        chatIds = tgInfo.channelId ? [tgInfo.channelId] : []
      } else {
        chatIds = await this.getChatIds(tgInfo)
      }

      if (!chatIds.length) {
        return console.log('No Chat ID is available and messages cannot be sent.')
      }
      console.log("sendMessage: ", message)
      // Create all promises that send requests
      const requests = [...chatIds].map((chatId) => axios.post(url, { chat_id: chatId, text: message }))
      const res = await Promise.all(requests)

      console.log('sendMessage success: ', res.length)
      return true
    } catch (err) {
      console.error('sendMessage failed: ', err.response ? err.response.data : err.message)
      return false
    }
  }

  async getChatIds(tgInfo) {
    try {
      const url = this.getChatIdTemplateUrl.replace(this.tgUrlPlaceholder, tgInfo.botToken)
      const res = await axios.get(url)
      const updates = res.data.result

      if (!updates.length) return []
      
      const chatIds = new Set()

      updates.forEach((update) => {
        if (update.message && update.message.chat)
          chatIds.add(update.message.chat.id)
      })

      return Array.from(chatIds)

    } catch (err) {
      console.error('getChatId err: ', err.response ? err.response.data : err.message)
      return []
    }
  }
}

module.exports = new Notification()
