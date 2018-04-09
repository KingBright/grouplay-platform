quoridor = {}

quoridor.game = {}
quoridor.game.initialized = false
quoridor.game.instance
quoridor.game.cellWidth = 50
quoridor.game.wallWidth = 10
quoridor.game.xoffset = 35
quoridor.game.yoffset = 35
quoridor.game.cellNum = 9
quoridor.game.wallNum = 8
quoridor.game.WIDTH = 900
quoridor.game.HEIGHT = 600
quoridor.game.width
quoridor.game.height
quoridor.game.playerPanelLeft = 610
quoridor.game.playerPanelTop = 10
quoridor.game.rectangles = new Array() //game panel
quoridor.game.graphics // object to draw graphics on 

quoridor.game.screen // Current state, gameScreen, welcomeScreen

quoridor.game.arrow // indicates which player is now in action
quoridor.game.playerPanelSprites = new Array() // players on play panel
quoridor.game.playerPanelText = new Array()

quoridor.game.gamePanelSprites = new Array() // players on game panel
quoridor.game.potentialSprites = new Array()
quoridor.game.potentialShowed = false
quoridor.game.pendingWall // A rectangle representing a wall
quoridor.game.pendingWallIntersected = false // wheather intersected with existed walls
quoridor.game.hasRoute = true // If has route to go from current position to destination

quoridor.game.data = {}
quoridor.game.data.raw
quoridor.game.data.NONE
quoridor.game.data.PLAYER
quoridor.game.data.WALL
quoridor.game.data.panelDataSize
quoridor.game.data.walls = new Array() //game wall
quoridor.game.data.panelData // data of the game panel, an array with size of (9+8)*(9+8) which contains wall and player
quoridor.game.data.playerNum = 0 // player number of current game
quoridor.game.data.currentIndex = 0 // index of player in action
quoridor.game.data.myIndex = -1 //Index of player queue
quoridor.game.data.startInfos // start info(position & walls) of all players, order by index
quoridor.game.data.currentInfos // current info(position & walls) of all players, order by index
quoridor.game.data.playerData

quoridor.game.initialize = function () {
    quoridor.game.init(quoridor.game.WIDTH, quoridor.game.HEIGHT, "quoridor")
}

quoridor.game.data.updateData = function (data) {
    console.log('quoridor update data')

    this.raw = data;
    // basic info
    var config = data.config
    this.NONE = config.none
    this.PLAYER = config.player
    this.WALL = config.wall
    this.panelDataSize = config.width

    // Update game data
    var gameData = data.data
    this.panelData = gameData.panelData
    this.startInfos = gameData.startPosition
    this.currentInfos = gameData.currentPosition

    this.currentIndex = gameData.currentIndex
    this.myIndex = gameData.myIndex
    this.playerData = gameData.playerData
    this.playerNum = gameData.playerData.length

    if (quoridor.game.initialized == false) {
        return
    }

    console.log('update screen...')
    // Update player positions
    foreach(this.currentInfos, function (item, index) {
        quoridor.game.onPositionUpdate(index, item.x, item.y)
    })

    // Update active player
    quoridor.game.selectPlayer()

    // Update wall left
    foreach(this.playerData, function (item, index) {
        quoridor.game.playerPanelText[index].setText(item.name + " : " + item.wallLeft)
    })

    // Update walls
    this.walls.length = 0
    foreach(gameData.walls, function (item) {
        quoridor.game.data.walls.push(quoridor.game.createWall(item))
    })
};

quoridor.game.init = function (w, h, id) {
    this.width = w
    this.height = h

    function preload() {
    }

    function create() {
        console.log("initialize start")
        document.body.oncontextmenu = function () {
            return false;
        };

        console.log("initialize textures")
        quoridor.game.initTextures(quoridor.game.instance, function () {
            console.log("initialize game panel")
            quoridor.game.createGamePanel(quoridor.game.instance)

            console.log("initialize player panel")
            quoridor.game.createPlayerPanel(quoridor.game.instance)
            quoridor.game.screen = quoridor.screens.game

            console.log("add move callback")
            quoridor.game.instance.input.addMoveCallback(function (event, x, y, down) {
                if (quoridor.game.screen) {
                    quoridor.game.screen.onMouse(x, y, down)
                }
            }, this.instance)

            console.log('initialized...')
            quoridor.game.initialized = true
            quoridor.game.data.updateData(quoridor.game.data.raw)
        })
    }

    function render() {
    }

    function update() {
        if (quoridor.game.screen) {
            quoridor.game.screen.onUpdate(quoridor.game.instance)
        }
    }

    quoridor.game.instance = new Phaser.Game(w, h, Phaser.AUTO, id, {
        preload: preload,
        create: create,
        update: update,
        render: render
    });
}

