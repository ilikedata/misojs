/*
	This is a sample user management app that uses the
	multiple url miso pattern.
*/
var miso = require('../server/miso.util.js'),
	validate = require('validator.modelbinder'),
	m = require('mithril'),
	sugartags = require('mithril.sugartags')(m),
	bindings = require('../server/mithril.bindings.node.js')(m),
	api = require('../system/api.server.js')(m, this);

//	TODO: This might be a useful practice - use self as module.exports
var self = module.exports;

//	TODO: Ability to load this from a separate file?
var editView = function(ctrl){
	with(sugartags) {
		return DIV({ class: "cw" }, [
			H2({class: "pageHeader"}, ctrl.header),
			ctrl.user ? [
				DIV([
					LABEL("Name"), INPUT({value: ctrl.user.name}),
					DIV({class: (ctrl.user.isValid('name') == true? "valid": "invalid") + " indented"}, [
						ctrl.user.isValid('name') == true? "": ctrl.user.isValid('name').join(", ")
					])
				]),
				DIV([
					LABEL("Email"), INPUT({value: ctrl.user.email}),
					DIV({class: (ctrl.user.isValid('email') == true? "valid": "invalid") + " indented" }, [
						ctrl.user.isValid('email') == true? "": ctrl.user.isValid('email').join(", ")
					])
				]),
				DIV({class: "indented"},[
					BUTTON({onclick: ctrl.save, class: "positive"}, "Save user"),
					BUTTON({onclick: ctrl.remove, class: "negative"}, "Delete user")
				])
			]: DIV("User not found")
		]);
	}
};


//	User list
module.exports.index = {
	controller: function(params) {
		var ctrl = this;

		ctrl.vm = {
			userList: function(users){
				this.users = m.p(users);
			}
		};

		api.find({type: 'user.edit.user'}).then(function(data) {
			if(data.error) {
				console.log("Error " + data.error);
				return;
			}
			if(data.result) {
				var list = Object.keys(data.result).map(function(key) {
					return new self.edit.models.user(data.result[key]);
				});

				ctrl.users = new ctrl.vm.userList(list);
			} else {
				ctrl.users = new ctrl.vm.userList([]);
			}
		}, function(){
			console.log('Error', arguments);
		});

		return this;
	},
	view: function(ctrl){
		var c = ctrl,
			u = c.users;

		with(sugartags) {
			return DIV({ class: "cw" }, [
				UL([
					u.users().map(function(user, idx){
						return LI(A({ href: '/user/' + user.id(), config: m.route}, user.name() + " - " + user.email()));
					})
				]),
				A({class:"button", href:"/users/new", config: m.route}, "Add new user")
			]);
		}
	}
};


//	New user
module.exports.new = {
	controller: function(params) {
		var ctrl = this;
		ctrl.user = new self.edit.models.user({name: "", email: ""});
		ctrl.header = "New user";

		ctrl.save = function(){
			//	TODO: return a proper THEN.
			api.save({ type: 'user.edit.user', model: ctrl.user } ).then(function(){
				console.log("Added user", arguments);
				m.route("/users");
			});
		};

		return ctrl;
	},
	view: editView
};


//	Edit user
module.exports.edit = {
	models: {
		user: function(data){
			this.name = m.p(data.name||"");
			this.email = m.p(data.email||"");
			this.id = m.p(data._id||"");

			//	Validate the model
			this.isValid = validate.bind(this, {
				name: {
					isRequired: "You must enter a name"
				},
				email: {
					isRequired: "You must enter an email address",
					isEmail: "Must be a valid email address"
				}
			});

			return this;
		}
	},
	controller: function(params) {
		var ctrl = this,
			userId = miso.getParam('user_id', params);

		ctrl.header = "Edit user " + userId;

		//	Load our user
		api.find({type: 'user.edit.user', query: {_id: userId}}).then(function(data) {
			var user = data.result;
			if(user && user.length > 0) {
				ctrl.user = new self.edit.models.user(user[0]);
			} else {
				console.log('User not found', userId);
			}
		}, function(){
			console.log('Error', arguments);
		});

		ctrl.save = function(){
			api.save({ type: 'user.edit.user', model: ctrl.user } ).then(function(){
				console.log("Saved user", arguments);
				m.route("/users");
			});
		};

		ctrl.remove = function(){
			if(confirm("Delete user?")) {
				api.remove({ type: 'user.edit.user', _id: userId }).then(function(data){
					console.log("Deleted user", data.result);
					m.route("/users");
				});
			}
		};

		return ctrl;
	},
	view: editView
	/*
	,
	//	Any authentication info
	//	Note: leave out, if open url
	//	TODO: Make sure this makes sense...?
	authenticate: {
		roles: ['admin', 'support']
	}
	*/
};
