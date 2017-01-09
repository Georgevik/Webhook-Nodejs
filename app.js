"use strict";
var TAG = "--Webhook--";
var http = require("http");
var config = require("./config");
var _ = require("lodash");
var exec = require('child_process').exec;
var createHandler = require('github-webhook-handler');
var handler = createHandler({ path: '/', secret: 'myWebhookPassword' });
var port = config.port;

var server = http.createServer(function(req, res) {
    handler(req, res, function (err) {
        res.statusCode = 404
        res.end('no such location')
    });
});

handler.on('push', function (event) {
    var nameRepo = event.payload.repository.name;
    var nameBranch = event.payload.ref.split('refs/heads/')[1];
    console.log('%s Repository: %s. Push received from %s',TAG, nameRepo, nameBranch);

    var repo = _.find(config.repositories, {name: nameRepo});
    if(!repo) return;

    var branch = _.find(repo.branches, {name: nameBranch});
    if(!branch) return;

    console.log('%s %s/%s. Running script %s', TAG, nameRepo, nameBranch, branch.script );

    exec(branch.script, function(error, stdout, stderr) {
        if(error) {
            console.log('Error during the execution of redeploy: ' + stderr);
        }

        console.log("%s End %s", TAG, branch.script);

    });
});

server.listen(port);

server.on('listening', function(){
    console.log('%s listening: %s',TAG, config.port);
});

server.on('error', function(error){
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});