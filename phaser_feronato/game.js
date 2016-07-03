window.onload = function() {
    // Setup
    var tileSize = 80,
        numRows = 4,
        numCols = 5,
        tileSpacing = 10,
        tilesArray = [],
        selectedArray = [],
        playSound,
        score,
        timeLeft,
        tilesLeft,
        localStorageName = 'memorygame',
        highScore;

    // Main Game obj
    var game = new Phaser.Game(500, 500);

    // State: Game Screen
    var playGame = function(game) {};
    playGame.prototype = {

        // Setup
        soundArray: [],
        scoreText: null,

        preload: function() {
            console.info('Phaser state: preload');

            // Sprites
            game.load.spritesheet('tiles', 'tiles.png', tileSize, tileSize);

            // Audio
            game.load.audio('select', ['select.mp3', 'select.ogg']);
            game.load.audio('right', ['right.mp3', 'right.ogg']);
            game.load.audio('wrong', ['wrong.mp3', 'wrong.ogg']);
        },

        create: function() {
            console.info('Phaser state: create');

            // Setup
            score = 0;
            timeLeft = 60;

            this.placeTiles();
            if(playSound) {
                // audio(key,volume) 1=max
                this.soundArray[0] = game.add.audio('select', 1);
                this.soundArray[1] = game.add.audio('right', 1);
                this.soundArray[2] = game.add.audio('wrong', 1);
            }

            // Score
            var style = {
                font: '32px Monospace',
                fill: '#00ff00',
                align: 'center'
            };
            this.scoreText = game.add.text(5, 5, "Score: " + score, style);

            // Timer
            this.timeText = game.add.text(5, game.height - 5, 'Time Left: ' + timeLeft, style);
            this.timeText.anchor.set(0, 1);
            game.time.events.loop(Phaser.Timer.SECOND, this.decreaseTime, this);
        },

        decreaseTime: function() {
            timeLeft--;
            this.timeText.text = 'Time Left: ' + timeLeft;

            // Game over
            if(timeLeft === 0) {
                game.state.start('GameOver');
            }
        },

        placeTiles: function() {

            // Feature
            tilesLeft = numRows * numCols;

            // Centering tiles
            var leftSpace = (game.width - (numCols * tileSize) - ((numCols - 1) * tileSpacing)) / 2;
            var topSpace = (game.height - (numRows * tileSize) - ((numRows - 1) * tileSpacing)) / 2;

            // Populate tile array - total number of tiles
            for (var i = 0; i < numRows * numCols; i++) {
                tilesArray.push(Math.floor(i/2));
            }
            console.info('Generated Tile[]: ' + tilesArray);

            // Shuffle tiles
            for (i = 0; i < numRows * numCols; i++) {
                var from = game.rnd.between(0, tilesArray.length-1);
                var to = game.rnd.between(0, tilesArray.length-1);

                // swap
                var temp  = tilesArray[from];
                tilesArray[from] = tilesArray[to];
                tilesArray[to] = temp;
            }
            console.info('Shuffled Tile[]: ' + tilesArray);

            // Display button/img
            for(i = 0; i < numCols; i++) {
                console.log('----');
                for(var j = 0; j < numRows; j++) {
                    var tile = game.add.button(leftSpace + i * (tileSize + tileSpacing),
                                              topSpace + j * (tileSize + tileSpacing), 'tiles',
                                              this.showTile, this);
                    tile.frame = 10;
                    tile.value = tilesArray[j * numCols + i]; // value = custom property
                }
            }
        },

        showTile: function(target) {

            // indexOf check if obj is already added
            if(selectedArray.length < 2 && selectedArray.indexOf(target) === -1) {

                // Play select sound
                if(playSound) { this.soundArray[0].play(); }

                target.frame = target.value;
                selectedArray.push(target);
            }

            if(selectedArray.length === 2) {
                game.time.events.add(Phaser.Timer.SECOND, this.checkTiles, this);
            }
        },

        checkTiles: function() {
            if(selectedArray[0].value === selectedArray[1].value) {

                // Play right sound
                if(playSound) { this.soundArray[1].play(); }

                // Score
                score++;
                timeLeft += 2;
                this.timeText.text = 'Time Left: ' + timeLeft;
                this.scoreText.text = 'Score: ' + score;

                // destroy() phaser method
                selectedArray[0].destroy();
                selectedArray[1].destroy();

                // If player finishes before timer create another board
                tilesLeft -= 2;
                if(tilesLeft === 0) {
                    tilesArray.length = 0;
                    selectedArray.length = 0;
                    this.placeTiles();
                }
            }
            else {

                // Play wrong sound
                if(playSound) { this.soundArray[2].play(); }

                selectedArray[0].frame = 10;
                selectedArray[1].frame = 10;
            }
            selectedArray.length = 0; // empty array in js || selectedArray = []
        }
    };


    // State: Title screen
    var titleScreen = function() {};
    titleScreen.prototype = {

        preload: function() {
            game.load.spritesheet('soundicons', 'soundicons.png', 80, 80);
        },

        create: function() {

            // Scaling (mobile)
            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
            game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

            // Continue running script even when player changes focus to other webpage
            // (Timer continues to run)
            game.stage.disableVisibilityChange = true;

            // Text
            var style = {
                font: '48px Monospace',
                fill: '#00ff00',
                align: 'center',
            };
            // TODO: fix with setTextBounds() method + boundsAlignH/V
            var text = game.add.text(game.width / 4 , game.height / 2 - 100,
                                     'MemBlock+', style );

            // Sound buttons on/off
            // Anchor = origin point (default 0.0)
            // anchor (0.5, 0.5) or 0.5 for x and y
            var soundButton = game.add.button(game.width / 2 - 100, game.height / 2 + 100,
                                              'soundicons', this.startGame, this);
            soundButton.anchor.set(0.5);
            // ---
            var soundButton = game.add.button(game.width / 2 + 100, game.height / 2 + 100,
                                              'soundicons', this.startGame, this);
            soundButton.frame = 1;
            soundButton.anchor.set(0.5);
        },

        startGame: function(target) {
            if(target.frame === 0) {
                playSound = true;
            }
            else {
                playSound = false;
            }

            game.state.start('PlayGame');
        }

    };


    // State: Game Over
    var gameOver = function() {};
    gameOver.prototype = {

        create: function() {
            //High Score
            highScore = Math.max(score, highScore);
            localStorage.setItem(localStorageName, highScore);

            var style = {
                font: '32px Monospace',
                fill: '#00ff00',
                align: 'center'
            };
            var text = game.add.text(game.width / 2, game.height / 2,
                                     'Game Over\n\nYour Score: ' + score + '\n' +
                                     'Best Score: ' + highScore +
                                     '\n\nTap to Restart', style);
            text.anchor.set(0.5);

            // Restart
            game.input.onDown.add(this.restartGame, this);
        },

        restartGame: function() {
            tilesArray.length = 0;
            selectedArray.length = 0;
            game.state.start('TitleScreen');
        }
    };

    // STATES
    game.state.add('TitleScreen', titleScreen);
    game.state.add('PlayGame', playGame);
    game.state.add('GameOver', gameOver);

    highScore = localStorage.getItem(localStorageName) == null ? 0 :
        localStorage.getItem(localStorageName);

    game.state.start('TitleScreen');
};
