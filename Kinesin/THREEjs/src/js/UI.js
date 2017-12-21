var ejectionSlider = {
    id: "EjectProbability",  
    title: "Probability of falling off without ATP bound",
    min: 0, 
    max: 100, 
    initValue: ejectFromWeakProbability, 
    function: updateEjection
};

var atpSliders = [
    {
        id: "Motor1ATPBinding", 
        title: "Motor 1",
        min: 0, 
        max: 100, 
        initValue: atpBindingProbability[0], 
        function: updateATP
    },
    {
        id: "Motor2ATPBinding",  
        title: "Motor 2",
        min: 0, 
        max: 100, 
        initValue: atpBindingProbability[1], 
        function: updateATP
    }
];

var hydrolysisTimeSlider = {
    id: "HydrolysisTime",  
    title: "ATP hydrolysis speed",
    min: 2, 
    max: 100, 
    initValue: hydrolysisTime, 
    function: updateATP
};

var randomWalkSliders = [
    {
        id: "HipsWalkDistance", 
        title: "Hips",
        min: 10, 
        max: 50, 
        initValue: hipsWalkDistance, 
        function: updateRandomWalks
    },
    {
        id: "MotorWalkDistance",  
        title: "Motors",
        min: 50, 
        max: 400, 
        initValue: motorWalkDistance, 
        function: updateRandomWalks
    }
];

var forceSliders = [
    {
        id: "SnappingForce", 
        title: "Force of neck linker snap when ATP binds",
        min: 0, 
        max: 10, 
        initValue: snappingForce, 
        function: updateForces
    },
    {
        id: "EjectionForce",  
        title: "Repelling force when motors fall off",
        min: 500, 
        max: 1500, 
        initValue: ejectionForce, 
        function: updateForces
    }
];

var massSliders = [
    {
        id: "OrganelleMass", 
        title: "Mass of organelle",
        min: 1, 
        max: 100, 
        initValue: 20, 
        function: updateOrganelle
    },
    {
        id: "StalkMass", 
        title: "Mass of stalk",
        min: 1, 
        max: 20, 
        initValue: 4, 
        function: updateStalk
    },
    {
        id: "HipsMass", 
        title: "Mass of hips",
        min: 1, 
        max: 50, 
        initValue: 1, 
        function: updateHips
    },
    {
        id: "MotorMass", 
        title: "Mass of each motor",
        min: 0, 
        max: 50, 
        initValue: 10, 
        function: updateMotors
    },
    {
        id: "NeckLinkerMass", 
        title: "Mass of each neck linker",
        min: 6, 
        max: 60, 
        initValue: 6, 
        function: updateNeckLinkers
    }
];

UI = {};

UI.createParameterInputs = function ()
{
    this.parameters = $("#parameters");
    
    this.parameters.append( "<h2>Set the simulation parameters:</h2>" );
    
    this.parameters.append( "<h3>Probability of Ejection</h3>" );
    this.addSliderThatCallsFunctionOnSlide( ejectionSlider );
    
    this.parameters.append( "<h3>Probability of ATP Binding</h3>" );
    for (var i = 0; i < atpSliders.length; i++)
    {
        this.addSliderThatCallsFunctionOnSlide(atpSliders[i]);
    }
    this.addSliderThatCallsFunctionOnSlide(hydrolysisTimeSlider);
    
    this.parameters.append( "<h3>Random Walk Step Sizes</h3>" );
    for (var i = 0; i < randomWalkSliders.length; i++)
    {
        this.addSliderThatCallsFunctionOnSlide(randomWalkSliders[i]);
    }
    
    this.parameters.append( "<h3>Forces</h3>" );
    for (var i = 0; i < forceSliders.length; i++)
    {
        this.addSliderThatCallsFunctionOnSlide(forceSliders[i]);
    }
    
//    this.parameters.append("<h3>Mass</h3>");
//    for (var i = 0; i < massSliders.length; i++)
//    {
//        this.addSliderThatCallsFunctionOnMouseup(massSliders[i]);
//    }
}

UI.addSliderThatCallsFunctionOnSlide = function (sliderData)
{
    var slider = $( "<div id='" + sliderData.id + "'><h4>" + sliderData.title + "</h4></div>" ).slider({
        min: sliderData.min,
        max: sliderData.max,
        range: "min",
        value: sliderData.initValue,
        slide: sliderData.function,
        stop: sliderData.function
    });
    this.parameters.append(slider);
}

UI.addSliderThatCallsFunctionOnMouseup = function (sliderData)
{
    var slider = $( "<div id='" + sliderData.id + "'><h4>" + sliderData.title + "</h4></div>" ).slider({
        min: sliderData.min,
        max: sliderData.max,
        range: "min",
        value: sliderData.initValue,
        stop: sliderData.function
    });
    this.parameters.append(slider);
}

UI.createParameterInputs();

// ------------------------------------------- Handle parameter input

function updateEjection ()
{
    ejectFromWeakProbability = $( "#EjectProbability" ).slider( "value" );
}

function updateATP ()
{
    atpBindingProbability[0] = $( "#Motor1ATPBinding" ).slider( "value" );
    atpBindingProbability[1] = $( "#Motor2ATPBinding" ).slider( "value" );
    hydrolysisTime = 10 / $( "#HydrolysisTime" ).slider( "value" );
}

function updateRandomWalks ()
{
    hipsWalkDistance = $( "#HipsWalkDistance" ).slider( "value" );
    motorWalkDistance = $( "#MotorWalkDistance" ).slider( "value" );
}

function updateForces ()
{
    snappingForce = $( "#SnappingForce" ).slider( "value" ) / 100;
    ejectionForce = $( "#EjectionForce" ).slider( "value" ) / 100;
}

function updateOrganelle ()
{
    organelleMass = $( "#OrganelleMass" ).slider( "value" );
//    hips.updateOrganelleMass();
}

function updateStalk ()
{
    stalkMass = $( "#StalkMass" ).slider( "value" );
//    hips.updateStalkMass();
}

function updateHips ()
{
    hipsMass = $( "#HipsMass" ).slider( "value" ) / 10;
//    hips.updateMass();
}

function updateMotors ()
{
    motorMass = $( "#MotorMass" ).slider( "value" );
    for (var i = 0; i < motors.length; i++)
    {
//        motors[i].updateMass();
    }
}

function updateNeckLinkers ()
{
    neckLinkerMass = $( "#NeckLinkerMass" ).slider( "value" ) / 10;
    for (var i = 0; i < motors.length; i++)
    {
//        motors[i].updateNeckLinkerMass();
    }
}
