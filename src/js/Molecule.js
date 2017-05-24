var Molecule = function ()
{
    this.initialPosition = Kinesin.getWorldPosition( this.collider );
    this.rotating = this.translating = this.attracting = false;
    this.frozen = false;
    this.constraints = [];
    this.lastTime = new Date().getTime();
}

Molecule.prototype.setPosition = function (position)
{
    this.collider.position.copy( position );
    this.collider.__dirtyPosition = true;
}

Molecule.prototype.freezeRotationFromPhysics = function ()
{
    this.collider.setAngularFactor( zeroVector );
    this.collider.setAngularVelocity( zeroVector );
    this.frozen = true;
}

Molecule.prototype.unfreezeRotationFromPhysics = function ()
{
    this.collider.setAngularFactor( new THREE.Vector3(1,1,1) );
    this.frozen = false;
}

Molecule.prototype.applyFriction = function ()
{
    var linearVelocity = this.collider.getLinearVelocity();
    var angularVelocity = this.collider.getAngularVelocity();
    
    this.collider.applyCentralImpulse( linearVelocity.clone().multiplyScalar( -friction ) );
    this.collider.applyTorque( angularVelocity.clone().multiplyScalar( -friction ) );
}

Molecule.prototype.walkRandomly = function (maxDistance)
{
    this.collider.setLinearVelocity( new THREE.Vector3(0,0,0) );
    this.collider.applyCentralImpulse( Kinesin.getRandomVector( maxDistance ) );
}

Molecule.prototype.getAxis = function (axis)
{
    return Kinesin.getAxisForGeometry( this.collider, axis );
}

Molecule.prototype.isBusy = function ()
{
    return this.translating || this.rotating || this.attracting;
}

Molecule.prototype.animate = function ()
{
    var animating = false;
    if (this.translating)
    {
        this.animateTranslation();
        animating = true;
    }
    if (this.rotating)
    {
        this.animateRotation();
        animating = true;
    }
    if (this.attracting)
    {
        this.attract();
    }
    return animating;
}

Molecule.prototype.startTranslating = function (finalPosition, callback)
{
    this.translation = finalPosition.clone().sub( this.collider.position ).multiplyScalar( 
        1 / animationLength );
    
    this.translationCallback = callback;
    this.translationStep = 0;
    this.translating = true;
}

Molecule.prototype.animateTranslation = function ()
{
    this.setPosition( this.collider.position.add( this.translation ) );
    
    this.translationStep++;
    if (this.translationStep >= animationLength)
    {
        this.translating = false;
        this.translationCallback();
    }
}

Molecule.prototype.startRotating = function (tangent, normal, callback)
{    
    this.rotationVector = this.getAxis( new THREE.Vector3(0,0,1) );
    this.rotationAxis = (new THREE.Vector3()).crossVectors( this.rotationVector, tangent ).normalize();
    this.rotationAngle = Math.acos( this.rotationVector.dot( tangent ) ) / animationLength;
    
    this.collider.up = normal;
    this.rotationCallback = callback;
    this.rotationStep = 0;
    this.rotating = true;
}

Molecule.prototype.animateRotation = function ()
{
    this.rotationVector.applyAxisAngle( this.rotationAxis, this.rotationAngle );
    this.collider.lookAt( this.collider.position.clone().add( this.rotationVector ) );
    this.collider.__dirtyRotation = true;
    
    this.rotationStep++;
    if (this.rotationStep >= animationLength)
    {
        this.rotating = false;
        this.rotationCallback();
    }
}

Molecule.prototype.startAttracting = function (target, force)
{
    this.attractionTarget = target;
    this.attractionForce = force;
    this.attracting = true;
}

Molecule.prototype.attract = function ()
{
    var vectorToTarget = this.attractionTarget.clone().sub( this.collider.position );
    var distanceToTarget = Math.max( vectorToTarget.length(), 1 );
    var force = Math.min( 10 + 8 * this.attractionForce / distanceToTarget, 2 * this.attractionForce );
    
    this.collider.applyCentralImpulse( vectorToTarget.normalize().multiplyScalar( force ) );
}

Molecule.prototype.addConstraint = function (parent, minRotation, maxRotation)
{
    var index = this.constraints.length;
    this.constraints[index] = {
        parent: parent,
        minRotation: minRotation,
        maxRotation: maxRotation,
        constraint: new Physijs.DOFConstraint(
            this.collider,
            parent,
            parent.position
        )
    };
    scene.addConstraint( this.constraints[index].constraint );
    
    this.constraints[index].constraint.setLinearLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
    this.constraints[index].constraint.setLinearUpperLimit( new THREE.Vector3( 0, 0, 0 ) );
    
    for (var axis = 0; axis < 3; axis++)
    {
        this.updateAngularMotor(index, axis);
    }
    this.enableAngularMotors();
}

Molecule.prototype.rotateRandomly = function ()
{
    if (new Date().getTime() - this.lastTime > 100)
    {
        for (var index = 0; index < this.constraints.length; index++)
        {
            for (var axis = 0; axis < 3; axis++)
            {
                if (this.constraints[index].minRotation[axis] !== this.constraints[index].maxRotation[axis])
                {
                    this.updateAngularMotor(index, axis);
                }
            }
        }
        this.lastTime = new Date().getTime();
    }
}

Molecule.prototype.updateAngularMotor = function (index, axis)
{
    this.constraints[index].constraint.configureAngularMotor(
        axis, // which angular motor to configure - 0,1,2 match x,y,z
        this.constraints[index].minRotation[axis], // lower limit of the motor
        this.constraints[index].maxRotation[axis], // upper limit of the motor
        10 * Kinesin.getRandomDirection(), // target velocity
        50 // maximum force the motor can apply
    );
}

Molecule.prototype.enableAngularMotors = function ()
{
    this.angularMotorsEnabled = true;
    for (var index = 0; index < this.constraints.length; index++)
    {
        for (var axis = 0; axis < 3; axis++)
        {
             this.constraints[index].constraint.enableAngularMotor( axis );
        }
    }
}

Molecule.prototype.disableAngularMotors = function ()
{
    this.angularMotorsEnabled = false;
    for (var index = 0; index < this.constraints.length; index++)
    {
        for (var axis = 0; axis < 3; axis++)
        {
             this.constraints[index].constraint.disableAngularMotor( axis );
        }
    }
}

Molecule.prototype.clearForces = function ()
{
    this.collider.setAngularVelocity( zeroVector );
    this.collider.setLinearVelocity( zeroVector );
}
