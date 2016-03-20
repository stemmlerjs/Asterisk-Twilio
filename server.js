  // ========================================================= // 
  // ============ Require all the things we need ============= //
  // ========================================================= // 
  
  var config = require('./config.json');
  var express = require('express');
  var bodyParser = require('body-parser');
  var jsonfile = require('jsonfile');
  var colors = require('colors');

  // Twilio Credentials
  var accountSid = process.env.TWILIO_SID;
  var authToken = process.env.TWILIO_AUTH;

  // Require Twilio
  var twilio = require('twilio')(accountSid, authToken);
  var AsteriskAmi = require('asterisk-ami');
  var ami = new AsteriskAmi( { host: 'localhost', username: 'hello', password: 'world' } );

  // ========================================================= //
  // ============ Configure Express HTTP Server ============== //
  // ========================================================= //

  var app = express();

  app.listen(8080);
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.set('view engine', 'ejs');
  
  app.get('/', function(req,res){
    res.render('index', {
      name: config.user.name,
      exten: config.user.exten,
      mobile: config.user.mobile
    });
  });

  app.post('/settings', function(req, res){
      // update settings
      config.user.name = req.body.name;
      config.user.exten = req.body.exten;
      config.user.mobile = req.body.mobile;

      console.log("Updating Settings...".yellow);

      jsonfile.writeFile('./config.json', config, function (err) {
          console.error(err)
      });

      // return to page
      res.render('index', {
      name: config.user.name,
      exten: config.user.exten,
      mobile: config.user.mobile
    });
  });

  // ========================================================= //
  // =============== Asterisk Call Processing ================ //
  // ========================================================= //

  var incomingCallState = false;

  ami.on('ami_data', function(eventData){
    // Every time an event happens once we are logged in, it will be logged into the console here as 'eventData'
    // What we want to do is look for certain events, such as a 'missedCall' event

    var eventName  = eventData.event;
    var channel    = eventData.channel;
    var callerid   = eventData.calleridnum;
    var callername = eventData.calleridname;
    var exten      = eventData.exten; 

    if(eventName) console.log("Event : ".green + eventName);
    if(channel) console.log("Channel : " + channel);
    if(callerid) console.log("CallerId : " + callerid);
    if(callername) console.log("CallerName : ".yellow + callername);
    if(exten) console.log("Exten : ".blue + exten);

    if(exten) console.log(""); //space out all of the SIP and RTP data 

    if((incomingCallState) && (eventName == 'BridgeCreate')){
      incomingCallState = false;
      console.log("STATE CHANGE: IN CALL".red);
    }

    if((incomingCallState) && (eventName == 'HangupRequest') && (callerid != config.user.exten)){
      console.log("SENDING NOTIFICATION".red);
      sendNotification(callerid, callername, exten);
      incomingCallState = false;
      console.log("STATE CHANGE: Awaiting calls".red);
    }

    if((eventName == 'DialBegin') && (callerid != config.user.exten)){
        //A call is coming in, enter the Incoming Call state
        console.log("STATE CHANGE: INCOMING CALL STATE".red);
        console.log("");
        incomingCallState = true;
    }
  });

  ami.connect(function(){
    console.log('connection to AMI socket successful');

  }, function(raw_data){
  });

  // ========================================================= //
  // =============== Send Twilio Notification ================ //
  // ========================================================= //

	/**
	 * Sends a notification to the mobile phone configured in config.json via Twilio's provisioned phone (requires a Twilio account).
	 * @param {String} caller_id	- the caller id of the missed caller
	 * @param {String} caller_name	- the display name of the missed caller
	 * @param {String} extension - monitored user extension from config.json
	 * @return void
	 */

  var sendNotification = function(caller_id, caller_name, extension){
      twilio.sendMessage({
        to: config.user.mobile,
        from: config.twilio.phone,
        body: "Asterisk Notification: Hi " + config.user.name + ", you've missed a call from " + caller_id 
          + " on your Extension - " + extension + "."
      }, function(err, message){
          if(err) console.log("There was an error", err);
          else {
            console.log("The notification was successfully sent".green);
            console.log("Date Sent: ".green + message.date_created);
          }
      });
  };


