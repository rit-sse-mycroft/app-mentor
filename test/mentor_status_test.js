var assert = require('assert');
var fs = require('fs');
var path = require('path');
var mentor_status = require('../mentor_status');

function getSchedule() {
  var f = path.join('test', 'test_schedule.json');
  return JSON.parse(fs.readFileSync(f));
}

// get a day object with the day, hour, and minute properties given
// day is 0 for sunday, 6 for saturday
function getDate(day, hour, minute) {
  var ret = new Date(2014, 0, 12, hour, minute, 0, 0);
  ret.setDate(ret.getDate()+day);
  return ret;
}

describe('getMentorAt', function() {
  var schedule = getSchedule();
  it('should not have a mentor on the weekend', function() {
    var weekend = getDate(0, 14, 20);
    var mentor = mentor_status.getMentorAt(weekend, schedule);
    assert.strictEqual(mentor, null, "Weekend mentor should be null");
  });
});