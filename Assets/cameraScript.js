
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
    GL.Color( Color(0.7,0.7,0.7,0.5) );

	var x:int;
	var y:int;
	var limit = 200;

	for(x=-limit;x<limit;x=x+10){
    	GL.Vertex3( x, -limit, 0 );
	    GL.Vertex3( x, limit, 0 );
	}
	
	for(y=-limit;y<limit;y=y+10){
    	GL.Vertex3( -limit, y, 0 );
	    GL.Vertex3( limit, y, 0 );
	}

    GL.End();
} 