/**
 * Created by sstam on 05-11-13.
 */
var fs = require('fs'),
    cradle = require('cradle');

var connection = new (cradle.Connection)("localhost", 5984,
    {cache: false, raw: false});
var db = connection.database('p2000');
var DIR = '/tmp/p2000';

fs.mkdir(DIR, function(err, res){
    if(err) {
        console.log(err);
        return;
    }

    console.log(res);
});

fs.watch(DIR, function (event, filename) {
    console.log('event is: ' + event);
    if (filename) {

        fs.readFile(DIR+'/'+filename, 'utf8', function (err,data) {
            if (err) {
                //console.log(err);
                return;
            }

            //console.log(data);
            store(JSON.parse(data));
            fs.unlink('message/'+filename);
        });

    } else {
        console.log('filename not provided');
    }
});

function store(message) {
    var id = message.id;
    var rev = "1-" + id;

    message.capcodes = [message.capcode];
    delete message.capcode;

    return db.save(id, rev, message, function (err, result){
        if(err) {
            //console.log(err);
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
            message.capcodes.push(capcode);
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