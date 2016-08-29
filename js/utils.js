define(['cannon', 'three', 'underscore'], function(CANNON, THREE, _) {

    function createItem(name, type, options) {
        if (!name) {
            return null;
        }

        const item = {},
            size = options.size || {x: 1, y: 1 ,z: 1},
            shape = new CANNON[type]((type !== 'Sphere') ?
            new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2) : size.x);

        item.name = name;
        item.body = new CANNON.Body({
            shape: shape,
            linearDamping: (typeof options.linearDamping === 'number') ?
                options.linearDamping : null,
            mass: (typeof options.mass === 'number') ? options.mass : 0,
            position:(typeof options.position !== 'undefined') ?
                new CANNON.Vec3(
                    options.position.x,
                    options.position.y,
                    options.position.z) :
                    null
        });

        const geometry = new THREE[type + 'Geometry'](size.x, size.y, size.z),
            material = options.material || new THREE.MeshLambertMaterial( {
            color: options.color || null,
            map: options.map || null
        });
        item.mesh = new THREE.Mesh(geometry, material);
        
        copyPositionFromBody(item);
        
        return item;
    }

    function positionWallsAndFloor(world) {
        for (let i = 0; i < world.worldObjectNames.length; i++) {
            const object = world.worldObjects[world.worldObjectNames[i]];
            if(object.name && ~object.name.indexOf('wall') || ~object.name.indexOf('floor')){
                copyPositionFromBody(object);
                // object.mesh.matrixAutoUpdate = false;
            }
        }
    }
    
    function copyPositionFromBody (object) {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
    }
    
    function mergeSolids (world, searchName) {
        const first = new THREE.CubeGeometry(1,1,1);
        world.worldObjectNames.find(function(name, idx){
            if(name.indexOf(searchName) >= 0){
                THREE.GeometryUtils.merge(first,  world.getObject(name).mesh);
            }
        });

        first.matrixAutoUpdate = false;
        
        return first;
    }
    
    return {
        createItem: createItem,
        positionWallsAndFloor: positionWallsAndFloor,
        copyPositionFromBody:copyPositionFromBody,
        mergeSolids: mergeSolids
    };
});
