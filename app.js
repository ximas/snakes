const express = require('express');
const app = express();
const path = require('path');
const http = require('http').createServer(app);
// const io = require('socket.io')(http);
const port = 3000;

let player = 0;

app.use(express.static('./'));

app.get('/home', (req, res) => {
    console.log('/ request')
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/config' ,(req, res) => {
    res.json({});
})

// io.on('connection', socket => {
//     console.log(`new player ${player}`);
//     socket.emit('player', player);

//     player++;

//     socket.on('playerName', data => {
//         console.log(data);
//         socket.broadcast.emit('playerName', data);
//     })
    
//     socket.on('move', move => {
//         console.log(move);
//         io.emit('move', move);
//     });
// });


http.listen(port, () => {
    console.log(`listening on port ${port}`);
})