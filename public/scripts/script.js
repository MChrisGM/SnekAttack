var socket;
var pID;
let canvas;
var aspect;
var nameField;
var randomLobbyBtn;
var createLobbyBtn;
var lobbyCode;
var lobbyCodeBtn;
var lobby = "";
var playerInfo = {
  names: [],
  positions: []
};
var pListDiv;
var lobbyCodeDiv;
let bg;
let player;
let otherP = [];
let chatDiv;
let chatInput;
let chatTextDiv;
var moving = true;
var paused = false;
let pauseDiv;

let fov = 60;
let lineWidth;
let res = 2;
let scale;
let sensX = 0.05;
let yAxis;


function socketFunctions() {
  socket = io.connect(window.location.href);

  socket.on('setPlayerId', function (data) {
    pID = data;
  });

  socket.on('clearUsername', function () {
    nameField.value("");
  });

  socket.on('joinLobby', function (data) {
    lobby = data;
    console.log("Lobby Code: " + data);
    lobbyCodeDiv.html('Lobby Code: <div class="tooltip"><button class="copyCode" onclick="copyCode()" onmouseout="outFunc()"> <span class="tooltiptext" id="myTooltip">Copy to clipboard </span>' + lobby + '</button></div>');
    socket.emit('lobbyInfo');
  });

  socket.on('lobbyInfo', function (data) {
    playerInfo = data;
    pListDiv.html("<b><u>Players(" + playerInfo.names.length + "/5): " + "</u><br><i>" + playerInfo.names.join('<br>') + "</b></i>");

    otherP = [];
    for (var i = 0; i < playerInfo.ids.length; i++) {
      if (playerInfo.ids[i] != pID) {
        otherP.push(
          new Player(playerInfo.positions[i].x, playerInfo.positions[i].y, playerInfo.ids[i], playerInfo.names[i])
          );
      } else {
        player.setUname(playerInfo.names[i]);
      }
    }
    chatInput.attribute("placeholder", "Message " + lobby);
  });

  socket.on('receiveMessage', function (data) {
    createMessage({ name: data.name, message: data.message, time: data.time });
  });
}

function UIFunctions() {
  nameField = createInput();
  nameField.input(submitName);
  nameField.id("usernameInput");
  nameField.attribute("placeholder", "Username");

  if (document.cookie != null && document.cookie != "") {
    nameField.value(document.cookie);
  }

  createLobbyBtn = createButton("Create Game");
  createLobbyBtn.id("createLobby");
  createLobbyBtn.mousePressed(createCustom);

  randomLobbyBtn = createButton("Random Game");
  randomLobbyBtn.mousePressed(joinRandom);
  randomLobbyBtn.id("randomLobby");

  lobbyCode = createInput();
  lobbyCode.id("codeLobby");
  lobbyCode.input(checkLobby);
  lobbyCode.attribute("placeholder", "Enter code");

  lobbyCodeBtn = createButton(">");
  lobbyCodeBtn.id("codeLobbyBtn");
  lobbyCodeBtn.mousePressed(joinCustom);

  pListDiv = createDiv();
  pListDiv.class('topleftcorner');
  pListDiv.id('playersDiv');

  lobbyCodeDiv = createDiv();
  lobbyCodeDiv.class('toprightcorner');
  lobbyCodeDiv.id('codeDiv');

  chatDiv = createDiv();
  chatDiv.class("bottomleftcorner");
  chatDiv.id('chatDiv');

  chatTextDiv = createDiv();
  chatTextDiv.parent(chatDiv);
  chatTextDiv.id('chatTextDiv');

  chatInput = createInput();
  chatInput.parent(chatDiv);
  chatInput.id('chatInput');
  chatInput.attribute("placeholder", "Message " + lobby);
  chatInput.mouseClicked(toggleChat);
  chatInput.changed(sendMessage);

  canvas.mouseClicked(toggleCanvas);

  pauseDiv = createDiv();
  pauseDiv.size(innerWidth, innerHeight);
  pauseDiv.id('pauseDiv');
  pauseDiv.center();
  pauseDiv.position(0, 0);
  pauseDiv.hide();
}