quoridor.game.getMyRect = function () {
    return this.gamePanelSprites[this.data.myIndex].mapRect
}

// Wheather is my turn
quoridor.game.isMyTurn = function (index) {
    if (index) {
        return index == this.data.currentIndex
    }
    return this.data.myIndex == this.data.currentIndex
}

quoridor.game.onPositionUpdate = function (index, x, y) {
    console.log('update position for player', index, 'position is (', x, ',', y, ')')
    var mySprite = this.gamePanelSprites[index]
    var playerCo = this.getPlayerCoordinate(x, y)
    mySprite.x = playerCo.left
    mySprite.y = playerCo.top

    var cellCo = this.getCellCoordinate(x, y)
    mySprite.mapRect.x = cellCo.left
    mySprite.mapRect.y = cellCo.top

    // update info
    var myInfo = this.data.currentInfos[index]
    myInfo.x = x
    myInfo.y = y

    // update map data
    this.data.panelData[mySprite.mapX][mySprite.mapY] = this.data.NONE
    this.data.panelData[myInfo.x][myInfo.y] = this.data.PLAYER
    mySprite.mapX = x
    mySprite.mapY = y
}

quoridor.game.onPotentialClick = function (sprite) {
    var x = sprite.mapX
    var y = sprite.mapY
    this.removePotential()
    this.potentialShowed = false

    var mySprite = this.gamePanelSprites[this.data.myIndex]
    var playerCo = this.getPlayerCoordinate(x, y)
    mySprite.x = playerCo.left
    mySprite.y = playerCo.top

    var cellCo = this.getCellCoordinate(x, y)
    mySprite.mapRect.x = cellCo.left
    mySprite.mapRect.y = cellCo.top

    // update info
    var myInfo = this.data.currentInfos[this.data.myIndex]
    myInfo.x = x
    myInfo.y = y

    // update map data
    this.data.panelData[mySprite.mapX][mySprite.mapY] = this.data.NONE
    this.data.panelData[myInfo.x][myInfo.y] = this.data.PLAYER
    mySprite.mapX = x
    mySprite.mapY = y

    quoridor.game.data.send("move", {x: x, y: y})
}

quoridor.game.onMySpriteClick = function (sprite) {
    if (!quoridor.game.isMyTurn(sprite.myIndex)) {
        return
    }

    if (this.potentialShowed == true) {
        this.removePotential()
        this.potentialShowed = false
        return
    }
    if (this.showPotential()) {
        this.potentialShowed = true
    }
}

quoridor.game.removePotential = function () {
    while (this.potentialSprites.length > 0) {
        this.potentialSprites.pop().destroy()
    }
}

// Show potential moves & make a float effect of your player sprite
quoridor.game.showPotential = function () {
    console.log("showPotential")
    var myInfo = this.data.currentInfos[this.data.myIndex]
    console.log(myInfo)
    var x = myInfo.x
    var y = myInfo.y

    var finalPotential = new Array()

    // 17*17 grid, so every two cell or wall has distance of 2,
    var potentials = [{
        x: x - 2,
        y: y
    }, {
        x: x,
        y: y - 2
    }, {
        x: x,
        y: y + 2
    }, {
        x: x + 2,
        y: y
    }]

    var nearWalls = [{
        x: x - 1,
        y: y
    }, {
        x: x,
        y: y - 1
    }, {
        x: x,
        y: y + 1
    }, {
        x: x + 1,
        y: y
    }]

    for (var i = 0; i < 4; i++) {
        var wall = nearWalls[i]
        // if coordinate is invalid
        if (this.invalid(wall.x, wall.y)) {
            continue
        }
        // If is wall
        if (this.isWall(wall.x, wall.y)) {
            continue
        }
        // If is another player
        if (this.isPlayer(potentials[i].x, potentials[i].y)) {
            // check cells around this player
            var tx = potentials[i].x
            var ty = potentials[i].y
            var wallsArround = [{
                x: tx,
                y: ty - 1
            }, {
                x: tx - 1,
                y: ty
            }, {
                x: tx + 1,
                y: ty
            }, {
                x: tx,
                y: ty + 1
            }]
            var cellsArround = [{
                x: tx,
                y: ty - 2
            }, {
                x: tx - 2,
                y: ty
            }, {
                x: tx + 2,
                y: ty
            }, {
                x: tx,
                y: ty + 2
            }]

            //Side cells may need to be shown
            var pending = new Array()
            for (var j = 0; j < 4; j++) {
                var wallx = wallsArround[j].x
                var wally = wallsArround[j].y
                var cellx = cellsArround[j].x
                var celly = cellsArround[j].y
                if (this.invalid(wallx, wally) || this.invalid(cellx, celly)) {
                    continue
                }
                // current player cell, ignore
                if (cellx == x && celly == y) {
                    console.log("self, ignore")
                    continue
                }
                // has wall
                if (this.isWall(wallx, wally)) {
                    console.log("has wall, ignore")
                    continue
                }
                // NO way to go
                if (this.isPlayer(cellx, celly)) {
                    console.log("has player, ignore")
                    continue
                }

                // same row or column with current player cell
                if (cellx == x || celly == y) {
                    if (this.isEmpty(cellx, celly)) {
                        console.log("has way ahead, clear pending")
                        pending.length = 0
                        finalPotential.push({
                            x: cellx,
                            y: celly
                        })
                        break;
                    }
                }

                if (this.isEmpty(cellx, celly)) {
                    console.log("put into pending arrY")
                    pending.push(cellsArround[j])
                }
            }

            var pendingSize = pending.length
            for (var k = 0; k < pendingSize; k++) {
                finalPotential.push({
                    x: pending[k].x,
                    y: pending[k].y
                })
            }
            continue
        }
        finalPotential.push({
            x: potentials[i].x,
            y: potentials[i].y
        })
    }

    var size = finalPotential.length
    for (var i = 0; i < size; i++) {
        this.createPotential(finalPotential[i].x, finalPotential[i].y)
    }
    console.log("potential positions", size)
    return size > 0
}

