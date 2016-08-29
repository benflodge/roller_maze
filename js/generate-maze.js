define([], function() {
    // Generate a random Maze, output the result as
    // an Ascii art layout compatible with level editor.
    // Map will have even length and width.

    const WALL = "#",
        FLOOR = " ",
        PLAYER = "%",
        END = "x",
        GAP = "$";

    const N = 1, // Y
        S = 2, // -Y
        E = 4, // -X
        W = 8; // X 
        
    const DX = {};
        DX[E] = 1; DX[W] = -1; DX[N] = 0; DX[S] = 0;
    const DY = {};
        DY[E] = 0; DY[W] = 0; DY[N] = -1; DY[S] = 1;
    const OPPOSITE = {};
        OPPOSITE[E] = W; OPPOSITE[W] = E; OPPOSITE[N] = S; OPPOSITE[S] = N;
        
    function createMap(size) {
        const grid = new Array(size);
        for(let i = 0; i < size; i++){
            grid[i] = new Array(size).fill(0);
        }
    
        carvePassage(0, 0, grid);
        
        return grid;
    }
    
    function carvePassage(cx, cy, grid) {
        const directions = getDirections();
        
        directions.forEach(function(dir){
            const nx = cx + DX[dir],
                ny = cy + DY[dir];
             
            if(between(ny, 0, grid.length -1) &&
                between(nx, 0, grid[ny].length -1) &&
                grid[ny][nx] === 0){
            
                grid[cy][cx] |= dir;
                grid[ny][nx] |= OPPOSITE[dir];
                
                carvePassage(nx, ny, grid);
            }
        });
    }
    
    function between(x, y, z){
        return (x >= y && x <= z);
    }
    
    function getDirections() {
        return [N, E, S, W].sort(function(a, b){
            return Math.floor((Math.random() * 3) - 1);
        });
    }

    function isNorth (grid, x, y) {
        return (grid[y][x] & N) === N;
    }
    function isSouth (grid, x, y) {
        return (grid[y][x] & S) === S;
    }
    function isEast (grid, x, y) {
        return (grid[y][x] & E) === E;
    }
    function isWest (grid, x, y) {
        return (grid[y][x] & W) === W;
    }
    
    function createAscii (grid) {
        const map = [];
        
        const top = WALL.repeat((grid.length * 2) + 1);
        map.push(top);
        
        for(let y = 0; y < (grid.length); y++){
            
            let row1 = WALL;
            let row2 = WALL;
            
            for(let x = 0; x < (grid.length); x++){
                eastClass = isEast(grid, x, y) ? FLOOR : WALL;
                southClass = isSouth(grid, x, y) ? FLOOR : WALL;
                
                row1 += (x === 0 && y === 0 ? PLAYER : FLOOR) + eastClass;
                row2 += southClass + WALL;
            }
            map.push(row1);
            map.push(row2);
        }
        
        return map;
    }
    
    function corruptMap (map, chanceToRemoveWall) {
        let split;
        for (let i = 1; i < map.length - 1; i++) {
            split = map[i].split('');
            
            for (let k = 0; k < split.length; k++) {
                if(k > 1 && k < (split.length - 1) && split[k] === WALL &&
                    (Math.random() < chanceToRemoveWall)) {
                    split[k] = GAP;
                }
            }

            map[i] = split.join('');
        }
        return map;
    }

    function setEndpoint (map) {
        const split = map[map.length - 2].split('');
        split[1] = END;

        map[map.length - 2] = split.join('');
        return map;
    }
    
    function generateMap (size, difficulty){
        size = size || 11;
        
        const grid = createMap(size),
            asciiMap = createAscii(grid),
            map = corruptMap(asciiMap, difficulty || 0.1),
            mapWithEndpoint = setEndpoint(map);
        
        return mapWithEndpoint;
    }
    
    return {
        generateMap: generateMap
    };
});
