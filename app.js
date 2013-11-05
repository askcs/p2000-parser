#!/usr/bin/env node
/**
 * Created by sstam on 04-11-13.
 */

var program = require('commander'),
    moment = require('moment'),
    crypto = require('crypto'),
    cradle = require('cradle');

var connection = new (cradle.Connection)("localhost", 5984,
    {cache: false, raw: false});
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

            store(id, "1-"+id, message);
            return;
        }
    }

    update(id, program.address);
});

function store(id, rev, message) {
    return db.save(id, rev, message, function (err, result){
        if(err) {
            console.log(err);
            update(id, message.capcodes[0]);
            return;
        }

        console.log(result);
    });
}

function update(id, capcode) {
    db.get(id, function(err, doc){

        var message = {};
        if(err) {
            if(err.error=='not_found') {
                console.log("Imposible!");
            }
            return;
        }

        message.capcodes = doc.capcodes;
        if(message.capcodes.indexOf(capcode)==-1) {
            var revs = doc._rev.split("-");
            console.log(revs);
            var rev = parseInt(revs[0]) + 1;
            message.capcodes.push(program.address);
            var revision = rev+"-"+revs[1];
            console.log(id, revision);
            message._rev = revision;
            db.merge(id, message, function (err, result){
                if(err) {
                    console.log(err);
                    update(id, capcode);
                    return;
                }

                console.log(result)
            });
        } else {
            console.log("Already stored");
        }
    });
}