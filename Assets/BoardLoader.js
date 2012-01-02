import System.IO;

#pragma strict

// sounds 

var startGameSound : AudioClip;
var endGameSound : AudioClip;
var doMoveSound : AudioClip;
var cantDoMoveSound : AudioClip;
var addESCPointSound : AudioClip;


var lines : int;
static var boardSizeX = 0;
static var boardSizeY = 0;
static var lineSize = 10;

static var minLimitX = 1;
static var maxLimitX = 1;
static var minLimitY = 1;
static var maxLimitY = 1;

static var playerName : GameObject;
static var messageGUI : GameObject;

static var touched = 0;

var crossPrefab : GameObject;
var dotPrefab : GameObject;
var lineXPrefabForPlayerA : GameObject;
var lineXPrefabForPlayerB : GameObject;
var lineXYPrefabForPlayerA : GameObject;
var lineXYPrefabForPlayerB : GameObject;

var gateAPrefab : GameObject;
var gateBPrefab : GameObject;

var lastPositionPrefabForPlayerA : GameObject;
var lastPositionPrefabForPlayerB : GameObject;

var showResetDialog = false;
var showExitDialog = false;

var resetDialogCanceled = false;
var exitDialogCanceled = false;

static var gameboard : GameDot[,];

static var undoPrevPositionX = 0;
static var undoPrevPositionY = 0;
static var undoLastPlayer = 0;
static var prevPositionX = 0;
static var prevPositionY = 0;
static var lastPositionX = 0;
static var lastPositionY = 0;
static var lastPositionMarker : GameObject;

static var dummyObject : GameObject;

static var playerCurrent = 0;
static var maxNrOfPlayers = 2;

static var nrPlayers : int = 0;
static var playerNames : String[];
static var playerGates : Vector2[];
static var playerLinesX : GameObject[];
static var playerLinesXY : GameObject[];
static var playersLastPositionPrefab : GameObject[];
static var playersGatePrefab : GameObject[];
static var undoActivated = 1;

static var gameIsWon;

static var lineHashTable : Hashtable = new Hashtable();

var boardPlane : GameObject;

var lastMoveTime = 0.0f;
var timeBetweenMoves = 0.5f;

var controlButtonUp : Texture2D;
var controlButtonDown : Texture2D;
var controlButtonLeft : Texture2D;
var controlButtonRight : Texture2D;
var controlButtonReset : Texture2D;

function Start () {
//Camera.main.transform.RotateAround(centerOfGame,Vector3.forward,-35);
//Camera.main.transform.RotateAround(centerOfGame,new Vector3(1,1,0),10);
gameIsWon = false;
dummyObject = GameObject.CreatePrimitive(PrimitiveType.Cube);
dummyObject.renderer.enabled=false;
loadBoard();
InitGUI();
audio.PlayOneShot(startGameSound,2.0f);
}

function InitPlayers(){


playerNames = new String[nrPlayers];
playerNames[0] = "Player A";
playerNames[1] = "Player B";


playerGates = new Vector2[nrPlayers];

playerCurrent = 0;

playerLinesX = new GameObject[nrPlayers];
playerLinesX[0] = lineXPrefabForPlayerA;
playerLinesX[1] = lineXPrefabForPlayerB;

playerLinesXY = new GameObject[nrPlayers];
playerLinesXY[0] = lineXYPrefabForPlayerA;
playerLinesXY[1] = lineXYPrefabForPlayerB;

playersLastPositionPrefab = new GameObject[nrPlayers];
playersLastPositionPrefab[0] = lastPositionPrefabForPlayerA;
playersLastPositionPrefab[1] = lastPositionPrefabForPlayerB;

playersGatePrefab = new GameObject[nrPlayers];
playersGatePrefab[0] = gateAPrefab;
playersGatePrefab[1] = gateBPrefab;
}

function InitGUI(){
playerName =  GameObject.Find("PlayerName");
messageGUI =  GameObject.Find("MessageGUI");

messageGUI.guiText.text = "";
setPlayerName();
}

