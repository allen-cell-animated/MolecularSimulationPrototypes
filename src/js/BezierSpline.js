var BezierSpline = function (points)
{
    this.makeCurve(points);
}

BezierSpline.prototype.makeCurve = function (points)
{
    this.curve = new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3]);
}

BezierSpline.prototype.drawLine = function (points)
{
    curveGeometry = new THREE.Geometry();
    curveGeometry.vertices = this.curve.getPoints( 50 );
    curveMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    curveLine = new THREE.Line( curveGeometry, curveMaterial );
    scene.add(curveLine);
}

BezierSpline.prototype.getLength = function (t)
{
    return this.curve.getLength();
}

BezierSpline.prototype.getPoint = function (t)
{
    return this.curve.getPoint(t);
}

BezierSpline.prototype.getTangent = function (t)
{
    var v0 = this.curve.v0, v1 = this.curve.v1, v2 = this.curve.v2, v3 = this.curve.v3;

    return new THREE.Vector3(
        BezierSpline.cubicBezierTangent( t, v0.x, v1.x, v2.x, v3.x ),
        BezierSpline.cubicBezierTangent( t, v0.y, v1.y, v2.y, v3.y ),
        BezierSpline.cubicBezierTangent( t, v0.z, v1.z, v2.z, v3.z )
    ).normalize();
}

BezierSpline.prototype.getNormal = function (t)
{
    var inc = 0.001;
    if (t >= 1)
    {
        inc *= -1;
    }
    var tangentInc = this.getTangent(t + inc);
    var incDifference = (new THREE.Vector3()).subVectors(this.getPoint(t), this.getPoint(t + inc));
    tangentInc = (new THREE.Vector3()).subVectors(tangentInc, incDifference);
    
    var tangent = this.getTangent(t);
    
    return (new THREE.Vector3()).crossVectors(tangent, tangentInc).normalize();
}

BezierSpline.prototype.getTForClosestPoint = function (point)
{
    var t = this.findClosest( point, 0, 1, 10 );
    return t;
}

BezierSpline.prototype.findClosest = function (point, t1, t2, iterations)
{
    var distance = [point.distanceTo( this.getPoint( t1 ) ), point.distanceTo( this.getPoint( t2 ) )];
    var middle = (t1 + t2) / 2;
    if (distance[0] > distance[1])
    {
        if (iterations > 0)
        {
            return this.findClosest( point, middle, t2, iterations - 1 );
        }
        return t2;
    }
    else
    {
        if (iterations > 0)
        {
            return this.findClosest( point, t1, middle, iterations - 1 );
        }
        return t1;
    }
}

BezierSpline.cubicBezierTangent = function (t, p0, p1, p2, p3)
{
    return this.cubicBezierTangent_P0P1( t, p0, p1 ) 
         + this.cubicBezierTangent_P1P2( t, p1, p2 ) 
         + this.cubicBezierTangent_P2P3( t, p2, p3 );
}

BezierSpline.cubicBezierTangent_P0P1 = function (t, p0, p1)
{
    return 3 * (1 - t) * (1 - t) * (p1 - p0);
}

BezierSpline.cubicBezierTangent_P1P2 = function (t, p1, p2)
{
    return 6 * (1 - t) * t * (p2 - p1);
}

BezierSpline.cubicBezierTangent_P2P3 = function (t, p2, p3)
{
    return 3 * t * t * (p3 - p2);
}
