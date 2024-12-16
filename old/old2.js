// make a number negative, if the number is 0, return 0
function revsn(num) {
    return num === 0 ? 0 : -num;
}

// like a diode, only letting a number go on one direction and preventing 
//  it from going above or below zero depending on the direction
// (direction = true) = can't go negative, (direction = false) = can't go positive
function halfcut(num, direction) {
    if (direction) {
        return (num > 0) ? num : 0;
    } else {
        return (num < 0) ? num : 0;
    }
}

// old collision detection now we use REAL function like range_collision
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}



// highly costumizable collision function that can have different collision type depending on the input
function range_collision(x, y, width, height, rect2, precision = false) {
    switch (precision) {
        case false:
            return x < rect2.x + rect2.width &&
                x + width > rect2.x &&
                y < rect2.y + rect2.height &&
                y + height > rect2.y;
        case "x":
            return x <= rect2.x + rect2.width &&
                x + width >= rect2.x &&
                y < rect2.y + rect2.height &&
                y + height > rect2.y;
        case "y":
            return x < rect2.x + rect2.width &&
                x + width > rect2.x &&
                y <= rect2.y + rect2.height &&
                y + height >= rect2.y;
        // snapfloor check floors from all the way to the bottom, so they can "snap" the player up when they're inside the block
        case "snapfloor":
            return x < rect2.x + rect2.width &&
                x + width > rect2.x &&
                y <= rect2.y + rect2.height &&
                y + height > rect2.y;
        case "floor":
            return x < rect2.x + rect2.width &&
                x + width > rect2.x &&
                y <= rect2.y + rect2.height / 4 &&
                y + height > rect2.y;
        case "ceil":
            return x < rect2.x + rect2.width &&
                x + width > rect2.x &&
                y < rect2.y + rect2.height &&
                y + height >= rect2.y;
        default:
            return x <= rect2.x + rect2.width &&
                x + width >= rect2.x &&
                y <= rect2.y + rect2.height &&
                y + height >= rect2.y;
    }
}

// check if value of x and y touches the x and y of an object, it's just collision detection but without the first object
function place_meeting(x, y, obj) {
    return x >= obj.x && x <= obj.x + obj.width &&
        y >= obj.y && y <= obj.y + obj.height;
}

// cycle through array of images, animate them and using counter to keep track of which is which
function animation_sequence(images, counter, speed, fps = 60) {
    const frameindex =  Math.floor((counter / speed) % images.length);
    return images[frameindex];
}

// draw grid in canvas for easy measuring
function drawGrid(ctx, width, height, cellSize) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = 0; y <= height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

}

// the unit that will be used for tiles, currently 16 and will probably always be
const amplification = 16;

// multiply by 16 so that position can be counted using grid tiles instead of pixels
function amp(value) {
    return value * amplification;
}

// divide value by the amplified grid value
function ampdiv(value, amp = 16) {
    return parseInt(value / amp);
}

// reverse height to make placing easier, would not use later
function xPosR(x, height) {
    return x - height;
}

// truncate float num to specified point
function cutprecision(num, fixed) {
    return parseFloat(num.toFixed(fixed));
}

