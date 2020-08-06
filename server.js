var app = require('./app.js');
var socket = require("socket.io");
var port = process.env.PORT || 4000;
var server = app.listen(port);
var nicknames = {}
var io = socket(server);
io.on("connection", function(socket){

	socket.on('subscribe', function(data, cb) {
		let room = data.room
		let name = data.name
		if(!nicknames[room]) nicknames[room] = Array()
		if(nicknames[room].findIndex(i => i.nickname.toLowerCase() === name.toLowerCase()) != -1){
			cb(false)
		}else{
			nicknames[room].push({
				id: socket.id,
				nickname: name
			})
			socket.nickname = name
			socket.join(room);
			cb(true, nicknames[room].length)
			socket.to(room).emit('users_online', nicknames[room].length)		
		}
	})

	socket.on('unsubscribe', function(room) {
		if(nicknames[room]){
			let pos = nicknames[room].findIndex(i => i.id === socket.id)
			nicknames[room].splice(pos, 1)
			socket.to(room).emit('users_online', nicknames[room].length)
			if(nicknames[room].length == 0) delete nicknames[room]
			socket.leave(room)
		}
	})

	socket.on('message', data => {
		socket.to(data.room).emit('broadcat', {
			nickname: socket.nickname, 
			timestamp: data.timestamp,
			message: data.message
		});
	})

	socket.on('videochat', data => {
		socket.to(data.room).emit('videochat', {
			nickname: socket.nickname, 
			url: data.url
		});
	})

});