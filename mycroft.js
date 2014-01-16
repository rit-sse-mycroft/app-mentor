var net = require('net');
var tls = require('tls');
var uuid = require('uuid');
var fs = require('fs');

// A class for connecting to Mycroft
function Mycroft(host, port) {
  this.host = host;
  this.port = port;
  this._unconsumed = '';
}

// this gets called every time a message is received
Mycroft.prototype.messageCb = function(verb, parsedJson) {};

// Start getting messages from mycroft
// errCb is an optional callback on error
Mycroft.prototype.startReceivingMessages = function startReceivingMessages(errCb) {
  var client = net.connect({port: 1847}, function(err){
    if (err) {
      if ( !(typeof(errCb) === 'undefined') ) {
        errCb(err);
      }
      else {
        console.error('ERROR: could not connect to Mycroft: ' + err);
      }
    }
  });
  this.client = client;
  var _this = this; // needed for `this` to be in scope in the callback
  this.client.on('data', function msgWrapper(data) {
    _this._doMessageReceive(data);
  });
  this.client.on('error', function errCaught(err) {
    console.log('caught error ' + err);
  });
  this.client.on('close', function closing(){
    console.log('closing connection to server');
  });
  this._sendManifest();
  console.log('listening for messages');
}

Mycroft.prototype._sendManifest = function _sendManifest() {
  var mf = fs.readFileSync('app.json');
  this.sendMessage('APP_MANIFEST ' + mf);
}

// called from on('data') of the client
Mycroft.prototype._doMessageReceive = function _doMessageReceive(data) {
  this._unconsumed += data.toString();
  while (this._unconsumed != '') {
    // get the message-length to read
    var verbStart = this._unconsumed.indexOf('\n');
    var msgLen = parseInt(this._unconsumed.substr(0, verbStart));
    // cut off the message length header from this._unconsumed
    this._unconsumed = this._unconsumed.substr(verbStart+1);
    // figure out how many bytes we have left to consume
    var bytesLeft = Buffer.byteLength(this._unconsumed, 'utf8');
    // don't process anything if we don't have enough bytes
    if (bytesLeft < msgLen) {
      break;
    }
    // isolate the message we are actually handling
    this._unconsumedBuffer = new Buffer(this._unconsumed);
    msg = this._unconsumedBuffer.slice(0, msgLen).toString();
    // store remainin stuff in this._unconsumed
    this._unconsumed = this._unconsumedBuffer.slice(msgLen).toString();
    // go process this single message
    console.log('Got message:');
    console.log(msg);
    var type = '';
    var data = {};
    var index = msg.indexOf(' {');
    if (index >= 0) { // if a body was supplied
      type = msg.substr(0, index);
      try {
        var toParse = msg.substr(index+1);
        data = JSON.parse(toParse);
      }
      catch(err) {
        console.log('malformed message 01');
        return;
      }
    }
    else { // no body was supplied
      type = msg;
    }
    if (type === '') {
      console.log('malformed message 02');
      return;
    }
    this.messageCb(type, data);
  }
}

// Send a message to Mycroft
// message is a string WITHOUT BYTE LENGTH
Mycroft.prototype.sendMessage = function sendMessage(message) {
  if (typeof(message) === 'object')
    message = JSON.stringify(message);
  var length = Buffer.byteLength(message, 'utf8');
  message = length + '\n' + message;
  console.log('Sending message:');
  console.log(message);
  this.client.write(message);
}

module.exports.Mycroft = Mycroft;