quoridor.game.invalid = function (x, y) {
    return x < 0 || y < 0 || x >= 17 || y >= 17
}

quoridor.game.isPlayer = function (x, y) {
    return this.data.panelData[x][y] == this.data.PLAYER
}

quoridor.game.isWall = function (x, y) {
    return this.data.panelData[x][y] == this.data.WALL
}

quoridor.game.isEmpty = function (x, y) {
    return this.data.panelData[x][y] == this.data.NONE
}

quoridor.game.createPotential = function (x, y) {
    var playerCo = this.getPlayerCoordinate(x, y)
    var sprite = this.instance.add.sprite(playerCo.left, playerCo.top, 'player_potential')

    // Store the coordinate of the cell
    sprite.mapX = x
    sprite.mapY = y
    sprite.myIndex = quoridor.game.data.myIndex
    sprite.inputEnabled = true;
    sprite.events.onInputDown.add(this.onPotentialClick, this);
    sprite.anchor = new PIXI.Point(0.5, 0.5)
    this.potentialSprites.push(sprite)

    var cellCo = this.getCellCoordinate(x, y)
    var rect = new Phaser.Rectangle(cellCo.left, cellCo.top, this.cellWidth, this.cellWidth)
    sprite.mapRect = rect
}

quoridor.game.initTextures = function (game, callback) {
    var player_orange = [
        '....7777....',
        '...777777...',
        '..77777777..',
        '.7777777777.',
        '.7777777777.',
        '.7777777777.',
        '..77777777..',
        '...777777...',
        '....7777....',
        '..77777777..',
        '.7777777777.',
        '777777777777',
        '777777777777',
        '777777777777',
        '777777777777',
        '777777777777'
    ];
    var player_pink = [
        '....4444....',
        '...444444...',
        '..44444444..',
        '.4444444444.',
        '.4444444444.',
        '.4444444444.',
        '..44444444..',
        '...444444...',
        '....4444....',
        '..44444444..',
        '.4444444444.',
        '444444444444',
        '444444444444',
        '444444444444',
        '444444444444',
        '444444444444'
    ];
    var player_blue = [
        '....EEEE....',
        '...EEEEEE...',
        '..EEEEEEEE..',
        '.EEEEEEEEEE.',
        '.EEEEEEEEEE.',
        '.EEEEEEEEEE.',
        '..EEEEEEEE..',
        '...EEEEEE...',
        '....EEEE....',
        '..EEEEEEEE..',
        '.EEEEEEEEEE.',
        'EEEEEEEEEEEE',
        'EEEEEEEEEEEE',
        'EEEEEEEEEEEE',
        'EEEEEEEEEEEE',
        'EEEEEEEEEEEE'
    ];
    var player_green = [
        '....AAAA....',
        '...AAAAAA...',
        '..AAAAAAAA..',
        '.AAAAAAAAAA.',
        '.AAAAAAAAAA.',
        '.AAAAAAAAAA.',
        '..AAAAAAAA..',
        '...AAAAAA...',
        '....AAAA....',
        '..AAAAAAAA..',
        '.AAAAAAAAAA.',
        'AAAAAAAAAAAA',
        'AAAAAAAAAAAA',
        'AAAAAAAAAAAA',
        'AAAAAAAAAAAA',
        'AAAAAAAAAAAA'
    ];
    var player_grey = [
        '....1111....',
        '...111111...',
        '..11111111..',
        '.1111111111.',
        '.1111111111.',
        '.1111111111.',
        '..11111111..',
        '...111111...',
        '....1111....',
        '..11111111..',
        '.1111111111.',
        '111111111111',
        '111111111111',
        '111111111111',
        '111111111111',
        '111111111111'
    ];
    var player_white = [
        '....2222....',
        '...222222...',
        '..22222222..',
        '.2222222222.',
        '.2222222222.',
        '.2222222222.',
        '..22222222..',
        '...222222...',
        '....2222....',
        '..22222222..',
        '.2222222222.',
        '222222222222',
        '222222222222',
        '222222222222',
        '222222222222',
        '222222222222'
    ];
    var arrow = [
        '................',
        '................',
        '..........2.....',
        '..........22....',
        '..........222...',
        '..........2222..',
        '..........22222.',
        '2222222222222222',
        '2222222222222222',
        '..........22222.',
        '..........2222..',
        '..........222...',
        '..........22....',
        '..........2.....',
        '................',
        '................'
    ];
    var redo = [
        '.....22222222...',
        '....2222222222..',
        '...222......222.',
        '..222........222',
        '..22..........22',
        '..22..........22',
        '..22..........22',
        '222222........22',
        '.2222.........22',
        '..22..........22',
        '..22..........22',
        '..............22',
        '.............222',
        '...22.......222.',
        '....2222222222..',
        '.....22222222...'
    ];

    var count = 8;
    var textureCallback = function (context, texture) {
        console.log('texture created')
        count = count - 1;
        if (count == 0) {
            if (callback) {
                callback()
            }
        }
    }

    game.create.texture('redo', redo, 2, 2, 0, true, textureCallback)
    game.create.texture('arrow', arrow, 2, 2, 0, true, textureCallback)

    game.create.texture('player_0', player_blue, 2, 2, 0, true, textureCallback)

    game.create.texture('player_1', player_pink, 2, 2, 0, true, textureCallback)
    game.create.texture('player_2', player_orange, 2, 2, 0, true, textureCallback)
    game.create.texture('player_3', player_green, 2, 2, 0, true, textureCallback)

    game.create.texture('player_inactive', player_grey, 2, 2, 0, true, textureCallback)
    game.create.texture('player_potential', player_white, 2, 2, 0, true, textureCallback)
}

