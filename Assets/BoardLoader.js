import System.IO;

var filePath = "/Resources/Boards/board01.txt";
var lines;
static var boardSizeX = 0;
static var boardSizeY = 0;
static var lineSize = 10;

static var minLimitX = 1;
static var maxLimitX = 1;
static var minLimitY = 1;
static var maxLimitY = 1;

var cameraZoom = 3;

static var playerName : GameObject;
static var messageGUI : GameObject;
var dotPrefab : GameObject;
var pointPrefab : GameObject;
var linePrefab : GameObject;
var wallPrefab : GameObject;
var gatePrefab : GameObject;
var mainCamera : GameObject;
var lastPositionPrefab : GameObject;

static var gameboard : GameDot[,];

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
static var playerColors : Color[];
static var playerGates : Vector2[];

static var gameIsWon = false;

static var lineHashTable : Hashtable = new Hashtable();

function Start () {
dummyObject = GameObject.CreatePrimitive(PrimitiveType.Cube);
loadBoard(filePath);
InitGUI();
}

function InitPlayers(){


playerNames = new String[nrPlayers];
playerNames[0] = "Player A";
playerNames[1] = "Player B";

playerColors = new Color[nrPlayers];
playerColors[0] = Color.red;
playerColors[1] = Color.blue;

playerGates = new Vector2[nrPlayers];

playerCurrent = 0;


}

function InitGUI(){
playerName =  GameObject.Find("PlayerName");
messageGUI =  GameObject.Find("MessageGUI");

messageGUI.guiText.text = "";
setPlayerName();
}

