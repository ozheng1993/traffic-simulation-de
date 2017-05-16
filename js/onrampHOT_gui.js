//#############################################
// GUI: Only defines interface; actual start of sim thread in onramp.js
//#############################################

//#############################################
// ACHTUNG BUG bei DYN_WEB.Event.domReady( function()..)
// Auch wenn diese Fkt nicht aufgerufen wird, produziert sie extrem
// boesartige Fehler, wenn die entspr html Elemeente
// (z.B. <div id="track_density"><div id="valueField_density">)
// nicht defiiert sind: Dann DOS bei allen im gui.js NACHFOLGENDEN Slidern
// deshalb separate gui fuer jedes html noetig
// das generelle "gui.js" bietet Sammlung fuer alles und ist Referenz

// ACHTUNG weiterer BUG: die sliderWidth wird zwar optisch dem responsive
// design angepasst, der Knopf laesst sich aber immer bis zur anfaengl. Weite 
// bewegen, also nicht zum Ende bei Vergroesserung, 
// darueber hinaus bei Verkleinerung 
//#############################################


// geometry of sliders; only nonzero initialization; 
// will be overridden in update method of main js file if hasChanged=true

var sliderWidth=100; // max value reached if slider at sliderWidth

// controlled contents of sliders

var timewarpInit=5;
var timewarp=timewarpInit;
var timewarp_min=0.1;
var timewarp_max=20;

var scaleInit=2.3;  // pixel/m
var scale=scaleInit;
var scale_min=0.6;
var scale_max=5;

var truckFracInit=0.2; // truck=non-HOT veh; normally init=0.04
var truckFrac=truckFracInit;
var truckFrac_min=0;
var truckFrac_max=0.9; // truck=non-HOT veh; normally max=0.5

var qInInit=1.0; // 1.0 total mainroad inflow [veh/s] 
var qIn=qInInit;
var qIn_min=0;
var qIn_max=1.5;

var qOnInit=0.2; //  0.2total onramp inflow [veh/s] 
var qOn=qOnInit;
var qOn_min=0;
var qOn_max=0.5;



var IDM_v0Init=30; 
var IDM_v0=IDM_v0Init;
var IDM_v0_min=5;
var IDM_v0_max=40;

var IDM_TInit=1.5; 
var IDM_T=IDM_TInit;
var IDM_T_min=0.6;
var IDM_T_max=3;

var IDM_s0Init=2; 
var IDM_s0=IDM_s0Init;
var IDM_s0_min=0.5;
var IDM_s0_max=5;

var IDM_aInit=0.4; 
var IDM_a=IDM_aInit;
var IDM_a_min=0.3;
var IDM_a_max=3;

var IDM_bInit=3;
var IDM_b=IDM_bInit;
var IDM_b_min=0.5;
var IDM_b_max=5;

//!!! truck=non-HOT vehicles 
var speedlimit_truck=120/3.6 //  normally 80/3.6
var factor_v0_truck=1.; // normally 0.7
var factor_a_truck=1.; // normally 0.8
var factor_T_truck=1.; // normally 1.2

function updateModels(){
    var v0_truck=Math.min(factor_v0_truck*IDM_v0, speedlimit_truck);
    var T_truck=factor_T_truck*IDM_T;
    var a_truck=factor_a_truck*IDM_a;

    //var longModelCar etc defined (w/o value) in onramp.js 
    // var MOBIL_bBiasRight and other MOBIL params defined in onramp.js 
    longModelCar=new ACC(IDM_v0,IDM_T,IDM_s0,IDM_a,IDM_b);
    longModelTruck=new ACC(v0_truck,T_truck,IDM_s0,a_truck,IDM_b);
    LCModelCar=new MOBIL(MOBIL_bSafe, MOBIL_bSafeMax, 
                         MOBIL_bThr, MOBIL_bBiasRight_car);
    LCModelTruck=new MOBIL(MOBIL_bSafe, MOBIL_bSafeMax, 
			   MOBIL_bThr, MOBIL_bBiasRight_truck);
}


// general info on threads:

// thread starts with "var myRun=init();" or "myRun=init();"
// in init() at end: setInterval(main_loop, 1000/fps);
// thread stops with "clearInterval(myRun);" 


//################################################################
// Start/Stop button action (triggered by "onclick" callback in html file)
//#################################################################

// in any case need first to stop;
// otherwise multiple processes after clicking 2 times start
// define no "var myRun "; otherwise new local instance started
// whenever myRun is inited

var isStopped=false; // only initialization

function myStartStopFunction(){ 

    clearInterval(myRun);
    console.log("in myStartStopFunction: isStopped=",isStopped);

    if(isStopped){
	isStopped=false;
	document.getElementById('startStop').innerHTML="Stop";
	myRun=init();
    }
    else{
	document.getElementById('startStop').innerHTML="Resume";
	isStopped=true;
    }
}

//#########################################################
// Disturb button (triggered by "onclick" callback in html file)
//#########################################################