// random integer from min to max
function randint(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number') {
        throw new TypeError('Both min and max must be numbers.');
    }
    if (min > max) {
        throw new RangeError('min must be less than or equal to max.');
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// obsolete, find obj from array
function findObjXandY(objectArray, x, y) {
    return objectArray.find(obj => obj.x === x && obj.y === y);
}

// cut array and return a slice of it that's specified
function failsafeSLICE(array, a, b) {
    a = parseInt(a);
    b = parseInt(b);
    if (a < 0) {
        a = 0;
    } else if (b >= array.length) {
        b = array.length - 1;
    } else if (a > b) {
        throw new Error("Invalid range");
    }
    return array.slice(a, b + 1);
}

function unblurprint(ctx, string, x, y, spacing = 8) {
    for (let t = 0; t < string.length; t++) {
        ctx.fillText(string[t], x + (t * spacing), y);
    }
}

class UpdateObjects {
    constructor() {
        this.playerInteractible = [];
        this.updatelist = [];
    }

    insert(theObject) {
        this.updatelist.push(theObject);    
    }

    bulkinsert(theObjects) {
        this.updatelist.push(...theObjects);    
    }

    update() {
        this.updatelist.forEach(obj => {
            if (obj.toggleupdate) {
                obj.update();
            }
        });
    }

    remove(theObject) {
        let index = this.updatelist.indexOf(theObject);
        this.updatelist.splice(index, 1);
    }
}

class RenderOrder {
    constructor(maxlayers) {
        this.length = maxlayers; 
        this.list = Array.from({ length: maxlayers }, () => [])
    }

    insert(insertedObj) {
        const index = insertedObj.depth;
        if (index > this.length - 1) {
            index = this.length - 1;
        } else if (index < 0) {
            index = 0;
        }
        this.list[index].push(insertedObj);
    }

    bulkinsert(insertedObjs) {
        insertedObjs.forEach(eachobj => {
            if (!eachobj.depth) {
                console.log("no object on insertion")
                return;
            }
            this.insert(eachobj, eachobj.depth)
        });
    }

    remove(insertedObj) {
        let objIndex = this.list[insertedObj.depth].indexOf(insertedObj);
        this.list[insertedObj.depth].splice(objIndex, 1);
    }
}

const bus = {
    mapWidth: 0,
    mapHeight: 0,
    screenWidth: 256,
    screenHeight: 240,
    coins: 0,
    compiledWall: null,
    updateObjects: new UpdateObjects(),
    movingPlatform: false,
    globalCounter: 0,
    player: null,
    enemy: [],
    //entity are objects that can move around AND interact with player, if it only moves it's a MovingObject
    entity: [],
    orderedRender: new RenderOrder(100),
    camera: null,
    bgcolor: "",
};

function addEffect(theAnimatedObject) {
    bus.orderedRender.insert(theAnimatedObject);
    bus.updateObjects.insert(theAnimatedObject);
}

class Instance {
    constructor(x, y, width, height, color, depth = 1, toggleupdate = true, togglecollision = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.dx = 0;
        this.dy = 0;
        this.speed = 5;
        this.bx = x + width;
        this.by = y + height;
        this.depth = depth;

        this.toggleupdate = toggleupdate;
        this.togglecollision = togglecollision;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(keyState) {

    }

    // tp(tx, ty) {
    //     const relativity = [0, 0];
    //     if (tx[0] == "~") relativity[0] = (tx.length > 1) ? tx.slice(1) : 0;
    //     if (ty[0] == "~") relativity[1] = (ty.length > 1) ? ty.slice(1) : 0;

    //     this.x = (tx[0] == "~") ? this.x + parseFloat(relativity[0]) : tx;
    //     this.y = (ty[0] == "~") ? this.y + parseFloat(relativity[1]) : ty;
    // }

    coor() {
        return [this.x, this.y];
    }
}

class GameObject extends Instance {
    constructor(x, y, width, height, color, depth = 1, collision = [true, true, true], ceilbounce = false, toggleupdate = true, togglecollision = true) {
        super(x, y, width, height, color, depth, toggleupdate, togglecollision);
        this.dx = 0;
        this.dy = 0;
        this.ceilbounce = false;
        if (collision == "none") {
            this.wallcol = false;
            this.ceilcol = false;
            this.floorcol = false;
        } else if (collision == "all") {
            this.wallcol = true;
            this.ceilcol = true;
            this.floorcol = true;
        } else {
            this.wallcol = collision[0];
            this.ceilcol = collision[1];
            this.floorcol = collision[2];
        }
    }

    update(keyState) {

    }
}

class Mario extends Instance {
    constructor(x, y, width, height, color, depth = 1) {
        super(x, y, 16, 16, color, depth);
        this.gravity = 0.4;
        this.jumpSpeed = 0;
        this.jumpMaxSpeed = 3;
        this.jumpdistance = 0;
        this.jumpinitial = true;
        this.acceleration = 0.25;
        this.deceleration = 0.25;
        this.maxspeed = 3;
        this.grounded = false;
        this.mapWidth = bus.mapWidth;
        this.mapHeight = bus.mapHeight;
        this.prevfloor = false;
        this.prevceil = false;
        this.wallcollision = false;
        this.maxjump = 60;
        this.prevX = 0;
        this.prevY = 0;

        // 0 = dead
        // 1 = small
        // 2 = big
        // 3 = fireflower
        // 4 = star
        this.playerproperty = {
            state: 2,
        };

        this.keyState = "";
        this.facingDirection = 1;

        this.spritefolder = "./sprite/mario";
        this.sprite = new Image();
        this.sprite.src = this.spritefolder + "/right/idle_right.png";
        // this.anispeed = 10;

        this.collidingY = this.mapHeight - this.height;
        this.grounded = this.y >= this.collidingY;
        this.freefall = 0;
        this.coyotetime = 6;
        this.death = 1;
        this.deathanimationtime = 30;
        this.checkedWall = [];
        // coyote time range from 1-10, 1 is just too small, 10 is too much, so in between

        if (this.playerproperty.state == 1) {
            this.spritefolder = "./sprite/mario";
        } else if (this.playerproperty.state == 2) {
            this.spritefolder = "./sprite/mario";
        }
    }

    draw(ctx) {
        if (this.death < 1) {
            this.sprite.src = this.spritefolder + "/mario_dead.png";
            ctx.drawImage(this.sprite, this.x, this.y,this.width, this.height);
            if (this.deathanimationtime < 1) {
                addEffect(new MarioDead(this.x, this.y, 10));
                this.draw = (ctx) => {};
            }
            this.deathanimationtime -= 1;
            return;
        }
        if (this.jumpdistance > 0) {
            if (this.facingDirection == 1) {
                this.sprite.src = this.spritefolder + "/right/jump_right.png";
            } else {
                this.sprite.src = this.spritefolder + "/left/jump_left.png";
            }
        } else {
            if (this.keyState['ArrowRight']) {
                if (this.dx < -1 || this.dx == -1) {
                    this.sprite.src = this.spritefolder + "/right/turning_right.png";
                } else {
                    this.facingDirection = 1;
                    this.sprite.src = animation_sequence([
                        this.spritefolder + "/right/walk1_right.png",
                        this.spritefolder + "/right/walk2_right.png",
                        this.spritefolder + "/right/walk3_right.png",
                    ], bus.globalCounter, 10 / parseInt(this.dx));
                }
            } else if (this.keyState['ArrowLeft']) {
                if (this.dx > 1) {
                    this.sprite.src = this.spritefolder + "/left/turning_left.png";
                } else {
                    this.facingDirection = -1;
                    this.sprite.src = animation_sequence([
                        this.spritefolder + "/left/walk1_left.png",
                        this.spritefolder + "/left/walk2_left.png",
                        this.spritefolder + "/left/walk3_left.png",
                    ], bus.globalCounter, 10 / parseInt(Math.abs(this.dx)));
                }
            } else {
                if (this.facingDirection == 1) {
                    this.sprite.src = this.spritefolder + "/right/idle_right.png";
                } else {
                    this.sprite.src = this.spritefolder + "/left/idle_left.png";
                }
            }
        }
        
        ctx.drawImage(this.sprite, this.x, this.y,this.width, this.height);

    }

    update(keyState) {
        if (this.death < 1) {
            return;
        }
        this.keyState = keyState;
        // jump
        // console.log(xPosR(this.y, this.mapHeight));            
        this.grounded = this.y >= this.collidingY;

        if (keyState[' '] && this.jumpinitial) {
            if (this.jumpdistance < this.maxjump) {
                this.jumpSpeed = (this.jumpSpeed < 1) ? this.jumpSpeed + 1 : this.jumpMaxSpeed;
                this.jumpdistance += this.jumpSpeed;
            } else {
                this.jumpinitial = false;
            }
            this.dy = -this.jumpSpeed;
        } else {
            if (this.grounded) {
                this.jumpinitial = true;
                this.jumpdistance = 0;
                this.dy = 0;
                this.jumpSpeed = 0;
                this.y = this.collidingY;
                this.freefall = 0;
            } else {
                this.freefall += 1;
                if (this.freefall > 1 && this.freefall < this.coyotetime && this.dy > 0 
                    && this.jumpSpeed == 0) {
                    this.jumpinitial = true;
                } else {
                    this.jumpinitial = false;
                }
                this.dy += this.gravity;
            }
        }

        if (keyState['ArrowRight']) {
            this.dx += this.acceleration;
            if (this.dx > this.maxspeed) {
                this.dx = this.maxspeed;
            }
        } else if (keyState['ArrowLeft']) {
            this.dx -= this.acceleration;
            if (this.dx < -this.maxspeed) {
                this.dx = -this.maxspeed;
            }
        } else {
            if (this.dx > 0) {
                this.dx -= this.deceleration;
                this.dx = halfcut(this.dx, true);
            } else {
                this.dx += this.deceleration;
                this.dx = halfcut(this.dx, false);
            }
        }

        // Wrap around the world edges
        if (this.x + this.width < 0) {
            this.x = this.mapWidth;
        } else if (this.x > this.mapWidth) {
            this.x = -this.width;
        }

        // COLLISION -----------------------------------------------------------------------------------------
        // let relativeX = []
        // let relativeY = []
        // let choosenSideX = 0
        // let choosenSideY = 0
        let floorcollflag = false;
        let ceilcollision = false;
        let wallceilrel = false;
        this.wallcollision = false;

        this.checkedWall = [];
        this.checkedWall = bus.compiledWall.collidingArea(this.x);
        // if (parseInt(this.x / 16) != parseInt(this.prevX / 16)) {
            // let render_distance = 5;
            // this.checkedWall = [];
            // const cutarray = failsafeSLICE(bus.PlayerInteractable.compiledwall, parseInt(this.x / 16) - render_distance, parseInt(this.x / 16) + render_distance);
            // cutarray.push(bus.PlayerInteractable.compiledwall[bus.PlayerInteractable.compiledwall.length - 1]);
            // cutarray.forEach(colum => {
            //     colum.forEach(obj => {
            //         this.checkedWall.push(obj);
            //     });
            // });
        // }

        
        // console.log(checkedWall);
        for (const wall of this.checkedWall) {
            wallceilrel = false;
            // check if the wall is in range or out of range
            // relativeX = [Math.abs(wall.x - this.x), Math.abs(wall.x + wall.width - this.x)];
            // relativeY = [Math.abs(wall.y - this.y), Math.abs(wall.y + wall.height - this.y)];
            // choosenSideX = (relativeX[0] > relativeX[1]) ? relativeX[0] : relativeX[1];
            // choosenSideY = (relativeY[0] > relativeY[1]) ? relativeY[0] : relativeY[1];
            // if (choosenSideX > 256 && choosenSideY > 240) continue;


            // ceiling check
            if (range_collision(this.x, this.y + halfcut(this.dy, false), this.width, halfcut(this.dy, true), wall) && wall.ceilcol) {
                if (range_collision(this.x + 6, this.y + halfcut(this.dy, false), this.width - 12, halfcut(this.dy, true), wall)) {
                    this.y = wall.y + wall.height;
                    ceilcollision = true;
                    wallceilrel = true;
                    // could set this to comment
                    this.jumpinitial = false;
                    this.dy = 0;
                }
            }

            // floor check
            if (!wall.stairs) {
                if (range_collision(this.x, this.y + this.height, this.width, 
                    halfcut(this.dy, true), wall, "floor") && this.dy > 0 && wall.floorcol ) {
                        // add this.dy > 0 if something else happen
                    if (range_collision(this.x + 3, this.y + this.height, this.width - 6, 
                    halfcut(this.dy, true), wall, "floor")) {
                        this.y = wall.y - this.height;
                        this.collidingY = wall.y - this.height;
                        floorcollflag = true;
                        this.dy = 0;
                    } 
                }
            } else {
                if (range_collision(this.x, this.y + this.height, this.width, 
                    halfcut(this.dy, true), wall, "snapfloor") && this.dy > 0 && wall.floorcol ) {
                        // add this.dy > 0 if something else happen
                    if (range_collision(this.x + 3, this.y + this.height, this.width - 6, 
                    halfcut(this.dy, true), wall, "snapfloor")) {
                        this.y = wall.y - this.height;
                        this.collidingY = wall.y - this.height;
                        floorcollflag = true;
                        this.dy = 0;
                    } 
                }
            }


            // wall check
            if (range_collision(this.x + this.dx, this.y, this.width, this.height, wall, "x") &&
                wall.wallcol && !wallceilrel) { 
                this.wallcollision = true;
                this.dx = 0;
                if ((wall.x + wall.dx) + wall.width / 2 > this.x) {
                    // this.x -= this.dx;
                    this.x = wall.x - this.width - wall.dx ;
                } else if (wall.x + wall.dx < this.x) {
                    this.x = wall.x + wall.width - wall.dx;
                }
            }
        }

        // floor limit, it is IMPOSSIBLE for player to fall below this
        if (!floorcollflag) {            
            // when the floor limit is the most bottom ground 
            // this.collidingY = this.mapHeight - this.height;
            // when the floor limit is below the most bottom ground
            this.collidingY = this.mapHeight;

        }
        
        // temporary out of bound teleport death solution
        if (this.y == this.mapHeight) {
            this.death = 0;
            // this.x = amp(4);
            // this.y = xPosR(this.mapHeight, amp(3));
            // this.jumpinitial = false;
        }

        // INTERACTIBLES -------------------------------------------------------
        // for (const intr of bus.PlayerInteractable.interactible) {
        //     intr.update(this);
        // }

        
        this.x += this.dx;
        this.y += this.dy;

        this.prevX = this.x;
        // TURN THIS ON OR OFF
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        // if (!bus.movingPlatform) {
        //     this.x = Math.round(this.x);
        //     this.y = Math.round(this.y);
        // }
    }
}

class InstanceAnimate {
    constructor(x, y, depth = 1, toggleupdate = true, togglecollision = true) {
        this.x = x;
        this.y = y;
        this.depth = depth;

        this.toggleupdate = toggleupdate;
        this.togglecollision = togglecollision;
    }

    draw(ctx) {}

    update() {}

    destroy() {
        bus.orderedRender.remove(this);
        bus.updateObjects.remove(this);
    }
}

class MarioDead extends InstanceAnimate {
    constructor(x, y, depth) {
        super(x, y, depth);
        this.sprite = new Image();
        this.sprite.src = "./sprite/mario/mario_dead.png";   
        this.velocity = -7;
        this.gravity = 0.3; 
        this.maxheight = amp(3);
        this.initialframe = 0;
        this.initialY = y;
    }

    draw(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y, 16, 16);
    }

    update() {

        // if (this.initialframe % 6 == 0) {
        //     this.timer -= 1;
        // }

        this.y += this.velocity;
        this.velocity += this.gravity;
        this.initialframe += 1;
        if (this.topY > bus.mapHeight) {
            // console.log("ever run?")
            this.destroy();
        }
    }
}


class CoinToss extends InstanceAnimate {
    constructor(x, y, depth) {
        super(x, y, depth);
        this.coin_sprite = new Image();
        this.coin_velocity = -5;
        this.gravity = 0.3; 
        this.maxheight = amp(3);
        this.initialframe = 0;
        this.initialY = y;
        // this.coin_sprite.src = "./sprite/coin/coin1.png";
    }

    draw(ctx) {
        this.coin_sprite.src = animation_sequence(
        [
            "./sprite/coin/coin1.png",
            "./sprite/coin/coin2.png",
            "./sprite/coin/coin3.png",
            "./sprite/coin/coin4.png",
        ], bus.globalCounter, 5);
                        
        ctx.drawImage(this.coin_sprite, this.x + 4, this.y, 8, 16);
    }

    update() {
        // if (this.initialframe % 6 == 0) {
        //     this.timer -= 1;
        // }

        
        this.y += this.coin_velocity;
        this.coin_velocity += this.gravity;
        this.initialframe += 1;
        if (this.coin_velocity > 0 && this.y > this.initialY) {
            // console.log("ever run?")
            this.destroy();
        }
    }
}


class BrickBreak extends InstanceAnimate {
    constructor(x, y, depth) {
        super(x, y, depth);
        this.brick_sprite = [new Image(), new Image(), new Image(), new Image()];
        this.brick_velocities = [-4, -3];
        this.gravity = 0.3; 
        this.maxheight = amp(3);
        this.initialframe = 0;
        this.initialY = y;
        this.order = [
            [
            "./sprite/brickbreak/break_top_left.png",
            "./sprite/brickbreak/break_top_right.png",
            "./sprite/brickbreak/break_bottom_right.png",
            "./sprite/brickbreak/break_bottom_left.png",
            ],
            [
            "./sprite/brickbreak/break_bottom_left.png",
            "./sprite/brickbreak/break_top_left.png",
            "./sprite/brickbreak/break_top_right.png",
            "./sprite/brickbreak/break_bottom_right.png",
            ],
            [
            "./sprite/brickbreak/break_bottom_left.png",
            "./sprite/brickbreak/break_top_left.png",
            "./sprite/brickbreak/break_top_right.png",
            "./sprite/brickbreak/break_bottom_right.png",
            ],
            [
            "./sprite/brickbreak/break_bottom_left.png",
            "./sprite/brickbreak/break_top_left.png",
            "./sprite/brickbreak/break_top_right.png",
            "./sprite/brickbreak/break_bottom_right.png",
            ]   
        ];
        this.topY = this.y;
        this.bottomY = this.y;
        this.spreadX = [this.x, this.x, this.x, this.x];
    }

    draw(ctx) {
        this.brick_sprite[0].src = animation_sequence(this.order[0], bus.globalCounter, 8);   
        ctx.drawImage(this.brick_sprite[0], this.spreadX[0] + 4, this.topY, 8, 8);
        this.brick_sprite[1].src = animation_sequence(this.order[1], bus.globalCounter, 8);   
        ctx.drawImage(this.brick_sprite[1], this.spreadX[1] + 4, this.topY, 8, 8);
        
        this.brick_sprite[2].src = animation_sequence(this.order[2], bus.globalCounter, 8);   
        ctx.drawImage(this.brick_sprite[2], this.spreadX[2] + 4, this.bottomY, 8, 8);
        this.brick_sprite[3].src = animation_sequence(this.order[3], bus.globalCounter, 8);   
        ctx.drawImage(this.brick_sprite[3], this.spreadX[3] + 4, this.bottomY, 8, 8);
    }

    update() {
        // if (this.initialframe % 6 == 0) {
        //     this.timer -= 1;
        // }

        this.spreadX[0] += 0.5;
        this.spreadX[1] -= 0.5;
        this.spreadX[2] += 0.5;
        this.spreadX[3] -= 0.5;

        this.topY += this.brick_velocities[0];
        this.bottomY += this.brick_velocities[1];
        this.brick_velocities[0] += this.gravity;
        this.brick_velocities[1] += this.gravity;
        this.initialframe += 1;
        if (this.topY > bus.mapHeight) {
            // console.log("ever run?")
            this.destroy();
        }
    }
}

class SquashedGoomba extends InstanceAnimate {
    constructor(x, y, depth) {
        super(x, y, depth);
        this.sprite = new Image();
        this.sprite.src = "./sprite/enemy/goomba/goomba_squashed.png";
        this.timer = 30;   
    }

    draw(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y, 16, 16);
    }

    update() {
        if (true) {
            // console.log("ever run?")
            if (this.timer < 0) {
                this.destroy();
            } else {
                this.timer -= 1;
            }
        }
    }
}