function getLineObject(dx:int,dy:int,player:int) : GameObject{
	if (dx != 0 && dy != 0){
		return playerLinesXY[player];
	}
	return playerLinesX[player];
}

function tryMove(dx:int,dy:int): boolean{
	if (validMove(dx,dy)){
		var line = getLineObject(dx,dy,playerCurrent); 
		move(dx,dy,line);
		audio.PlayOneShot(doMoveSound,1.0f);
		return true;
	}
	audio.PlayOneShot(cantDoMoveSound,1.0f);
	return false;
}

static function checkIfGate(positionX:int, positionY:int):int{
	var i: int;
	for(i=0;i<nrPlayers;i++){
		if (playerGates[i].x == positionX && playerGates[i].y == positionY){
			return i;
		}
	}
	return -1;
}

static function validMoveTest1(newPositionX:int,newPositionY:int,dx:int,dy:int, lastX:int, lastY:int,prevX:int,prevY:int){
	/*
	Debug.Log("ValidMoveTest1");
	Debug.Log("newPosition: "+newPositionX+","+newPositionY);
	Debug.Log("dx: "+dx+","+dy);
	Debug.Log("lastPosition: "+lastX+","+lastY);
	Debug.Log("prevPosition: "+prevX+","+prevY);
	*/
	if (newPositionX >= minLimitX && newPositionX <= maxLimitX && newPositionY >= minLimitY && newPositionY <= maxLimitY){
		//Debug.Log("Check 1");
		var playerGate = checkIfGate(newPositionX,newPositionY);
		if ( playerGate == -1 || playerGate == playerCurrent) {
			//Debug.Log("Check 2");
			if (!gameboard[lastX,lastY].isLine(dx,dy) || gameboard[lastX+dx,lastY+dy].dot16 || gameboard[lastX,lastY].dot16){
				//Debug.Log("Check 3");
				if (true /*getNrOfLines(newPositionX,newPositionY) < 7 */){
					//Debug.Log("Check 4");
					if (checkWallCondition(newPositionX,newPositionY,lastX,lastY,prevX,prevY)){
						//Debug.Log("Check OK");
						
						return true;
					}
					else{
						messageGUI.guiText.text="Rule05. Can't move through walls.";
					}
				}
				else{
					messageGUI.guiText.text="Rule04. After this move there will be 8 lines...";
				}
			}
			else{
				messageGUI.guiText.text="Rule03. There is already a line.";
			}
		}
		else{
			messageGUI.guiText.text="Rule02. Can't move into other players gate.";
		}
	}
	else{
		messageGUI.guiText.text="Rule01. Move can't be outside of board limits.";
	}
	return false;
}

static function validMove(dx:int,dy:int): boolean{
	var validMove = false;
	
	if (!gameIsWon){
		var newPositionX = lastPositionX + dx;
		var newPositionY = lastPositionY + dy;
		
		if (validMoveTest1(newPositionX,newPositionY,dx,dy,lastPositionX,lastPositionY,prevPositionX,prevPositionY)){
			return true;
		}
	}
	return validMove;
}

static function checkWallCondition(x:int, y:int, lastX:int, lastY:int,prevX:int, prevY:int):boolean{
	if (gameboard[lastPositionX,lastPositionY].isWall){
		if (!(prevX == lastPositionX && prevY == lastPositionY)){
			return checkWallConditionCase1(x,y,lastX,lastY,prevX,prevY) && checkWallConditionCase2(x,y,lastX,lastY,prevX,prevY);
		}
	}
	return true;
}

