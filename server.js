/**
 * Created by sstam on 05-11-13.
 */
var fs = require('fs'),
    cradle = require('cradle'),
    os = require('os'),
    path = require('path');

var connection = new (cradle.Connection)("localhost", 5984,
    {cache: false, raw: false});
var db = connection.database('p2000');
var dir = 'p2000';
var messageDir = (os.tmpDir().match(path.sep+"$") ? os.tmpDir() : os.tmpDir() + path.sep ) + dir;
var isWin = os.type().match(/^win/);

fs.mkdir(messageDir, function(err, res){
    if(err) {
        console.log(err);
        return;
    }

    console.log(res);
});

fs.watch(messageDir, function (event, filename) {
    console.log('event is: ' + event);
    if (filename && ((isWin && event=='change') || !isWin)) {
        var file = messageDir+path.sep+filename;
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                //console.log(err);
                return;
            }

            //console.log(data);
            try {
                store(JSON.parse(data),file);
            } catch(e) {
                console.log('ERR: file doesn\'t contain json');
            }
        });

    } else {
        console.log('filename not provided');
    }
});

function store(message, file) {
    var id = message.id;
    var rev = "1-" + id;

    message.capcodes = [message.capcode];
    delete message.capcode;

    return db.save(id, rev, message, function (err, result){
        if(err) {
            //console.log(err);
            update(id, message.capcodes[0], file);
            return;
        }

        console.log(result);
        fs.unlink(file);
    });
}

function update(id, capcode, file) {
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
                    update(id, capcode, file);
                    return;
                }

                console.log(result);
                fs.unlink(file);
            });
        } else {
            console.log("Already stored");
        }
    });
}