class FlippedGoomba extends InstanceAnimate {
    constructor(x, y, depth) {
        super(x, y, depth);
        this.sprite = new Image();
        this.sprite.src = "./sprite/enemy/goomba/goombaflipped.png";   
        this.velocity = -4;
        this.gravity = 0.2; 
        this.maxheight = amp(3);
        this.initialframe = 0;
        this.initialY = y;
    }

    draw(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y, 16, 16);
    }

    update() {

        // if (this.initialframe % 6 == 0) {
        //     this.timer -= 1;
        // }

        this.y += this.velocity;
        this.velocity += this.gravity;
        this.initialframe += 1;
        if (this.topY > bus.mapHeight) {
            // console.log("ever run?")
            this.destroy();
        }
    }
}

class InstanceEnemy {
    constructor(x, y, width, height, color, depth = 1, enemytype, toggleupdate = true, togglecollision = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.dx = 0;
        this.dy = 0;
        this.speed = 5;
        this.bx = x + width;
        this.by = y + height;
        this.depth = depth;
        this.enemytype = enemytype;

        this.toggleupdate = toggleupdate;
        this.togglecollision = togglecollision;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(keyState) {

    }

    // tp(tx, ty) {
    //     const relativity = [0, 0];
    //     if (tx[0] == "~") relativity[0] = (tx.length > 1) ? tx.slice(1) : 0;
    //     if (ty[0] == "~") relativity[1] = (ty.length > 1) ? ty.slice(1) : 0;

    //     this.x = (tx[0] == "~") ? this.x + parseFloat(relativity[0]) : tx;
    //     this.y = (ty[0] == "~") ? this.y + parseFloat(relativity[1]) : ty;
    // }

    coor() {
        return [this.x, this.y];
    }
}


class Goomba extends InstanceEnemy {
    constructor(x, y, width, height, walkdirection, depth = 1, toggleupdate = true, togglecollision = true) {
        super(x, y, 16, 16, "black", depth, "goomba", toggleupdate, togglecollision);
        this.gravity = 0.3;
        this.acceleration = 0.25;
        this.deceleration = 0.25;
        this.maxspeed = 0.5;
        this.grounded = false;
        this.mapWidth = bus.mapWidth;
        this.mapHeight = bus.mapHeight;
        this.prevfloor = false;
        this.prevceil = false;
        this.wallcollision = false;
        this.prevX = 0;
        this.prevY = 0;

        this.spritefolder = "./sprite/";

        this.sprite = new Image();
        // this.sprite.src = "./sprite/enemy/goomba/goomba1.png";
        this.anispeed = 10;

        this.collidingY = this.mapHeight - this.height;
        this.grounded = this.y >= this.collidingY;
        this.walkdirection = walkdirection;
        // this.selfdestruct = false;
        // this.destructiontimer = 30;

        this.checkedWall = [];
    }