function disturbOneVehicle(relLocation,speedReduce){
    mainroad.disturbOneVehicle(relLocation,speedReduce);
}




//#############################################
// Timewarp slider (names 'slider_timewarp' etc defined in html file)
// (also define formatting in sliders.css!)
//#############################################

DYN_WEB.Event.domReady( function() {
    var slider_timewarp 
        = new DYN_WEB.Slider('slider_timewarp', 'track_timewarp', 'h');

    //callback
    slider_timewarp.on_move = function(x,y) {// function (x) OK
        change_timewarp(x);
        document.getElementById('valueField_timewarp').innerHTML
           =parseFloat(get_timewarp(),10).toFixed(1)+" times";
        };
    }
);


// called when timewarp slider is moved
// xSlider goes from 0 to pixel length of slider

function change_timewarp(xSlider){
    timewarp=timewarp_min
	+(timewarp_max-timewarp_min)*xSlider/sliderWidth; 
    dt=timewarp/fps;
    //console.log("change_timewarp(xSlider): xSlider=",xSlider," scale=",scale," sliderWidth=",sliderWidth," canvas.width=",canvas.width);
}
function get_timewarp(){return timewarp;}

// inverse function of change_timewarp for initialization
// called in onramp.js in init() method

function change_timewarpSliderPos(x){
    //console.log(" in change_timewarpSliderPos(x), x="+x);
    var xSlider=sliderWidth // how to use this var to externally set slider pos?
	*(x-timewarp_min)/(timewarp_max-timewarp_min);
    document.getElementById('valueField_timewarp').innerHTML
           =parseFloat(x,10).toFixed(1)+" times";
}




//#############################################
// truck fraction slider (also update sliders.css!)
//#############################################

DYN_WEB.Event.domReady( function() {
    var slider_truckFrac 
        = new DYN_WEB.Slider('slider_truckFrac', 'track_truckFrac', 'h');
    slider_truckFrac.on_move = function(x,y) {
        change_truckFrac(x);
        document.getElementById('valueField_truckFrac').innerHTML
           =parseFloat(100*get_truckFrac(),10).toFixed(0)+" %";
        };
    }
);

function change_truckFrac(x){
    truckFrac=truckFrac_min
	+(truckFrac_max-truckFrac_min)*x/sliderWidth;
}

function get_truckFrac(){return truckFrac;}

function change_truckFracSliderPos(truckFrac){
    var x=sliderWidth
	*(truckFrac-truckFrac_min)/(truckFrac_max-truckFrac_min);
    document.getElementById('valueField_truckFrac').innerHTML
        =parseFloat(100*get_truckFrac(),10).toFixed(0)+" %";
}


//#############################################
// mainroad inflow slider (also update sliders.css!)
//#############################################

DYN_WEB.Event.domReady( function() {
    var slider_qIn 
        = new DYN_WEB.Slider('slider_qIn', 'track_qIn', 'h');
    slider_qIn.on_move = function(x,y) {
        change_qIn(x);
        document.getElementById('valueField_qIn').innerHTML
           =parseFloat(3600*get_qIn(),10).toFixed(0)+" veh/h";
        };
    }
);

function change_qIn(x){
    qIn=qIn_min
	+(qIn_max-qIn_min)*x/sliderWidth;
}

function get_qIn(){
  return qIn;
}

function change_qInSliderPos(qIn){
    var x=sliderWidth
	*(qIn-qIn_min)/(qIn_max-qIn_min);
    document.getElementById('valueField_qIn').innerHTML
        =parseFloat(3600*get_qIn(),10).toFixed(0)+" veh/h";
}


//#############################################
// mainroad onramp slider (also update sliders.css!)
//#############################################

DYN_WEB.Event.domReady( function() {
    var slider_qOn 
        = new DYN_WEB.Slider('slider_qOn', 'track_qOn', 'h');
    slider_qOn.on_move = function(x,y) {
        change_qOn(x);
        document.getElementById('valueField_qOn').innerHTML
           =parseFloat(3600*get_qOn(),10).toFixed(0)+" veh/h";
        };
    }
);

function change_qOn(x){
    qOn=qOn_min
	+(qOn_max-qOn_min)*x/sliderWidth;
}

function get_qOn(){return qOn;}

function change_qOnSliderPos(qOn){
    var x=sliderWidth
	*(qOn-qOn_min)/(qOn_max-qOn_min);
    document.getElementById('valueField_qOn').innerHTML
        =parseFloat(3600*get_qOn(),10).toFixed(0)+" veh/h";
}





//#############################################
// Slider for long Model parameters (also update sliders.css!)
//#############################################


DYN_WEB.Event.domReady( function() {
    var slider_IDM_v0 
        = new DYN_WEB.Slider('slider_IDM_v0', 'track_IDM_v0', 'h');
    slider_IDM_v0.on_move = function(x,y) {
        change_IDM_v0(x);
        document.getElementById('valueField_IDM_v0').innerHTML
           =parseFloat(3.6*get_IDM_v0(),10).toFixed(0)+" km/h";
        };
    }
);


