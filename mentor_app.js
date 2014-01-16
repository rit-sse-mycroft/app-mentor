var mycroft = require('./Mycroft');
var mentor_status = require('./mentor_status');
var conn = null;

function main() {
  conn = new mycroft.Mycroft('localhost', 1847);
  conn.messageCb = handleMessage;
  conn.startReceivingMessages();
}

function handleMessage(type, json) {
  if (type === 'APP_MANIFEST_OK') {
    conn.sendMessage('APP_UP');
  }
  else if (type === 'MSG_QUERY') {
    handleMessageQuery(json);
  }
  else {
    console.log("Got unknown message type " + type);
  }
}

function handleMessageQuery(json) {
  var action = json['action'];
  if (action === 'getMentor') {

  }
}

if (require.main === module) {
  main();
}