    draw(ctx) {
        this.sprite.src = animation_sequence(
        [
            "./sprite/enemy/goomba/goomba1.png",
            "./sprite/enemy/goomba/goomba2.png",
        ], bus.globalCounter, 27);
        
        // if (this.selfdestruct) {
        //     this.sprite.src = "./sprite/enemy/goomba/goomba_squashed.png";
        // }
        ctx.drawImage(this.sprite, this.x, this.y,this.width, this.height);
    }

    update() {
        // if (this.selfdestruct) {
        //     if (this.destructiontimer < 0) {
        //         this.destroy();
        //     }
        //     this.destructiontimer -= 1;
        //     return;
        // };

        if (Math.abs(bus.player.x - this.x) > amp(15)) return;

        // jump  
        this.grounded = this.y >= this.collidingY;
        if (this.grounded) {
            this.dy = 0;
            this.y = this.collidingY;
        } else {
            this.dy += this.gravity;
        }

        this.dx = this.maxspeed * this.walkdirection;

        // Wrap around the world edges
        if (this.x + this.width < 0) {
            this.x = this.mapWidth;
        } else if (this.x > this.mapWidth) {
            this.x = -this.width;
        }

        if (range_collision(this.x, this.y - 4, this.width, this.height, bus.player, "ceil") 
                && bus.player.dy > 0  &&  !(bus.player.death < 1) ) {
            bus.player.dy = -3;
            // this.selfdestruct = true;
            addEffect(new SquashedGoomba(this.x, this.y));
            this.destroy();
        } else if (range_collision(this.x, this.y, this.width, this.height, bus.player, "x")) {
            // bus.player.x = amp(9);
            // bus.player.y = xPosR(bus.mapHeight, amp(3));
            bus.player.death -= 1;
        }



        // COLLISION -----------------------------------------------------------------------------------------
        let floorcollflag = false;
        let ceilcollision = false;
        let wallceilrel = false;
        this.wallcollision = false;

        this.checkedWall = [];
        this.checkedWall = bus.compiledWall.collidingArea(this.x);
        // if (parseInt(this.x / 16) != parseInt(this.prevX / 16)) {
            // let render_distance = 5;
            // this.checkedWall = [];
            // const cutarray = failsafeSLICE(bus.PlayerInteractable.compiledwall, parseInt(this.x / 16) - render_distance, parseInt(this.x / 16) + render_distance);
            // cutarray.push(bus.PlayerInteractable.compiledwall[bus.PlayerInteractable.compiledwall.length - 1]);
            // cutarray.forEach(colum => {
            //     colum.forEach(obj => {
            //         this.checkedWall.push(obj);
            //     });
            // });
        // }
        // console.log(checkedWall);
        for (const wall of this.checkedWall) {
            wallceilrel = false;

            // floor check 
            if (range_collision(this.x, this.y + this.height, this.width, 
                halfcut(this.dy, true), wall, "floor") && this.dy > 0 && wall.floorcol ) {
                    // add this.dy > 0 if something else happen
                if (range_collision(this.x + 3, this.y + this.height, this.width - 6, 
                halfcut(this.dy, true), wall, "floor")) {
                    this.y = wall.y - this.height;
                    this.collidingY = wall.y - this.height;
                    floorcollflag = true;
                    this.dy = 0;
                } 
            }


            // wall check
            if (range_collision(this.x + this.dx, this.y, this.width, this.height, wall, "x") &&
                wall.wallcol && !wallceilrel) { 
                this.wallcollision = true;
                this.dx = 0;
                this.walkdirection = revsn(this.walkdirection);
                if ((wall.x + wall.dx) + wall.width / 2 > this.x) {
                    // this.x -= this.dx;
                    this.x = wall.x - this.width - wall.dx ;
                } else if (wall.x + wall.dx < this.x) {
                    this.x = wall.x + wall.width - wall.dx;
                }
            }
        }

        // floor limit, it is IMPOSSIBLE for player to fall below this
        if (!floorcollflag) {            
            // when the floor limit is the most bottom ground 
            // this.collidingY = this.mapHeight - this.height;
            // when the floor limit is below the most bottom ground
            this.collidingY = this.mapHeight;

        }

        if (this.y == this.mapHeight) {
            this.destroy();
        }


        
        this.x += this.dx;
        this.y += this.dy;
        
        this.prevX = this.x;
        // this.x = Math.round(this.x);
        // this.y = Math.round(this.y);
    }

