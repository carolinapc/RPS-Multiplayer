const ROCK = "<i class='fas fa-hand-rock'></i>";
const PAPER = "<i class='fas fa-hand-paper'></i>";
const SCISSORS = "<i class='fas fa-hand-scissors'></i>";

const config = {
    apiKey: "AIzaSyCqlzF59M-WVvn_WTps9GqJ62_36QgmBZE",
    authDomain: "rps-game-5cb57.firebaseapp.com",
    databaseURL: "https://rps-game-5cb57.firebaseio.com",
    projectId: "rps-game-5cb57",
    storageBucket: "rps-game-5cb57.appspot.com",
    messagingSenderId: "900185945561",
    appId: "1:900185945561:web:6ed737f583d9fce3"
  };

// Initialize Firebase
firebase.initializeApp(config);

var database = firebase.database();
var gamesRef = database.ref("games");
var connectedRef = database.ref(".info/connected");
var connectionsRef = database.ref("connections");

var game = {
    startedAt: "",
    messages: "",
    score:{
        ties: 0,
        player1:{
            id: "",
            wins: 0, 
            losses: 0, 
            choice: ""
        },
        player2:{
            id: "",
            wins: 0, 
            losses: 0, 
            choice: ""
        }
    }
    
};

var started = false;
var gameKey = "waiting";
var player;
var playerName;

var $player1 = $("#player1");
var $player2 = $("#player2");
var $player1wins = $("#player1-wins");
var $player2wins = $("#player2-wins");
var $player1losses = $("#player1-losses");
var $player2losses = $("#player2-losses");
var $gameTies = $("#ties");
var $gameButtons = $(".game-buttons");
var $gameResult = $("#game-result");
var $msgInput = $("#msg-input");
var $msgButton = $("#msg-button");
var $chat = $("#chat");


function error (err) {
    console.log("Error!");
    console.log(err);
}

function getSymbol(s){
    switch (s) {
        case "r":
            return ROCK;
        case "p":
            return PAPER;
        case "s":
            return SCISSORS;
    
        default:
            return "-"
    } 

}

connectedRef.on("value", function(snapshot){
    // If they are connected..
    if (snapshot.val()) {
  
      // Add user to the connections list.
      var con = connectionsRef.push("waiting");
  
      player = con.key;

      // Remove user from the connection list when they disconnect.
      con.onDisconnect().remove();
    }
    
}, error);

function playerDisconnect(data){
    gameDisconnected = data.val();
    
    //if the user disconnected was playing on the same game of the current player
    if(gameKey === gameDisconnected){

        //remove the game disconnected
        gamesRef.child(gameDisconnected).remove();
        //reset gameKey
        connectionsRef.child(player).remove();
        
        $gameButtons.css("disabled","true");
        $msgInput.attr("disabeld","true");
        $msgButton.attr("disabled","true");

        playerName == "player1";
        $player1.text("Player 1: YOU!");
        $player2.text("Player 2: Disconnected");
        $player2.addClass("blink");
        $gameResult.empty();
        $gameResult.append("<p class='text-center'>Your opponent has disconnected! Please click on restart button and wait for a new player.</p>");

        var restartButton = $("<button>");
        restartButton.attr("class","btn btn-primary pt-1 text-center");
        restartButton.click(restart);
        restartButton.text("Restart");
        $gameResult.append(restartButton);
    }
}

function connectPlayers(snapshot){
    
    var numPlayers = snapshot.numChildren();

    if(numPlayers % 2 === 0){
        //new game
        var players = Object.keys(snapshot.val());
        var player1 = players[numPlayers-2]; //get the player before the last player
        var player2 = players[numPlayers-1]; //get the last player

        game.score.player1.id = player1;
        game.score.player2.id = player2; 

        //only the player 2 starts the game
        if(player === player2){
            game.startedAt = firebase.database.ServerValue.TIMESTAMP;
            gameKey = gamesRef.push(game).key;

            connectionsRef.child(player1).set(gameKey);
            connectionsRef.child(player2).set(gameKey);

            $player2.text("Player 2: YOU!");
            $playerName = "player2";
            $gameButtons.removeAttr("disabled");

            $player1.text("Player 1: Your Opponent!");
        }
        else{
            $player2.text("Player 2: YOU!");
            $playerName = "player2";
        }
            
    }
    else{
        //waiting a player
        $player1.text("Player 1: YOU!");
        $playerName = "player1";
    }

    //listen changes on the player conection waiting for a game key
    database.ref("/connections/"+player).on("value", data =>{
        //get the game key
        gameKey = data.val();
        if(gameKey != "waiting"){
    
            if(!started){
                $player1.removeClass("blink");
                $player2.removeClass("blink");
                $gameResult.text("Make your choice!");
                $gameButtons.removeAttr("disabled");
                //start listen the game score
                gamesRef.child(gameKey+"/score").on("value", scoreChanges, error);
                //start listen the game messages
                gamesRef.child(gameKey+"/messages").on("child_added", messagesChanges, error);
                started = true;
            }
    
        }

    });
}

