Kinesin = {};

Kinesin.getRandomVector = function (length)
{
    var x = Math.random()*2 - 1;
    var y = Math.random()*2 - 1;
    var z = Math.random()*2 - 1;
    return new THREE.Vector3(x, y, z).multiplyScalar(length);
}

Kinesin.getRandomRotatedPosition = function (maxRotation, localPosition)
{
    // Generate a point on the spherical cap around the north pole
    var theta = this.degreesToRadians(maxRotation);
    var z = Math.cos(theta) + (1 - Math.cos(theta)) * Math.sqrt(1 - Math.pow(Math.random(), 2));
    var phi = Math.random() * 2 * Math.PI;
    
    var x = Math.sqrt(1 - Math.pow(z, 2)) * Math.cos(phi);
    var y = Math.sqrt(1 - Math.pow(z, 2)) * Math.sin(phi);
    var newDirection = new THREE.Vector3(x,y,z).normalize();
    
    // If the spherical cap is centered around the north pole, we're done
    var unitInitialDirection = new THREE.Vector3().copy( localPosition ).normalize();
    if (unitInitialDirection == new THREE.Vector3(0,0,1))
    {
        return newDirection;
    }
    
    // Find the rotation axis and rotation angle
    var rotationAxis = (new THREE.Vector3()).crossVectors(new THREE.Vector3(0,0,1), unitInitialDirection).normalize();
    var rotationAngle = Math.acos( (new THREE.Vector3(0,0,1)).dot(unitInitialDirection) );
    
    // Rotate new direction from north pole to initial direction
    newDirection.applyAxisAngle(rotationAxis, rotationAngle).normalize();
    return newDirection.multiplyScalar( localPosition.length() );
}

Kinesin.getRotatedPositionAwayFromOther = function (molecule, otherWorldPosition, rotationMultiplier)
{
    // Get world positions relative to parent
    var moleculeWorldPosition = this.getWorldPosition(molecule.geometry);
    var parentWorldPosition = (new THREE.Vector3()).setFromMatrixPosition(molecule.geometry.parent.matrixWorld);
    
    var moleculePositionRelativeToParent = (new THREE.Vector3()).subVectors(moleculeWorldPosition, parentWorldPosition);
    var otherPositionRelativeToParent = (new THREE.Vector3()).subVectors(otherWorldPosition, parentWorldPosition);
    
    // Find the rotation axis and rotation angle
    var rotationAxis = (new THREE.Vector3()).crossVectors(moleculePositionRelativeToParent, 
                                                          otherPositionRelativeToParent).normalize();
    var rotationAngle = Math.acos( (new THREE.Vector3()).dot(moleculePositionRelativeToParent, 
                                                             otherPositionRelativeToParent) );
    
    var newDirection = (new THREE.Vector3()).copy(moleculePositionRelativeToParent);
    newDirection.applyAxisAngle(rotationAxis, -rotationAngle * rotationMultiplier);
    var distanceFromParent = parentWorldPosition.distanceTo( moleculeWorldPosition );
    var newLocalPosition = newDirection.normalize().multiplyScalar( distanceFromParent / globalScale );
    
    return newLocalPosition;
}
    
Kinesin.degreesToRadians = function (degrees)
{
    return degrees * Math.PI / 180;
}
    
Kinesin.radiansToDegrees = function (radians)
{
    return radians * 180 / Math.PI;
}

Kinesin.addTestCube = function (position)
{
    var cube = new THREE.Mesh( new THREE.BoxGeometry( 10, 10, 5 ), 
                               new THREE.MeshBasicMaterial( {color: new THREE.Color( 1, 0, 1 )} ) );
    cube.position.copy( position );
    scene.add( cube );  
    return cube;
}

Kinesin.addTestSphere = function (position)
{
    var sphere = new THREE.Mesh( new THREE.SphereGeometry( 2, 32, 32 ), 
                                 new THREE.MeshBasicMaterial( {color: new THREE.Color( 1, 0, 1 )} ) );
    sphere.position.copy( position );
    scene.add( sphere );  
    return sphere;
}

Kinesin.getWorldScale = function (geometry)
{
    this.updateWorldMatrices(geometry);
    var worldScale = new THREE.Vector3(); 
    worldScale.setFromMatrixScale(geometry.matrixWorld);
    return worldScale;
}

Kinesin.getWorldPosition = function (geometry)
{
    this.updateWorldMatrices(geometry);
    return new THREE.Vector3().setFromMatrixPosition(geometry.matrixWorld);
}

Kinesin.updateWorldMatrices = function (geometry)
{
    var parent = geometry;
    while (parent.parent != null)
    {
        parent.updateMatrixWorld();
        parent = parent.parent;
    }
}

Kinesin.getRandomUnitRotationInShell = function ()
{
    var theta = Math.random() * Math.PI / 2;
    var phi = Math.random() * 2 * Math.PI;
    return new THREE.Vector3( Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta));
}

Kinesin.vectorToString = function (vector)
{
    return "(" + vector.x + ", " + vector.y + ", " + vector.z + ")";
}

Kinesin.getAxisForGeometry = function (geometry, axis)
{
    var quaternion = new THREE.Quaternion();

    geometry.updateMatrixWorld();
    geometry.matrixWorld.decompose( new THREE.Vector3(), quaternion, new THREE.Vector3() );

    return axis.applyQuaternion( quaternion );
}

Kinesin.doSomethingWithProbability = function (probability, something)
{
    var random = 100 * Math.random();
    if (random <= probability)
    {
        something();
        return true;
    }
    return false;
}

Kinesin.getRandomDirection = function ()
{
    var r = Math.random();
    if (r > 0.5)
    {
        return 1;
    }
    return -1;
}
