const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId, userName) => { // Added userName parameter
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId, userName); // Emitting userName

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });

    socket.on('toggle-mute', isMuted => {
      socket.to(roomId).broadcast.emit('peer-toggle-mute', { userId, isMuted }); // Broadcasting mute action
    });

    socket.on('toggle-pause', isPaused => {
      socket.to(roomId).broadcast.emit('peer-toggle-pause', { userId, isPaused }); // Broadcasting pause action
    });
  });
});

server.listen(3000);