static function checkWallConditionCase1(x:int, y:int,lastX:int, lastY:int,prevX:int, prevY:int){
	Debug.Log("Prev: "+prevX+","+prevY+" "+"Last: "+lastX+","+lastY+" Current:"+x+","+y);
	
	if (gameboard[lastX+1,lastY].isWall && gameboard[lastX-1,lastY].isWall){
		if (gameboard[lastX,lastY].getWallLine(1,0) != null ){
			if (gameboard[lastX,lastY].getWallLine(-1,0) != null){
				//Debug.Log("checkWallConditionCase1");
				return y == prevY;
			}
			
		}
	}
	return true;
}

static function checkWallConditionCase2(x:int, y:int,lastX:int, lastY:int,prevX:int, prevY:int){
	if (gameboard[lastX,lastY+1].isWall && gameboard[lastX,lastY-1].isWall){
	    if (gameboard[lastX,lastY].getWallLine(0,1) !=null){
	    	if (gameboard[lastX,lastY].getWallLine(0,-1) !=null){
	    		//Debug.Log("checkWallConditionCase2");
				return x == prevX;
	    	}
	    } 
	}
	return true;
}


static function checkIfCanMoveAfterMove(x:int,y:int):boolean{
		//Debug.Log("possible moves from "+x+","+y);
		var possibleMoves : int = 0;
		var i : int;
		var j : int;
		var xx : int;
		var yy : int;
		for(i=0;i<3;i++)
			for(j=0;j<3;j++){
				xx = i - 1;
				yy = j - 1; 
				if ( !(xx == 0 && yy == 0)){
					if (validMoveTest1(x+xx,y+yy,xx,yy,x,y,prevPositionX,prevPositionY)){
						possibleMoves++;
						Debug.Log("Can Move "+xx+","+yy);
					}
				}
			}
		
		//Debug.Log("Nr. of possible moves: "+possibleMoves);
		return possibleMoves > 0;
}


static function checkIfPlayerMustChange(){
	if (!playerCanMove() && !gameIsWon){
		changePlayer();
	}
}

static function changePlayer(){
	
	
	playerCurrent++;
	if (playerCurrent >= maxNrOfPlayers){
		playerCurrent = 0;
	}
	
	setPlayerName();	
} 

static function undoPlayer(){
	playerCurrent = undoLastPlayer;
	setPlayerName();
}

static function setPlayerName(){
	playerName.guiText.text = playerNames[playerCurrent];
}

static function getNextPlayer():int{
	var nextPlayer : int = playerCurrent + 1;
	if (nextPlayer >= maxNrOfPlayers){
		nextPlayer = 0;
	}
	
	return nextPlayer;
}

static function getNextMovePlayer():int{
	if (playerCanMove()){
		return playerCurrent;
	}
	else{
		return getNextPlayer();
	}
}

static function playerCanMove(): boolean{
	var nrLines = BoardLoader.gameboard[BoardLoader.lastPositionX,BoardLoader.lastPositionY].getNrLines();
	//Debug.Log(""+nrLines);
	return  nrLines > 1;
}

static function isInBoardLimits(x:int, y:int):boolean{
	if ( x >= minLimitX && y <= maxLimitX && y >= minLimitY && y <= maxLimitY ){
		return true;
	}
	return false;
}

static function undoMove(){
if (!gameIsWon && undoActivated == 0){
		undoActivated = 1;
		
		var dx = prevPositionX - lastPositionX;
		var dy = prevPositionY - lastPositionY;
		
		Debug.Log("PrevPos("+prevPositionX+","+prevPositionY+")"+" LastPos("+lastPositionX+","+lastPositionY+") dx:"+dx+" dy:"+dy);

		removeLineUnit(lastPositionX,lastPositionY,dx,dy);


		lastPositionX = prevPositionX;
		lastPositionY = prevPositionY;

		prevPositionX = undoPrevPositionX;
		prevPositionY = undoPrevPositionY;
		
		undoPlayer();
		
		setLastPosition(lastPositionX,lastPositionY);
	}
}

