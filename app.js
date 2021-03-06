/*
	WIP: when the app is created, we should have options to include:

	* sessions
	* authentication

	This needs to either be:

	* options in /bin/miso.bin.js
	* options in server.json
	* or perhaps a mixture of both?

*/

var express = require('express'),
	bodyParser = require('body-parser'),

	session = require('express-session'),

	//	TODO: For dev only
	reload = require('./server/reload'),
	path = require('path'),
	app = express(),

	serverConfig = require('./cfg/server.json'),
	routeConfig	= require('./cfg/routes.json'),

	mvc = require('./system');



//	Setup session
//	TODO: Set session store
//	Fix config: https://github.com/sahat/hackathon-starter/issues/169
// serverConfig.session.resave = serverConfig.session.resave || false;
// serverConfig.session.saveUninitialized = serverConfig.session.saveUninitialized || false;
// app.use(session(serverConfig.session));

//	We parse application/x-www-form-urlencoded and application/json
//	TODO: Add any further defaults here and make configurable
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//	Static directory for our client-side JS
app.use(express.static(path.join(__dirname, '/client')));

//	Basic error handling
//	TODO: make configurable
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

//	Create our miso app
mvc(app, {
	routeConfig: routeConfig,
	throwUnmappedActions: true,
	verbose: true
});

//	Run the server
var server = app.listen(serverConfig.port, function () {
	var info = server.address(),
		address = info.address;

	//	Fix for chrome - it doesn't like 0.0.0.0
	if(address == "0.0.0.0") {
		address = "localhost";
	}

	console.log('');
	console.log('Miso is listening at http://%s:%s in %s mode', address, info.port, app.get('env'));
	console.log('');
});

//	For dev only - auto reloading, TODO: environment support
reload(server, app);