// Player pannel
quoridor.game.createPlayerPanel = function (game) {
    var playerPanelLeft = this.playerPanelLeft
    var playerPanelTop = this.playerPanelTop
    var playerNum = this.data.playerNum
    var style = {font: "20px Arial", fill: "#fff", boundsAlignH: "left", boundsAlignV: "middle"};
    console.log('player data', this.data.playerData)
    for (var i = 0; i < playerNum; i++) {
        console.log("add player", i)
        //icon
        var sprite = game.add.sprite(playerPanelLeft + 40, playerPanelTop + 40 * i, 'player_' + i)
        //name
        var name = game.add.text(0, 0, this.data.playerData[i].name + " : " + this.data.playerData[i].wallLeft, style);
        name.setTextBounds(playerPanelLeft + 80, playerPanelTop + 40 * i, 50, 40);
        this.playerPanelSprites.push(sprite)
        this.playerPanelText.push(name)
    }
    console.log('add player done')

    var currentPlayerIndex = this.data.currentIndex
    this.arrow = game.add.sprite(playerPanelLeft, playerPanelTop + 40 * currentPlayerIndex, 'arrow')
}

quoridor.game.createGamePanel = function (game) {
    var cellWidth = this.cellWidth
    var wallWidth = this.wallWidth

    var xoffset = this.xoffset
    var yoffset = this.yoffset

    var cellNum = this.cellNum

    var xborderWidth = xoffset * 2 + cellWidth * cellNum + wallWidth * (cellNum - 1)
    var yborderWidth = yoffset * 2 + cellWidth * cellNum + wallWidth * (cellNum - 1)
    var borderRect = new Phaser.Rectangle(0, 0, xborderWidth, yborderWidth)

    var rects = quoridor.game.rectangles

    rects.push(borderRect)

    // Rectangles for panel
    for (i = 0; i < cellNum; i++) {
        var x = xoffset + cellWidth * i + wallWidth * i
        for (j = 0; j < cellNum; j++) {
            y = yoffset + cellWidth * j + wallWidth * j
            var rect = new Phaser.Rectangle(x, y, cellWidth, cellWidth)
            rects.push(rect)
        }
    }

    // Draw game panel
    quoridor.game.graphics = game.add.graphics(0, 0);
    var graphics = quoridor.game.graphics
    graphics.beginFill(0xdeb887, 0.5)
    var len = rects.length
    for (var i = 0; i < len; i++) {
        graphics.drawRect(rects[i].x, rects[i].y, rects[i].width, rects[i].height)
    }
    graphics.endFill()

    var playerNum = this.data.playerNum
    console.log("player num is", playerNum)
    for (var i = 0; i < playerNum; i++) {
        var point = this.data.currentInfos[i]
        console.log("player position", point.x, point.y)
        var playerCo = this.getPlayerCoordinate(point.x, point.y)

        var sprite = game.add.sprite(playerCo.left, playerCo.top, 'player_' + i)
        sprite.myIndex = i
        sprite.mapX = point.x
        sprite.mapY = point.y
        sprite.anchor = new PIXI.Point(0.5, 0.5)
        this.gamePanelSprites.push(sprite)

        var cellCo = this.getCellCoordinate(point.x, point.y)
        var rect = new Phaser.Rectangle(cellCo.left, cellCo.top, this.cellWidth, this.cellWidth)
        sprite.mapRect = rect

        sprite.inputEnabled = true;
        if (i == this.data.myIndex) {
            sprite.events.onInputDown.add(this.onMySpriteClick, this);
        }

        this.data.panelData[point.x][point.y] = this.data.PLAYER
    }
    //blue   49  162 142 0x31A2F2 //top
    //pink   224 111 139 0xE06F8B //left
    //orange 235 137 49  0xEB8931
    //green  68  137 26  0x44891A
    var colors = [0x31A2F2, 0x44891A, 0xE06F8B, 0xEB8931]

    var sides = [[new Phaser.Point(0, 0),
        new Phaser.Point(quoridor.game.HEIGHT, 0),
        new Phaser.Point(quoridor.game.HEIGHT - quoridor.game.xoffset, quoridor.game.yoffset),
        new Phaser.Point(quoridor.game.xoffset, quoridor.game.yoffset)],//top
        [new Phaser.Point(quoridor.game.HEIGHT, 0),
            new Phaser.Point(quoridor.game.HEIGHT, quoridor.game.HEIGHT),
            new Phaser.Point(quoridor.game.HEIGHT - quoridor.game.xoffset, quoridor.game.HEIGHT - quoridor.game.yoffset),
            new Phaser.Point(quoridor.game.HEIGHT - quoridor.game.xoffset, quoridor.game.yoffset)],//right
        [new Phaser.Point(0, 0),
            new Phaser.Point(0, quoridor.game.HEIGHT),
            new Phaser.Point(quoridor.game.xoffset, quoridor.game.HEIGHT - quoridor.game.yoffset),
            new Phaser.Point(quoridor.game.xoffset, quoridor.game.yoffset)],//left
        [new Phaser.Point(0, quoridor.game.HEIGHT),
            new Phaser.Point(quoridor.game.HEIGHT, quoridor.game.HEIGHT),
            new Phaser.Point(quoridor.game.HEIGHT - quoridor.game.xoffset, quoridor.game.HEIGHT - quoridor.game.yoffset),
            new Phaser.Point(quoridor.game.xoffset, quoridor.game.HEIGHT - quoridor.game.yoffset)],//bottom
    ]

    for (var i = 0; i < quoridor.game.data.playerNum; i++) {
        var polygon = new Phaser.Polygon();
        graphics = game.add.graphics(0, 0);
        if (i == 1 && i == quoridor.game.data.playerNum - 1) {
            graphics.beginFill(colors[2]);
        } else {
            graphics.beginFill(colors[i]);
        }
        if (i == 1 && i == quoridor.game.data.playerNum - 1) {
            polygon.setTo(sides[3]);
        } else {
            polygon.setTo(sides[i]);
        }
        graphics.drawPolygon(polygon.points);
        graphics.endFill();
    }
}

