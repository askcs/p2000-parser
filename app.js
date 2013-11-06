/**
 * Created by sstam on 05-11-13.
 */
var program = require('commander'),
    moment = require('moment'),
    crypto = require('crypto'),
    fs = require('fs'),
    path = require('path'),
    os = require('os');

program
    .version('0.0.1')
    .option('-a, --address [address]', 'Address')
    .option('-t, --time [time]', 'Time HH:ii:ss')
    .option('-d, --date [date]', 'Date YYYY-MM-DD')
    .option('-m, --message [message]', 'Message')
    .parse(process.argv);

var timestamp = new moment(program.time+" "+program.date).valueOf();
var id = crypto.createHash('md5').update(timestamp+"_"+program.message).digest("hex");

var now = new Date().getTime();

var dir = 'p2000';
var messageDir = os.tmpDir() + dir;

console.log(messageDir);

var message = {id: id, timestamp: timestamp, message: program.message, capcode: program.address};
fs.writeFile(messageDir+path.sep+now, JSON.stringify(message));