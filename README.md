# Google Calendar Work Schedule Management Project

*All sensitive or private information have been created and stored separately in `config.gs`*

This is set to get all events from the subscribed work calendar for the next three weeks, but that can be adjusted by changing the number of days in the `threeWeeksFromNow` variable on line 9.

Also, be mindful of the `getTimezoneOffset()` function used on lines 19 and 20, where the time difference between the work calendar and the current user can change based on location. `Session.getScriptTimeZone()` was used only during formatting, which did not help to change the time zone from UTC on the work calendar to PST or PDT, depending on the day of the year. This is why `getTimezoneOffset()` was used beforehand to adjust the time of the shift by either 7 or 8 hours, depending on the date's relation to daylight savings.

### References
* [Apps Script - Calendar Overview](https://developers.google.com/apps-script/reference/calendar)
* [Stack Overflow](https://stackoverflow.com/questions/3244361/can-i-access-variables-from-another-file)