// Get coordinate from position on game panel
// Notice: this coordinate is based on the 17*17 grid not 9*9
quoridor.game.getCellCoordinate = function (x, y) {
    var cellWidth = this.cellWidth
    var wallWidth = this.wallWidth

    var xoffset = this.xoffset
    var yoffset = this.yoffset

    x = Math.floor(x / 2)
    y = Math.floor(y / 2)

    var left = xoffset + cellWidth * x + wallWidth * x
    var top = yoffset + cellWidth * y + wallWidth * y

    return {
        left: left,
        top: top
    }
}

// Get coordinate from position on game panel
// Notice: this coordinate is based on the 17*17 grid not 9*9
quoridor.game.getPlayerCoordinate = function (x, y) {
    var cellWidth = this.cellWidth
    var wallWidth = this.wallWidth

    var xoffset = this.xoffset
    var yoffset = this.yoffset

    x = Math.floor(x / 2)
    y = Math.floor(y / 2)

    var left = xoffset + cellWidth * x + wallWidth * x + cellWidth / 2
    var top = yoffset + cellWidth * y + wallWidth * y + cellWidth / 2

    return {
        left: left,
        top: top
    }
}

quoridor.game.removePendingWall = function () {
    this.pendingWall = null
}

quoridor.game.putDownPendingWall = function (x, y) {
    if (!this.isMyTurn()) {
        return
    }

    if (!this.pendingWall) {
        return
    }

    if (this.pendingWallIntersected) {
        return
    }

    if (!this.hasRoute) {
        return
    }

    if (this.data.playerData[this.data.myIndex].wallLeft <= 0) {
        return
    }

    console.log("add pending wall")

    var positions = this.pendingWall.info
    this.data.walls.push(this.pendingWall)

    foreach(positions, function (position) {
        quoridor.game.data.panelData[position.x][position.y] = quoridor.game.data.WALL
    })

    quoridor.game.data.send("put_wall", this.pendingWall.info)
    this.pendingWall = null
}

