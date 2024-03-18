const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  // host: '/',
  // port: '3001'
});
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const muteButton = document.getElementById('muteButton');
const pauseButton = document.getElementById('pauseButton');
let isMuted = false;
let isPaused = false;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream);

  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
  });

  // Chat functionality
  sendButton.addEventListener('click', () => {
    const message = chatInput.value;
    if (message.trim() !== '') {
      appendMessage('You', message);
      socket.emit('chat-message', message);
      chatInput.value = '';
    }
  });

  socket.on('chat-message', ({ sender, message }) => {
    appendMessage(sender, message);
  });
});

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

function appendMessage(sender, message) {
  const messageElement = document.createElement('div');
  messageElement.innerText = `${sender}: ${message}`;
  chatMessages.append(messageElement);
}

// Mute/unmute audio
muteButton.addEventListener('click', () => {
  isMuted = !isMuted;
  myVideo.muted = isMuted;
  muteButton.innerText = isMuted ? 'Unmute' : 'Mute';
});

// Pause/resume video
pauseButton.addEventListener('click', () => {
  isPaused = !isPaused;
  if (isPaused) {
    myVideo.pause();
    pauseButton.innerText = 'Resume';
  } else {
    myVideo.play();
    pauseButton.innerText = 'Pause';
  }
});