function move(dx:int,dy:int,linePrefab:GameObject)
{
		Debug.Log("Move dx: "+dx+" dy:"+dy);
		
		undoLastPlayer = playerCurrent;
		
		addLineUnit(lastPositionX,lastPositionY,dx,dy,linePrefab);
		
		checkFor16LinesInNeighbours(lastPositionX,lastPositionY);

		undoPrevPositionX = prevPositionX;
		undoPrevPositionY = prevPositionY;
		undoActivated = 0;

		prevPositionX = lastPositionX;
		prevPositionY = lastPositionY;
								
		lastPositionX = lastPositionX+dx;
		lastPositionY = lastPositionY+dy;
		
		if (!checkIfCanMoveAfterMove(lastPositionX,lastPositionY)){
			changePlayer();
			announceWinnder(playerCurrent);
		}

		var isPlayerGate:int = checkIfGate(lastPositionX,lastPositionY);

		if (isPlayerGate != -1 ){
			if (isPlayerGate == playerCurrent){
				announceWinnder(playerCurrent);
			}
		}

		checkIfPlayerMustChange();
				
		setLastPosition(lastPositionX,lastPositionY);
		
		messageGUI.guiText.text="";
		
		
}



function announceWinnder(winner:int){
	gameIsWon = true;
	
	playerName.guiText.text = "We have a winner! "+playerNames[playerCurrent];
	
	audio.PlayOneShot(endGameSound,1.0f);

}

static function addLineUnit(x1:int,y1:int,dx:int,dy:int,linePrefab:GameObject){
	var line : GameObject = addBaseLineUnit(x1,y1,dx,dy,linePrefab);
}

static function removeLineUnit(x:int,y:int,dx:int,dy:int){
	var gameObject = gameboard[x,y].getLineObject(dx,dy);
	gameObject.renderer.enabled = false;
	Destroy(gameObject);
	
	var gameObject1 = gameboard[x+dx,y+dy].getLineObject(-dx,-dy);
	gameObject1.renderer.enabled = false;
	Destroy(gameObject1);
	
	gameboard[x,y].setLineObject(dx,dy,null);
	gameboard[x+dx,y+dy].setLineObject(-dx,-dy,null);
	
	Debug.Log("Add line at "+x+","+y+" dx="+dx+" dy="+dy);
	Debug.Log("Add line at "+(x+dx)+","+(y+dy)+" dx="+(-dx)+" dy="+(-dy));
}

static function addBaseLineUnit(x1:int,y1:int,dx:int,dy:int,linePrefab:GameObject) : GameObject{
	var line : GameObject = Instantiate(linePrefab, Vector3((x1+dx/2.0f) * lineSize, (y1+dy/2.0f) * lineSize, 0), Quaternion.FromToRotation (Vector3(1,0,0), Vector3(dx,dy,0)));
	
	gameboard[x1,y1].setLineObject(dx,dy,line);
	gameboard[x1+dx,y1+dy].setLineObject(-dx,-dy,line);
	
	gameboard[x1,y1].setLine(dx,dy);
	gameboard[x1+dx,y1+dy].setLine(-dx,-dy);
	
	return line;
}

static function setLastPosition(x:int,y:int){
	if (lastPositionMarker != null){
		Destroy(lastPositionMarker);
	}
	
	lastPositionX = x;
	lastPositionY = y;

	lastPositionMarker= Instantiate(playersLastPositionPrefab[playerCurrent], Vector3(x * lineSize, y * lineSize, 0), Quaternion.identity);
	

}


	