    destroy() {
        let index = bus.enemy.indexOf(this);
        bus.enemy.splice(index, 1);
        bus.orderedRender.remove(this);
        bus.updateObjects.remove(this);
    }
}

class Camera {
    constructor(x, y, width, height, mapsize) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.followDelay = 0.25; // Adjust this value for more or less delay
        this.mapWidth = mapsize[0];
        this.mapHeight = mapsize[1];
    }

    follow(target) {
        // Horizontal follow with delay
        this.x += (target.x + target.width / 2 - this.width / 2 - this.x) * this.followDelay;

        // Ensure the camera does not go outside the world bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.mapWidth) this.x = this.mapWidth - this.width;
    }
}

class Tile {
    constructor(x, y, src, width = 16, height = 16, depth = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprite = new Image();
        this.sprite.src = src;
        this.depth = depth;
    }

    draw(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
}

class QuestionBlock extends GameObject {
    constructor(x, y, width, height, color, depth = 1, collision = [true, true, true], ceilbounce = false, toggleupdate = true, togglecollision = true) {
        super(x, y, width, height, color, depth, collision, ceilbounce, toggleupdate, togglecollision);
        this.sprite = new Image();
        this.sprite.src = "./sprite/questionblock.png"
        
        this.tempX = this.x;
        this.tempY = this.y;
        this.once = false;
        // this.coin_sprite = new Image();
        // this.coin_sprite.src = "./sprite/coin/coin1.png";
        
        this.animation_trigger = false;
        this.bonk = false;
        this.bonk_vel = -1.5;
        this.virtualY = y;
        this.endVirtual = true;
        // this.coin_travel = -10;
        // this.frameExec = new FrameExec(bus.globalCounter);
    } 

