const { io } = require("socket.io-client");

const uidA = "userA";
const socketA = io("http://localhost:3001", { auth: { uid: uidA } });

socketA.on("connect", () => {
  console.log("A connected");
  
  socketA.emit("ROOM_JOIN", { roomCode: "TEST", name: "A" }, (res) => {
    console.log("A joined:", res.state.state);
    
    // Start game 1
    socketA.emit("GAME_START");
  });
});

let game1Done = false;

socketA.on("GAME_ROLES_BULK", (roles) => {
  console.log("A received roles:", roles);
});

socketA.on("ROOM_STATE_UPDATE", (state) => {
  console.log("A received state update:", state.state);
  
  if (state.state === "DRAWING" && !game1Done) {
    console.log("Game 1 drawing, ending round...");
    game1Done = true;
    // End game
    socketA.emit("DRAW_NEXT_PLAYER");
  } else if (state.state === "VOTING") {
    console.log("Voting, forcing reveal...");
    socketA.emit("VOTE_FORCE_REVEAL");
  } else if (state.state === "RESULTS") {
    console.log("Results, restarting...");
    socketA.emit("GAME_RESTART");
  } else if (state.state === "LOBBY" && game1Done) {
    console.log("Lobby, starting game 2...");
    setTimeout(() => {
      socketA.emit("GAME_START");
    }, 1000);
  }
});