function loadBoard() {

	var textData = Resources.Load("board01",TextAsset);
	
	var sr :StringReader;
	sr = new StringReader(textData.text);
 
	while (true) {
		var input:String;
		input = sr.ReadLine();
		
		if (input == null) { break; }
		
		Debug.Log(""+input);
		
		var tokens = input.Split(" "[0]);
	
		/*
		for(i=0;i<tokens.length;i++){
			Debug.Log(tokens[i]);
		}
		*/
		
		if (tokens[0] == "BoardLimitsX"){
			minLimitX = parseInt(tokens[1]);
			maxLimitX = parseInt(tokens[2]);
		}
		
		if (tokens[0] == "BoardLimitsY"){
			minLimitY = parseInt(tokens[1]);
			maxLimitY = parseInt(tokens[2]);
		}
		
		if (tokens[0] == "BoardSize"){
			initBoard(parseInt(tokens[1]),parseInt(tokens[2]));
		}
		
		if (tokens[0] == "Wall"){
			addWallLine(parseInt(tokens[1]),parseInt(tokens[2]),parseInt(tokens[3]),parseInt(tokens[4]));
		}
		
		if (tokens[0] == "Gate"){
			addGate(parseInt(tokens[1]),parseInt(tokens[2]),parseInt(tokens[3]));
		}
		
		if (tokens[0] == "LastPosition"){
			setLastPosition(parseInt(tokens[1]),parseInt(tokens[2]));
			prevPositionX=parseInt(tokens[1]);
			prevPositionY=parseInt(tokens[2]);
		}
		
		if (tokens[0] == "NrPlayers"){
			nrPlayers = parseInt(tokens[1]);
			InitPlayers();
		}
		
	}
	
}


function initBoard(x:int, y:int){
var i : int;
var j : int;
boardSizeX = x;
boardSizeY = y;

gameboard = new GameDot[x,y];

for(j=0;j<boardSizeY;j++)
	for(i=0;i<boardSizeX;i++){
		gameboard[i,j] = new GameDot();
		gameboard[i,j].dot = addDot(i,j);
		addCross(i,j);
	}

}



function addDot(x:int,y:int):GameObject{
	var instance : GameObject = Instantiate(dotPrefab, Vector3(x * lineSize, y * lineSize, 0), Quaternion.identity);
	instance.transform.localScale = Vector3(2,2,2);
	instance.renderer.material.SetColor("_Color",Color.gray);
    instance.renderer.material.color.a = 0.5f;
    instance.renderer.active = false;
    return instance;
	
}


function addCross(x:int,y:int):GameObject{
	var instance : GameObject = Instantiate(crossPrefab, Vector3(x * lineSize, y * lineSize, 0), Quaternion.identity);
	return instance;
}

function addGate(playerId:int,x:int,y:int){
		var instance : GameObject = Instantiate(playersGatePrefab[playerId], Vector3(x * lineSize, y * lineSize, 0), Quaternion.identity);
		playerGates[playerId].x = x;
		playerGates[playerId].y = y;
}


function addWallLine(x1:int,y1:int,x2:int,y2:int){

if (x1 == x2)
	{
		var i:int;
		for(i=y1;i<=y2;i++){
			addWallPoint(x1,i);
			if (i < y2){
			addWallLineUnit(x1,i,0,1);
			}
		}
	}

if (y1 == y2){
	for(i=x1;i<=x2;i++){
			addWallPoint(i,y1);
			if (i < x2){
				addWallLineUnit(i,y1,1,0);
			}
		}
	}
}


static function addWallLineUnit(x1:int,y1:int,dx:int,dy:int){
	gameboard[x1,y1].setLine(dx,dy);
	gameboard[x1+dx,y1+dy].setLine(-dx,-dy);

	gameboard[x1,y1].setWallLine(dx,dy);
	gameboard[x1+dx,y1+dy].setWallLine(-dx,-dy);
}

function addWallPoint(x:int,y:int){

	var dot : GameDot = gameboard[x,y];
	dot.isWall = true;
}

static function getNrPointWalls(x:int,y:int): int{
		var nrWalls : int = 0;
		var i : int;
		var j : int;
		
		for(i=0;i<3;i++)
			for(j=0;j<3;j++){
				if (gameboard[x+i-1,y+j-1].isWall){
					nrWalls++;
				}
			}
		
		return nrWalls;
	}
	
