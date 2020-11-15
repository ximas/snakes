window.onload = load;

const DIRECTION = { x: 1, y: 0 };

const CELL_SIZE = 50;
const GRID_X = Math.floor((window.innerWidth - 100) / CELL_SIZE);
const GRID_Y = Math.floor((window.innerHeight - 100) / CELL_SIZE);

const CANVAS_X = GRID_X * CELL_SIZE;
const CANVAS_Y = GRID_Y * CELL_SIZE;

const HEAD_SIZE = 40;
const HEAD_OFFSET = (CELL_SIZE - HEAD_SIZE) / 2;

const BODY_SIZE = 20;
const BODY_OFFSET = (CELL_SIZE - BODY_SIZE) / 2;

const LINK_SIZE = 10;
const LINK_OFFSET = (CELL_SIZE - LINK_SIZE) / 2

const FOOD_SIZE = 10;
const FOOD_OFFSET = (CELL_SIZE - FOOD_SIZE) / 2;

let TIME_INTERVAL = 350;
let PLAY = true;
let NEXTID = 0;

// make grid
const grid = [];
for (let i = 0; i < GRID_X; i++) {
    grid.push(Array(GRID_Y).fill({}));
}

// init
function load() {
    const canvas = window.gameCanvas;
    const ctx = canvas.getContext("2d");
    canvas.height = CANVAS_Y;
    canvas.width = CANVAS_X;

    grid[4][4] = { x: 4, y: 4, type: 0, next: true, id: NEXTID };
    NEXTID++;

    document.addEventListener('keydown', event => {
        changeDirection(event.key)
    })

    gameLoop({ ctx, headX: 4, headY: 4, time: 0 });
}

function changeDirection(key) {
    if (key === 'ArrowUp') {
        DIRECTION.x = 0;
        DIRECTION.y = -1;
    } else if (key === 'ArrowDown') {
        DIRECTION.x = 0;
        DIRECTION.y = 1;
    } else if (key === 'ArrowLeft') {
        DIRECTION.x = -1;
        DIRECTION.y = 0;
    } else if (key === 'ArrowRight') {
        DIRECTION.x = 1;
        DIRECTION.y = 0;
    } else if (key === 'q') {
        TIME_INTERVAL -= 100;
    } else if (key === 'a') {
        TIME_INTERVAL += 100;
    }

    if (TIME_INTERVAL <= 100) {
        TIME_INTERVAL = 100;
    }
}

function gameLoop({ ctx, headX, headY, time }) {
    const now = Date.now();
    const diff = now - time;
    let newTime;

    if (diff < TIME_INTERVAL) {
        newTime = time;
    } else {
        let addCell = false;

        ctx.clearRect(0, 0, CANVAS_X, CANVAS_Y);

        // set snake head for loop
        let snakeCell = grid[headX][headY];

        // remember last snake cell pos for trail
        let lastX = (GRID_X + (snakeCell.x + DIRECTION.x)) % GRID_X;
        let lastY = (GRID_Y + (snakeCell.y + DIRECTION.y)) % GRID_Y;

        // move snake cells
        while (snakeCell.next) {
            const cellX = snakeCell.x;
            const cellY = snakeCell.y;

            // only head can consume or die
            if (snakeCell.id === 0) {
                const nextCell = grid[lastX][lastY];
                // if player hits food, consume
                if (nextCell.type === 1) {
                    addCell = true;
                    // if player hits self, game over
                } else if (nextCell.type === 0 && !(nextCell.id in [snakeCell.id, snakeCell.id + 1])) {
                    PLAY = false;
                }
            }

            // if last cell and add cell, add new cell 
            if (snakeCell.next === true && addCell) {
                // don't place the cell in the grid, leave until next iteration
                snakeCell.next = { type: 0, next: true, id: NEXTID };
                NEXTID++;
                addCell = false;
            }

            grid[lastX][lastY] = snakeCell;
            snakeCell.x = lastX;
            snakeCell.y = lastY;
            snakeCell = snakeCell.next;

            lastX = cellX;
            lastY = cellY;
        }

        // if new cell was added, the last cell will be the new cell, 
        // which has no previous location, so lastX,lastY will be undefined
        if (grid[lastX]) {
            // remove last reference to prevent left over cells
            grid[lastX][lastY] = {};
        }

        // update snake head
        headX = (GRID_X + (headX + DIRECTION.x)) % GRID_X;
        headY = (GRID_Y + (headY + DIRECTION.y)) % GRID_Y;

        // loop through the grid, draw
        const snakeColour = getRandomColour();
        grid.forEach((cellCol, col) => {
            cellCol.forEach((cell, row) => {
                // draw black box on cell
                ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

                if (cell.type === 0) {
                    drawSnakeCell(cell, snakeColour, ctx);
                } else {
                    drawFood(cell, ctx);
                }
            });
        });

        // generate food pos while pos != player
        if (Math.random() > 0.7) {
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

                // draw food
                drawFood(food, ctx);
            }
        }

        newTime = now;
    }

    if (PLAY) {
        requestAnimationFrame(() => gameLoop({
            ctx,
            time: newTime,
            headX,
            headY
        }));
    } else {
        // display message
        ctx.clearRect(0, 0, CANVAS_X, CANVAS_Y);
        ctx.fillStyle = 'black';
        ctx.font = '48px serif';
        ctx.fillText('You Noob', CANVAS_X / 2 - 85, CANVAS_Y / 2);
    }
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

        console.log(y1, y2, dy);

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