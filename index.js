const PLAYER = getPlayer();

const DIRECTION_KEYS = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right'
};

let LAST_DIRECTION = '';

const STATS_HEIGHT = 100;

// cell size in px = smallest length / 10 cells
const CELL_SIZE = Math.floor(Math.min(window.innerWidth, window.innerHeight) - STATS_HEIGHT - 50) / 10;

// number of grid cells in each dimension
const GRID_X = 10;
const GRID_Y = 10;

// visible grid in px
const GRID_WIDTH = GRID_X * CELL_SIZE;
const GRID_HEIGHT = GRID_Y * CELL_SIZE;

// visible canvas in px (not the same as grid size because of options/stats)
const CANVAS_WIDTH = GRID_WIDTH;
const CANVAS_HEIGHT = GRID_HEIGHT + STATS_HEIGHT;

// get 30% of smallest number of grid cells to define touch regions
const numGridSquare = Math.floor(Math.min(GRID_X, GRID_Y) * 0.3);
// get canvas boundary from approximated grid boundary
const gridBoundary = numGridSquare * CELL_SIZE;

// boundaries for touch regions
const TOP_REGION = gridBoundary;
const BOTTOM_REGION = GRID_HEIGHT - gridBoundary;
const LEFT_REGION = gridBoundary;
const RIGHT_REGION = GRID_WIDTH - gridBoundary;

const HEAD_SIZE = 0.8 * CELL_SIZE;
const HEAD_OFFSET = (CELL_SIZE - HEAD_SIZE) / 2;

const BODY_SIZE = 0.5 * CELL_SIZE;
const BODY_OFFSET = (CELL_SIZE - BODY_SIZE) / 2;

const LINK_SIZE = 0.2 * CELL_SIZE;
const LINK_OFFSET = (CELL_SIZE - LINK_SIZE) / 2

const FOOD_SIZE = 0.2 * CELL_SIZE;
const FOOD_OFFSET = (CELL_SIZE - FOOD_SIZE) / 2;

let TIME_INTERVAL = 500;

// init
window.onload = load;
function load() {
    const canvas = window.gameCanvas;
    const ctx = canvas.getContext("2d");
    const direction = { x: 1, y: 0 };

    canvas.height = CANVAS_HEIGHT;
    canvas.width = CANVAS_WIDTH;

    // make grid
    const grid = [];
    for (let i = 0; i < GRID_X; i++) {
        grid.push(Array(GRID_Y).fill({}));
    }

    grid[4][4] = { x: 4, y: 4, type: 0, next: true, id: 0 };

    document.addEventListener('keydown', keyDownHandler);
    canvas.addEventListener('click', mouseClickHandler);

    gameLoop({ ctx, headX: 4, headY: 4, time: 0, direction, grid, nextId: 1, score: 0 });
}

function getPlayer() {
    let player;

    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        if (cookies[i].match('player')) {
            player = cookies[i].split('=')[1];
            break;
        }
    }

    while (!player) {
        player = prompt('enter player name');
    }

    document.cookie = 'player=' + player;

    return player;
}

function gameLoop({ ctx, headX, headY, time, direction, grid, nextId, score }) {
    const now = Date.now();
    const diff = now - time;
    let newTime;
    let play = true;

    if (diff < TIME_INTERVAL) {
        newTime = time;
    } else {
        let addCell = false;
        const snakeHead = grid[headX][headY];
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // calculate possible new direction
        const newDirection = handleDirection(direction);
        // set snake head for loop
        let snakeCell = snakeHead;
        // calculate new head position, remember last cell position for tail
        let moveToX = (GRID_X + (snakeCell.x + newDirection.x)) % GRID_X;
        let moveToY = (GRID_Y + (snakeCell.y + newDirection.y)) % GRID_Y;

        // revert direction if moveToCell is cell 1 (1st after head)
        if (grid[moveToX][moveToY].id === 1) {
            moveToX = (GRID_X + (snakeCell.x + direction.x)) % GRID_X;
            moveToY = (GRID_Y + (snakeCell.y + direction.y)) % GRID_Y;
            // set new direction if the direction is valid 
        } else {
            direction = newDirection
        }

        // move snake cells
        while (snakeCell.next) {
            const cellX = snakeCell.x;
            const cellY = snakeCell.y;

            // only head can consume or die
            if (snakeCell.id === 0) {
                const moveToCell = grid[moveToX][moveToY];
                // if player hits food, consume
                if (moveToCell.type === 1) {
                    addCell = true;
                    score++;
                    // if player hits self, game over
                } else if (moveToCell.type === 0) {
                    play = false;
                }
            }

            // if last cell and add cell, add new cell 
            if (snakeCell.next === true && addCell) {
                // don't place the cell in the grid, leave until next iteration
                snakeCell.next = { type: 0, next: true, id: nextId };
                nextId++;
                addCell = false;
            }

            grid[moveToX][moveToY] = snakeCell;
            snakeCell.x = moveToX;
            snakeCell.y = moveToY;
            snakeCell = snakeCell.next;

            moveToX = cellX;
            moveToY = cellY;
        }

        // if new cell was added, the last cell will be the new cell, 
        // which has no previous location, so moveToX, moveToY will be undefined
        if (grid[moveToX]) {
            // remove last reference to prevent left over cells
            grid[moveToX][moveToY] = {};
        }

        // update snake head
        headX = (GRID_X + (headX + direction.x)) % GRID_X;
        headY = (GRID_Y + (headY + direction.y)) % GRID_Y;

        maybeGenerateFood(grid, ctx);
        drawGrid(grid, ctx);
        drawStats(score, ctx);

        newTime = now;
    }

    if (play) {
        requestAnimationFrame(() => gameLoop({
            ctx,
            time: newTime,
            headX,
            headY,
            direction,
            grid,
            nextId,
            score
        }));
    } else {
        endGame(score, ctx);
    }
}