function change_IDM_v0(x){
    IDM_v0=IDM_v0_min +(IDM_v0_max-IDM_v0_min)*x/sliderWidth; 
    updateModels();

}

function get_IDM_v0(){return IDM_v0;}

function change_IDM_v0SliderPos(IDM_v0){
    var x=sliderWidth
	*(IDM_v0-IDM_v0_min)/(IDM_v0_max-IDM_v0_min);
    document.getElementById('valueField_IDM_v0').innerHTML
           =parseFloat(3.6*IDM_v0,10).toFixed(0)+" km/h";
}


//#############################################
// Slider for IDM_T (also update sliders.css!)
//#############################################


DYN_WEB.Event.domReady( function() {
    var slider_IDM_T 
        = new DYN_WEB.Slider('slider_IDM_T', 'track_IDM_T', 'h');
    slider_IDM_T.on_move = function(x,y) {
        change_IDM_T(x);
        document.getElementById('valueField_IDM_T').innerHTML
           =parseFloat(get_IDM_T(),10).toFixed(1)+" s";
        };
    }
);


function change_IDM_T(x){
    IDM_T=IDM_T_min
	+(IDM_T_max-IDM_T_min)*x/sliderWidth; 
    updateModels();
}

function get_IDM_T(){return IDM_T;}

function change_IDM_TSliderPos(IDM_T){
    var x=sliderWidth
	*(IDM_T-IDM_T_min)/(IDM_T_max-IDM_T_min);
    document.getElementById('valueField_IDM_T').innerHTML
           =parseFloat(IDM_T,10).toFixed(1)+" s";
}

//#############################################
// Slider for IDM_s0 (also update sliders.css!)
//#############################################

DYN_WEB.Event.domReady( function() {
    var slider_IDM_s0 
        = new DYN_WEB.Slider('slider_IDM_s0', 'track_IDM_s0', 'h');
    slider_IDM_s0.on_move = function(x,y) {
        change_IDM_s0(x);
        document.getElementById('valueField_IDM_s0').innerHTML
           =parseFloat(get_IDM_s0(),10).toFixed(1)+" m";
        };
    }
);


function change_IDM_s0(x){
    IDM_s0=IDM_s0_min
	+(IDM_s0_max-IDM_s0_min)*x/sliderWidth; 
    updateModels();
}

function get_IDM_s0(){return IDM_s0;}

function change_IDM_s0SliderPos(IDM_s0){
    var x=sliderWidth
	*(IDM_s0-IDM_s0_min)/(IDM_s0_max-IDM_s0_min);
    document.getElementById('valueField_IDM_s0').innerHTML
           =parseFloat(IDM_s0,10).toFixed(1)+" m";
}


//#############################################
// Slider for IDM_a (also update sliders.css!)
//#############################################


DYN_WEB.Event.domReady( function() {
    var slider_IDM_a 
        = new DYN_WEB.Slider('slider_IDM_a', 'track_IDM_a', 'h');
    slider_IDM_a.on_move = function(x,y) {
        change_IDM_a(x);
        document.getElementById('valueField_IDM_a').innerHTML
           =parseFloat(get_IDM_a(),10).toFixed(1)+" m/s<sup>2</sup>";
        };
    }
);

function change_IDM_a(x){
    IDM_a=IDM_a_min
	+(IDM_a_max-IDM_a_min)*x/sliderWidth; 
    updateModels();
}

function get_IDM_a(){return IDM_a;}

function change_IDM_aSliderPos(IDM_a){
    var x=sliderWidth
	*(IDM_a-IDM_a_min)/(IDM_a_max-IDM_a_min);
    document.getElementById('valueField_IDM_a').innerHTML
           =parseFloat(IDM_a,10).toFixed(1)+" m/s<sup>2</sup>";
}


//#############################################
// Slider for IDM_b (also update sliders.css!)
//#############################################

DYN_WEB.Event.domReady( function() {
    var slider_IDM_b 
        = new DYN_WEB.Slider('slider_IDM_b', 'track_IDM_b', 'h');
    slider_IDM_b.on_move = function(x,y) {
        change_IDM_b(x);
        document.getElementById('valueField_IDM_b').innerHTML
           =parseFloat(get_IDM_b(),10).toFixed(1)+" m/s<sup>2</sup>";
        };
    }
);

function change_IDM_b(x){
    IDM_b=IDM_b_min
	+(IDM_b_max-IDM_b_min)*x/sliderWidth; 
    updateModels();
}

function get_IDM_b(){return IDM_b;}

function change_IDM_bSliderPos(IDM_b){
    var x=sliderWidth
	*(IDM_b-IDM_b_min)/(IDM_b_max-IDM_b_min);
    document.getElementById('valueField_IDM_b').innerHTML
           =parseFloat(IDM_b,10).toFixed(1)+" m/s<sup>2</sup>";
}