quoridor.game.createWall = function (wallInfo) {
    var cellWidth = this.cellWidth
    var wallWidth = this.wallWidth

    var xoffset = this.xoffset
    var yoffset = this.yoffset

    var left = Math.floor((wallInfo[1].x + 1) / 2)
    var top = Math.floor((wallInfo[1].y + 1) / 2)

    var wall = new Phaser.Rectangle(0, 0, 0, 0)

    var rectX, rectY
    var rectW, rectH
    // vertical
    if (wallInfo[0].x == wallInfo[2].x) {
        rectX = xoffset + left * cellWidth + (left - 1) * wallWidth
        rectY = yoffset + (top - 1) * cellWidth + (top - 1) * wallWidth

        rectW = wallWidth
        rectH = cellWidth * 2 + wallWidth
    } else if (wallInfo[0].y == wallInfo[2].y) {
        rectX = xoffset + (left - 1) * cellWidth + (left - 1) * wallWidth
        rectY = yoffset + top * cellWidth + (top - 1) * wallWidth

        rectW = cellWidth * 2 + wallWidth
        rectH = wallWidth
    }

    wall.x = rectX
    wall.y = rectY
    wall.width = rectW
    wall.height = rectH
    wall.info = wallInfo
    return wall
}

// Calculate the pending wall position. Show a pending wall on the right position
quoridor.game.createPendingWall = function (x, y) {
    if (this.data.myIndex <= 0 && this.data.playerData[this.data.myIndex].wallLeft <= 0) {
        return
    }
    var cellWidth = this.cellWidth
    var wallWidth = this.wallWidth

    var xoffset = this.xoffset
    var yoffset = this.yoffset

    var cellNum = this.cellNum
    var wallNum = this.wallNum

    var xborderWidth = xoffset * 2 + cellWidth * cellNum + wallWidth * (cellNum - 1)
    var yborderWidth = yoffset * 2 + cellWidth * cellNum + wallWidth * (cellNum - 1)

    // the distance to wall, <0 on wall, >0 out of wall
    var xDelta = 9999
    var yDelta = 9999

    // wall index
    var xIndex = -1
    var yIndex = -1

    // Check horizontal, 8 walls
    for (var i = 1; i <= wallNum; i++) {
        var wallleft = xoffset + i * cellWidth + wallWidth * (i - 1)
        var wallright = xoffset + i * cellWidth + wallWidth * i
        if (wallleft < x && wallright > x) {
            xIndex = i
            xDelta = Math.min(x - wallleft, wallright - x)
            break
        } else
        // left of wall
        if (wallleft > x) {
            if (wallleft - x <= cellWidth / 2) {
                xIndex = i
                xDelta = wallleft - x
                break
            } else if (x > xoffset) {
                if (i <= 1) {
                    xIndex = 1
                    break
                }
            }
        } else
        // right of wall
        if (x > wallright) {
            if (x - wallright <= cellWidth / 2) {
                xIndex = i
                xDelta = x - wallright
                break
            } else if (x < xborderWidth - xoffset) {
                if (i >= wallNum) {
                    xIndex = wallNum
                    break
                }
            }
        }
    }
    // Check vertical
    for (var j = 1; j <= wallNum; j++) {
        var walltop = yoffset + j * cellWidth + wallWidth * (j - 1)
        var wallbottom = yoffset + j * cellWidth + wallWidth * j

        // on wall
        if (walltop < y && wallbottom > y) {
            yIndex = j
            yDelta = Math.min(y - walltop, wallbottom - y)
            break
        } else
        // top of wall
        if (walltop > y) {
            if (walltop - y <= cellWidth / 2) {
                yIndex = j
                yDelta = walltop - y
                break
            } else if (y > yoffset) {
                if (j <= 1) {
                    yIndex = 1
                    break
                }
            }
        } else
        // bottom of wall
        if (y > wallbottom) {
            if (y - wallbottom <= cellWidth / 2) {
                yIndex = j
                yDelta = y - wallbottom
                break
            } else if (y < yborderWidth - yoffset) {
                if (j >= wallNum) {
                    yIndex = wallNum
                    break
                }
            }
        }
    }

    if (xIndex == -1 || yIndex == -1 || xDelta == yDelta == 9999) {
        // If not valid, reset the rect
        this.pendingWall = null
        return
    }

    var rectW, rectH
    var rectX, rectY

    var wallInfo

    // vertial wall
    if (xDelta <= yDelta) {
        rectX = xoffset + xIndex * cellWidth + (xIndex - 1) * wallWidth
        rectY = yoffset + (yIndex - 1) * cellWidth + (yIndex - 1) * wallWidth
        rectW = wallWidth
        rectH = cellWidth * 2 + wallWidth

        // transform from 8*8(count from 1 to 9) to 17*17(count from 0 to 16) coordinates
        wallInfo = [{
            x: (xIndex - 1) * 2 + 1,
            y: (yIndex - 1) * 2
        }, {
            x: (xIndex - 1) * 2 + 1,
            y: (yIndex - 1) * 2 + 1
        }, {
            x: (xIndex - 1) * 2 + 1,
            y: (yIndex - 1) * 2 + 2
        }]
    }
    // Horizontal wall
    else {
        rectX = xoffset + (xIndex - 1) * cellWidth + (xIndex - 1) * wallWidth
        rectY = yoffset + yIndex * cellWidth + (yIndex - 1) * wallWidth
        rectW = cellWidth * 2 + wallWidth
        rectH = wallWidth
        wallInfo = [{
            x: (xIndex - 1) * 2,
            y: (yIndex - 1) * 2 + 1
        }, {
            x: (xIndex - 1) * 2 + 1,
            y: (yIndex - 1) * 2 + 1
        }, {
            x: (xIndex - 1) * 2 + 2,
            y: (yIndex - 1) * 2 + 1
        }]
    }

    if (!this.pendingWall) {
        this.pendingWall = new Phaser.Rectangle(0, 0, 0, 0)
    }

    // Update pending wall rect
    this.pendingWall.x = rectX
    this.pendingWall.y = rectY
    this.pendingWall.width = rectW
    this.pendingWall.height = rectH

    this.pendingWall.info = wallInfo

    this.checkConnectivity(wallInfo)
}


