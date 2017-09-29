if (!Detector.webgl) Detector.addGetWebGLMessage();

class Turbine { //extends?
    
    constructor(obj, isShow) {
        this.obj = obj;
        this.obj.visible = isShow;
        var blade = this.blade = obj.children[1];
        blade.rotation.x = Math.random(Math.PI * 2);
        this.speed = 0;
    }
    
    appear(callback, quick = 1){
        this.obj.visible = true;
        this.blade.visible = false;
        
        //TODO: problem with the same inner obj after clone() ?!
        this.obj.scale.y = 0.01;
        createjs.Tween.get(this.obj.scale).to({y:0.6}, 1000 / quick).call(() => { 
            this.blade.visible = true;
            this.blade.position.x = 15;
            createjs.Tween.get(this.blade.position).to({x:0}, 1000 / quick, createjs.Ease.quadOut).call(() => { 
                createjs.Tween.get(this).to({speed:2}, 5000 / (quick * quick) ).call(callback); //(Math.random() + 2) * 1.2
            });
        });
    }
  
    /*get blade() {
        return this.calcArea();
    }

    calcArea() {
        return this.height * this.width;
    }*/
}

const NUM_TURBINES = 1;
var container, stats, clock, mixer;
var camera, scene, renderer;
var turbines = [], pointLight;

init();
animate();

function moveCameraUp() {
    createjs.Tween.get(camera.position).to({
        y:camera.position.y + 50 
    }, 2000, createjs.Ease.quadOut);
}

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 2000 );
    //camera.position.set( 10, 4, 40 );
    camera.position.set(25, 2, 0);

    clock = new THREE.Clock();

    scene = new THREE.Scene();
   
    mixer = new THREE.AnimationMixer( scene );

    // BEGIN Clara.io JSON loader code
    var objectLoader = new THREE.ObjectLoader();
    objectLoader.load("models/wind-turbine/wind-turbine.json", function ( obj ) {  
        for (var i=0; i < NUM_TURBINES; i++)
        {
            if (i==0){
                obj.scale.set(0.6, 0.6, 0.6);
                obj.position.y = -4;

                obj.remove(obj.children[0], obj.children[1], obj.children[2]); // unneseccary

                // changing pivot point
                var dy = -7.75;
                var mesh = obj.children[0];
                var pivot = new THREE.Group();
                mesh.position.y = dy;
                pivot.position.y = -dy;
                pivot.add( mesh );
                obj.add( pivot );
            }
            else{
                obj = obj.clone();
            }

            obj.position.z = (i - (NUM_TURBINES - 1) * 0.5) * 5;
            obj.position.x = 10 -Math.abs((i - (NUM_TURBINES - 1) * 0.5) * 5);
            scene.add( obj );
            
            var turbine = new Turbine(obj, false);
            turbines.push( turbine );
            setTimeout(() => {
                turbine.appear(moveCameraUp, 1);
            }, 100)
        }
    } );
    // END Clara.io JSON loader code


    // lights

    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    pointLight = new THREE.PointLight( 0xffffff, 5, 30 );
    pointLight.position.set( 5, 8, 0 );
    scene.add( pointLight );

    // renderer

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    // stats

    stats = new Stats();
    container.appendChild( stats.dom );

    // events

    window.addEventListener( 'resize', onWindowResize, false );

}

//

function onWindowResize( event ) {

    renderer.setSize( window.innerWidth, window.innerHeight );

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    var timer = Date.now() * 0.0005;

    //camera.position.x = Math.cos( timer ) * 10;
    //camera.position.y = 4;
    //camera.position.z = Math.sin( timer ) * 10;

    //pointLight.position.x = Math.cos( timer ) * 10;
    //pointLight.position.z = Math.sin( timer ) * 10;

    for (var i=0; i < turbines.length; i++){
        var turbine = turbines[i];
        turbine.blade.rotation.x += clock.getDelta() * turbine.speed;
    }

    mixer.update( clock.getDelta() );

    camera.lookAt( scene.position );

    renderer.render( scene, camera );

}