static function isPointWallInLine(x:int,y:int): boolean{
		var nrWalls : int = 0;
		var i : int;
		var j : int;
		
		for(i=0;i<3;i++)
			if (gameboard[x+i-1,y].isWall){
				nrWalls++;
			}
		
		if (nrWalls == 3){
			return true;
		}
	
		nrWalls = 0;
		for(i=0;i<3;i++)
			if (gameboard[x,y+i-1].isWall){
				nrWalls++;
			}
		
		if (nrWalls == 3){
			return true;
		}		
	
		return false;
	}	
	
static function getNrOfLines(x:int,y:int): int{
		var nrLines : int = 0;
		var i : int;
		var j : int;
		
		for(i=-1;i<2;i++)
			for(j=-1;j<2;j++){
				if (gameboard[x,y].isLine(i,j)){
					nrLines++;
				}
			}
		
		
		return nrLines;
	}	

static function getNrOfUniqueLines(x:int,y:int,xx:int,yy:int){
		var i : int;
		var j : int;
		 
		var tx : int;
		var ty : int;
		
		var o : GameObject;
		
		if (x >= 0 && x <= boardSizeX && y >= 0 && y <= boardSizeY){
			for(i=-1;i<2;i++)
				for(j=-1;j<2;j++){
					o = gameboard[x,y].getLineObject(i,j);
					if ( o != null){
						if (distance(x,y,xx,yy) < 2 && distance(x+i,y+j,xx,yy) < 2){
							if (!lineHashTable.ContainsKey(o)){
						  	lineHashTable.Add(o,"a");
						 	}
						}
					}
				}
		}
		

	}
	
static function distance( x1:int,y1:int,x2:int,y2:int):int{
	return Mathf.Sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) );
}	

static function getNrOfLinesInPointAndNeighbours(x:int,y:int): int{
		var i : int;
		var j : int;
		
		lineHashTable.Clear();
		
		for(i=-1;i<2;i++)
			for(j=-1;j<2;j++){
				getNrOfUniqueLines(x+i,y+j,x,y);
			}
		
		return lineHashTable.Count;
	}


function checkFor16LinesInNeighbours(x:int,y:int){
	var i:int;
	var j:int;
		
	for(i=-1;i<2;i++){
		for(j=-1;j<2;j++){
			var nrLines = getNrOfLinesInPointAndNeighbours(x+i,y+j);
			if ( nrLines >= 16 && numberOfNeighboursThatAre16(x+i,y+j) == 0 && !gameboard[x+i,y+j].isWall){
				gameboard[x+i,y+j].dot16 = true;
				gameboard[x+i,y+j].dot.renderer.active=true;
				gameboard[x+i,y+j].dot.renderer.material.SetColor("_Color",Color.yellow);
				audio.PlayOneShot(addESCPointSound,1.0f);
			}
		}
	}
}
	
static function numberOfNeighboursThatAre16(x:int,y:int){
	var i:int;
	var j:int;
	var count:int;
	count = 0;
	for(i=-1;i<2;i++)
		for(j=-1;j<2;j++){
			if (gameboard[x+i,y+j].dot16){
				count++;
			}
		}
	return count;		
}

function OnMouseDown() {
}

function OnMouseUp() {
}

function OnMouseEnter() {

}

function OnMouseExit() {
}

function Update () {
	
	
	  
	
	
	//updateMainCamera();
}

function getMoveUserInput(){
	if (!showResetDialog && !showExitDialog && !resetDialogCanceled && !exitDialogCanceled){
		for (var i = 0; i < Input.touchCount; ++i) {
	  	var touch = Input.GetTouch(i);
	    if (touch.phase == TouchPhase.Ended && (lastMoveTime+timeBetweenMoves)<Time.time) {
	    	lastMoveTime = Time.time;
	        var touchRay = Camera.current.ScreenPointToRay(Input.GetTouch(i).position);
	        var hit : RaycastHit;
	        if (Physics.Raycast(touchRay,hit,10000)){
	        	doMove(hit.point);
	      }    
	    }
	}
	
	
	
	if(Input.GetMouseButtonUp(0) && (lastMoveTime+timeBetweenMoves)<Time.time ){
		lastMoveTime = Time.time;
        var mouseRay : Ray = Camera.main.ScreenPointToRay (Input.mousePosition);
        if (Physics.Raycast (mouseRay,hit,10000)) {
            doMove(hit.point);
        }
    	}
	}
}