function setSize(resizing) {
  let pScale;
  let pPos;
  if (resizing) {
    pScale = scale;
    pPos = player.getPos();
  }
  if (window.innerHeight < window.innerWidth) {
    resizeCanvas(window.innerHeight, window.innerHeight);
    scale = window.innerHeight / 500;
  } else {
    resizeCanvas(window.innerWidth, window.innerWidth);
    scale = window.innerWidth / 500;
  }
  lineWidth = 1 + width / (fov * res);
  player = new Player(150 * scale, 150 * scale, pID);
  if (resizing) {
    let x = (pPos.x / pScale) * scale;
    let y = (pPos.y / pScale) * scale;
    player.setPos(x, y);
  }
  yAxis = height / 2;
  formatScale();
}

function formatScale() {

}

function windowResized() {
  setSize(true);
  pauseDiv.size(window.innerWidth, window.innerHeight);
}

function setup() {

  canvas = createCanvas(0,0);

  socketFunctions();

  setSize();

  UIFunctions();

  frameRate(60);

  pListDiv.hide();
  lobbyCodeDiv.hide();
  canvas.hide();
  hideMenu();
}

function sendMessage() {
  var text = chatInput.value();
  var username = player.getUname();
  socket.emit('sendMessage', { name: username, message: text, time: "" });
  chatInput.value(null);
}



function joinCustom() {
  submitName();
  var custom = lobbyCode.value();
  socket.emit('joinCustom', custom);
  socket.emit('sendMessage', { name: "", message: "" + player.getUname() + " connected!", time: "" });
}

function joinRandom() {
  submitName();
  socket.emit('joinRandom');
  socket.emit('sendMessage', { name: "", message: "" + player.getUname() + " connected!", time: "" });
}

function checkLobby() {
  if (lobbyCode.value().length > 5) {
    lobbyCode.value(lobbyCode.value().substring(0, lobbyCode.value().length - 1));
  }
}

function submitName() {
  if (nameField.value().length > 20) {
    nameField.value(nameField.value().substring(0, nameField.value().length - 1));
  } else {
    setName();
  }
}



function draw() {
  if (lobby != null && lobby != "") {
    canvas.show();
    hideMenu();
    background(51);

    main();

    pListDiv.show();
    lobbyCodeDiv.show();

    if (paused) {
      pauseDiv.show();
    } else if (!paused) {
      pauseDiv.hide();
    }

  } else {
    background(82);
    showMenu();
    player.setUname(nameField.value());
    document.cookie = nameField.value();
  }
}

function main() {
  let data = {
    x: player.getPos().x / scale,
    y: player.getPos().y / scale
  };
  socket.emit('updatePosition', data);
  socket.emit('lobbyInfo');
}

function displayNames(players) {
  textAlign(CENTER);
  textStyle(NORMAL);
  strokeWeight(4);
  stroke(0);
  fill(255);

  push();
  translate(0, yAxis);

  for (let [id, colXs] of players) {
    const colX = (colXs[0] + colXs[1]) / 2;
    textSize((8000 * scale) / colXs[2]);
    text(colXs[3], colX, -20);
  }
  pop();
}

function playerMovement() {
  if (!paused && moving) {
    let dirX = 0;
    let dirY = 0;
    if (keyIsDown(87)) { //W
      dirY += 1;
    }
    if (keyIsDown(65)) { //A
      dirX -= 1;
    }
    if (keyIsDown(83)) {  //S
      dirY -= 1;
    }
    if (keyIsDown(68)) {  //D
      dirX += 1;
    }
    player.move(dirX, dirY);
  }

}
function playerSpeed() {
  if (!paused && moving) {
    if (keyIsDown(16)) {
      player.setSpeed(1);
    } else {
      player.setSpeed(2);
    }
  }
}

function playerDirection() {
  if (!paused && moving) {
    if (player.getDir() < -180) {
      player.dir = 180 + (180 + player.getDir());
    }
    if (player.getDir() > 180) {
      player.dir = -180 + (player.getDir() - 180);
    }
    player.changeDir(int(movedX) * sensX);
  }
}