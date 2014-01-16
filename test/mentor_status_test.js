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

function assertDatesEqual(d1, d2) {
  assert.strictEqual(d1.getDate(), d2.getDate(), 'Dates should be equal');
  assert.strictEqual(d1.getHours(), d2.getHours(), 'Hours should be equal');
  assert.strictEqual(d1.getMinutes(), d2.getMinutes(), 'Minutes should be equal');
}

describe('getMentorAt', function() {
  var schedule = getSchedule();

  it('should not have a mentor on the weekend', function() {
    var weekend = getDate(0, 14, 20);
    var mentor = mentor_status.getMentorAt(weekend, schedule);
    assert.strictEqual(mentor, null, 'Weekend mentor should be null');
  });

  it('should not have a mentor before mentoring hours', function() {
    var before = getDate(3, 8, 20);
    var mentor = mentor_status.getMentorAt(before, schedule);
    assert.strictEqual(mentor, null, 'Before mentoring hours mentor should be null');
  });

  it('should not have a mentor after mentoring hours', function() {
    var after = getDate(3, 20, 20);
    var mentor = mentor_status.getMentorAt(after, schedule);
    assert.strictEqual(mentor, null, 'After mentoring hours mentor should be null');
  });

  it('should identify current mentor correctly', function() {
    var d = getDate(1, 12, 30);
    var mentor = mentor_status.getMentorAt(d, schedule);
    assert.strictEqual(mentor, 'Jane', 'Mentor should be Jane');
  });
});

describe('getNextChange', function() {
  var schedule = getSchedule();

  it('should find next spot from Friday after mentoring', function() {
    var d = getDate(5, 20, 20);
    var target = getDate(8, 10, 0);
    var ret = mentor_status.getNextChange({'date':d, 'schedule':schedule});
    assertDatesEqual(target, ret);
  });

  it('should find next spot from Monday after mentoring', function() {
    var d = getDate(1, 20, 20);
    var target = getDate(2, 10, 0);
    var ret = mentor_status.getNextChange({'date':d, 'schedule':schedule});
    assertDatesEqual(target, ret);
  });

  it('should find next spot while mentoring', function() {
    var d = getDate(4, 11, 30);
    var target = getDate(4, 15, 0);
    var ret = mentor_status.getNextChange({'date':d, 'schedule':schedule});
    assertDatesEqual(target, ret);
  });

  it('should indicate mentor change at the end of the day', function() {
    var d = getDate(5, 13, 30);
    var target = getDate(5, 18, 0);
    var ret = mentor_status.getNextChange({'date':d, 'schedule':schedule});
    assertDatesEqual(target, ret);
  });

});