var centerOfGame = new Vector3(65,40,0);
var cameraUp = new Vector3(0,-1,0);

function updateMainCamera(){
	Camera.main.transform.LookAt(centerOfGame);
	
	
}



public class GameDot{

public static var DOT_EMPTY = 0; 

public static var DOT_PLAYER_MOVE = 3;

public static var DOT_PLAYER1_GATE = 1;

public static var DOT_PLAYER2_GATE = 2;

public var isWall : boolean;

public var state : int;

public var dot16 : boolean;

public var lineObjects : GameObject[,];

public var lines : boolean[,];

public var wallLines : boolean[,];

public var dot : GameObject;

	function GameDot(){
		state = DOT_EMPTY;
		isWall = false;
		lineObjects = new GameObject[3,3];
		lines = new boolean[3,3];
		wallLines = new boolean[3,3];
		dot16 = false;
		for(var x = 0;x<3;x++){
			for(var y = 0;y<3;y++){
				lines[x,y]=false;
				wallLines[x,y]=false;
			}
		}
	}
	
	public function setLineObject(dx:int,dy:int,line:GameObject){
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			lineObjects[dx+1,dy+1] = line;
		}
	}
	
	public function getLineObject(dx:int,dy:int): GameObject{
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			return lineObjects[dx+1,dy+1];
		}
		return null;
	}
	
	public function setLine(dx:int,dy:int){
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			lines[dx+1,dy+1] = true;
		}
	}
	
	public function isLine(dx:int,dy:int): boolean{
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			return lines[dx+1,dy+1];
		}
		return false;
	}
	
	public function setWallLine(dx:int,dy:int){
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			wallLines[dx+1,dy+1] = true;
		}
	}
	
	public function getWallLine(dx:int,dy:int): boolean{
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			return wallLines[dx+1,dy+1];
		}
		return false;
	}
	
	
	
	public function getNrLines(): int{
		var nrLines : int = 0;
		var i:int;
		var j:int;
		
		for(i=0;i<3;i++)
			for(j=0;j<3;j++){
				if (lines[i,j]){
					nrLines++;
				}
			}
		
		return nrLines;
	}
	
	

}

/* Example level loader */

