var WIDTH = 900, HEIGHT = 500;

var filenameDAE = "geometry/Kinesin.dae";
var shadowsOn = false;
var globalScale = 100;
var kinesinPosition = new THREE.Vector3(0,0,0);
var cameraPosition = new THREE.Vector3(0,200,500);
var scene, kinesin, hips, motors, microtubule, organelle;
var nucleotideMaterials = [new THREE.MeshBasicMaterial( {color: new THREE.Color( 1, 1, 0 )} ),
                           new THREE.MeshBasicMaterial( {color: new THREE.Color( 0.5, 0.5, 0.5 )} )];
var neckLinks = 6;
var nLMaterials = [new THREE.MeshLambertMaterial( {color: new THREE.Color( 1, 0, 1 )} ),
                   new THREE.MeshLambertMaterial( {color: new THREE.Color( 0, 1, 1 )} )];
var sphereResolution = 16;
var animationLength = 30;
var zeroVector = new THREE.Vector3(0,0,0);

//adjustable parameters
var ejectFromWeakProbability = 5;
var atpBindingProbability = [60, 60];
var hydrolysisTime = 3;
var hipsWalkDistance = 15;
var motorWalkDistance = 100;
var snappingForce = 50;
var ejectionForce = 100;
var motorBindingForce = 100;

var organelleRadius = 500;
var organelleMass = 10;
var stalkSegments = 2;
var stalkLength = 300;
var stalkMass = 0.4;
var hipsMass = 0.1;
var motorMass = 1;
var neckLinkerMass = 0.6;
var friction = 0.01;

Controller = {};

Controller.init = function (callback)
{   
    this.lastTime = new Date().getTime();
    this.lastFrameCheckTime = 0;
    
    scene = new Physijs.Scene();
    
    this.setupPhysics();
    this.createRenderer();
    this.createCamera();
    this.createLight();
    this.loadCollada(callback);
}

Controller.setupPhysics = function ()
{
    scene.setGravity(new THREE.Vector3( 0, 0, 0 ));
}

Controller.createRenderer = function ()
{
    scene.fog = new THREE.FogExp2( 0xFFFFFF, 0.001 );
    
    this.renderer = new THREE.WebGLRenderer( {antialias:true} );
    this.renderer.setSize( WIDTH, HEIGHT );
    this.renderer.setClearColor( scene.fog.color );
    
    this.renderer.shadowMap.enabled = shadowsOn;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    $(document).ready( function () {
        $("#3dwindow").html( Controller.renderer.domElement );
    }); 
}

Controller.createCamera = function ()
{
    this.camera = new THREE.PerspectiveCamera( 45, WIDTH / HEIGHT, 1, 100000 );
    this.camera.position.copy( cameraPosition );
    scene.add( this.camera ); 
}

Controller.createLight = function ()
{
    this.light = new THREE.DirectionalLight(0xfffff3,1.5);
    this.camera.add(this.light);
    this.light.position.set(0,0,1);
    this.light.target = this.camera;
    this.light.castShadow = shadowsOn;
}

Controller.loadCollada = function (callback)
{
    this.loader = new THREE.ColladaLoader();
    this.loader.options.convertUpAxis = true;
    this.loader.load( filenameDAE, function (collada) {
        collada.scene.position.set(0,0,0);
        collada.scene.scale.set(globalScale, globalScale, globalScale);
        scene.add(collada.scene);
        callback(); 
    });
}

// Call Controller init with this function on collada load
Controller.init( function() {
    
    Controller.setupGeometry();
    Controller.createCameraControls();
    
    Controller.update();
})

Controller.setupGeometry = function ()
{   
    hips = new Hips( scene.getObjectByName("Hips") );
    
    motors = [];
    motors[0] = new Motor( scene.getObjectByName("Motor1"),
                           scene.getObjectByName("Motor1ATP"), 1 );
    motors[1] = new Motor( scene.getObjectByName("Motor2"),
                           scene.getObjectByName("Motor2ATP"), 2 );
    
    microtubule = new Microtubule();
    
    organelle = new Organelle();
    
//    this.testMotor();
}

Controller.createCameraControls = function ()
{
    this.controls = new THREE.OrbitControls( Controller.camera, Controller.renderer.domElement );
    this.controls.rotateSpeed = 2.0;
    this.controls.zoomSpeed = 2;
    this.controls.panSpeed = 0.5;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = false;
    this.controls.dynamicDampingFactor = 0.2;
    this.controls.keys = [ 65, 83, 68 ];
    this.controls.target = Kinesin.getWorldPosition(hips.collider);
    this.controls.addEventListener( 'change', Controller.render );
    this.camera.lookAt( this.controls.target );
    this.cameraTarget = new CameraTarget( hips.collider );
}

var frame = -1;
var f = 0;
var pause = false;

Controller.update = function ()
{
    requestAnimationFrame( Controller.update );
    if (f > frame && !pause) // slow down or pause for testing
    {
        Controller.updateKinesin();
//        Controller.updateMotor();
        
        scene.simulate();
        Controller.render();
        
        Controller.setFrameTime();
        $('#test').html( Controller.getFrameRate() );
        f = 0;
    }
    f++;
}

Controller.updateKinesin = function ()
{
    for (var i = 0; i < motors.length; i++)
    {
        motors[i].update();
    }
    hips.update();
    organelle.update();
}

Controller.randomForcesEnabled = function ()
{
    return ((!motors[0].snapping || motors[0].snapped) && (!motors[1].snapping || motors[1].snapped));
}

