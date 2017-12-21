function Hips (geometry)
{
    this.makeCollider( Kinesin.getWorldPosition(geometry) );
    
    Molecule.call( this );
    
    this.setupGeometry( geometry );
}

Hips.prototype = Object.create(Molecule.prototype);
Hips.prototype.constructor = Hips;

Hips.prototype.makeCollider = function (worldPosition)
{
    this.collider = new Physijs.SphereMesh( 
        new THREE.SphereGeometry( 3, sphereResolution, sphereResolution ), 
        Physijs.createMaterial( new THREE.MeshLambertMaterial( {color: new THREE.Color( 0, 0, 0 )} ), 0, 0),
        hipsMass
    );
    
    this.collider.position.copy( worldPosition );
    this.collider.__dirtyPosition = true;
    
    this.collider.material.transparent = true;
    this.collider.material.opacity = 0;
    
    scene.add( this.collider );
    
    this.collider.name = "hips";
    this.collider.molecule = this;
}

Hips.prototype.setupGeometry = function (geometry)
{
    THREE.SceneUtils.detach( geometry, geometry.parent, scene );
    THREE.SceneUtils.attach( geometry, scene, this.collider );
    geometry.rotateZ( Kinesin.degreesToRadians(6.03) );
    geometry.position.copy( new THREE.Vector3(0,0,0) );
    this.geometry = geometry;
}

Hips.prototype.update = function ()
{
    if (Controller.randomForcesEnabled())
    {
        this.walkRandomly( hipsWalkDistance );
    }
}

Hips.prototype.updateMass = function ()
{
    this.collider.mass = hipsMass;
}