function OnGUI () {



	// Make a background box
	GUI.Box (Rect (Screen.width-110,10,100,120), "Menu");

	GUI.enabled = true;


	// Make the first button. If it is pressed, Application.Loadlevel (1) will be executed
	if (GUI.Button (Rect (Screen.width-100,40,80,20), "Reset")) {
		if (!showResetDialog){
			showResetDialog = true;
		}
	}

	if (showResetDialog){
		
		GUI.enabled = true;
		GUI.Window(1, new Rect(Screen.width/2-150,Screen.height/2-100,300,200), DrawResetGameConfirmationWindow, "Confirmation Dialog");
	}

	// Make the second button.
	if (GUI.Button (Rect (Screen.width-100,70,80,20), "Undo")) {
		 undoMove();
	}
	
		// Make the second button.
	if (GUI.Button (Rect (Screen.width-100,100,80,20), "Exit")) {
		if (!showExitDialog){
			showExitDialog = true;
		}
	}
	
	if (showExitDialog){
		
		GUI.enabled = true;
		GUI.Window(1, new Rect(Screen.width/2-150,Screen.height/2-100,300,200), DrawExitGameConfirmationWindow, "Confirmation Dialog");
	}
	
	
	var controlBox_x = 30;
	var controlBox_y = 10;
	
	// Make a background box
	GUI.Box (Rect (controlBox_x,controlBox_y,105,140), "Controls");

	if (GUI.Button (Rect (controlBox_x+38,controlBox_y+30,30,30), controlButtonUp)) {
		Camera.main.transform.position += Vector3.up * 200 * Time.deltaTime;
		if (Camera.main.transform.position.y > 60){
			Camera.main.transform.position.y = 60;
		}
	}

	if (GUI.Button (Rect (controlBox_x+38,controlBox_y+100,30,30), controlButtonDown)) {
		Camera.main.transform.position += Vector3.down * 200 * Time.deltaTime;
		if (Camera.main.transform.position.y < 0){
			Camera.main.transform.position.y = 0;
		}
	}
	
	if (GUI.Button (Rect (controlBox_x+5,controlBox_y+65,30,30), controlButtonLeft)) {
		Camera.main.transform.position += Vector3.left * 200 * Time.deltaTime;
		if (Camera.main.transform.position.x < 45){
			Camera.main.transform.position.x = 45;
		}
	}

	if (GUI.Button (Rect (controlBox_x+70,controlBox_y+65,30,30), controlButtonRight)) {
		Camera.main.transform.position += Vector3.right * 200 * Time.deltaTime;
		if (Camera.main.transform.position.x > 85){
			Camera.main.transform.position.x = 85;
		}
	}
	
	if (GUI.Button (Rect (controlBox_x+38,controlBox_y+65,30,30), controlButtonReset)) {
		Camera.main.transform.position.x = 60;
		Camera.main.transform.position.y = 20;
		Camera.main.transform.position.z = -60;
		
	}
	
	getMoveUserInput();
	resetDialogCanceled = false;
	exitDialogCanceled = false;
}


function doMove(fromPosition:Vector3){
    var dx:int;
    var dy:int;

	var minDistance:float;
	var minDx = 3;
	var minDy = 3;
	minDistance = 1000.0f;
	
  for(dy=-1;dy<=1;dy++){
	for(dx=-1;dx<=1;dx++){
	
		if (!(dx == 0 && dy ==0)){
   		  var possibleNewPos = Vector3((BoardLoader.lastPositionX+dx)*BoardLoader.lineSize,(BoardLoader.lastPositionY+dy)*BoardLoader.lineSize,0);
	  
		  var dist = Vector3.Distance(possibleNewPos, fromPosition);
	
		  if (dist < minDistance ){
		  	minDistance = dist;
		  	minDx = dx;
		  	minDy = dy;
		  }
		}
	}
  }
  
  Debug.Log("MinDist: "+minDistance+" direction=("+minDx+","+minDy+")");

    
	if (minDistance < (BoardLoader.lineSize))
	 {
		tryMove(minDx,minDy);
	 }
	  else{
	    Debug.Log("Dist "+dist);
	}


  

}


function DrawResetGameConfirmationWindow(windowId:int) {
	var windowRect = new Rect(30,70,280,200);

    GUI.Label(windowRect,"Do you want to reset the current game?");
    
    if(GUI.Button(new Rect(20, 140,100,40),"Yes")) {
       showResetDialog = false;
       Application.LoadLevel (0);
    }
    if(GUI.Button(new Rect(180, 140,100,40),"No")) {
       showResetDialog = false;
       resetDialogCanceled = true;
    }
    
    GUI.DragWindow();
    GUI.BringWindowToFront(windowId);
 }
 
 function DrawExitGameConfirmationWindow(windowId:int) {
	var windowRect = new Rect(30,70,280,200);

    GUI.Label(windowRect,"Do you want to exit the game?");
    
    if(GUI.Button(new Rect(20, 140,100,40),"Yes")) {
       showExitDialog = false;
       Application.Quit();
    }
    if(GUI.Button(new Rect(180, 140,100,40),"No")) {
       showExitDialog = false;
       exitDialogCanceled = true;
    }
    
    GUI.DragWindow();
    GUI.BringWindowToFront(windowId);
 }
