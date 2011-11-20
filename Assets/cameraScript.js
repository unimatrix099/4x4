
function Update () {
}


static var lineMaterial : Material;

static function CreateLineMaterial() {
    if( !lineMaterial ) {
        lineMaterial = new Material( "Shader \"Lines/Colored Blended\" {" +
            "SubShader { Pass { " +
            "    Blend SrcAlpha OneMinusSrcAlpha " +
            "    ZWrite Off Cull Off Fog { Mode Off } " +
            "    BindChannels {" +
            "      Bind \"vertex\", vertex Bind \"color\", color }" +
            "} } }" );
        lineMaterial.hideFlags = HideFlags.HideAndDontSave;
        lineMaterial.shader.hideFlags = HideFlags.HideAndDontSave;
    }
}

function OnPostRender() {

    CreateLineMaterial();
    // set the current material
    lineMaterial.SetPass( 0 );

    GL.Begin( GL.LINES );
    GL.Color( Color(0.9,0.9,0.9,0.7) );

	var x:int;
	var y:int;
	var limit = 200;
	var lineLen = 2.0f;

	for(x=-limit;x<limit;x=x+10){
		for(y=-limit;y<limit;y=y+lineLen*2){
		 	GL.Vertex3( x, y-lineLen/2, 0 );
	    	GL.Vertex3( x, y+lineLen/2, 0 );
		}
   }
	
	for(y=-limit;y<limit;y=y+10){
		for(x=-limit;x<limit;x=x+lineLen*2){
		   	GL.Vertex3( x-lineLen/2, y, 0 );
		    GL.Vertex3( x+lineLen/2, y, 0 );
		}
 	}

	renderESCPointLines();

    GL.End();
} 

function renderESCPointLines(){
	var x:int;
	var y:int;
	var z:int;
	
	var limit = 2000;
	var lineLen = 2.0f;
	var lineSize = BoardLoader.lineSize;
	for(y=BoardLoader.minLimitY;y<=BoardLoader.maxLimitY;y++){
		for(x=BoardLoader.minLimitX;x<=BoardLoader.maxLimitX;x++){
			if (BoardLoader.gameboard[x,y].dot16){
				for(z=-limit;z<limit;z=z+lineLen*2){
		   			GL.Vertex3( x*lineSize, y*lineSize, z-lineLen/2 );
		    		GL.Vertex3( x*lineSize, y*lineSize, z+lineLen/2 );
				}
			}
		}
	}
}