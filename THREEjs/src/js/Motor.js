// ---------------------------------- Initialize

function Motor (geometry, nucleotideGeometry, number)
{  
    this.number = number - 1;
    this.makeCollider( Kinesin.getWorldPosition(geometry) );
    
    Molecule.call( this );
    
    this.setupGeometry( geometry );
    this.makeNeckLinks();
    this.addLinkerConstraints();
    this.setState(Motor.State.Free);
    this.snapping = this.snapped = this.bound = false;
    
    this.nucleotide = new Nucleotide( nucleotideGeometry, this );
}

Motor.prototype = Object.create(Molecule.prototype);
Motor.prototype.constructor = Motor;

Motor.prototype.makeCollider = function (worldPosition)
{
    this.collider = new Physijs.SphereMesh( 
        new THREE.SphereGeometry( 4, sphereResolution, sphereResolution ), 
        Physijs.createMaterial( new THREE.MeshLambertMaterial( {color: new THREE.Color( 1, 1, 1 )} ), 0, 0),
        0.1
    );
    
    var subCollider1 = new Physijs.BoxMesh( 
        new THREE.BoxGeometry( 20, 30, 50 ), 
        Physijs.createMaterial( new THREE.MeshLambertMaterial( {color: new THREE.Color( 1, 1, 1 )} ), 0, 0),
        0.1
    );
    
    var subCollider2 = new Physijs.BoxMesh( 
        new THREE.BoxGeometry( 31, 20, 50 ), 
        Physijs.createMaterial( new THREE.MeshLambertMaterial( {color: new THREE.Color( 1, 1, 1 )} ), 0, 0),
        0.1
    );
    
    this.collider.position.copy( worldPosition );
    this.collider.__dirtyPosition = true;
    
    this.collider.rotation.setFromVector3( new THREE.Vector3( 0, Math.PI / 2, 0 ) );
    this.collider.__dirtyRotation = true;
    
    this.collider.material.transparent = true;
    this.collider.material.opacity = 0;
    
    this.collider.add( subCollider1 );
    
    subCollider1.position.copy( new THREE.Vector3(15,-10,20) );
    subCollider1.__dirtyPosition = true;
    
    subCollider1.material.transparent = true;
    subCollider1.material.opacity = 0;
    
    this.collider.add( subCollider2 );
    
    subCollider2.position.copy( new THREE.Vector3(10,-15,20) );
    subCollider2.__dirtyPosition = true;
    
    subCollider2.material.transparent = true;
    subCollider2.material.opacity = 0;
    
    scene.add( this.collider );
    
    this.collider.name = "motor" + (this.number + 1);
    this.collider.molecule = this;
    
    this.collider.setAngularFactor( new THREE.Vector3(0.2,0.2,0.2) );
    this.collider.setLinearFactor( new THREE.Vector3(0.2,0.2,0.2) );
    
    this.collider.addEventListener( 'collision', function( otherObject, linearVelocity, angularVelocity ) {
        this.molecule.onCollision( otherObject, linearVelocity, angularVelocity );
    });
}

Motor.prototype.setupGeometry = function (geometry)
{
    THREE.SceneUtils.detach( geometry, geometry.parent, scene );
    THREE.SceneUtils.attach( geometry, scene, this.collider );
    geometry.rotation.setFromVector3( new THREE.Vector3( 0, -Math.PI / 2, 0 ) );
    this.geometry = geometry;
    
    geometry.remove( scene.getObjectByName("NeckLinker" + (this.number + 1) ) );
}

Motor.prototype.makeNeckLinks = function ()
{      
    var hipsToMotor = (new THREE.Vector3()).subVectors( this.initialPosition, hips.initialPosition );
    this.linkersLength = hipsToMotor.length() * neckLinks / (neckLinks + 1);
    this.linkDiameter = this.linkersLength / neckLinks;
    hipsToMotor.normalize().multiplyScalar( this.linkDiameter );
    
    this.linkers = [];
    var position = hips.initialPosition.clone().add( hipsToMotor );
    for (var i = 0; i < neckLinks; i++)
    {
        this.linkers[i] = new NeckLinker( this, position, this.linkDiameter / 2, i );
        position.add( hipsToMotor );
    }
}