// Select player(make the arrow pointing to active player)
quoridor.game.selectPlayer = function () {
    var playerPanelTop = quoridor.game.playerPanelTop
    var currentPlayerIndex = quoridor.game.data.currentIndex
    quoridor.game.arrow.y = playerPanelTop + 40 * currentPlayerIndex

    console.log('update arrow position :', y)
}

quoridor.game.checkConnectivity = function (wallInfo) {
    var data = deepcopy(quoridor.game.data.panelData)

    foreach(wallInfo, function (item) {
        data[item.x][item.y] = quoridor.game.data.WALL
    })

    var graph = new Graph(data)
    var allOK = true

    var startInfo = quoridor.game.data.startInfos
    var currentInfo = quoridor.game.data.currentInfos
    loop(quoridor.game.data.playerNum, function (index) {
        var start = graph.grid[currentInfo[index].x][currentInfo[index].y]
        var endList = quoridor.game.getDestinationList(startInfo[index].x, startInfo[index].y)
        var hasRoute = false
        foreach(endList, function (position) {
            var end = graph.grid[position.x][position.y]
            graph.init()
            var result = astar.search(graph, start, end, {
                wallMarker: quoridor.game.data.WALL
            });
            if (result.length > 0) {
                hasRoute = true
                return true
            }
        })

        if (hasRoute == false) {
            allOK = false
            return true
        } else {
            return false
        }
    })

    if (allOK == true) {
        quoridor.game.hasRoute = true
    } else if (allOK == false) {
        quoridor.game.hasRoute = false
    }
}

