define([
    'three',
    'underscore',
    'utils'

 ], function(THREE, _, utils) {
    // Create the geomotry for the maze from a Ascii Art level plan.
    // This gives support for custom levels as well as auto generated 
    // maps.

    const WALL = "#",
        FLOOR = " "
        PLAYER = "%",
        END = "x";

    function createMap(thePlan, world) {
        let currentRow,
            currentChr,
            count;
    
        createGround.call(world, thePlan);

        for (let i = 0; i < thePlan.length; i++) {
            currentRow = thePlan[i];
            for (let j = 0; j < currentRow.length; j++) {
                currentChr = currentRow[j];

                //Count number of spaces the symbol is repeated
                count = 0;
                for (let k = j; k < currentRow.length &&
                    currentRow[k] === currentChr; k++) {
                        count ++;
                }

                switch(currentChr){
                    case (WALL):
                        createWall.call(world, count, j, i);
                        break;
                    case (PLAYER):
                        addPlayer.call(world, j, i);
                        /* Fall Though */
                    case (FLOOR):
                        addFloor.call(world, count, j, i);
                        break;
                    case (END):
                        addEnd.call(world, count, j, i);
                        break;
                }
                j = j + count - 1;
            }
        }
        
        utils.mergeSolids(world, 'floor');
        utils.mergeSolids(world, 'wall');
    }

    function createGround(thePlan) {
        const floor = utils.createItem('plane', 'Plane', {
            size: {
                x: thePlan[0].length * 4,
                y: thePlan.length * 4 ,
                z: 32
            },
            position: {
                x: (thePlan[0].length * 0.5) -1,
                y: -((thePlan.length * 0.5) -1) ,
                z: -10
            },
            material: new THREE.MeshPhongMaterial({
                opacity: 0,
                transparent: true,
            }),
            mass: 0,
        });
        
        //keep refrence to throttle event
        const throttleFall = _.throttle(this.fall.bind(this), 1000);
        
        floor.body.addEventListener("collide", throttleFall);
        this.events.push({
            el: floor.body,
            ev:"collide",
            fn: throttleFall
        });
        this.addObject(floor);
    }
    
    function createWall(count, j, i){
        const thing = utils.createItem('wall_x:' + j + '_y:' + i, 'Box', {
            size: {
                x: count,
                y: 1,
                z: 2
            },
            position: {
                x: j + (count / 2),
                y: -(i * 1),
                z: 0
            },
            mass: 0,
            color: 0x00cdcd
        });

        this.addObject(thing);
    }

    function addPlayer(j, i) {
        const texture = THREE.ImageUtils.loadTexture( "assets/img/crate.gif" );
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = this.renderer.getMaxAnisotropy();

        this.player = utils.createItem('player', 'Sphere', {
            size: {
                x: 0.3,
                y: 14,
                z: 14
            },
            position: {
                x: j * 1 + 0.5,
                y: -(i * 1),
                z: 1
            },
            linearDamping: 0.099,
            mass: 99,
            map: texture
        });
        
        this.initalPlayerPosition = {
            x: j * 1 + 0.5,
            y: -(i * 1),
            z: 1
        };
        
        this.addObject(this.player);
    }
    
    function addFloor(count, j, i) {
        const name = 'floor_x:' + j + '_y:' + i,
            thing = utils.createItem(name, 'Box', {
            size: {
                x: count,
                y: 1,
                z: 0.1
            },
            position: {
                x: j + (count / 2),
                y: -(i * 1),
                z: 0
            },
            mass: 0,
            color: 0x195f77
        });
        this.addObject(thing);
    }
    
    function addEnd(count, j, i) {
        const name = 'end_x:' + j + '_y:' + i,
            thing = utils.createItem(name, 'Box', {
            size: {
                x: count,
                y: 1 ,
                z: 0.1
            },
            position: {
                x: j + (count / 2),
                y: -(i * 1),
                z: 0
            },
            mass: 0,
            color: 0xFECA1D
        });

        this.addObject(thing);

        const width = 1;
        const height = 1;
        const intensity = 999;
        const rectLight = new THREE.RectAreaLight( 0xFECA1D, intensity,  width, height );
        rectLight.position.set( j + (count / 2), -(i * 1), 1 );
        // rectLight.lookAt( 0, 0, -5 );

        this.scene.add(rectLight);
        
        const throttleEnd = _.throttle(function(){
            this.destroyWorldNow = true;
        }, 1000);
        
        thing.body.addEventListener("collide", throttleEnd.bind(this));
        
        this.events.push({
            el: thing.body,
            ev:"collide",
            fn: throttleEnd
        });
    }
    
    return createMap;
});