    draw(ctx) {
        if (this.animation_trigger) {
            addEffect(new CoinToss(this.x, this.y, 0));
            this.animation_trigger = false;
        }

        // bonk effect
        if (this.bonk) {
            if (this.endVirtual) {this.virtualY = this.y; this.endVirtual = false;}
            this.virtualY += this.bonk_vel;
            this.bonk_vel += 0.3;
            if (this.virtualY > this.y) {
                this.virtualY = this.y;
                this.endVirtual = true;
                this.bonk_vel = -1.5;
                this.bonk = false;
            }
        }
        
        ctx.drawImage(this.sprite, this.x, this.virtualY, 16, 16);
    }

    update() {
        // this.y = this.tempY;
        if (range_collision(this.x, this.y + this.height, this.width, 1, bus.player)) {
            if (!this.once) {
                this.sprite.src = "./sprite/questionblockactive.png";

                bus.enemy.forEach(en => {
                    if (range_collision(this.x, this.y - 16, 16, 16, en)) {
                        en.destroy();

                        if (en.enemytype == "goomba") {
                            addEffect(new FlippedGoomba(en.x, en.y, 3));
                        }
                    }
                });


                bus.coins += 1;
                // bus.PlayerInteractable.wall.push(new GameObject(
                //     amp(randint(1, 4)), xPosR(240, amp(randint(1, 4)), amp(1), amp(1), randhex())));
                // bus.PlayerInteractable.wall.push(
                //     new GameObject(amp(randint(1, 64)), amp(randint(1, 15)), amp(1), amp(1), randhex()));
                this.once = true;
                this.animation_trigger = true;
                this.bonk = true;

            }
            // this.tempY = this.y;
            // this.y -= 4;
        } else {
            this.sprite.src = "./sprite/questionblock.png"
            this.once = false;
        }
    }
}

class Brick extends GameObject {
    constructor(x, y, width, height, color, depth = 1, collision = [true, true, true], ceilbounce = false, toggleupdate = true, togglecollision = true) {
        super(x, y, width, height, color, depth, collision, ceilbounce, toggleupdate, togglecollision);
        this.sprite = new Image;
        this.sprite.src = "./sprite/brick.png"
        this.once = false;

        this.bonk = false;
        this.bonk_vel = -1.5;
        this.initialY = y;
    }

    draw(ctx) {

        // bonk effect
        // if (this.bonk) {
        //     this.y += this.bonk_vel;
        //     this.bonk_vel += 0.3;
        //     if (this.y > this.initialY) {
        //         this.y = this.initialY;
        //         this.bonk_vel = -1.5;
        //         this.bonk = false;
        //     }
        // }

        ctx.drawImage(this.sprite, this.x, this.y, 16, 16);
    }

    update() {
        if (range_collision(this.x + (this.width - (this.width / 4)) / 2, 
                this.y + this.height, this.width / 4, 1, bus.player)) {
            if (!this.once) {
                this.once = true;
                if (bus.player.playerproperty.state > 1) {
                    addEffect(new BrickBreak(this.x, this.y + amp(1), 3));

                    bus.enemy.forEach(en => {
                        if (range_collision(this.x, this.y - 16, 16, 16, en)) {
                            en.destroy();
                            addEffect(new FlippedGoomba(en.x, en.y, 3));
                        }
                    });

                    bus.player.y = Math.round(this.y + this.height + bus.player.jumpSpeed + bus.player.gravity);

                    // let wallindex = bus.PlayerInteractable.compiledwall[ampdiv(this.x)].indexOf(this);
                    // bus.PlayerInteractable.compiledwall[ampdiv(this.x)].splice(wallindex, 1);
                    // let intindex = bus.PlayerInteractable.interactible.indexOf(this);
                    // bus.PlayerInteractable.interactible.splice(intindex, 1);
                    bus.compiledWall.remove(this);
                    bus.updateObjects.remove(this);
                    bus.orderedRender.remove(this);
                } 
                // else {
                //     this.bonk = true;
                // }
            }
        } else {
            this.once = false;
        }
    }
}

class TileObject extends GameObject {
    constructor(x, y, width, height, color, depth = 1, src = "wall.png", tiling = false, tilestyle = "repeat", collision = [true, true, true], ceilbounce = false) {
        super(x, y, width, height, color, depth, collision, ceilbounce);
        this.sprite = new Image();
        this.sprite.src = src;
        this.tile = tiling;
        this.tilestyle = tilestyle;
    }

    draw(ctx) { 
        if (!this.tile) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        } else {
            const pattern = ctx.createPattern(this.sprite, this.tilestyle);
            ctx.fillStyle = pattern;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}



class CompiledWall {
    constructor(mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.compiledwallLength = (Math.ceil(mapWidth) / 16) + 1;
        this.compiledwall = Array.from({ length: this.compiledwallLength}, () => []);
    }

    insert(wall) {
        if (wall.width <= bus.screenWidth) {
            this.compiledwall[parseInt(wall.x / 16)].push(wall);
        } else {
            this.compiledwall[this.compiledwallLength - 1].push(wall);
        }
    }

