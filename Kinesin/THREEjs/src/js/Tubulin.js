var colors = [new THREE.Color( 0, 1, 1 ),
              new THREE.Color( 0.54, 0.17, 0.88 )];

function Tubulin (index, size, position, target, normal, type)
{
    this.type = type;
    this.makeCollider( index, size, position, target, normal );
    
    Molecule.call( this );
}

Tubulin.prototype = Object.create(Molecule.prototype);
Tubulin.prototype.constructor = Tubulin;

Tubulin.prototype.makeCollider = function (index, size, position, target, normal)
{
    this.collider = new Physijs.BoxMesh( new THREE.BoxGeometry( size, size, size ), 
                                         new THREE.MeshLambertMaterial( {color: colors[this.type]} ), 
                                         0 );
    
    this.collider.position.copy( position.add( Kinesin.getRandomVector( 0.02 ) ) );
    this.collider.__dirtyPosition = true;
    
    this.collider.up.copy( normal );
    this.collider.lookAt( target );
    this.collider.__dirtyRotation = true;
    
    scene.add( this.collider );
    
    this.collider.name = "tubulin" + index;
    this.collider.tubulin = this;
    
    if (this.type == 0)
    {
        this.collider.addEventListener( 'collision', function( otherObject, linearVelocity, angularVelocity ) {
            this.tubulin.onCollision( otherObject, linearVelocity, angularVelocity );
        });
    }
}

Tubulin.prototype.onCollision = function (otherObject, linearVelocity, angularVelocity)
{
    if (otherObject.molecule instanceof Motor)
    {        
        var normal = this.getAxis( new THREE.Vector3(0,1,0) );
        var tangent = this.getAxis( new THREE.Vector3(1,0,0) );
        var sideways = this.getAxis( new THREE.Vector3(0,0,1) );
        
        var bindingPosition = this.collider.position.clone();
        bindingPosition.add( normal.clone().multiplyScalar( 30 ) );
        bindingPosition.add( tangent.clone().multiplyScalar( -20.5 ) );
        bindingPosition.add( sideways.clone().multiplyScalar( 8 ) );
        
        otherObject.molecule.bindToMT( bindingPosition, tangent, normal, sideways );
    }
}
