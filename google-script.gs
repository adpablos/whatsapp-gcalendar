function getData(dataSheet){
  var data = {};
  data.titleMatch = dataSheet.getRange(1,2).getValue();
  data.suffixProcessed = dataSheet.getRange(2,2).getValue();
  data.sandboxNumber = dataSheet.getRange(3,2).getValue();
  data.minsToNotify = dataSheet.getRange(4,2).getValue();
  
  return data;
}

function getSheetNames(activeSpreadSheet){
  var sheets = {};
  sheets.twilio = activeSpreadSheet.getSheetByName("Twilio");
  sheets.contacts = activeSpreadSheet.getSheetByName("Contacts");
  sheets.data = activeSpreadSheet.getSheetByName("Data");

  return sheets;
}

function send_whatsapp() {
  var activeSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = getSheetNames(activeSpreadSheet);    
  
  var time = new Date();
  var events = CalendarApp.getDefaultCalendar().getEventsForDay(time);  
  for(var i=0; i < events.length; i++)  {
    if (validate_event(sheets, events[i], time)){
      send_whatsapp_to_contacts(sheets, events[i]);
    }         
  } 

}

function send_whatsapp_to_contacts(sheets, event){
  var eventTitle = event.getTitle();
  var eventStartTime = event.getStartTime();  
  var twilio_sid = sheets.twilio.getRange(1,1).getValue();
  var twilio_token = sheets.twilio.getRange(2,1).getValue();
  var contactSheet = sheets.contacts;
  var data = getData(sheets.data);
  var cellno = null;

  Logger.log('Item '+ eventTitle +' found on '+ eventStartTime); 

  for(n=1; n <= contactSheet.getLastRow(); ++n) {
    cellno = contactSheet.getRange(n,1).getValue();      
    var response = call_api(eventTitle, eventStartTime, twilio_sid, twilio_token, cellno, data.sandboxNumber);
    Logger.log('Response '+ response);        
    if(response.getResponseCode() == 201){
      event.setTitle(eventTitle + data.suffixProcessed);
    }
  }
}

function validate_event(sheets, event, now){
  var data = getData(sheets.data);
  var eventTitle = event.getTitle();
  var suffix = eventTitle.substring(eventTitle.length-3, eventTitle.length);
  var minsOffset = (event.getStartTime().getTime() - now.getTime()) / 1000 / 60;
  
  return eventTitle == data.titleMatch && suffix !== data.suffixProcessed && minsOffset < data.minsToNotify;
}

function call_api(title, time, twilio_sid, twilio_token, cellno, twilioSbxNumber) {
  var url = 'https://api.twilio.com/2010-04-01/Accounts/' + twilio_sid + '/Messages.json';
  var options = {
    "method": "post",
    "headers": {
      "Authorization": "Basic " + Utilities.base64Encode(twilio_sid + ":" + twilio_token)
    },
    "payload": {
      "From": "whatsapp:" + '+' + twilioSbxNumber,
      "To": "whatsapp:" + '+' + cellno,
      "Body": "Your appointment is coming up on " + title + " at " + time
    },
    "followRedirects" : true,
    "muteHttpExceptions": true
  };
  
  return UrlFetchApp.fetch(url, options);
}
