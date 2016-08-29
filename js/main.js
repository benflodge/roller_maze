define([
    'cannon',
    'three',
    'underscore',
    'generate-maze',
    'keys',
    'utils',
    'create-map'

 ], function(CANNON, THREE, _, map, controls, utils, createMap) {

    const textureLoader = new THREE.TextureLoader(),
        TIME_STEP = 1/60,
        VELOCITY_FACTOR = 0.9;

    // Track player score of completed levels
    let completed = 0;

    const WORLD = {
        events: [],
        worldObjects: {},
        worldObjectNames: [],
        world: null,
        scene: null,
        renderer: null,
        animationFrame: null,
        initalPlayerPosition: null,
        destroyWorldNow: false,
        inputVelocity: new THREE.Vector3(),

        addObject: function(obj) {
            if(!obj.name){
                return;
            }
            this.worldObjects[obj.name] = obj;
            this.worldObjectNames.push(obj.name);

            this.world.addBody(obj.body);
            this.scene.add(obj.mesh);
        },
        
        getObject: function(name) {
            return (name) ? this.worldObjects[name] : null;
        },
        
        setWorld: function(newWorld) {
            if(this.world){
                console.warn("Warning: World already set");
            }
            this.world = newWorld;
        },
        
        setScene: function(newScene) {
            if(this.scene){
                console.warn("Warning: Scene already set");
            }
            this.scene = newScene;
        },
        
        setRenderer: function(newRenderer) {
            if(this.renderer){
                console.warn("Warning: Renderer already set");
            }
            this.renderer = newRenderer;
        },
        
        setCamera: function(newCamera) {
            if(this.camera){
                console.warn("Warning: Camera already set");
            }
            this.camera = newCamera;
        },
        
        destroyWorld: function(){
            let obj = null;
            cancelAnimationFrame(this.animationFrame);
        
            // remove event listeners (background and end)
            this.events.forEach(function(obj){
                obj.el.removeEventListener('collide', obj.fn);
            });
            
            this.events = [];

            for (let i = 0; i < this.worldObjectNames.length; i++) {
                const thing = this.worldObjects[this.worldObjectNames[i]];
                
                if(thing.body) {
                    this.world.removeBody(thing.body);
                }
            }
            
            while (this.scene.children.length > 0) {
                obj = this.scene.children[0];
      
                this.scene.remove(obj);
                
                if(obj.material){
                    obj.material.dispose();
                    obj.geometry.dispose();
                }
                
                this.renderer.dispose(obj);
				this.renderer.dispose(obj.geometry);
				this.renderer.dispose(obj.material);
            }
            
            this.worldObjects = {};
            this.worldObjectNames = [];
            this.world = null;
        },
        
        setUniforms: function() {

            this.uniforms = {
                fogDensity: {
                    type: "f",
                    value: 0.00015
                },
                fogColor: {
                    type: "v3",
                    value: new THREE.Vector3(0, 0, 0)
                },
                time: {
                    type: "f",
                    value: 1
                },
                resolution: {
                    type: "v2",
                    value: new THREE.Vector2()
                },
                uvScale: {
                    type: "v2",
                    value: new THREE.Vector2(3.0, 1.0)
                },
                texture1: {
                    type: "t",
                    value: textureLoader.load("assets/img/cloud.png")
                },
                texture2: {
                    type: "t",
                    value: textureLoader.load("assets/img/lavatile.jpg")
                }
            };
            
            this.uniforms.texture1.value.wrapS = this.uniforms.texture1.value.wrapT =
                THREE.RepeatWrapping;
            this.uniforms.texture2.value.wrapS = this.uniforms.texture2.value.wrapT =
                THREE.RepeatWrapping;
            this.uniforms.resolution.value.x = window.innerWidth;
            this.uniforms.resolution.value.y = window.innerHeight;
        },
        
        initCannon: function () {
            const world = new CANNON.World(),
                // Create a slippery material (friction coefficient = 0.0)
                physicsMaterial = new CANNON.Material("slipperyMaterial"),
                physicsContactMaterial = new CANNON.ContactMaterial(
                physicsMaterial,
                physicsMaterial,
                {
                    friction:0.0,
                    restitution: 0.0
                });
        
            // We must add the contact materials to the world
            world.addContactMaterial(physicsContactMaterial);
            world.gravity.set(0, 0, -20);
            world.broadphase = new CANNON.NaiveBroadphase();
            world.solver.iterations = 10;
            
            this.setWorld(world);
        },
    
        initThree: function() {
            const scene = new THREE.Scene(),
                renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }),
                container = document.getElementById('container');
    
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0x000000, 0);
            
            container.appendChild(renderer.domElement);
    
            this.setScene(scene);
            this.setRenderer(renderer);
        },
        
        lightsCameraAction: function() {
            
            const VIEW_ANGLE = 45,
                ASPECT =  window.innerWidth / window.innerHeight,
                NEAR = 1,
                FAR = 10000;
                
            const camera = new THREE.PerspectiveCamera(
                VIEW_ANGLE,
                ASPECT,
                NEAR,
                FAR);
                
            // the camera starts at 0,0,0 so pull it back 
            // camera.position.set(15, -35, 25);
            // camera.rotation.x = 0.2;
    
            this.scene.add(camera);
            camera.updateProjectionMatrix();
    
            const light = new THREE.DirectionalLight(0xffffff, 1.1);
            light.position.set(1, 91, 0).normalize();
            this.scene.add(light);
    
            const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
            light1.position.set(-51, 51, 22).normalize();
            this.scene.add(light1);
    
            this.setCamera(camera);
        },
        
        animate: function() {
            if(this.destroyWorldNow) {
                this.destroyWorldNow = false;
                this.end();
                return;
            }
            
            const newTime = Date.now();
            this.movement(newTime - this.time);
            this.updatePhysics();
            this.render();
            this.time = newTime;
            this.animationFrame = requestAnimationFrame(this.animate.bind(this));
        },
    
        movement: function(delta) {
    
            this.uniforms.time.value += 0.002 * delta;
    
            delta *= 0.1;
    
            this.inputVelocity.set(0,0,0);
    
            if (controls.keys.moveForward){
                this.inputVelocity.y = VELOCITY_FACTOR * delta;
            }
            if (controls.keys.moveBackward){
                this.inputVelocity.y = -VELOCITY_FACTOR * delta;
            }
            if (controls.keys.moveLeft){
                this.inputVelocity.x = -VELOCITY_FACTOR * delta;
            }
            if (controls.keys.moveRight){
                this.inputVelocity.x = VELOCITY_FACTOR * delta;
            }
    
            this.player.body.velocity.x += this.inputVelocity.x;
            this.player.body.velocity.y += this.inputVelocity.y;
        },
    
        updatePhysics: function() {
            // Step the physics world
            this.world.step(TIME_STEP);
            
            // Copy coordinates from Cannon.js to Three.js
            for (let i = 0; i < this.worldObjectNames.length; i++) {
                const object = this.worldObjects[this.worldObjectNames[i]];
                if(object.name && !~object.name.indexOf('wall') && !~object.name.indexOf('floor')){
                    // Only set coords on movable things
                    utils.copyPositionFromBody(object);
                }
            }
    
            const playerPos = WORLD.worldObjects['player'].mesh.position;
            this.camera.position.set(playerPos.x, playerPos.y, playerPos.z + 20);
        },
    
        render: function() {
            this.renderer.render(this.scene, this.camera);
        },
        
        end: function() {
            console.log("The ball just got to the end, well done!");

            completed ++;
            const scoreUi = document.querySelector("#completed");
            if (scoreUi) {
                scoreUi.innerText = completed;
            }

            this.destroyWorld();
            window.setTimeout(this.setup.bind(this), 100);
        },
    
        fall: function() {
            console.log("The ball just fell down a hole!");

            this.player.body.position.x = this.initalPlayerPosition.x;
            this.player.body.position.y = this.initalPlayerPosition.y;
            this.player.body.position.z = this.initalPlayerPosition.z;
        },

        onWindowResize: function() {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = (window.innerWidth / window.innerHeight);
            this.camera.updateProjectionMatrix();
        },
    
        setup: function() {
            const thePlan = map.generateMap(11);
            
            this.initCannon();
            
            createMap(thePlan, this);
            
            this.lightsCameraAction();

            this.time = Date.now() - 16;
            
            this.animate();
        },
        
        initialize: function () {
            this.setUniforms();
            
            controls.addListeners();
            this.initThree();
            this.setup();

            const throttleOnWindowResize = _.throttle(this.onWindowResize.bind(this), 200);
            window.addEventListener('resize', throttleOnWindowResize);
        }
    };

    WORLD.initialize();
});
