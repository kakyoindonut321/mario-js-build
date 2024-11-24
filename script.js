const bus = {
    coins: 0,
    playerInteractable: {},
    movingPlatform: false,
    globalCounter: 0
};

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

class Instance {
    constructor(x, y, width, height, color) {
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
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(keyState) {

    }

    tp(tx, ty) {
        const relativity = [0, 0];
        if (tx[0] == "~") relativity[0] = (tx.length > 1) ? tx.slice(1) : 0;
        if (ty[0] == "~") relativity[1] = (ty.length > 1) ? ty.slice(1) : 0;

        this.x = (tx[0] == "~") ? this.x + parseFloat(relativity[0]) : tx;
        this.y = (ty[0] == "~") ? this.y + parseFloat(relativity[1]) : ty;
    }

    coor() {
        return [this.x, this.y];
    }
}

class GameObject extends Instance {
    constructor(x, y, width, height, color, collision = [true, true, true], ceilbounce = false) {
        super(x, y, width, height, color);
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

class Player extends Instance {
    constructor(x, y, width, height, color, mapsize) {
        super(x, y, width, height, color);
        this.gravity = 0.3;
        this.jumpSpeed = 0;
        this.jumpdistance = 0;
        this.jumpinitial = true;
        this.acceleration = 0.25;
        this.deceleration = 0.25;
        this.maxspeed = 3;
        this.grounded = false;
        this.mapWidth = mapsize[0];
        this.mapHeight = mapsize[1];
        this.prevfloor = false;
        this.prevceil = false;
        this.wallcollision = false;
        this.maxjump = 50;

        // this.sprite = new Image();
        // this.sprite.src = "./sprite/mario.png"

        this.collidingY = this.mapHeight - this.height;
        this.grounded = this.y >= this.collidingY;
    }

    // draw(ctx) {
    //     ctx.drawImage(this.sprite, this.x, this.y, 16, 16);
    // }

    update(keyState, objects) {
        // jump
        // console.log(xPosR(this.y, this.mapHeight));            
        this.grounded = this.y >= this.collidingY;    
        // console.log(this.grounded);

        if (keyState[' '] && this.jumpinitial) {
            if (this.jumpdistance < this.maxjump) {
                this.jumpSpeed = (this.jumpSpeed < 1) ? this.jumpSpeed + 1 : 3;
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
            } else {
                this.jumpinitial = false;
                this.dy += this.gravity;
                //  this.dy += this.gravity;
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

        // if (keyState['Shift'] && this.grounded) {
        //     this.maxspeed = 5;
        //     this.acceleration = 1;
        // } else {
        //     this.maxspeed = 3;
        //     this.acceleration = 0.2;
        // }

        // Wrap around the world edges
        if (this.x + this.width < 0) {
            this.x = this.mapWidth;
        } else if (this.x > this.mapWidth) {
            this.x = -this.width;
        }

        // COLLISION -----------------------------------------------------------------------------------------
        let relativeX = []
        let relativeY = []
        let choosenSideX = 0
        let choosenSideY = 0
        let floorcollflag = false;
        let ceilcollision = false;
        let wallceilrel = false;
        this.wallcollision = false;
        for (const wall of objects.wall) {
            wallceilrel = false;
            // check if the wall is in range or out of range
            relativeX = [Math.abs(wall.x - this.x), Math.abs(wall.x + wall.width - this.x)];
            relativeY = [Math.abs(wall.y - this.y), Math.abs(wall.y + wall.height - this.y)];
            choosenSideX = (relativeX[0] > relativeX[1]) ? relativeX[0] : relativeX[1];
            choosenSideY = (relativeY[0] > relativeY[1]) ? relativeY[0] : relativeY[1];
            if (choosenSideX > 256 && choosenSideY > 240) continue;


            // ceiling check
            if (range_collision(this.x, this.y + halfcut(this.dy, false), this.width, halfcut(this.dy, true), wall) && wall.ceilcol) {
                // this.y = wall.y + this.height;
                // bounce
                // if (wall.ceilbounce) {
                //     this.y = Math.round(wall.y + wall.height + this.jumpSpeed + this.gravity);
                // }
                this.y = wall.y + wall.height;
                ceilcollision = true;
                wallceilrel = true;
                // could set this to comment
                this.jumpinitial = false;
                this.dy = 0;
                // this.dy = wall.y - this.y + wall.height;
                // this.dy = this.gravity;
                // if (!this.prevceil) {
                //     // this.y = wall.y + wall.height;
                //     this.prevceil = true;
                // }
                // this.dy += this.gravity;
            }

            // floor check
            // remove "floor" from range collision when shit goes bad 
            if (range_collision(this.x, this.y + this.height, this.width, 
                halfcut(this.dy, true), wall, "floor")  && this.dy > 0 && wall.floorcol ) {
                    // add this.dy > 0 if something else happen
                this.y = wall.y - this.height;
                this.collidingY = wall.y - this.height;
                floorcollflag = true;
                // if(!this.prevfloor) {
                //     // this.dy = wall.y - this.y - this.height;
                //     // this.dy = 0;
                //     this.prevfloor = true;
                // }
                this.dy = 0;
                // this.prevfloor = true;
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

            // if (wallcollision && ceilcollision) {
            //     if (this.dx == 0 && this.dy == 0) {
            //         this.y = wall.y + wall.height;
            //     }
            // }
        }

        // floor limit, it is IMPOSSIBLE for player to fall below this
        if (!floorcollflag) {
            // this.y = this.mapHeight - this.height;
            // this.prevfloor = false;
            
            // when the floor limit is the most bottom ground 
            // this.collidingY = this.mapHeight - this.height;
            // when the floor limit is below the most bottom ground
            this.collidingY = this.mapHeight;

        }
        
        // temporary out of bound teleport death solution
        if (this.y == this.mapHeight) {
            this.x = amp(4);
            this.y = xPosR(this.mapHeight, amp(6));
        }
        // if (!ceilcollision) {
            // this.dy += this.gravity;
            // this.prevceil = false
        // };

        // INTERACTIBLES -------------------------------------------------------
        for (const intr of objects.interactible) {
            intr.update(this);
        }

        this.x += this.dx;
        this.y += this.dy;
        if (!bus.movingPlatform) {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
        }
    }
}


class Mario extends Instance {
    constructor(x, y, width, height, color, mapsize) {
        super(x, y, 16, 16, color);
        this.gravity = 0.3;
        this.jumpSpeed = 0;
        this.jumpdistance = 0;
        this.jumpinitial = true;
        this.acceleration = 0.25;
        this.deceleration = 0.25;
        this.maxspeed = 3;
        this.grounded = false;
        this.mapWidth = mapsize[0];
        this.mapHeight = mapsize[1];
        this.prevfloor = false;
        this.prevceil = false;
        this.wallcollision = false;
        this.maxjump = 50;

        this.spritefolder = "./sprite/";
        this.keyState = "";
        this.facingDirection = 1;

        this.sprite = new Image();
        this.sprite.src = "./sprite/mario/right/idle_right.png";
        this.anispeed = 10;

        this.collidingY = this.mapHeight - this.height;
        this.grounded = this.y >= this.collidingY;
    }

    draw(ctx) {
        if (this.jumpdistance > 0) {
            if (this.facingDirection == 1) {
                this.sprite.src = "./sprite/mario/right/jump_right.png";
            } else {
                this.sprite.src = "./sprite/mario/left/jump_left.png";
            }
        } else {
            if (this.keyState['ArrowRight']) {
                if (this.dx < 0) {
                    this.sprite.src = "./sprite/mario/right/turning_right.png";
                } else {
                    this.facingDirection = 1;
                    this.sprite.src = animation_sequence([
                        "./sprite/mario/right/walk1_right.png",
                        "./sprite/mario/right/walk2_right.png",
                        "./sprite/mario/right/walk3_right.png",
                    ], bus.globalCounter, Math.round(15 - (halfcut(this.dx, true) * 4)));
                }
            } else if (this.keyState['ArrowLeft']) {
                if (this.dx > 0) {
                    this.sprite.src = "./sprite/mario/left/turning_left.png";
                } else {
                    this.facingDirection = -1;
                    this.sprite.src = animation_sequence([
                        "./sprite/mario/left/walk1_left.png",
                        "./sprite/mario/left/walk2_left.png",
                        "./sprite/mario/left/walk3_left.png",
                    ], bus.globalCounter, Math.round(15 - Math.abs(halfcut(this.dx, false) * 4)));
                }
            } else {
                if (this.facingDirection == 1) {
                    this.sprite.src = "./sprite/mario/right/idle_right.png";
                } else {
                    this.sprite.src = "./sprite/mario/left/idle_left.png";
                }
            }
        }
        
        ctx.drawImage(this.sprite, this.x, this.y,this.width, this.height);

    }

    update(keyState) {
        this.keyState = keyState;
        // jump
        // console.log(xPosR(this.y, this.mapHeight));            
        this.grounded = this.y >= this.collidingY;    
        // console.log(this.grounded);

        if (keyState[' '] && this.jumpinitial) {
            if (this.jumpdistance < this.maxjump) {
                this.jumpSpeed = (this.jumpSpeed < 1) ? this.jumpSpeed + 1 : 3;
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
            } else {
                this.jumpinitial = false;
                this.dy += this.gravity;
                //  this.dy += this.gravity;
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
        let relativeX = []
        let relativeY = []
        let choosenSideX = 0
        let choosenSideY = 0
        let floorcollflag = false;
        let ceilcollision = false;
        let wallceilrel = false;
        this.wallcollision = false;
        for (const wall of bus.playerInteractable.wall) {
            wallceilrel = false;
            // check if the wall is in range or out of range
            relativeX = [Math.abs(wall.x - this.x), Math.abs(wall.x + wall.width - this.x)];
            relativeY = [Math.abs(wall.y - this.y), Math.abs(wall.y + wall.height - this.y)];
            choosenSideX = (relativeX[0] > relativeX[1]) ? relativeX[0] : relativeX[1];
            choosenSideY = (relativeY[0] > relativeY[1]) ? relativeY[0] : relativeY[1];
            if (choosenSideX > 256 && choosenSideY > 240) continue;


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
            // remove "floor" from range collision when shit goes bad 
            if (range_collision(this.x, this.y + this.height, this.width, 
                halfcut(this.dy, true), wall, "floor")  && this.dy > 0 && wall.floorcol ) {
                    // add this.dy > 0 if something else happen
                this.y = wall.y - this.height;
                this.collidingY = wall.y - this.height;
                floorcollflag = true;
                this.dy = 0;
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
            this.x = amp(4);
            this.y = xPosR(this.mapHeight, amp(6));
        }

        // INTERACTIBLES -------------------------------------------------------
        for (const intr of bus.playerInteractable.interactible) {
            intr.update(this);
        }

        
        this.x += this.dx;
        this.y += this.dy;
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        // if (!bus.movingPlatform) {
        //     this.x = Math.round(this.x);
        //     this.y = Math.round(this.y);
        // }
    }
}


class Tile {
    constructor(x, y, src, width = 16, height = 16) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sprite = new Image();
        this.sprite.src = src;
    }

    draw(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
}

class QuestionBlock  extends GameObject {
    constructor(x, y, width, height, color, collision = [true, true, true], ceilbounce = false) {
        super(x, y, width, height, color, collision, ceilbounce);
        this.sprite = new Image();
        this.sprite.src = "./sprite/questionblock.png"
        
        this.tempX = this.x;
        this.tempY = this.y;
        this.coinonce = false;
        this.coin_sprite = new Image();
        this.coin_sprite.src = "./sprite/coin/coin1.png";
    } 

    draw(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y, 16, 16);
        // this.coin_sprite.src = animation_sequence([
        //                             "./sprite/coin/coin1.png",
        //                             "./sprite/coin/coin2.png",
        //                             "./sprite/coin/coin3.png",
        //                             "./sprite/coin/coin4.png",
        //                         ], bus.globalCounter, 20);
        // ctx.drawImage(this.coin_sprite, this.x + 4, this.y - amp(3), 8, 16);
    }

    update(playerdata) {
        this.y = this.tempY;
        if (range_collision(this.x, this.y + this.height, this.width, 1, playerdata)) {
            if (!this.coinonce) {
                this.sprite.src = "./sprite/questionblockactive.png";
                bus.coins += 1;
                
                // bus.playerInteractable.wall.push(new GameObject(
                //     amp(randint(1, 4)), xPosR(240, amp(randint(1, 4)), amp(1), amp(1), randhex())));
                // bus.playerInteractable.wall.push(
                //     new GameObject(amp(randint(1, 64)), amp(randint(1, 15)), amp(1), amp(1), randhex()));
                this.coinonce = true;
            }
            this.tempY = this.y;
            this.y -= 4;
        } else {
            this.sprite.src = "./sprite/questionblock.png"
            this.coinonce = false;
        }
    }
}

class Brick extends GameObject {
    constructor(x, y, width, height, color, collision = [true, true, true], ceilbounce = false) {
        super(x, y, width, height, color, collision, ceilbounce);
        this.sprite = new Image;
        this.sprite.src = "./sprite/brick.png"
        this.once = false;
    }

    draw(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y, 16, 16);
    }

    update(playerdata) {
        if (range_collision(this.x + (this.width - (this.width / 4)) / 2, this.y + this.height, this.width / 4, 1, playerdata)) {
            if (!this.once) {
                this.once = true;
                // console.log(this.x, this.y);
                playerdata.y = Math.round(this.y + this.height + playerdata.jumpSpeed + playerdata.gravity);
                let wallindex = bus.playerInteractable.wall.indexOf(this);
                let intindex = bus.playerInteractable.interactible.indexOf(this);
                bus.playerInteractable.wall.splice(wallindex, 1);
                bus.playerInteractable.interactible.splice(intindex, 1);
            }
        } else {
            this.once = false;
        }
    }
}

class Ice  extends GameObject {
    constructor(x, y, width, height, color, collision = [true, true, true], ceilbounce = false) {
        super(x, y, width, height, color, collision, ceilbounce);
        this.once = false;
    }

    update(playerdata) {
        if (range_collision(this.x, this.y - 1, this.width, 1, playerdata)) {
            playerdata.acceleration = 0.0625;
            playerdata.deceleration = 0.0625;
            playerdata.maxspeed = 8;
            // if (!this.once) {
            //     this.once = true;
            //     }
        } else {
            if (playerdata.grounded) {
                playerdata.acceleration = 0.25;
                playerdata.deceleration = 0.25;
                playerdata.maxspeed = 3;
            }
            this.once = false;
        }
    }
}

class MovingObject extends GameObject {
    constructor(x, y, width, height, color, ceilbounce = false, speed, distance) {
        super(x, y, width, height, color, [false, false, false], ceilbounce);
        this.initialX = x; // Store the initial X position
        this.speed = speed; // Speed of the oscillation
        this.distance = distance; // Distance from the initial position
        this.time = 0; // Time variable to control the sine wave
        this.dx = 0;
        this.dy = 0;
        this.prevtrue = false;
    }

    // Method to update the object's position
    update(playerdata) { 
        // let ceilcollision = true;
        this.dx = this.distance * (Math.sin(this.time) - Math.sin(this.time + this.speed / 8)); 
        this.time += this.speed / 16; // Increment time by the speed factor

                
        // ceil
        if (range_collision(
            playerdata.x + 2, 
            playerdata.y + halfcut(playerdata.dy, false), 
            playerdata.width - 4, 
            halfcut(playerdata.dy, true), this)) 
        {
            playerdata.y = this.y + this.height;
            // wallceilrel = true;
            playerdata.jumpinitial = false;
            playerdata.dy = 0;
        }

        // floor check
        if (range_collision(this.x, this.y - playerdata.dy, this.width, 1, playerdata) && !(playerdata.dy < 0)) {
            // add this.dy > 0 if something else happen
            playerdata.dy = 0;
            playerdata.y = this.y - playerdata.height;
            playerdata.collidingY = this.y - playerdata.height;
            // floorcollflag = true;
            // if(!this.prevfloor) {
            //     // this.dy = wall.y - this.y - this.height;
            //     // this.dy = 0;
            //     this.prevfloor = true;
            // }
            // this.prevfloor = true;
        }

        // this.dx = Math.round(this.distance * Math.sin(this.time)); // Calculate dx using sine function
        // wall check 
        if (range_collision(
            this.x + halfcut(this.dx / 2, false) - playerdata.dx, 
            this.y, 
            this.width + halfcut(this.dx / 2, true) - halfcut(this.dx / 2 + playerdata.dx, false), 
            this.height, playerdata, "x")) {
            playerdata.dx = this.dx;
            // console.log('collided');
            if ((this.x + this.dx) + this.width / 2 > playerdata.x) {
                // playerdata.x -= playerdata.dx;
                playerdata.x = this.x - playerdata.width - this.dx ;
            } else if (this.x + this.dx < playerdata.x) {
                playerdata.x = this.x + this.width - this.dx;
            }
        }


        // if (range_collision(this.x + (this.width - (this.width + Math.abs(this.dx * 2)) + playerdata.dx) / 2, 
        //     this.y, this.width + Math.abs(this.dx * 2) + playerdata.dx, this.height, playerdata, "x") && !wallceilrel) {
        //     // console.log("the wall");
        //     playerdata.dx = this.dx;
        //     if ((this.x + this.dx) + this.width / 2 > playerdata.x) {
        //         // playerdata.x -= playerdata.dx;
        //         playerdata.x = this.x - playerdata.width - this.dx ;
        //     } else if (this.x + this.dx < playerdata.x) {
        //         playerdata.x = this.x + this.width - this.dx;
        //     }
        // }

        // moving player
        if (range_collision(this.x, this.y - 1, this.width, 1, playerdata) && !playerdata.wallcollision) {
            bus.movingPlatform = true;
            this.prevtrue = true;
            playerdata.x += this.dx;
        } else {
            // if (this.prevtrue) {
            //     // DELETE WHEN NESESARRY
            //     playerdata.dx = this.dx * 3;
            //     this.prevtrue = false;
            // }
            bus.movingPlatform = false;
        }
        
        this.x += this.dx;

        // this.x = this.initialX + this.dx; // Update the x position based on initial position and dx
    }
}

class TileObject extends GameObject {
    constructor(x, y, width, height, color, src = "wall.png", tiling = false, tilestyle = "repeat", collision = [true, true, true], ceilbounce = false) {
        super(x, y, width, height, color, collision, ceilbounce);
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


function randhex() {
    // Generate a random integer between 0 and 255 for each color component
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Convert each component to a two-digit hexadecimal string
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    // Combine the components into a single hex color code
    return `#${rHex}${gHex}${bHex}`;
}

// NOT logic version of absolute number
function nabs(num) {
    return num > 0 ? -num : num;
}

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


function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

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
        // case "floor":
        //     return x < rect2.x + rect2.width &&
        //         x + width > rect2.x &&
        //         y <= rect2.y + rect2.height &&
        //         y + height > rect2.y;
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


function place_meeting(x, y, obj) {
    return x >= obj.x && x <= obj.x + obj.width &&
        y >= obj.y && y <= obj.y + obj.height;
}

function animation_sequence(images, counter, speed, fps = 60) {
    const frameindex =  Math.floor((counter / speed) % images.length);
    return images[frameindex];
}

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


const amplification = 16;

function amp(value) {
    return value * amplification;
}

// reverse height to make placing easier, would not use later
function xPosR(x, height) {
    return x - height;
}

function cutprecision(num, fixed) {
    return parseFloat(num.toFixed(fixed));
}


function randint(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number') {
        throw new TypeError('Both min and max must be numbers.');
    }
    if (min > max) {
        throw new RangeError('min must be less than or equal to max.');
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function findObjXandY(objectArray, x, y) {
    return objectArray.find(obj => obj.x === x && obj.y === y);
}


const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// MAP
const mapWidth = 3584;
const mapHeight = canvas.height;

// const player = new Player(amp(16), mapHeight - 58, 16, 16, '#0095DD', [mapWidth, mapHeight]);
const player = new Mario(amp(9), xPosR(mapHeight, amp(3)), 16, 16, '#0095DD', [mapWidth, mapHeight]);
const camera = new Camera(player.x, player.y, canvas.width, canvas.height, [mapWidth, mapHeight]);
// const following = new GameObject(0, canvas.height - 16, 16, 16, 'red');

const moving = new MovingObject(amp(50), xPosR(mapHeight, amp(5)), amp(10), amp(3), '#80D010', false, 1, 10);
const ice = new Ice(amp(44), xPosR(mapHeight, amp(4)), amp(10), amp(1), '#80D010');

// const mario = new Image();
// mario.src = '/sprite/mario.png';

function stairs_generator(x, y, height, direction = true, lastpillar = false) {
    const stairs = [];
    if (direction) {
        for (let i = 0; i < height; i++) {
            stairs.push(new TileObject(amp(x + i), xPosR(mapHeight, amp(y + i)), amp(height - i), amp(1), '#C84C0C', "./sprite/smoothblock.png", true));
        }
        if (lastpillar) {
            stairs.push(new TileObject(amp(x + height), xPosR(mapHeight, amp(y + height - 1)), amp(1), amp(height), '#C84C0C', "./sprite/smoothblock.png", true));
        }
    } else {
        for (let i = 0; i < height; i++) {
            stairs.push(new TileObject(amp(x), xPosR(mapHeight, amp(y + i)), amp(height - i), amp(1), '#C84C0C', "./sprite/smoothblock.png", true));
        }
        if (lastpillar) {
            stairs.forEach(obj => new TileObject(obj.x + 1, obj.y, obj.width, obj.height, obj.color, obj.src, obj.tiling));
            stairs.push(new TileObject(amp(x), xPosR(mapHeight, amp(y + height - 1)), amp(1), amp(height), '#C84C0C', "./sprite/smoothblock.png", true));
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
    new Brick(amp(20), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(22), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(24), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    
    new Brick(amp(77), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(79), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),

    new Brick(amp(80), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(81), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(82), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(83), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(84), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(85), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(86), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(87), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),

    new Brick(amp(91), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(92), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(93), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(94), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    
    new Brick(amp(100), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(101), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(118), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    
    new Brick(amp(121), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(122), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(123), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    
    new Brick(amp(128), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(131), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(129), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(130), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    
    new Brick(amp(168), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(169), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new Brick(amp(171), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
]

const questionBlocks = [
    new QuestionBlock(amp(16), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#FC9838', "all", true),
    new QuestionBlock(amp(22), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#FC9838', "all", true),
    new QuestionBlock(amp(21), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(23), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(78), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(94), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),

    new QuestionBlock(amp(106), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(109), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(109), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(112), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(129), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(130), xPosR(mapHeight, amp(10)), amp(1), amp(1), '#C84C0C', "all", true),
    new QuestionBlock(amp(170), xPosR(mapHeight, amp(6)), amp(1), amp(1), '#C84C0C', "all", true),

]

const bgtiles = []


const repeatingbgtiles = [
    new Tile(amp(-7), xPosR(mapHeight, amp(3)), './sprite/bush2.png', amp(4), amp(1)),
    new Tile(amp(0), xPosR(mapHeight, amp(5)), './sprite/mountain_big.png', amp(5), amp(3)),
    new Tile(amp(11), xPosR(mapHeight, amp(3)), './sprite/bush3.png', amp(5), amp(1)),
    new Tile(amp(16), xPosR(mapHeight, amp(4)), './sprite/mountain_small.png', amp(3), amp(2)),
    new Tile(amp(23), xPosR(mapHeight, amp(3)), './sprite/bush1.png', amp(3), amp(1)),
    new Tile(amp(8), xPosR(mapHeight, amp(12)), './sprite/cloud1.png', amp(3), amp(2)),
    new Tile(amp(19), xPosR(mapHeight, amp(13)), './sprite/cloud1.png', amp(3), amp(2)),
    new Tile(amp(27), xPosR(mapHeight, amp(12)), './sprite/cloud3.png', amp(5), amp(2)),
    new Tile(amp(36), xPosR(mapHeight, amp(13)), './sprite/cloud2.png', amp(4), amp(2)),
]
for (let c = 0; c < 5; c++) {
    const newObjects = repeatingbgtiles.map(obj => new Tile(obj.x + (c * amp(48)), obj.y, obj.sprite.src, obj.width, obj.height));
    bgtiles.push(...newObjects);
}

bgtiles.push(...[
    //flagpole
    new Tile(amp(197), xPosR(mapHeight, amp(13)), './sprite/flagpole.png', amp(2), amp(10)),
    //castle
    new Tile(amp(202), xPosR(mapHeight, amp(7)), './sprite/castle.png', amp(5), amp(5)),
]);




// const ice = new Ice(amp(21), xPosR(mapHeight, amp(7)), amp(64), amp(1), '#80D010');

const walls = [
    // new TileObject(-16, xPosR(mapHeight, amp(2)), mapWidth + 16, amp(2), '#C84C0C', "./sprite/cobble.png", true),
    //ground
    new TileObject(-16, xPosR(mapHeight, amp(2)), amp(69) + 16, amp(2), '#C84C0C', "./sprite/cobble.png", true),
    new TileObject(amp(71), xPosR(mapHeight, amp(2)), amp(15), amp(2), '#C84C0C', "./sprite/cobble.png", true),
    new TileObject(amp(89), xPosR(mapHeight, amp(2)), amp(64), amp(2), '#C84C0C', "./sprite/cobble.png", true),
    new TileObject(amp(155), xPosR(mapHeight, amp(2)), mapWidth, amp(2), '#C84C0C', "./sprite/cobble.png", true),

    ...bricks,
    ...questionBlocks,
    ...stairs,

    // flagpole
    new TileObject(amp(198), xPosR(mapHeight, amp(3)), amp(1), amp(1), '#C84C0C', "./sprite/smoothblock.png"),
    
    // pipe
    new TileObject(amp(28), xPosR(mapHeight, amp(4)), amp(2), amp(2), '#80D010', "./sprite/pipe1.png"),
    new TileObject(amp(38), xPosR(mapHeight, amp(5)), amp(2), amp(3), '#80D010', "./sprite/pipe2.png"),
    new TileObject(amp(46), xPosR(mapHeight, amp(6)), amp(2), amp(4), '#80D010', "./sprite/pipe3.png"),
    new TileObject(amp(57), xPosR(mapHeight, amp(6)), amp(2), amp(4), '#80D010', "./sprite/pipe3.png"),
    new TileObject(amp(163), xPosR(mapHeight, amp(4)), amp(2), amp(2), '#80D010', "./sprite/pipe1.png"),
    new TileObject(amp(179), xPosR(mapHeight, amp(4)), amp(2), amp(2), '#80D010', "./sprite/pipe1.png"),
    //moving,
    //ice
];

const interactibles = [
    ...bricks,
    ...questionBlocks,
    //moving,
]

// playerInteractable
const presetInteractible = {
    wall: walls,
    interactible: interactibles,
}

bus.playerInteractable = presetInteractible;

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

        player.update(keyState);

        camera.follow(player);
        ctx.save();
        ctx.translate(-camera.x, 0);
        // objects draw here ---------------------------------
        
        // backround sky
        ctx.fillStyle = "#5C94FC";
        ctx.fillRect(0, 0, mapWidth, mapHeight);
        
        //drawGrid(ctx, mapWidth, mapHeight, 16);

        bgtiles.forEach(ee => ee.draw(ctx));
        for (const key in bus.playerInteractable) {
            if (Object.hasOwnProperty.call(bus.playerInteractable, key)) {
                const element = bus.playerInteractable[key];
                element.forEach(ee => ee.draw(ctx));
            }
        }

        
        // ctx.fillStyle = "#ff000050";
        // ctx.fillRect(
        //     moving.x + halfcut(moving.dx * 3, false) - player.dx, 
        //     moving.y,
        //     moving.width + halfcut(moving.dx  * 3, true) - halfcut(moving.dx * 3 + player.dx, false), 
        //     moving.height);
            //ctx.fillRect(moving.x + moving.dx * 2, moving.y, moving.width, moving.height);
        // ctx.fillRect(
        //     moving.x + (moving.width - (moving.width + Math.abs(moving.dx)) - player.dx), 
        //     moving.y, 
        //     moving.width + Math.abs(moving.dx * 2) - player.dx, 
        //     moving.height);

        player.draw(ctx);
        // following.width = player.width / 4;
        // following.x = player.x + (player.width - following.width) / 2;
        // following.y = player.y;
        // following.draw(ctx);


        // ctx.fillStyle = "#ff000050";
        // ctx.fillRect(player.x, player.y + player.height, player.width, halfcut(player.dy, true));
        // ctx.strokeText(text, x, y); // Optionally, draw the text outline
        
        // console.log(globalCounter);
        // ctx.drawImage(mario, player.x, player.y, 16, 16);

        ctx.restore();

        // ctx.font = "10px 'Press Start 2P'"; 
        ctx.fillStyle = 'white'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bus.coins, amp(2), amp(1)); 
        globalCounter += 1;
        bus.globalCounter = globalCounter;
    }

    requestAnimationFrame(gameLoop);
}




const myFont = new FontFace('Press-Start-2P', 'url(PressStart2P-Regular.ttf)');
myFont.load().then(function(font){
    document.fonts.add(font);

    console.log('Font loaded');
    // start game
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    ctx.font = "16px 'Press-Start-2P'";
    ctx.fillStyle = "white";

    ctx.fillText("LOADING", amp(4), mapHeight / 2);
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
