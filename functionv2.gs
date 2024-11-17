/**
 * Helper function to get a new Date object relative to the current date.
 * @param {number} daysOffset The number of days in the future for the new date.
 * @param {number} hour The hour of the day for the new date, in the time zone
 *     of the script.
 * @return {Date} The new date.
 */
function getRelativeDate(daysOffset, hour) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

/**
 * Retrieve and log events from the given calendar that have been modified
 * since the last sync. If the sync token is missing or invalid, log all
 * events from up to a month ago (a full sync).
 *
 * @param {string} workCalendarId The ID of the calender to retrieve events from.
 * @param {boolean} fullSync If true, throw out any existing sync token and
 *        perform a full sync; if false, use the existing sync token if possible.
 */
function syncCalendars(workCalendarId, fullSync) {
  const personalCalendarId = CalendarApp.getCalendarById(config.personalCalendarId);
  const familyCalendarId = CalendarApp.getCalendarById(config.familyCalendarId);
  
  var properties = PropertiesService.getUserProperties();
  var options = {
    maxResults: 100
  };
  var syncToken = properties.getProperty('syncToken');
  if (syncToken && !fullSync) {
    options.syncToken = syncToken;
  } else {
    // Sync events up to the next four weeks (28 days)
    options.timeMin = getRelativeDate(0, -12).toISOString();
    options.timeMax = getRelativeDate(28, 0).toISOString();
  }

  // Retrieve events one page at a time.
  var events;
  var pageToken;
  do {
    try {
      options.pageToken = pageToken;
      options.showDeleted = true;
      events = Calendar.Events.list(config.workCalendarId, options);
    } catch (e) {
      // Check to see if the sync token was invalidated by the server;
      // if so, perform a full sync instead.
      if (e.message === 'API call to calendar.events.list failed with error: Sync token is no longer valid, a full sync is required.') {
        properties.deleteProperty('syncToken');
        syncCalendars(config.workCalendarId, true);
        return;
      } else {
        throw new Error(e.message);
      }
    }

    if (events.items && events.items.length > 0) {
      for (var i = 0; i < events.items.length; i++) {
        var event = events.items[i];
        
        var startDateTime = new Date(event.start.dateTime);
        var endDateTime = new Date(event.end.dateTime);

        var shiftedStart = new Date(startDateTime.getTime() + (startDateTime.getTimezoneOffset() * 60 * 1000));
        var shiftedEnd = new Date(endDateTime.getTime() + (endDateTime.getTimezoneOffset() * 60 * 1000));
        
        //Properly format new times from MS
        
        var start = new Date(Utilities.formatDate(shiftedStart, Session.getScriptTimeZone(),'MMM dd, yyyy HH:mm:ss'));
        var end = new Date(Utilities.formatDate(shiftedEnd, Session.getScriptTimeZone(),'MMM dd, yyyy HH:mm:ss'));

        var todayDate = getRelativeDate(0,0);

        if (event.status === 'cancelled' && todayDate > start) { 
          // Event cancelled, but is due to a past shift being deleted; keep it on personal and family calendars for record
          console.log("KEEP PAST SHIFT:", start);
          continue;
        } else if (event.status === 'cancelled' && todayDate < start) { 
          // Event cancelled and is due to changes in the future; delete it on personal and family calendars
          console.log('Event id %s was cancelled.', event.id, start, end);

          //Delete duplicate event in personal calendar
          var personalDuplicateList = personalCalendarId.getEvents(start, end, {search: event.summary});
          if(personalDuplicateList.length == 1) {
            var personalDeleteEvent = personalDuplicateList[0];
            personalDeleteEvent.deleteEvent();
            console.log(personalDeleteEvent.getStartTime(), `EVENT ${personalDeleteEvent.getTitle()} DELETED IN PERSONAL CALENDAR`);
          }

          //Delete duplicate event in family calendar
          var familyDuplicateList = familyCalendarId.getEvents(start, end, {search: 'Hansle - ' + event.summary});
          if(familyDuplicateList.length == 1) {
            var familyDeleteEvent = familyDuplicateList[0];
            familyDeleteEvent.deleteEvent();
            console.log(familyDeleteEvent.getStartTime(), `EVENT ${familyDeleteEvent.getTitle()} DELETED IN FAMILY CALENDAR`);
          }
        } else if (event.start.date) {
          // All-day event.
          console.log('%s (%s)', event.summary, start.toLocaleDateString(), 'POSSIBLE ERROR');
        } else {
          // Events that don't last all day; they have defined start times.
          //Add event to personal calendar
          var copiedEventPersonal = personalCalendarId.createEvent(event.summary, start, end).addPopupReminder(120).setDescription(config.description);
          console.log(`Added '${copiedEventPersonal.getTitle()}' to personal calendar: ${copiedEventPersonal.getStartTime()} to ${copiedEventPersonal.getEndTime()}`);

          //Add event to family calendar
          var copiedEventFamily = familyCalendarId.createEvent('Hansle - ' + event.summary, start, end);
          console.log(`Added '${copiedEventFamily.getTitle()}' to family calendar: ${copiedEventFamily.getStartTime()} to ${copiedEventFamily.getEndTime()}`);
        }
      }
    } else {
      console.log('No updates in the work calendar.');
    }

    pageToken = events.nextPageToken;
  } while (pageToken);

  properties.setProperty('syncToken', events.nextSyncToken);
}