Motor.prototype.addLinkerConstraints = function ()
{
    var d = -1;
    var parent = this.collider;
    for (var i = neckLinks - 1; i >= 0; i--)
    {
        this.linkers[i].addConstraint( parent, [d * Math.PI / 3, 0, 1], [d * Math.PI / 3, 0, -1] );
        parent = this.linkers[i].collider;
        d = (i % 2 === 1) ? -1 : 1;
    }
    hips.addConstraint( parent, [d * Math.PI / 3, 0, 1], [d * Math.PI / 3, 0, -1] );
}

// ---------------------------------- Update

Motor.prototype.update = function ()
{
    if (!this.animate())
    {
        if (this.state === Motor.State.Free)
        {
            this.doFreeRandomMotion();
        }
        else if (this.state === Motor.State.Weak)
        {
            this.walkRandomly( 10 );
            this.fallOffIfEscaped();
            
            if (!this.nucleotide.isATP && this.hasTimePassedInState( 1 ))
            {
                if (!this.maybeEjectFromWeak())
                {
                    this.maybeStartATPBinding();
                }
            }
        }
        else if (this.state === Motor.State.Strong)
        {
            this.pullOffBackMotor();
            this.fallOffIfEscaped();
            this.hydrolyzeATPIfTime();
        }
    }
    this.nucleotide.animate();
    this.updateNeckLinkers();
}

Motor.prototype.doFreeRandomMotion = function ()
{
    if (Controller.randomForcesEnabled())
    {
        this.walkRandomly( motorWalkDistance );
        this.rotateRandomly();
    }
}

Motor.prototype.maybeEjectFromWeak = function ()
{
    var n = this.number;
    return Kinesin.doSomethingWithProbability(
        ejectFromWeakProbability, 
        function () {
            motors[n].eject();
        }
    );
}

Motor.prototype.maybeStartATPBinding = function ()
{
    var n = this.number;
    Kinesin.doSomethingWithProbability(
        atpBindingProbability[n], 
        function () {
            motors[n].nucleotide.startATPAnimation()
        }
    );
}

Motor.prototype.pullOffBackMotor = function ()
{
    if (this.isInFront() && this.otherMotor().state === Motor.State.Weak)
    {
        console.log(this.color() + " pulled off other motor");
        this.otherMotor().eject();
    }
}

Motor.prototype.fallOffIfEscaped = function ()
{
    if (this.collider.position.distanceTo(this.mtBindingPosition) > 30)
    {
        console.log(this.color() + " fell off while strong");
        this.unbindToMT();
    }
}

Motor.prototype.updateNeckLinkers = function ()
{
    for (var i = 0; i < this.linkers.length; i++)
    {
        this.linkers[i].update();
    }
}

// ---------------------------------- State

Motor.State = {
    Free : 0,
    Weak : 1,
    Strong : 2,
    Test : 3
}

Motor.prototype.setState = function (newState)
{
    this.state = newState;
    this.lastStateTime = (new Date()).getTime();
}

Motor.prototype.hasTimePassedInState = function (seconds)
{
    var now = (new Date()).getTime();
    var secondsPassed = (now - this.lastStateTime) / 1000;
    return (secondsPassed >= seconds);
}

// ---------------------------------- Binding

Motor.prototype.bindToMT = function (bindingPoint, tangent, normal, sideways)
{
    if (this.state === Motor.State.Free && this.positionIsWithinRange(bindingPoint) 
        && this.hasTimePassedInState( 1 ))
    {
        console.log(this.color() + " bind");
        this.setState(Motor.State.Weak);
        
        this.mtBindingPosition = bindingPoint;
        this.mtBindingTangent = tangent;
        this.mtBindingNormal = normal;
        this.mtBindingSideways = sideways;
        
        this.clearForces();
        this.freezeRotationFromPhysics();
        
        this.startAttracting( this.mtBindingPosition, motorBindingForce );
        this.startRotating( this.mtBindingTangent, this.mtBindingNormal, function () { this.addBindingConstraint() } );
        
        this.nucleotide.startADPAnimation();
    }
}

