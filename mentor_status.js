var fs = require('fs');

// --------- Utility functions -------------

// returns the parsed json from schedule.json
function getCurrentSchedule() {
  if (!fs.existsSync('schedule.json')) {
    console.log("ERROR: no schedule.json found");
    return null;
  }
  return JSON.parse(
    fs.readFileSync('schedule.json') // yeah I know it rereads this every time,
  );                                 // but that's like ~3 times per 10 mins at most right?
}

// get a string '15:00' froma Date object
function dateToTimeString(date) {
  var timeHours = date.getHours() + '';
  if (timeHours.length === 1) timeHours += '0';
  var timeMins = date.getMinutes();
  if (timeMins.length === 1) timeMins += '0';
  return time = timeHours + ':' + timeMins;
}

// returns true if the given date is within mentoring hours
function isInRange(date, schedule) {
  var day = date.getDay();
  // if it's not a weekday there are no mentors
  if (day === 0 || day === 6) {
    return false;
  }
  var start = schedule['hours']['start'];
  var end = schedule['hours']['end'];

  var time = dateToTimeString(date);

  return time > start && time < end;
}

// get the closest time to the one given from the schedule (only going backward in time)
// schedule - the specific weekday section from schedule.json
//            ie {"10:00":"john", "11:00":"jim"}
// time - the string of the current time - "10:00"
function getClosestBackward(time, schedule) {
  var closestTime = null;
  for (var time in schedule) {
    if (closestTime === null) { // if this is the first iteration set time now
      closestTime = time;
    }
    else if (time > closestTime && closestTime < time) {
      closestTime = time;
    }
  }
  return closestTime;
}

// same as the function above but looks for the closest time forward
function getClosestForward(time, schedule) {
  var closestTime = null;
  for (var time in schedule) {
    if (closestTime === null) { // if this is the first iteration set time now
      closestTime = time;
    }
    else if (time < closestTime && closestTime > time) {
      closestTime = time;
    }
  }
  return closestTime;
}

function dayNumToString(day) {
  var days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  return days[day];
}

// ----------- Exposed Functions -------------

// get the name of the current mentor, or null if out of range
function getCurrentMentor() {
  return getMentorAt(new Date());
}
module.exports.getCurrentMentor = getCurrentMentor;

// get the name of the current mentor at the given date, or null if out of range
function getMentorAt(date, schedule) {
  if (typeof(schedule) === 'undefined') {
    schedule = getCurrentSchedule();
  }
  if (!isInRange(date, schedule)) {
    return null;
  }

  var thisSchedule = schedule[dayNumToString(date.getDay())];
  var thisTime = dateToTimeString(date);

  var closestTime = getClosestBackward(thisTime, thisSchedule);

  return thisSchedule[closestTime];
}
module.exports.getMentorAt = getMentorAt;

// args (optional):
// {
//   "date" : Date(),
//   "schedule" : {...}
// }
function getNextChange(args) {
  var date = null;
  var ret = null;
  var schedule = null;
  if (typeof(args) === 'undefined') {
    date = new Date();
    ret = new Date();
    schedule = getCurrentSchedule();
  }
  else {
    date = args['date'];
    ret = new Date(date.getTime());
    schedule = args['schedule'];
  }

  // adjust forward to Monday for the weekend
  if (date.getDay() === 0) { // it's sunday, add a day to ret to make it monday
    ret.setDate(ret.getDate()+1);
    ret.setHours(0);
  }
  else if (date.getDay() === 6) { // it's saturday, add two to make it monday
    ret.setDate(ret.getDate()+2);
    ret.setHours(0);
  }

  // adjust forward for the end of the day
  var end = schedule['hours']['end'];
  var currTime = dateToTimeString(date);
  if (currTime > end) { // we need to adjust forward
    // if it's friday we need to go all the way to monday
    if (date.getDay() === 5) {
      ret.setDate(ret.getDate()+3);
    }
    else {
      ret.setDate(ret.getDate()+1);
    }
    ret.setHours(0);
  }

  var thisSchedule = schedule[dayNumToString(ret.getDay())]

  // find the current mentor
  var currMentor = getMentorAt(ret, thisSchedule);

  // look forward for when the next mentor change is
  currTime = dateToTimeString(ret);
  var nextTime = getClosestForward(currTime, thisSchedule);
  var splat = nextTime.split(":"); // splat = past tense of split
  ret.setHours(parseInt(splat[0]));
  ret.setMinutes(parseInt(splat[1]));
  return ret;
}
module.exports.getNextChange = getNextChange;