var mtRadius = 75;
var tubulinsPerTurn = 13;
var tubulinSize = 50;

var Microtubule = function ()
{
    this.removeOriginalGeometry();
    this.makeSpline();
    this.addTubulins();
}

Microtubule.prototype.removeOriginalGeometry = function ()
{
    scene.getObjectByName("MicrotubuleTubulins").visible = false;
    scene.children[1].remove( scene.getObjectByName("MicrotubuleTubulins") );
    scene.children[1].remove( scene.getObjectByName("MicrotubuleSpline") );
}

Microtubule.prototype.makeSpline = function ()
{
    this.spline = new BezierSpline([
        new THREE.Vector3( -1050, 50, 0 ),
        new THREE.Vector3( -50, -900, 0 ),
        new THREE.Vector3( 950, 970, 0 ),
        new THREE.Vector3( 1950, 50, 0 )]);
}

Microtubule.prototype.addTubulins = function ()
{
    this.tubulins = [];
    
    var length = this.spline.getLength();
    var t = 0;
    var tInc = (tubulinSize - 2) / length;
    var turns = 1 / tInc;
    var normal = this.spline.getNormal( 0 );
    for (var i = 0; i < turns; i++)
    {
        var axisPosition = this.spline.getPoint( t );
        var toNextAxisPosition = this.spline.getPoint( t + 2 * tInc ).sub( axisPosition );
        var type = (i % 2 === 1) ? 0 : 1;
        
        for (var j = 0; j < tubulinsPerTurn; j++)
        {
            var axialOffset = j / tubulinsPerTurn;
            var position = axisPosition.clone().add( 
                toNextAxisPosition.clone().multiplyScalar( axialOffset ) );
            var tangent = this.spline.getTangent( t + 2 * axialOffset * tInc );
            normal.applyAxisAngle( tangent, 2 * Math.PI / tubulinsPerTurn );
            var radialPosition = position.clone().add( normal.clone().multiplyScalar( mtRadius ) );
            var lookAxis = (new THREE.Vector3()).crossVectors( tangent, normal ).normalize();
            var lookTarget = radialPosition.clone().add( lookAxis );
            var n = i * j + j;
            
            this.tubulins[n] = new Tubulin( n, tubulinSize, radialPosition, lookTarget, normal, type );
        }
        
        t += tInc;
    }
}