    bulkinsert(walls) {
        walls.forEach(objs => {
            if (objs.width <= bus.screenWidth) {
                this.compiledwall[parseInt(objs.x / 16)].push(objs);
            } else {
                this.compiledwall[this.compiledwallLength - 1].push(objs);
            }
        }); 
    }

    collidingArea(objX) {
        const ampeddivOBJX = parseInt(ampdiv(objX));
        const ampeddivScreenWidth = ampdiv(bus.screenWidth);
        const cutarray = failsafeSLICE(this.compiledwall, 
            ampeddivOBJX - parseInt(ampeddivScreenWidth / 2) - parseInt(ampeddivScreenWidth), 
                ampeddivOBJX + parseInt(ampeddivScreenWidth / 2));
        
        cutarray.push(this.compiledwall[this.compiledwall.length - 1]);
        const spreadcut = [];
        cutarray.forEach(colum => {
            colum.forEach(obj => {
                if (obj.togglecollision) {
                    spreadcut.push(obj);
                }
            });
        });
        return spreadcut;
    }

    remove(theObject) {
        const location = ampdiv(theObject.x);
        const index = this.compiledwall[location].indexOf(theObject);
        this.compiledwall[location].splice(index, 1);
    }
}

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// MAP
const mapWidth = 3584;
const mapHeight = 240;

bus.mapWidth = mapWidth;
bus.mapHeight = mapHeight;

bus.screenWidth = 256;
bus.screenHeight = 240;

const player = new Mario(amp(9), xPosR(mapHeight, amp(4)), 16, 16, '#0095DD', 11);
const camera = new Camera(player.x - 120, player.y, bus.screenWidth, bus.screenHeight, [mapWidth, mapHeight]);

const enemy = [
    new Goomba(amp(25), xPosR(mapHeight, amp(3)), 16, 16, -1, 10),
    
    new Goomba(amp(52), xPosR(mapHeight, amp(3)), 16, 16, 1, 10),
    new Goomba(amp(54), xPosR(mapHeight, amp(3)), 16, 16, 1, 10),
    new Goomba(amp(81), xPosR(mapHeight, amp(11)), 16, 16, -1, 10),
    new Goomba(amp(83), xPosR(mapHeight, amp(11)), 16, 16, -1, 10),
    new Goomba(amp(111), xPosR(mapHeight, amp(3)), 16, 16, -1, 10),
    new Goomba(amp(113), xPosR(mapHeight, amp(3)), 16, 16, -1, 10),
    new Goomba(amp(175), xPosR(mapHeight, amp(3)), 16, 16, -1, 10),
    new Goomba(amp(176), xPosR(mapHeight, amp(3)), 16, 16, -1, 10),
];

function stairs_generator(x, y, height, direction = true, lastpillar = false) {
    const stairs = [];
    if (direction) {
        for (let i = 0; i < height; i++) {
            stairs.push(new TileObject(amp(x + i), xPosR(mapHeight, amp(y + i)), amp(height - i), amp(1), '#C84C0C', 2, "./sprite/smoothblock.png", true));
        }
        if (lastpillar) {
            stairs.push(new TileObject(amp(x + height), xPosR(mapHeight, amp(y + height - 1)), amp(1), amp(height), '#C84C0C', 2, "./sprite/smoothblock.png", true));
        }
    } else {
        for (let i = 0; i < height; i++) {
            stairs.push(new TileObject(amp(x), xPosR(mapHeight, amp(y + i)), amp(height - i), amp(1), '#C84C0C', 2, "./sprite/smoothblock.png", true));
        }
        if (lastpillar) {
            stairs.forEach(obj => new TileObject(obj.x + 1, obj.y, obj.width, obj.height, obj.color, obj.src, obj.tiling));
            stairs.push(new TileObject(amp(x), xPosR(mapHeight, amp(y + height - 1)), amp(1), amp(height), '#C84C0C', 2, "./sprite/smoothblock.png", true));
        }
    }
    return stairs;
}
    

const stairs = [
    ...stairs_generator(134, 3, 4),
    ...stairs_generator(140, 3, 4, false),
    ...stairs_generator(148, 3, 4, true, true),
    ...stairs_generator(155, 3, 4, false),
    ...stairs_generator(181, 3, 8, true, true)
];

const bricks = [
    new Brick(amp(20), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(22), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(24), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    
    new Brick(amp(77), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(79), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),

    new Brick(amp(80), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(81), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(82), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(83), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(84), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(85), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(86), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(87), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),

    new Brick(amp(91), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(92), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(93), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(94), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    
    new Brick(amp(100), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(101), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(118), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    
    new Brick(amp(121), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(122), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(123), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    
    new Brick(amp(128), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(131), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(129), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(130), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    
    new Brick(amp(168), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(169), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new Brick(amp(171), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
]

const questionBlocks = [
    new QuestionBlock(amp(16), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(22), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(21), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(23), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(78), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(94), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),

    new QuestionBlock(amp(106), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(109), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(109), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(112), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true), 
    new QuestionBlock(amp(129), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(130), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', 2, "all", true),
    new QuestionBlock(amp(170), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', 2, "all", true),

]

const bgtiles = []



const repeatingbgtiles = [
    new Tile(amp(-7), xPosR(mapHeight, amp(3)), '../sprite/bush2.png', amp(4), amp(1), 1),
    new Tile(amp(0), xPosR(mapHeight, amp(5)), '../sprite/mountain_big.png', amp(5), amp(3), 1),
    new Tile(amp(11), xPosR(mapHeight, amp(3)), '../sprite/bush3.png', amp(5), amp(1), 1),
    new Tile(amp(16), xPosR(mapHeight, amp(4)), '../sprite/mountain_small.png', amp(3), amp(2), 1),
    new Tile(amp(23), xPosR(mapHeight, amp(3)), '../sprite/bush1.png', amp(3), amp(1), 1),
    new Tile(amp(8), xPosR(mapHeight, amp(12)), '../sprite/cloud1.png', amp(3), amp(2), 1),
    new Tile(amp(19), xPosR(mapHeight, amp(13)), '../sprite/cloud1.png', amp(3), amp(2), 1),
    new Tile(amp(27), xPosR(mapHeight, amp(12)), '../sprite/cloud3.png', amp(5), amp(2), 1),
    new Tile(amp(36), xPosR(mapHeight, amp(13)), '../sprite/cloud2.png', amp(4), amp(2), 1),
]
for (let c = 0; c < 5; c++) {
    const newObjects = repeatingbgtiles.map(obj => new Tile(obj.x + (c * amp(48)), obj.y, obj.sprite.src, obj.width, obj.height));
    bgtiles.push(...newObjects);
}

bgtiles.push(...[
    //flagpole
    new Tile(amp(197), xPosR(mapHeight, amp(13)), '../sprite/flagpole.png', amp(2), amp(10)),
    //castle
    new Tile(amp(202), xPosR(mapHeight, amp(7)), '../sprite/castle.png', amp(5), amp(5)),
]);


const walls = [
    //ground
    new TileObject(-16, xPosR(mapHeight, amp(2)), amp(69) + 16, amp(2), '#C84C0C', 2, "./sprite/cobble.png", true),
    new TileObject(amp(71), xPosR(mapHeight, amp(2)), amp(15), amp(2), '#C84C0C', 2, "./sprite/cobble.png", true),
    new TileObject(amp(89), xPosR(mapHeight, amp(2)), amp(64), amp(2), '#C84C0C', 2, "./sprite/cobble.png", true),
    new TileObject(amp(155), xPosR(mapHeight, amp(2)), mapWidth, amp(2), '#C84C0C', 2, "./sprite/cobble.png", true),

    ...bricks,
    ...questionBlocks,
    ...stairs,

    // flagpole
    new TileObject(amp(198), xPosR(mapHeight, amp(3)), amp(1), amp(1), '#C84C0C', 2, "./sprite/smoothblock.png"),
    
    // pipe
    new TileObject(amp(28), xPosR(mapHeight, amp(4)), amp(2), amp(2), '#80D010', 2, "./sprite/pipe1.png"),
    new TileObject(amp(38), xPosR(mapHeight, amp(5)), amp(2), amp(3), '#80D010', 2, "./sprite/pipe2.png"),
    new TileObject(amp(46), xPosR(mapHeight, amp(6)), amp(2), amp(4), '#80D010', 2, "./sprite/pipe3.png"),
    new TileObject(amp(57), xPosR(mapHeight, amp(6)), amp(2), amp(4), '#80D010', 2, "./sprite/pipe3.png"),
    new TileObject(amp(163), xPosR(mapHeight, amp(4)), amp(2), amp(2), '#80D010', 2, "./sprite/pipe1.png"),
    new TileObject(amp(179), xPosR(mapHeight, amp(4)), amp(2), amp(2), '#80D010', 2, "./sprite/pipe1.png"),
];

const interactibles = [
    ...enemy,
    ...bricks,
    ...questionBlocks,
]

// INTERACTION
bus.compiledWall = new CompiledWall(mapWidth, mapHeight);
bus.compiledWall.bulkinsert(walls);
bus.updateObjects.bulkinsert(interactibles);
bus.enemy = enemy;
bus.player = player;
bus.camera = camera;


// DRAW
bus.compiledWall.compiledwall.forEach(eachcolumn => {
    bus.orderedRender.bulkinsert(eachcolumn);
});
bus.orderedRender.bulkinsert(bus.enemy);
bus.orderedRender.insert(bus.player);
bus.orderedRender.bulkinsert(bgtiles);
bus.bgcolor = "#5C94FC";

const keyState = {};
let isPaused = false;
let fps = 60;
let lastFrameTime = 0;
let globalCounter = 0;

let inc_frame = false;

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        isPaused = !isPaused;
    }
    if (e.key === '=') {
        fps = (fps == 1) ? 5 : fps + 5;
        fps = (fps > 60) ? 60 : fps;
        console.log(fps);
    } else if (e.key === '-') {
        fps -= 5;
        fps = (fps < 1) ? 1 : fps;
        console.log(fps);
    } else if (e.key === 'f') {
        inc_frame = true;
    }
    keyState[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keyState[e.key] = false;
});


function gameLoop(timestamp) {
    const fpsInterval = 1000 / fps;
    const elapsed = timestamp - lastFrameTime;

    const oneframe = (isPaused) ? inc_frame : false; 

    if (elapsed >= fpsInterval && !isPaused || oneframe) {
        inc_frame = false;
        lastFrameTime = timestamp - (elapsed % fpsInterval);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        bus.player.update(keyState);
        bus.updateObjects.update();
        
        bus.camera.follow(bus.player);
        ctx.save();
        ctx.translate(-bus.camera.x, 0);
        // objects draw here ---------------------------------
        
        // backround sky
        ctx.fillStyle = bus.bgcolor;
        ctx.fillRect(0, 0, bus.mapWidth, bus.mapHeight);
        
        // drawGrid(ctx, mapWidth, mapHeight, 16);

        bus.orderedRender.list.forEach(eachcolumn => {
            eachcolumn.forEach((tile) => tile.draw(ctx));
        });

        // RULER----------
        // ctx.font = "5px 'Press-Start-2P'"; 
        // ctx.fillStyle = 'white'; 
        // for (let h = 0; h < (mapWidth / 16); h++) {
        //     ctx.fillText(h, amp(h) + 4, amp(3) - 8);
        // }
        ctx.restore();

        ctx.font = "8px 'Press-Start-2P'"; 
        ctx.fillStyle = 'white'; 
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(bus.coins, amp(1), amp(1));

        // unblurprint(ctx, "loadingggg", amp(1), amp(1));
        globalCounter += 1;
        bus.globalCounter = globalCounter;
    }

    requestAnimationFrame(gameLoop);
}


// start game
const myFont = new FontFace('Press-Start-2P', 'url(PressStart2P-Regular.ttf)');
myFont.load().then(function(font){
    document.fonts.add(font);
    console.log('Font loaded');
    // start game
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, bus.mapWidth, bus.mapHeight);

    ctx.font = "8px 'Press-Start-2P'";
    ctx.fillStyle = "white";

    ctx.fillText("LOADING", amp(6), bus.mapHeight / 2);
    ctx.font = "8px 'Press-Start-2P'";

    setTimeout(() => {
        gameLoop();
    }, 1000);
});	


//decode
const buttonium = document.querySelector(".execution");
buttonium.addEventListener("click", (e) => {
    executeCode();
});

function executeCode() {
    const input = document.getElementById('js-input').value;
    const resultContainer = document.getElementById('result');
    try {
        const result = eval(input);
        resultContainer.textContent = `Result: ${result}`;
    } catch (error) {
        resultContainer.textContent = `Error: ${error}`;
    }
}
