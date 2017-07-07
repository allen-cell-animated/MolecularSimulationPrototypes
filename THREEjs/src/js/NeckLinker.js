function NeckLinker (motor, position, radius, index)
{
    this.motor = motor;
    this.index = index;
    this.makeCollider( position, radius );
    
    Molecule.call( this );
    
    this.snapping = this.docked = false;
}

NeckLinker.prototype = Object.create(Molecule.prototype);
NeckLinker.prototype.constructor = NeckLinker;

NeckLinker.prototype.makeCollider = function (worldPosition, radius)
{
    this.color = new THREE.Color( 1  - this.index / neckLinks, this.index / neckLinks, 1 );
    this.collider = new Physijs.SphereMesh( 
        new THREE.SphereGeometry( radius, sphereResolution, sphereResolution ), 
        Physijs.createMaterial( new THREE.MeshLambertMaterial( {color: this.color} ), 0, 0),
        neckLinkerMass / neckLinks
    );
    
    this.collider.position.copy( worldPosition );
    this.collider.__dirtyPosition = true;
    
    scene.add( this.collider );
    
    this.collider.name = "motor" + (this.motor.number + 1) + "-linker" + this.index;
}

NeckLinker.prototype.update = function ()
{
    this.setAngularMotors();
    
    if (this.snapping)
    {
        this.snapDown();
    }
    else if (this.angularMotorsEnabled)
    {
        this.rotateRandomly();
    }
}

NeckLinker.prototype.setAngularMotors = function ()
{
    if (Controller.randomForcesEnabled())
    {
        if (!this.angularMotorEnabled)
        {
            this.enableAngularMotors();
        }
    }
    else if (this.angularMotorEnabled)
    {
        this.disableAngularMotors();
    }
}

NeckLinker.prototype.startSnapping = function ()
{   
    this.pivot = this.getSnappingPivot();
    this.goalPosition = Kinesin.getWorldPosition( this.motor.geometry ).clone().add( 
        this.motor.mtBindingTangent.clone().multiplyScalar( (neckLinks - this.index - 1) * this.motor.linkDiameter ) );
    
    this.snapping = true;
}

NeckLinker.prototype.getSnappingPivot = function ()
{ 
    return this.motor.collider.position.clone().add( 
        this.motor.mtBindingTangent.clone().multiplyScalar( (neckLinks - this.index) * this.motor.linkDiameter ) );
}

NeckLinker.prototype.snapDown = function ()
{   
    this.collider.applyCentralImpulse( this.getSnappingDirection().multiplyScalar( snappingForce ) );
    
    if (this.collider.position.distanceTo( this.goalPosition ) < 5)
    {
        if (this.motor.state === Motor.State.Strong)
        {
            this.addDockingConstraint();
            if (this.index !== 0)
            {
                this.setPosition( this.goalPosition );
                this.motor.linkers[this.index - 1].startSnapping();
                this.motor.otherMotor().collider.applyCentralImpulse( 
                    this.motor.mtBindingTangent.clone().multiplyScalar( 50 ) );
            }
            else
            {
                this.motor.snapped = true;
            }
        }
        this.snapping = false;
    }
}

NeckLinker.prototype.getSnappingDirection = function ()
{ 
    if (this.index === neckLinks - 1)
    {
        return this.goalPosition.clone().sub( this.collider.position ).normalize();
    }
    else
    {
        var pivotToLinkerDirection = this.collider.position.clone().sub( this.pivot ).normalize();

        var tangentAngle = Math.acos( this.motor.mtBindingTangent.dot( pivotToLinkerDirection ) );
        var normalAngle = Math.acos( this.motor.mtBindingNormal.dot( pivotToLinkerDirection ) );
        var sideAngle = Math.acos( this.motor.mtBindingSideways.dot( pivotToLinkerDirection ) );

        var goal;
        if ((tangentAngle < 15 * Math.PI / 18) && (normalAngle < 11 * Math.PI / 18) && (sideAngle < 3 * Math.PI / 4))
        {
            return this.goalPosition.clone().sub( this.collider.position ).normalize();
        }
        else
        {
            var normalPosition = this.pivot.clone().add( 
                this.motor.mtBindingNormal.clone().multiplyScalar( this.motor.linkDiameter ) ); 
            return normalPosition.sub( this.collider.position ).normalize();
        }
    }
}

NeckLinker.prototype.addDockingConstraint = function ()
{ 
    if (!this.docked)
    {
        this.dockingConstraint = new Physijs.DOFConstraint(
            this.collider,
            this.goalPosition
        );
        scene.addConstraint( this.dockingConstraint );
        
        this.dockingConstraint.setLinearLowerLimit( zeroVector );
        this.dockingConstraint.setLinearUpperLimit( zeroVector );
        this.dockingConstraint.setAngularLowerLimit( zeroVector );
        this.dockingConstraint.setAngularUpperLimit( zeroVector );

        this.collider.material.color = new THREE.Color(0,0,0);
        this.docked = true;
    }
}

NeckLinker.prototype.stopSnapping = function ()
{
    this.removeDockingConstraint();
    this.snapping = this.docked = false;
}

NeckLinker.prototype.removeDockingConstraint = function ()
{
    if (this.docked)
    {
        scene.removeConstraint( this.dockingConstraint );
        this.collider.material.color = this.color;
        this.docked = false;
    }
}

NeckLinker.prototype.updateMass = function ()
{
    this.collider.mass = neckLinkerMass / neckLinks;
}