Motor.prototype.positionIsWithinRange = function (position)
{
    return position.distanceTo( hips.collider.position ) < 1.2 * this.linkersLength;
}

Motor.prototype.addBindingConstraint = function ()
{
    if (this.bound)
    {
        this.removeBindingConstraint();
    }
    
    this.attracting = false;
    
    this.bindingConstraint = new Physijs.DOFConstraint(
        this.collider,
        this.mtBindingPosition
    );
    scene.addConstraint( this.bindingConstraint );
    
    this.bindingConstraint.setLinearLowerLimit( zeroVector );
    this.bindingConstraint.setLinearUpperLimit( zeroVector );
    this.bindingConstraint.setAngularLowerLimit( zeroVector );
    this.bindingConstraint.setAngularUpperLimit( zeroVector );
    
    this.bound = true;
}

Motor.prototype.unbindToMT = function ()
{   
    this.setState( Motor.State.Free );
    
    this.unfreezeRotationFromPhysics();
    this.removeBindingConstraint();
    this.stopSnappingLinkers();
    this.translating = this.rotating = this.attracting = false;
    
    this.nucleotide.reset();
}

Motor.prototype.removeBindingConstraint = function ()
{
    if (this.bindingConstraint)
    {
        scene.removeConstraint( this.bindingConstraint );
        this.bound = false;
    }
}

// ---------------------------------- Collide with other motor while binding

Motor.prototype.onCollision = function (otherObject, linearVelocity, angularVelocity)
{
    if (this.isBusy() && otherObject.molecule instanceof Motor 
        && otherObject.molecule.state !== Motor.State.Free)
    {        
        this.cancelBinding( otherObject );
    }
}

Motor.prototype.cancelBinding = function (other)
{
    console.log(this.color() + " cancel binding");
    
    this.unbindToMT();
    
    this.collider.applyCentralImpulse( 
        this.collider.position.clone().sub( other.position ).normalize().multiplyScalar( 0.1 ) );
}

// ---------------------------------- ATP

Motor.prototype.bindATP = function ()
{
    this.setState( Motor.State.Strong );
    this.startSnappingLinkers();
}

Motor.prototype.hydrolyzeATPIfTime = function ()
{
    if (this.hasTimePassedInState( hydrolysisTime ))
    {
        this.nucleotide.hydrolyze();
        this.stopSnappingLinkers();
        this.setState( Motor.State.Weak );
    }
}

// ---------------------------------- Linker Snapping

Motor.prototype.startSnappingLinkers = function ()
{
    this.linkers[neckLinks - 1].startSnapping();
    this.snapping = true;
}

Motor.prototype.stopSnappingLinkers = function ()
{
    for (var i = 0; i < this.linkers.length; i++)
    {
        this.linkers[i].stopSnapping();
    }
    this.snapping = this.snapped = false;
}

// ---------------------------------- Eject

Motor.prototype.eject = function ()
{
    console.log(this.color() + " eject");
    
    this.unbindToMT();
    
    this.collider.applyCentralImpulse( this.getAxis( new THREE.Vector3(0,1,0) ).multiplyScalar(ejectionForce) );
}

// ---------------------------------- Update Mass

Motor.prototype.updateMass = function ()
{
    this.collider.mass = motorMass;
}

Motor.prototype.updateNeckLinkerMass = function ()
{
    for (var i = 0; i < this.linkers.length; i++)
    {
        this.linkers[i].updateMass();
    }
}

// ---------------------------------- Other

Motor.prototype.isInFront = function ()
{
    var thisToOther = this.otherMotor().collider.position.clone().sub( this.collider.position ).normalize();
    var angle = Math.acos( this.mtBindingTangent.dot( thisToOther ) );
    return (angle > Math.PI / 2);
}

Motor.prototype.otherMotor = function ()
{
    return motors[1 - this.number];
}

Motor.prototype.color = function () // for testing
{
    return (this.number === 0) ? "red" : "blue";
}