static function tryMove(dx:int,dy:int,linePrefab:GameObject,lastPositionPrefab:GameObject): boolean{
	if (validMove(dx,dy)){
		move(dx,dy,linePrefab,lastPositionPrefab);
		
		return true;
	}
	
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
	if (newPositionX >= minLimitX && newPositionX <= maxLimitX && newPositionY >= minLimitY && newPositionY <= maxLimitY){
		Debug.Log("Check 1");
		var playerGate = checkIfGate(newPositionX,newPositionY);
		if ( playerGate == -1 || playerGate == playerCurrent) {
			Debug.Log("Check 2");
			if (gameboard[lastX,lastY].getLine(dx,dy) == null){
				Debug.Log("Check 3");
				if (getNrOfLines(newPositionX,newPositionY) < 7){
					Debug.Log("Check 4");
					if (checkWallCondition(newPositionX,newPositionY,lastX,lastY,prevX,prevY)){
						Debug.Log("Check OK");
						
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
			if (gameboard[lastPositionX,lastPositionY].getLine(dx,dy) == null){
				addDummyBaseLineUnit(lastPositionX,lastPositionY,dx,dy);
			}
			
			if (checkIfCanMoveAfterMove(newPositionX,newPositionY)){
				validMove = true;
			}
			else{
				messageGUI.guiText.text="Rule06. After this move, there are no more moves.";
			}
			
			if (gameboard[lastPositionX,lastPositionY].getLine(dx,dy) == dummyObject){
				removeDummyBaseLineUnit(lastPositionX,lastPositionY,dx,dy);
			}
		}
	}
	return validMove;
}

static function checkWallCondition(x:int, y:int, lastX:int, lastY:int,prevX:int, prevY:int):boolean{
	if (gameboard[lastPositionX,lastPositionY].isWall){
		if (!(prevX == lastPositionX && prevY == lastPositionY)){
			return checkWallConditionCase1(x,y,lastX,lastY,prevX,prevY) && checkWallConditionCase2(x,y,lastX,lastY,prevX,prevY) && checkWallConditionCase3(x,y,lastX,lastY,prevX,prevY);
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

static function checkWallConditionCase3(x:int, y:int,lastX:int, lastY:int,prevX:int, prevY:int){
	return true;
	/*
	if (gameboard[lastX+1,lastY+1].isWall && gameboard[lastX,lastY].getLine(1,1) != null)
		if (gameboard[lastX-1,lastY-1].isWall && gameboard[lastX,lastY].getLine(-1,-1) != null){
			if (prevX <= lastX && prevY <= lastY){
				if (x <= lastX && y <=lastY){
					return true;
				}
				else{
					return false;
				}
			}
			if (prevX >= lastX && prevY >= lastY){
				if (x >= lastX && y >=lastY){
					return true;
				}
				else{
					return false;
				}
			}
		} 
	if (gameboard[lastX-1,lastY+1].isWall && gameboard[lastX,lastY].getLine(-1,1) != null)
		if (gameboard[lastX+1,lastY-1].isWall && gameboard[lastX,lastY].getLine(1,-1) != null){
			if (prevX <= lastX && prevY <= lastY){
				if (x <= lastX && y <=lastY){
					return true;
				}
				else{
					return false;
				}
			}
			if (prevX >= lastX && prevY >= lastY){
				if (x >= lastX && y >=lastY){
					return true;
				}
				else{
					return false;
				}
			}
		}

	return true;*/
}


static function checkIfCanMoveAfterMove(x:int,y:int):boolean{
		//Debug.Log("possible moves from "+x+","+y);
		var possibleMoves : int = 0;
		var i;
		var j;
		var xx;
		var yy;
		for(i=0;i<3;i++)
			for(j=0;j<3;j++){
				xx = i - 1;
				yy = j - 1; 
				if ( !(xx == 0 && yy == 0)){
					//Debug.Log("Check move "+xx+","+yy);
					if (validMoveTest1(x+xx,y+yy,xx,yy,x,y,lastPositionX,lastPositionY)){
						possibleMoves++;
						Debug.Log("Can Move "+xx+","+yy);
					}
				}
			}
		
		Debug.Log("Nr. of possible moves: "+possibleMoves);
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


static function move(dx:int,dy:int,linePrefab:GameObject,lastPosPrefab:GameObject)
{
		addLineUnit(lastPositionX,lastPositionY,dx,dy,linePrefab);

		checkFor16LinesInNeighbours(lastPositionX,lastPositionY);

		prevPositionX = lastPositionX;
		prevPositionY = lastPositionY;
								
		lastPositionX = lastPositionX+dx;
		lastPositionY = lastPositionY+dy;

	
		var isPlayerGate:int = checkIfGate(lastPositionX,lastPositionY);

		if (isPlayerGate != -1 ){
			if (isPlayerGate == playerCurrent){
				announceWinnder(playerCurrent);
			}
		}

		checkIfPlayerMustChange();
				
		setLastPosition(lastPositionX,lastPositionY,lastPosPrefab);
		
		messageGUI.guiText.text="";
}

static function announceWinnder(winner:int){
	gameIsWon = true;
	
	playerName.guiText.text = "We have a winner! "+playerNames[playerCurrent];

}

static function addLineUnit(x1:int,y1:int,dx:int,dy:int,linePrefab:GameObject){
	var line : GameObject = addBaseLineUnit(x1,y1,dx,dy,linePrefab);
	line.renderer.material.SetColor("_Color",playerColors[playerCurrent]);
}

static function addBaseLineUnit(x1:int,y1:int,dx:int,dy:int,linePrefab:GameObject) : GameObject{
	var line : GameObject = Instantiate(linePrefab, Vector3((x1+dx/2.0f) * lineSize, (y1+dy/2.0f) * lineSize, 0), Quaternion.FromToRotation (Vector3(1,0,0), Vector3(dx,dy,0)));
	if (dx != 0 && dy != 0){
		line.transform.localScale = Vector3(1.5f * lineSize ,1.0f,1.0f);
	}
	
	gameboard[x1,y1].setLine(dx,dy,line);
	gameboard[x1+dx,y1+dy].setLine(-dx,-dy,line);
	return line;
}

static function addDummyBaseLineUnit(x1:int,y1:int,dx:int,dy:int){
	gameboard[x1,y1].setLine(dx,dy,dummyObject);
	gameboard[x1+dx,y1+dy].setLine(-dx,-dy,dummyObject);
}

static function removeDummyBaseLineUnit(x1:int,y1:int,dx:int,dy:int){
	gameboard[x1,y1].setLine(dx,dy,dummyObject);
	gameboard[x1+dx,y1+dy].setLine(-dx,-dy,dummyObject);
}


static function setLastPosition(x:int,y:int,lastPositionPrefab:GameObject){
	if (lastPositionMarker != null){
		Destroy(lastPositionMarker);
	}
	
	lastPositionX = x;
	lastPositionY = y;

	lastPositionMarker= Instantiate(lastPositionPrefab, Vector3(x * lineSize, y * lineSize, 0), Quaternion.identity);
	lastPositionMarker.renderer.material.SetColor("_Color",playerColors[playerCurrent]);
    lastPositionMarker.renderer.material.color.a = 0.5f;
	lastPositionMarker.transform.localScale = Vector3(lineSize/3.0f,lineSize/3.0f,1);
	
	
	



}



function loadBoard(filepathIncludingFileName : String) {
	sr = new File.OpenText(Application.dataPath+filepathIncludingFileName);
	input = "";
	while (true) {
		input = sr.ReadLine();
		
		if (input == null) { break; }
		
		//Debug.Log(""+input);
		
		tokens = input.Split(" "[0]);
	
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
			setLastPosition(parseInt(tokens[1]),parseInt(tokens[2]),lastPositionPrefab);
			prevPositionX=parseInt(tokens[1]);
			prevPositionY=parseInt(tokens[2]);
		}
		
		if (tokens[0] == "NrPlayers"){
			nrPlayers = parseInt(tokens[1]);
			InitPlayers();
		}
		
	}
	sr.Close();
}


function initBoard(x:int, y:int){
var i;
var j;
boardSizeX = x;
boardSizeY = y;

//mainCamera.transform.position = Vector3(x/2.0f * cameraZoom,y/2.0f * cameraZoom, -(x+y)*cameraZoom);

gameboard = new GameDot[x,y];

for(j=0;j<boardSizeY;j++)
	for(i=0;i<boardSizeX;i++){
		gameboard[i,j] = new GameDot();
		gameboard[i,j].dot = addDot(i,j);
	}

}


function addDot(x:int,y:int):GameObject{
	var instance : GameObject = Instantiate(dotPrefab, Vector3(x * lineSize, y * lineSize, 0), Quaternion.identity);
	instance.transform.localScale = Vector3(2,2,2);
	instance.renderer.material.SetColor("_Color",Color.gray);
    instance.renderer.material.color.a = 0.5f;
    return instance;
	
}

function addGate(playerId:int,x:int,y:int){
		var instance : GameObject = Instantiate(gatePrefab, Vector3(x * lineSize, y * lineSize, 0), Quaternion.identity);
		instance.renderer.material.SetColor ("_Color", playerColors[playerId]);
		playerGates[playerId].x = x;
		playerGates[playerId].y = y;
}


function addWallLine(x1:int,y1:int,x2:int,y2:int){

if (x1 == x2)
	{
		for(i=y1;i<=y2;i++){
			addWallPoint(x1,i);
			if (i < y2){
			addWallLineUnit(x1,i,0,1,wallPrefab);
			}
		}
	}

if (y1 == y2){
	for(i=x1;i<=x2;i++){
			addWallPoint(i,y1);
			if (i < x2){
				addWallLineUnit(i,y1,1,0,wallPrefab);
			}
		}
	}
}


static function addWallLineUnit(x1:int,y1:int,dx:int,dy:int,wallPrefab:GameObject){
	var wallLine : GameObject = addBaseLineUnit(x1,y1,dx,dy,wallPrefab);
//	wallLine.renderer.material.SetColor("_Color", Color.black);
	gameboard[x1,y1].setWallLine(dx,dy,wallLine);
	gameboard[x1+dx,y1+dy].setWallLine(-dx,-dy,wallLine);
}

function addWallPoint(x:int,y:int){

	var dot : GameDot = gameboard[x,y];
	dot.isWall = true;
}

static function getNrPointWalls(x:int,y:int): int{
		var nrWalls : int = 0;
		var i;
		var j;
		
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
		var i;
		var j;
		
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
		var i;
		var j;
		
		for(i=-1;i<2;i++)
			for(j=-1;j<2;j++){
				if (gameboard[x,y].getLine(i,j) != null){
					nrLines++;
				}
			}
		
		
		return nrLines;
	}	

static function getNrOfUniqueLines(x:int,y:int,xx:int,yy:int){
		var i;
		var j;
		
		var tx;
		var ty;
		
		var o : GameObject;
		
		if (x >= 0 && x <= boardSizeX && y >= 0 && y <= boardSizeY){
			for(i=-1;i<2;i++)
				for(j=-1;j<2;j++){
					o = gameboard[x,y].getLine(i,j);
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
		var i;
		var j;
		
		lineHashTable.Clear();
		
		for(i=-1;i<2;i++)
			for(j=-1;j<2;j++){
				getNrOfUniqueLines(x+i,y+j,x,y);
			}
		
		return lineHashTable.Count;
	}


static function checkFor16LinesInNeighbours(x:int,y:int){
		var i;
		var j;
		
		for(i=-1;i<2;i++)
			for(j=-1;j<2;j++){
				var nrLines = getNrOfLinesInPointAndNeighbours(x+i,y+j);
				if ( nrLines >= 16){
					gameboard[x+i,y+j].dot.renderer.material.SetColor("_Color",Color.yellow);
				}
			}

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


}

public class GameDot{

public static var DOT_EMPTY = 0; 

public static var DOT_PLAYER_MOVE = 3;

public static var DOT_PLAYER1_GATE = 1;

public static var DOT_PLAYER2_GATE = 2;

public var isWall : boolean;

public var state : int;

public var lines : GameObject[,];

public var wallLines : GameObject[,];

public var dot : GameObject;

	function GameDot(){
		state = DOT_EMPTY;
		isWall = false;
		lines = new GameObject[3,3];
		wallLines = new GameObject[3,3];
	}
	
	public function setLine(dx:int,dy:int,line:GameObject){
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			lines[dx+1,dy+1] = line;
		}
	}
	
	public function getLine(dx:int,dy:int): GameObject{
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			return lines[dx+1,dy+1];
		}
		return null;
	}
	
	public function setWallLine(dx:int,dy:int,line:GameObject){
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			wallLines[dx+1,dy+1] = line;
		}
	}
	
	public function getWallLine(dx:int,dy:int): GameObject{
		if (dx >= -1 && dx <=1 && dy>= -1 && dy<= 1){
			return wallLines[dx+1,dy+1];
		}
		return null;
	}
	
	
	
	public function getNrLines(): int{
		var nrLines : int = 0;
		var i;
		var j;
		
		for(i=0;i<3;i++)
			for(j=0;j<3;j++){
				if (lines[i,j] != null){
					nrLines++;
				}
			}
		
		return nrLines;
	}
	
	

}
