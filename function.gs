function copyEventsToTwoCalendars() {
  
  var workCalendarId = CalendarApp.getCalendarById(config.workCalendarId);
  var familyCalendarId = CalendarApp.getCalendarById(config.familyCalendarId);
  var personalCalendarId = CalendarApp.getCalendarById(config.personalCalendarId);

  //Get all events for the next three weeks
  var now = new Date();
  var ThreeWeeksFromNow = new Date(now.getTime() + (21 * 24 * 60 * 60 * 1000)); //days * hours * mins * secs * millisecs
  var workCalendar = workCalendarId.getEvents(now, ThreeWeeksFromNow);
  var updateCountPersonal = 0;
  var updateCountFamily = 0;

  //Loop through each event
  for(var item in workCalendar) {
    var event = workCalendar[item];

    //Adjust clock in and clock out times based on the current time zone
    var startTime = event.getStartTime().getTime() + (event.getStartTime().getTimezoneOffset() * 60 * 1000); //hours * mins * millisecs
    var endTime = event.getEndTime().getTime() + (event.getEndTime().getTimezoneOffset() * 60 * 1000); //hours * mins * millisecs

    //Properly format new times from MS
    var shiftedStart = new Date(startTime);
    var shiftedStartFormatted = new Date(Utilities.formatDate(shiftedStart, Session.getScriptTimeZone(),'MMM dd, yyyy HH:mm:ss'));
    var shiftedEnd = new Date(endTime);
    var shiftedEndFormatted = new Date(Utilities.formatDate(shiftedEnd, Session.getScriptTimeZone(),'MMM dd, yyyy HH:mm:ss'));

    //Get all events for the day in case of a duplicate event in my personal calendar
    var personalDuplicateCheck = personalCalendarId.getEventsForDay(shiftedStartFormatted, {search: event.getTitle()});

    //Check whether there are no events for the day
    if(personalDuplicateCheck[0] == undefined) {
      var copiedEventPersonal = personalCalendarId.createEvent(event.getTitle(), shiftedStartFormatted, shiftedEndFormatted).addPopupReminder(120).setDescription(config.description);
      console.log(`Added ${copiedEventPersonal.getTitle()} to personal calendar: ${copiedEventPersonal.getStartTime()} to ${copiedEventPersonal.getEndTime()}`);
      updateCountPersonal++;
    }
    //When there are one or more events for the day
    else {
      for(var personalDuplicate in personalDuplicateCheck) {
        var personalEvent = personalDuplicateCheck[personalDuplicate];

        //When there is already a duplicate event
        if((personalEvent.getStartTime().toString() == shiftedStartFormatted.toString()) && (personalEvent.getEndTime().toString() == shiftedEndFormatted.toString())) {
          //Log it for confirmation
          console.log(`The shift from ${personalEvent.getStartTime()} to ${personalEvent.getEndTime()} is already added to my personal calendar!`);
        }
        //When there is an event for the day, but is at another time
        else {
          //Delete the pre-existing event
          console.log(`DELETING SHIFT ON ${personalEvent.getStartTime()} AND ADDING AN UPDATED SHIFT`);
          personalEvent.deleteEvent();

          //Create the updated event
          var copiedEventPersonal = personalCalendarId.createEvent(event.getTitle(), shiftedStartFormatted, shiftedEndFormatted).addPopupReminder(120).setDescription(config.description);
          console.log(`Added ${copiedEventPersonal.getTitle()} to personal calendar: ${copiedEventPersonal.getStartTime()} to ${copiedEventPersonal.getEndTime()}`);
          console.log("DOUBLE CHECK THIS SHIFT CHANGE");
          updateCountPersonal++;
        }
      }
    }
    
    //Get all events for the day in case of a duplicate event in our family calendar
    var familyDuplicateCheck = familyCalendarId.getEventsForDay(shiftedStartFormatted, {search: 'Hansle - ' + event.getTitle()});

    //Check whether there are no events for the day
    if(familyDuplicateCheck[0] == undefined) {
      var copiedEventFamily = familyCalendarId.createEvent('Hansle - ' + event.getTitle(), shiftedStartFormatted, shiftedEndFormatted);
      console.log(`Added ${copiedEventFamily.getTitle()} to family calendar: ${copiedEventFamily.getStartTime()} to ${copiedEventFamily.getEndTime()}`);
      updateCountFamily++;
    }
    //When there are one or more events for the day
    else {
      for(var familyDuplicate in familyDuplicateCheck) {
        var familyEvent = familyDuplicateCheck[familyDuplicate];

        //When there is already a duplicate event
        if((familyEvent.getStartTime().toString() == shiftedStartFormatted.toString()) && (familyEvent.getEndTime().toString() == shiftedEndFormatted.toString())) {
          //Log it for confirmation
          console.log(`The shift from ${familyEvent.getStartTime()} to ${familyEvent.getEndTime()} is already added to our family calendar!`);
        }
        //When there is an event for the day, but is at another time
        else {
          console.log(`DELETING SHIFT ON ${familyEvent.getStartTime().getDate()} AND ADDING AN UPDATED SHIFT`);
          familyEvent.deleteEvent();
          var copiedEventFamily = familyCalendarId.createEvent('Hansle - ' + event.getTitle(), shiftedStartFormatted, shiftedEndFormatted);
          console.log(`Added ${copiedEventFamily.getTitle()} to family calendar: ${copiedEventFamily.getStartTime()} to ${copiedEventFamily.getEndTime()}`);
          console.log("DOUBLE CHECK ON INFOR FOR THIS SHIFT CHANGE");
          updateCountFamily++;
        }
      }
    }
  }

  if(updateCountPersonal != updateCountFamily) {
    console.log("CHECK FOR ERRORS BETWEEN THE TWO CALENDARS\nUPDATED COUNTS ARE DIFFERENT");
  }
  else if((updateCountPersonal == 0) && (updateCountFamily == 0)) {
    console.log("No new shifts to add to calendars!");
  }
  else if((updateCountPersonal == 1) && (updateCountFamily == 1)) {
    console.log(`Added ${updateCountPersonal} new shift to both calendars!`);
  }
  else if((updateCountPersonal > 1) && (updateCountFamily > 1)) {
    console.log(`Added ${updateCountPersonal} new shifts to both calendars!`);
  }
}
