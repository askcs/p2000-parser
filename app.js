#!/usr/bin/env node
/**
 * Created by sstam on 04-11-13.
 */

var program = require('commander'),
    moment = require('moment'),
    crypto = require('crypto'),
    cradle = require('cradle');

var connection = new (cradle.Connection)("localhost", 5984,
    {cache: true, raw: false});
var db = connection.database('p2000');

program
    .version('0.0.1')
    .option('-a, --address [address]', 'Address')
    .option('-t, --time [time]', 'Time HH:ii:ss')
    .option('-d, --date [date]', 'Date YYYY-MM-DD')
    .option('-m, --message [message]', 'Message')
    .parse(process.argv);

var timestamp = new moment(program.time+" "+program.date).valueOf();
var id = crypto.createHash('md5').update(timestamp+"_"+program.message).digest("hex");

db.get(id, function(err, doc){

    var message = {};
    if(err) {
        if(err.error=='not_found') {

            message.message = program.message;
            message.timestamp = timestamp;
            message.capcodes = [program.address];

            console.log(message);

            return db.save(id, message, function (err, result){
                if(err) {
                    console.log(err);
                    return;
                }

                console.log(result);
            });
        }
    }

    message.capcodes = doc.capcodes;
    if(message.capcodes.indexOf(program.address)==-1) {
        message.capcodes.push(program.address);
        db.merge(id, message, function (err, result){
            if(err) {
                console.log(err);
                return;
            }

            console.log(result)
        });
    } else {
        console.log("Already stored");
    }
});