quoridor.game.getDestinationList = function (x, y) {
    var list = new Array()
    if (x == 0) {
        for (var i = 0; i < 17; i += 2) {
            list.push({
                x: 16,
                y: i
            })
        }
    }
    if (x == 16) {
        for (var i = 0; i < 17; i += 2) {
            list.push({
                x: 0,
                y: i
            })
        }
    }
    if (y == 0) {
        for (var i = 0; i < 17; i += 2) {
            list.push({
                x: i,
                y: 16
            })
        }
    }
    if (y == 16) {
        for (var i = 0; i < 17; i += 2) {
            list.push({
                x: i,
                y: 0
            })
        }
    }

    return list
}

quoridor.game.checkWinning = function () {

}

// TODO Show a panel to input text(for create a group, or for set player name)
quoridor.game.showInputPanel = function (game, callback) {
    var word = "phaser";
    var correct = [];

    //  Here we'll create a simple array where each letter of the word to enter represents one element:
    for (var i = 0; i < word.length; i++) {
        correct[word[i]] = false;
    }

    //  This is our BitmapData onto which we'll draw the word being entered
    var bmd = game.make.bitmapData(800, 200);
    bmd.context.font = '64px Arial';
    bmd.context.fillStyle = '#ffffff';
    bmd.context.fillText(word, 64, 64);
    bmd.addToWorld();

    //  Capture all key presses
    game.input.keyboard.addCallbacks(this.instance, null, null, keyPress);

    function keyPress(aaa) {

        //  Clear the BMD
        bmd.cls();

        //  Set the x value we'll start drawing the text from
        var x = 64;

        //  Loop through each letter of the word being entered and check them against the key that was pressed
        for (var i = 0; i < word.length; i++) {
            var letter = word.charAt(i);

            //  If they pressed one of the letters in the word, flag it as correct
            if (aaa === letter) {
                correct[letter] = true;
            }

            //  Now draw the word, letter by letter, changing colour as required
            if (correct[letter]) {
                bmd.context.fillStyle = '#00ff00';
            } else {
                bmd.context.fillStyle = '#ffffff';
            }

            bmd.context.fillText(letter, x, 64);

            x += bmd.context.measureText(letter).width;
        }
    }
}

// TODO Show a prompt with animation
quoridor.game.prompt = function (game, text) {

}

// Game states
quoridor.screens = {}
// Welcome screen
quoridor.screens.welcome = {
    onUpdate: function (game) {
    },
    onMouse: function (x, y, down) {
    }
}

// game screen
quoridor.screens.game = {
    alphaSign: -1,
    onCreate: function (game) {

    },
    onUpdate: function (game) {
        // Show pending wall
        var hasRoute = quoridor.game.hasRoute
        if (hasRoute) {
            game.debug.geom(quoridor.game.pendingWall, 'rgba(246,227,206,1)');
        } else {
            game.debug.geom(quoridor.game.pendingWall, 'rgba(250,88,88,1)');
        }

        var wallSize = quoridor.game.data.walls.length
        quoridor.game.pendingWallIntersected = false
        if (wallSize > 0) {
            for (var i = 0; i < wallSize; i++) {
                game.debug.geom(quoridor.game.data.walls[i], 'rgba(245,208,169,1)');
                if (quoridor.game.pendingWall) {
                    var intersects = Phaser.Rectangle.intersection(quoridor.game.pendingWall, quoridor.game.data.walls[i]);
                    if (intersects.width > 0 && intersects.height > 0) {
                        quoridor.game.pendingWallIntersected = true
                        game.debug.geom(intersects, 'rgba(250,88,88,1)');
                    }
                }
            }
        }

        // Show potential move position with alpha animation
        var potentialSize = quoridor.game.potentialSprites.length
        if (potentialSize > 0) {
            for (var i = 0; i < potentialSize; i++) {
                var sprite = quoridor.game.potentialSprites[i]
                sprite.alpha = sprite.alpha + this.alphaSign * 0.01
            }
            if (quoridor.game.potentialSprites[0].alpha <= 0.5) {
                this.alphaSign = 1
            }
            if (quoridor.game.potentialSprites[0].alpha >= 1) {
                this.alphaSign = -1
            }
        }
    },
    onMouse: function (x, y, down) {
        if (quoridor.game.potentialShowed == true) {
            var sprites = quoridor.game.potentialSprites
            var size = sprites.length
            for (var i = 0; i < size; i++) {
                var sprite = sprites[i]
                if (sprite.mapRect.contains(x, y)) {
                    sprite.scale = new PIXI.Point(1.3, 1.3)
                } else {
                    sprite.scale = new PIXI.Point(1, 1)
                }
            }
        } else {
            var rect = quoridor.game.getMyRect()
            if (rect.contains(x, y) == true) {
                quoridor.game.removePendingWall()
            } else {
                if (down == true) {
                    quoridor.game.putDownPendingWall(x, y)
                } else {
                    quoridor.game.createPendingWall(x, y)
                }
            }
        }
    }
}