function scoreChanges(snapshot) {

    game.score = snapshot.val();

    if(game.score != null){
        
        //enable chat
        $msgInput.removeAttr("disabled");
        $msgButton.removeAttr("disabled");

        var player1 = game.score.player1;
        var player2 = game.score.player2;
    
        $player1wins.text(player1.wins);
        $player1losses.text(player1.losses);
        $player2wins.text(player2.wins);
        $player2losses.text(player2.losses);
        $gameTies.text(game.score.ties);
    
        if(player1.id == player){
            playerName = "player1";
            $player1.text("Player 1: YOU!");
            $player2.text("Player 2: Your Opponent");
        }
        else{
            playerName = "player2";
            $player1.text("Player 1: Your Opponent");
            $player2.text("Player 2: YOU!");
        }
        
        
    
        //if both players played
        if(player1.choice != "" && player2.choice != ""){
            $gameResult.empty();
            var $divp1 = $("<div>");
            var $divp2 = $("<div>");
            var $textResult = $("<p>");

            
            $divp1.append(getSymbol(player1.choice));
            $divp2.append(getSymbol(player2.choice));
            
            $divp1.append($("<p>").text("Player 1"));
            $divp2.append($("<p>").text("Player 2"));


            if (player1.choice === player2.choice) {
                game.score.ties++;  
                $textResult.text("That's a tie! Play again!");
                $divp1.addClass("text-primary");
                $divp2.addClass("text-primary");
            } 
            else if ((player1.choice === "r" && player2.choice === "s") ||
                     (player1.choice === "s" && player2.choice === "p") || 
                     (player1.choice === "p" && player2.choice === "r")) {
    
                game.score.player1.wins++;
                game.score.player2.losses++;
                $textResult.text("Player 1 WON! Play again!");
                $divp1.addClass("text-primary");
    
            } else {
    
                game.score.player2.wins++;
                game.score.player2.losses++;
                $textResult.text("Player 2 WON! Play again!");
                $divp2.addClass("text-primary");
    
            }

            
            $gameResult.append($divp1);
            $gameResult.append($divp2);
            $gameResult.append($textResult);
        
            //reset choices
            game.score.player1.choice = "";
            game.score.player2.choice = "";
    
            $gameButtons.removeAttr("disabled");
            
            //updata database
            gamesRef.child(gameKey+"/score").set(game.score);
            
        }
        else if(player1.choice != ""){
            $gameResult.empty();
            $gameResult.append($("<p>").text("Waiting for player 2 to choose..."));
            if(playerName == "player2")
                $gameButtons.removeAttr("disabled");
        }
        else if(player2.choice != ""){
            $gameResult.empty();
            $gameResult.append($("<p>").text("Waiting for player 1 to choose..."));
            if(playerName == "player1")
                $gameButtons.removeAttr("disabled");
        }
    }

}

function messagesChanges(data){
    var msg = data.val();
    var newP = $("<p>");
    var newSpan = $("<span>");

    
    if(msg.player == "Player 1"){
        newSpan.addClass("player1");
    }
    else{
        newSpan.addClass("player2");
    }
    newSpan.text(`${msg.player}: `);
    newP.append(newSpan);
    newP.append(msg.text);

    $chat.append(newP);
    
    //auto scroll
    document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
    
}

function play(){

    var choice = $(this).val();

    $gameButtons.attr("disabled","true");

    gamesRef.child(gameKey+"/score/"+playerName+"/choice").set(choice);
    
}

function restart(){
    location.reload();
}

function sendMessage(){

    event.preventDefault();

    var message = {};
    message.text = $msgInput.val().trim();
    message.timestamp = firebase.database.ServerValue.TIMESTAMP;

    if(game.score.player1.id == player){
        message.player = "Player 1";
    }
    else{
        message.player = "Player 2";
    }

    gamesRef.child(gameKey+"/messages").push(message);
    $msgInput.val("");
}

// When the connections are changed once
connectionsRef.once("value", connectPlayers, error);

// When the connections are removed
connectionsRef.on("child_removed", playerDisconnect, error);

// When the player clicks on the button choice
$gameButtons.click(play);

// When the player clicks on the button to send a messagem
$msgButton.click(sendMessage);

// When the player hits enter to send a message
$msgInput.keypress(event => {
    if(event.key == "Enter"){
        sendMessage();
    }
});




    
