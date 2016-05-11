# Asterisk-Twilio

An implementation of **Missed Call SMS Notifications** in Asterisk using Twilio.
Making use of the Asterisk AMI’s detailed event logging system, this triggers an SMS notification to be sent to the user’s mobile phone on the event of a missed call to the user's extension.

A local user on the LAN will be able to go onto the **Notification Server Configuration** via **[node_server_ip]:8080** and enter the phone number to associate with their user agent address. Asterisk will be run on the same physical server as the Notification Server written in Node.JS. Using a community-created Node module (**asterisk-ami by @danjenkins**), the Notification Server will connect to the AMI over a TCP connection and listen for missed calls on the configured local user extension.

On the event of a missed call, the Notification Server will communicate with Twilio (a Cloud communications platform for building Voice & Messaging applications) using it’s SMS API to send a message to the local user’s mobile phone from Twilio’s provisioned phone.
