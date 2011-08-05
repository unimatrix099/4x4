//
var pointPrefab : GameObject;
var linePrefab : GameObject;
var lastPositionPrefab : GameObject;

function OnMouseDown() {

  var lastPos = Vector3(BoardLoader.lastPositionX*BoardLoader.lineSize,BoardLoader.lastPositionY*BoardLoader.lineSize,0);

  var dist = Vector3.Distance(lastPos, transform.position);
  
	if (dist < (BoardLoader.lineSize * 1.5f))
	 {
		var direction = transform.position - lastPos;
		
		direction.x = direction.x / 10;
		direction.y = direction.y / 10;
		direction.z = direction.z / 10;
		
		//Debug.Log("Direction  "+direction.x+" "+direction.y+" "+direction.z);
				
		var dx = 0;
		var dy = 0;
		
		if (direction.normalized.x > 0){
			dx += 1;
		}
		
		if (direction.normalized.x < 0){
			dx -= 1;
		}
		
		if (direction.normalized.y > 0){
			dy += 1;
		}
				
		if (direction.normalized.y < 0){
			dy -= 1;
		}
		

		BoardLoader.tryMove(dx,dy,linePrefab,lastPositionPrefab);
		
	  }
	  else{
	    Debug.Log("Dist "+dist);
	}


}





function OnMouseUp() {

}

function OnMouseEnter() {

}

function OnMouseExit() {
}


function Update () {
}




