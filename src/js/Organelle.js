var organelleDirection = new THREE.Vector3(0, 1, 0);

function Organelle ()
{
    this.makeCollider();
    
    Molecule.call( this );
}

Organelle.prototype = Object.create(Molecule.prototype);
Organelle.prototype.constructor = Organelle;

Organelle.prototype.makeCollider = function ()
{
    var stalk = this.makeStalk();
    
    this.collider = new Physijs.SphereMesh(
        new THREE.SphereGeometry( organelleRadius, 32, 32 ), 
        Physijs.createMaterial( new THREE.MeshLambertMaterial( {color: new THREE.Color( 1, 1, 1 )} ), 0, 0),
        organelleMass
    );
    
    this.collider.position.copy( stalk.position.clone().add( 
        organelleDirection.normalize().multiplyScalar( organelleRadius ) ) );
    this.collider.__dirtyPosition = true;
    
    scene.add( this.collider );
    
    this.collider.material.transparent = true;
    this.collider.material.opacity = 0.5;
    
    this.collider.constraint = new Physijs.DOFConstraint(
        this.collider, stalk, stalk.position
    );
    scene.addConstraint( this.collider.constraint );
}

Organelle.prototype.makeStalk = function ()
{
    this.stalkSegments = [];
    var lastSegment = hips.collider;
    var direction = organelleDirection.multiplyScalar( stalkLength / stalkSegments );
    var position = hips.initialPosition.clone().add( direction );
    for (var i = 0; i < stalkSegments; i++)
    {
        this.stalkSegments[i] = this.makeStalkSegment( position, lastSegment );
        
        lastSegment = this.stalkSegments[i];
        position.add( direction );
    }
    
    return this.stalkSegments[this.stalkSegments.length - 1];
}

Organelle.prototype.makeStalkSegment = function (position, parent)
{
    var segment = new Physijs.SphereMesh(
        new THREE.SphereGeometry( 3, sphereResolution, sphereResolution ), 
        Physijs.createMaterial( new THREE.MeshLambertMaterial( {color: new THREE.Color( 0, 0, 0 )} ), 0, 0),
        stalkMass / stalkSegments
    );
    
    segment.position.copy( position );
    segment.__dirtyPosition = true;
    
    scene.add( segment );
    
    segment.constraint = new Physijs.DOFConstraint(
        segment, parent, parent.position
    );
    scene.addConstraint( segment.constraint );
    segment.constraint.setAngularLowerLimit( new THREE.Vector3(0,0,0) );
    segment.constraint.setAngularUpperLimit( new THREE.Vector3(0,0,0) );
    
    return segment;
}

Organelle.prototype.update = function ()
{
    this.applyFriction();
}

Organelle.prototype.updateMass = function ()
{
    this.collider.mass = organelleMass;
}

Organelle.prototype.updateStalkMass = function ()
{
    for (var i = 0; i < this.stalkSegments.length; i++)
    {
        this.stalkSegments[i].mass = stalkMass / stalkSegments;
    }
}

Organelle.prototype.clearStalkForces = function ()
{
    for (var segment = 0; segment < this.stalkSegments.length; segment++)
    {
        this.stalkSegments[segment].setAngularVelocity( zeroVector );
        this.stalkSegments[segment].setLinearVelocity( zeroVector );
    }
}