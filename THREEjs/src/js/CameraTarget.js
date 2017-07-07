var maxDistancePerFrame = 0.5;

var CameraTarget = function (objectToFollow)
{
    this.objectToFollow = objectToFollow;
    
    this.target = new THREE.Mesh(
        new THREE.SphereGeometry( 10, 2, 2 ),
        new THREE.MeshBasicMaterial( {color: new THREE.Color(0,0,0)} )
    );
    scene.add( this.target );
    
    this.target.material.transparent = true;
    this.target.material.opacity = 0;
    
    this.target.position.copy( this.objectToFollow.position );
}

CameraTarget.prototype.update = function ()
{
    var direction = this.objectToFollow.position.clone().sub( this.target.position ).normalize();
    
    this.target.position.add( direction.multiplyScalar( maxDistancePerFrame ) );
}