function drawStats(score, ctx) {
    ctx.fillStyle = 'white';
    ctx.font = '48px serif';
    ctx.fillText(`Score: ${score}`, 25, CANVAS_HEIGHT - 35);
    ctx.font = '30px serif';
    ctx.fillText(`Player: ${PLAYER}`, 225, CANVAS_HEIGHT - 35);
}

async function endGame(score, ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.font = '40px serif';
    ctx.fillText(PLAYER, CANVAS_WIDTH / 2 - 200, 70);
    ctx.fillText(`You Noob, Score: ${score}`, CANVAS_WIDTH / 2 - 200, 150);
    
    await fetch('/snake/uploadScore.php', {
        method: 'post',
        body: JSON.stringify({
            player: PLAYER,
            score 
        })
    })
    
    const res = await fetch('/snake/getScores.php');
    const scores = await res.json();
    
    ctx.fillText('Hall of fame', CANVAS_WIDTH / 2 - 200, 220);
    scores.forEach((_score, idx) => {
        ctx.fillText(`${idx+1} - ${_score.name}: ${_score.score}`, CANVAS_WIDTH / 2 - 200, 270 + (idx * 50));
    });
}

function mouseClickHandler(event) {
    if (event.button === 0) {
        const bound = event.target.getBoundingClientRect();
        const mousex = event.clientX - bound.x;
        const mousey = event.clientY - bound.y;

        const direction = getDirectionFromRegion(mousex, mousey);
        if (direction) {
            LAST_DIRECTION = direction;
        }
    }
}

function getDirectionFromRegion(x, y) {
    const leftRegion = x >= 0 && x < LEFT_REGION;
    const rightRegion = x >= RIGHT_REGION && x <= GRID_WIDTH;
    const topRegion = y >= 0 && y < TOP_REGION;
    const bottomRegion = y >= BOTTOM_REGION && y <= GRID_HEIGHT;

    let direction;

    if ((topRegion || bottomRegion) && !leftRegion && !rightRegion) {
        if (topRegion) {
            direction = 'up';
        } else {
            direction = 'down';
        }
    } else if ((leftRegion || rightRegion) && !topRegion && !bottomRegion) {
        if (leftRegion) {
            direction = 'left';
        } else {
            direction = 'right';
        }
    }

    return direction;
}

function keyDownHandler(event) {
    const key = event.key;

    if (key in DIRECTION_KEYS) {
        LAST_DIRECTION = DIRECTION_KEYS[key];
    } else if (key === 'q') {
        TIME_INTERVAL -= 100;
    } else if (key === 'a') {
        TIME_INTERVAL += 100;
    }

    if (TIME_INTERVAL <= 100) {
        TIME_INTERVAL = 100;
    }
}

function handleDirection({ x, y }) {
    if (LAST_DIRECTION === 'up') {
        x = 0;
        y = -1;
    } else if (LAST_DIRECTION === 'down') {
        x = 0;
        y = 1;
    } else if (LAST_DIRECTION === 'left') {
        x = -1;
        y = 0;
    } else if (LAST_DIRECTION === 'right') {
        x = 1;
        y = 0;
    }

    LAST_DIRECTION = '';

    return { x, y };
}

