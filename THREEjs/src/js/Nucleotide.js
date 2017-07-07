function Nucleotide (geometry, motor)
{
    this.motor = motor;
    this.makeCollider( Kinesin.getWorldPosition(geometry) );
    
    Molecule.call( this );
    
    this.setupGeometry( geometry );
    this.isATP = false;
    this.bound = false;
}

Nucleotide.prototype = Object.create( Molecule.prototype );
Nucleotide.prototype.constructor = Nucleotide;

Nucleotide.prototype.makeCollider = function (worldPosition)
{
    this.collider = new Physijs.SphereMesh( 
        new THREE.SphereGeometry( 5, sphereResolution, sphereResolution ), 
        new THREE.MeshLambertMaterial( {color: new THREE.Color(1,1,1)} ), 
        0
    );
    
    this.collider.position.copy( worldPosition );
    this.collider.__dirtyPosition = true;
    
    this.collider.material.transparent = true;
    this.collider.material.opacity = 0;
    
    this.motor.collider.add( this.collider );
    
    this.collider.name = "motor" + (this.motor.number + 1) + "-ATP";
    
    this.boundPosition = (new THREE.Vector3()).copy( this.collider.position );
}

Nucleotide.prototype.setupGeometry = function (geometry)
{
    THREE.SceneUtils.detach( geometry, geometry.parent, scene );
    THREE.SceneUtils.attach( geometry, scene, this.collider );
    this.geometry = geometry;
    this.geometry.material = nucleotideMaterials[1];
}

Nucleotide.prototype.startADPAnimation = function ()
{
    this.adpExitPosition = Kinesin.getRandomUnitRotationInShell().multiplyScalar( 3 );
    this.geometry.visible = true;
}

Nucleotide.prototype.startATPAnimation = function ()
{
    this.setPosition( Kinesin.getRandomUnitRotationInShell().multiplyScalar( 1 ) );
    
    this.geometry.material = nucleotideMaterials[0];
    this.geometry.visible = true;
    
    this.isATP = true;
    this.bound = false;
}

Nucleotide.prototype.animate = function ()
{
    if (this.isATP)
    {
        if (!this.bound)
        {
            var translation = (new THREE.Vector3()).subVectors( this.boundPosition, 
                                                                this.collider.position ).multiplyScalar( 0.05 );
            this.translate( Kinesin.getRandomVector( 5 ).add( translation ) );

            if (this.collider.position.distanceTo( this.boundPosition ) < 5)
            {
                this.resetPosition();
                this.motor.bindATP();
                this.bound = true;
            }
        }
    }
    else if (this.geometry.visible && this.adpExitPosition)
    {
        var translation = (new THREE.Vector3()).subVectors( this.adpExitPosition, 
                                                            this.collider.position ).multiplyScalar( 0.01 );
        this.translate( Kinesin.getRandomVector( 5 ).add( translation ) );

        if (this.collider.position.distanceTo( this.boundPosition ) > 150)
        {
            this.geometry.visible = false;
        }
    }
}

Nucleotide.prototype.translate = function (translationVector)
{
    this.setPosition( this.collider.position.add( translationVector ) );
}

Nucleotide.prototype.hydrolyze = function ()
{
    this.geometry.material = nucleotideMaterials[1];
    this.isATP = false;
}

Nucleotide.prototype.reset = function ()
{
    if (this.isATP)
    {
        this.resetPosition();
        this.hydrolyze();
    }
}

Nucleotide.prototype.resetPosition = function ()
{
    this.collider.position.copy( this.boundPosition );
}
