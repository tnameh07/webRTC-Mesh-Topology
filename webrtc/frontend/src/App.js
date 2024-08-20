// App.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [peers, setPeers] = useState({});
  const socketRef = useRef();
  const userVideoRef = useRef();
  const peersRef = useRef({});

  useEffect(() => {
    if (isLoggedIn) {
      socketRef.current = io.connect('http://localhost:5000');
      const peer = new Peer(undefined, {
        host: '/',
        port: '3001'
      });

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          userVideoRef.current.srcObject = stream;
          peer.on('call', call => {
            call.answer(stream);
            call.on('stream', userVideoStream => {
              addVideoStream(call.peer, userVideoStream);
            });
          });

          socketRef.current.on('user-connected', userId => {
            connectToNewUser(userId, stream);
          });
        });

      peer.on('open', id => {
        socketRef.current.emit('join-room', roomId, id);
      });

      function connectToNewUser(userId, stream) {
        const call = peer.call(userId, stream);
        call.on('stream', userVideoStream => {
          addVideoStream(userId, userVideoStream);
        });
        peersRef.current[userId] = call;
      }

      function addVideoStream(userId, stream) {
        setPeers(prevPeers => {
          return { ...prevPeers, [userId]: stream };
        });
      }
    }
  }, [isLoggedIn, roomId]);

  const handleLogin = async () => {
    // Implement login logic here
    setIsLoggedIn(true);
  };

  const handleJoinRoom = () => {
    // Join room logic
  };

  if (!isLoggedIn) {
    return (
      <div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={e => setRoomId(e.target.value)}
      />
      <button onClick={handleJoinRoom}>Join Room</button>
      <div>
        <video ref={userVideoRef} autoPlay muted />
        {Object.keys(peers).map(userId => (
          <video key={userId} autoPlay playsInline srcObject={peers[userId]} />
        ))}
      </div>
    </div>
  );
}

export default App;