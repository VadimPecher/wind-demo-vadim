if (!Detector.webgl) Detector.addGetWebGLMessage();

class Turbine {
    
    constructor(obj) {
        
        this.destX = 10;
        this.obj = obj;
        var blade = this.blade = obj.children[1];
        blade.rotation.x = Math.random(Math.PI * 2);
        this.addLine();
        this.addParticles();
    }
    
    init() {
        
        this.obj.visible = false; 
        this.pinPlane.visible = false;
        this.particleSystem.visible = false;
        this.speed = 0;
        this.timeScale = 0;
        this.particleOptions.position = this.obj.position.clone();
    }
    
    appear(callback, quick = 1) {
        
        this.obj.visible = true;
        this.blade.visible = false;
        
        this.obj.scale.y = 0.01;
        createjs.Tween.get(this.obj.scale).to({y:0.6}, 1000 / quick).call(() => { 
            this.blade.visible = true;
            this.blade.position.x = 15;
            createjs.Tween.get(this.blade.position).to({x:0}, 1000 / quick, createjs.Ease.quadOut).call(() => { 
                var tween = createjs.Tween.get(this).to({speed:2}, 3000 / quick);
                if (callback) tween.call(callback);
            });
        });
    }
    
    addLine() {
        
        var l = this.destX + this.obj.position.x;
        var geometry = new THREE.PlaneGeometry(l, 0.2);
        var material = new THREE.MeshBasicMaterial({color: 0xccffcc});
        var plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI * 0.5;
        
        plane.position.z = this.obj.position.z;
        plane.position.y = this.obj.position.y;
        
        var pin = new THREE.Group();
        pin.add(plane);
        plane.position.x = -l * 0.5;
        scene.add(pin);
        pin.position.x = this.obj.position.x;
        this.pinPlane = pin;
        this.pinPlane.visible = false;
    }
        
    showLine() {
        
        this.pinPlane.visible = true;
        this.pinPlane.scale.x = 0;
        createjs.Tween.get(this.pinPlane.scale).to({x:1}, 2000).call(() => { 
            this.particleSystem.visible = true;
            this.timeScale = 0.3; 
        });
    }
    
    addParticles() {
        
        this.particleSystem = new THREE.GPUParticleSystem({
            maxParticles: 1000 // radically affects CPU load
        });
        scene.add(this.particleSystem);

        this.particleOptions = {
            position: new THREE.Vector3(),
            positionRandomness: .13,
            velocity: new THREE.Vector3(),
            velocityRandomness: 1.3,
            color: 0xccffcc,
            colorRandomness: 0.2,
            turbulence: 0,//0.5,
            lifetime: 1.0,
            size: 4.0,
            sizeRandomness: 10.0
        };   
    }
    
    render(deltaT) {
        
        this.blade.rotation.x += deltaT * this.speed;
    
        if (this.particleSystem && this.timeScale > 0.01)
        {
            this.particleOptions.position.x -= deltaT * 10;
            if (this.particleOptions.position.x < -this.destX) this.particleOptions.position.x = this.obj.position.x;
            
            var particlesNum = Math.abs(4000 * deltaT * this.timeScale);
            for (var i = 0; i < particlesNum; i++) {
                this.particleSystem.spawnParticle(this.particleOptions);
            }
            this.particleSystem.update(tick);
        }
    }
}

const NUM_TURBINES = 7;
var container, restartText, stats, clock, tick = 0;
var camera, scene, renderer;
var turbines = [], pointLight, centerI;

init();
animate();

function moveCameraUp(t = 2000) {
    
    createjs.Tween.get(camera.position).to({
        y:50 
    }, t, createjs.Ease.quadOut)
    .call(showLines);
}

function showLines() {
    
    for (let i=0; i < NUM_TURBINES; i++)
    {
        turbines[i].showLine();
    }
    setTimeout(() => { 
        restartText.style.display = 'block';
    }, 2000);
}

function appearRestTurbines() {
    
    for (let i=0; i < NUM_TURBINES; i++)
    {
        let turbine = turbines[i];
        if (i == centerI) continue;
        setTimeout(() => {
            turbine.appear(i == 0 ? () => { 
                setTimeout(moveCameraUp, 1000); 
            } : null, 2);
        }, Math.abs((i - (NUM_TURBINES - 1) * 0.5) * 500));
    }
}

function restart() {
    
    startAppear();
}

function startAppear() {
    
    for (let i=0; i < NUM_TURBINES; i++)
    {
        turbines[i].init();
    }
    camera.position.set(25, 2, 0);
    turbines[centerI].appear(appearRestTurbines, 1);
    restartText.style.display = 'none';
    
    //moveCameraUp(1); // test
}

function init() {

    container = document.getElementById('container');
    restartText = document.getElementById('restart');

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);
    clock = new THREE.Clock();
    scene = new THREE.Scene();

    // Clara.io JSON loader
    
    var objectLoader = new THREE.ObjectLoader();
    objectLoader.load("models/wind-turbine/wind-turbine.json", function (obj) { 
        centerI = Math.round((NUM_TURBINES - 1) * 0.5);
        for (var i=0; i < NUM_TURBINES; i++) 
        {
            if (i==0) {
                obj.scale.set(0.6, 0.6, 0.6);
                obj.position.y = -4;

                obj.remove(obj.children[0], obj.children[1], obj.children[2]); // unnecessary objects from the model

                // changing pivot point
                var dy = -7.75;
                var mesh = obj.children[0];
                var pivot = new THREE.Group();
                mesh.position.y = dy;
                pivot.position.y = -dy;
                pivot.add(mesh);
                obj.add(pivot);
            }
            else{
                obj = obj.clone(true);
            }

            obj.position.z = (i - (NUM_TURBINES - 1) * 0.5) * 5; // left to right
            obj.position.x = 10 -Math.abs((i - (NUM_TURBINES - 1) * 0.5) * 5); // depth
            scene.add(obj);
            
            var turbine = new Turbine(obj);
            turbines.push(turbine);
        }
        startAppear();
    });
    
    // lights

    var ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);

    pointLight = new THREE.PointLight(0xffffff, 5, 30);
    pointLight.position.set(5, 8, 0);
    scene.add(pointLight);

    // renderer

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // stats

    stats = new Stats();
    container.appendChild(stats.dom);

    // events

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize(event) {

    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();
}

function render() {

    var deltaT = clock.getDelta();
    tick += deltaT;

    for (var i=0; i < turbines.length; i++) {
        turbines[i].render(deltaT);
    }

    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}