Controller.render = function ()
{
    Controller.cameraTarget.update();
    Controller.controls.target = Controller.cameraTarget.target.position;
    Controller.camera.lookAt( Controller.cameraTarget.target.position );
    Controller.renderer.render(scene, Controller.camera);
}

Controller.setFrameTime = function ()
{
    var now = new Date().getTime();
    this.frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
}

Controller.getFrameRate = function ()
{
    var now = new Date().getTime();
    if (now - this.lastFrameCheckTime > 1000)
    {
        this.frameRate = Math.round( 1 / this.frameTime );
        this.lastFrameCheckTime = now;
    }
    return this.frameRate;
}


















Controller.testMotor = function ()
{
    this.parentBox = new Physijs.BoxMesh(new THREE.CubeGeometry(10, 10, 10), 
                                         new THREE.MeshPhongMaterial({color: 0x4444ff, transparent: true, opacity: 0.7}), 
                                         0.1);
    this.parentBox.position.copy( new THREE.Vector3(200,250,200) );
    scene.add( this.parentBox );

    var parent = this.parentBox;
    this.motorConstraints = [];
    this.minRotations = [
        [Math.PI / 6, -Math.PI / 3, 0],
        [-Math.PI / 3, -Math.PI / 3, 0],
        [Math.PI / 3, -Math.PI / 3, 0],
        [-Math.PI / 3, -Math.PI / 3, 0]
    ];
    this.maxRotations = [
        [Math.PI / 6, Math.PI / 3, 0],
        [-Math.PI / 3, Math.PI / 3, 0],
        [Math.PI / 3, Math.PI / 3, 0],
        [-Math.PI / 3, Math.PI / 3, 0]
    ];
    this.motorChildren = 4;
    for (var index = 0; index < this.motorChildren; index++)
    {
        parent = this.addChild( index, parent );
    }
    
    lastTime = new Date().getTime();
    startTime = new Date().getTime();
}

Controller.addChild = function (index, parent)
{
    var child = new Physijs.BoxMesh(new THREE.CubeGeometry(30, 10, 20), 
                                    new THREE.MeshPhongMaterial({color: 0x4444ff, transparent: true, opacity: 0.7}), 
                                    0.1);
    child.position.copy( new THREE.Vector3(200, 250 - (index + 1) * 50, 200) );
    scene.add( child );
    
    this.addMotorConstraint( child, parent, index );
    
    return child;
}

Controller.addMotorConstraint = function (child, parent, index)
{
    this.motorConstraints[index] = new Physijs.DOFConstraint(
        child,
        parent,
        parent.position
    );
    scene.addConstraint( this.motorConstraints[index] );
    
    this.motorConstraints[index].setLinearLowerLimit( new THREE.Vector3( 0, 0, 0 ) );
    this.motorConstraints[index].setLinearUpperLimit( new THREE.Vector3( 0, 0, 0 ) );
    
    for (var axis = 0; axis < 3; axis++)
    {
        this.motorConstraints[index].configureAngularMotor(
            axis, // which angular motor to configure - 0,1,2 match x,y,z
            this.minRotations[index][axis], // lower limit of the motor
            this.maxRotations[index][axis], // upper limit of the motor
            this.getRandomDirection(), // target velocity
            1 // maximum force the motor can apply
        );
        this.motorConstraints[index].enableAngularMotor( axis );
    }
}

var lastTime;
var startTime;
Controller.updateMotor = function ()
{
    this.parentBox.setLinearVelocity( new THREE.Vector3(0,0,0) );
    this.parentBox.applyCentralImpulse( Kinesin.getRandomVector( 15 ) );
    if (new Date().getTime() - lastTime > 300)
    {
        for (var index = 0; index < this.motorChildren; index++)
        {
            for (var axis = 0; axis < 3; axis++)
            {
                this.updateMotorConstraint(axis, index);
            }
        }
        lastTime = new Date().getTime();
    }
    if (new Date().getTime() - startTime > 5000)
    {
        this.parentBox.material.color = new THREE.Color(0,0,0);
        for (var index = 0; index < this.motorChildren; index++)
        {
            for (var axis = 0; axis < 3; axis++)
            {
                this.motorConstraints[index].disableAngularMotor( axis );
            }
        }
    }
    if (new Date().getTime() - startTime > 10000)
    {
        this.parentBox.material.color = new THREE.Color(1,1,1);
        for (var index = 0; index < this.motorChildren; index++)
        {
            for (var axis = 0; axis < 3; axis++)
            {
                this.motorConstraints[index].enableAngularMotor( axis );
            }
        }
    }
}

Controller.updateMotorConstraint = function (axis, index)
{
    this.motorConstraints[index].configureAngularMotor(
        axis, // which angular motor to configure - 0,1,2 match x,y,z
        this.minRotations[index][axis], // lower limit of the motor
        this.maxRotations[index][axis], // upper limit of the motor
        100 * this.getRandomDirection(), // target velocity
        100 // maximum force the motor can apply
    );
}

Controller.getRandomDirection = function ()
{
    var r = Math.random();
    if (r > 0.5)
    {
        return 1;
    }
    return -1;
}

Controller.clearForces = function ()
{
    hips.clearForces();
    organelle.clearForces();
    organelle.clearStalkForces();
    for (var motor = 0; motor < motors.length; motor++)
    {
        motors[motor].clearForces();
        for (var linker = 0; linker < motors[motor].linkers.length; linker++)
        {
            motors[motor].linkers[linker].clearForces();
        }
    }
}