function drawGrid(grid, ctx) {
    // loop through the grid, draw
    const snakeColour = getRandomColour();
    grid.forEach((cellCol, col) => {
        cellCol.forEach((cell, row) => {
            // draw black box on cell
            const boxx = col * CELL_SIZE;
            const boxy = row * CELL_SIZE;
            const boxLocation = getDirectionFromRegion(boxx, boxy);
            if (boxLocation) {
                ctx.strokeStyle = 'red';
            } else {
                ctx.strokeStyle = 'white';
            }
            ctx.strokeRect(boxx, boxy, CELL_SIZE, CELL_SIZE);

            if (cell.type === 0) {
                drawSnakeCell(cell, snakeColour, ctx);
            } else {
                drawFood(cell, ctx);
            }
        });
    });
}

function drawSnakeCell(cell, colour, ctx) {
    // if (cell.next === true) {
    if (cell.id !== 0) {
        drawSquare(cell.x * CELL_SIZE + BODY_OFFSET, cell.y * CELL_SIZE + BODY_OFFSET, BODY_SIZE, colour, ctx);
    } else {
        drawSquare(cell.x * CELL_SIZE + HEAD_OFFSET, cell.y * CELL_SIZE + HEAD_OFFSET, HEAD_SIZE, colour, ctx);
    }

    if (cell.next !== true) {
        const nextCell = cell.next;

        // calculate cell differences for link direction
        let diffX = cell.x - nextCell.x;
        let diffY = cell.y - nextCell.y;

        // if cell has reached edge and moved to opposte side of grid,
        // difference must be adjusted
        if (Math.abs(diffX) > 1) {
            diffX = Math.sign(diffX) * -1;
        } else if (Math.abs(diffY) > 1) {
            diffY = Math.sign(diffY) * -1;
        }

        drawCellLink(nextCell.x, nextCell.y, diffX, diffY, colour, ctx);
    }
}

function maybeGenerateFood(grid, ctx) {
    // don't generate while pos != player because when the player occupies all squares it will crash
    if (Math.random() > 0.6) {
        const foodX = Math.round(Math.random() * (GRID_X - 1));
        const foodY = Math.round(Math.random() * (GRID_Y - 1));

        if (isNaN(grid[foodX][foodY].type)) {
            const food = {
                x: foodX,
                y: foodY,
                type: 1,
                colour: getRandomColour()
            }
            grid[foodX][foodY] = food;

            drawFood(food, ctx);
        }
    }
}

function drawFood(food, ctx) {
    drawSquare(food.x * CELL_SIZE + FOOD_OFFSET, food.y * CELL_SIZE + FOOD_OFFSET, FOOD_SIZE, food.colour, ctx);
}

function drawSquare(x, y, size, colour, ctx) {
    ctx.fillStyle = colour || getRandomColour();
    ctx.fillRect(x, y, size, size);
}

function drawRectAbs(_x1, _y1, _x2, _y2, colour, ctx, minx = 0, miny = 0) {
    const x1 = Math.min(_x1, _x2);
    const y1 = Math.min(_y1, _y2);
    const x2 = Math.max(_x1, _x2);
    const y2 = Math.max(_y1, _y2);

    let width = x2 - x1;
    let height = y2 - y1;

    if (width < minx) {
        width = minx;
    }
    if (height < miny) {
        height = miny;
    }

    ctx.fillStyle = colour || getRandomColour();
    ctx.fillRect(x1, y1, width, height);
}

// draw link between snake cells
function drawCellLink(x, y, dx, dy, colour, ctx) {
    let x1, x2, y1, y2;

    if (dx === 0) {
        // calculate left and right xs
        x1 = x * CELL_SIZE + LINK_OFFSET;
        x2 = (x + 1) * CELL_SIZE - LINK_OFFSET;

        // calculate y at centre of cell
        y1 = (y + 0.5) * CELL_SIZE;
        // calculate y at edge - down for pos, up for neg
        y2 = y1 + (dy * CELL_SIZE);

    } else {
        // calculate top and bottom ys
        y1 = y * CELL_SIZE + LINK_OFFSET;
        y2 = (y + 1) * CELL_SIZE - LINK_OFFSET;

        // calculate y at centre of cell
        x1 = (x + 0.5) * CELL_SIZE;
        // calculate y at edge - right for pos, left for neg
        x2 = x1 + (dx * CELL_SIZE);
    }

    drawRectAbs(x1, y1, x2, y2, colour, ctx);
}

function getRandomColour() {
    const r = 125 + Math.floor(Math.random() * 100);
    const g = 125 + Math.floor(Math.random() * 100);
    const b = 125 + Math.floor(Math.random() * 100);
    const colour = `rgb(${r}, ${g}, ${b})`;
    return colour;
}