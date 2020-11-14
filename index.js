window.onload = load;

const direction = { x: 1, y: 0 };
const GRID_SIZE = 12;
const PLAYER_SIZE = 50;
const FOOD_SIZE = 20;
const FOOD_OFFSET = (PLAYER_SIZE - FOOD_SIZE) / 2;
const CANVAS_SIZE = GRID_SIZE * PLAYER_SIZE;
let TIME_INTERVAL = 500;

let play = true;
let nextId = 0;

// make grid
const grid = [];
for (let i = 0; i < GRID_SIZE; i++) {
    grid.push(Array(GRID_SIZE).fill({}));
}

// init
function load() {
    const canvas = window.gameCanvas;
    const ctx = canvas.getContext("2d");
    canvas.height = CANVAS_SIZE;
    canvas.width = CANVAS_SIZE;

    grid[4][4] = { x: 4, y: 4, type: 0, next: true, id: nextId };
    nextId++;

    document.addEventListener('keyup', event => {
        changeDirection(event.key)
    })

    gameLoop({ ctx, headX: 4, headY: 4, time: 0 });
}

function changeDirection(key) {
    if (key === 'ArrowUp') {
        direction.x = 0;
        direction.y = -1;
    } else if (key === 'ArrowDown') {
        direction.x = 0;
        direction.y = 1;
    } else if (key === 'ArrowLeft') {
        direction.x = -1;
        direction.y = 0;
    } else if (key === 'ArrowRight') {
        direction.x = 1;
        direction.y = 0;
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

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // set snake head for loop
        let snakeCell = grid[headX][headY];

        // remember last snake cell pos for trail
        let lastX = (GRID_SIZE + (snakeCell.x + direction.x)) % GRID_SIZE;
        let lastY = (GRID_SIZE + (snakeCell.y + direction.y)) % GRID_SIZE;

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
        headX = (GRID_SIZE + (headX + direction.x)) % GRID_SIZE;
        headY = (GRID_SIZE + (headY + direction.y)) % GRID_SIZE;

        // loop through the grid, draw
        const snakeColour = getRandomColour();
        grid.forEach(row => {
            row.forEach(cell => {
                if (cell.type === 0) {
                    drawSquare(cell.x * PLAYER_SIZE, cell.y * PLAYER_SIZE, PLAYER_SIZE, snakeColour, ctx);
                } else {
                    drawSquare(cell.x * PLAYER_SIZE + FOOD_OFFSET, cell.y * PLAYER_SIZE + FOOD_OFFSET, FOOD_SIZE, cell.colour, ctx);
                }
            });
        });

        // generate food pos while pos != player
        if (Math.random() > 0.7) {
            const foodX = Math.round(Math.random() * (GRID_SIZE - 1));
            const foodY = Math.round(Math.random() * (GRID_SIZE - 1));

            if (isNaN(grid[foodX][foodY].type)) {
                const food = {
                    x: foodX,
                    y: foodY,
                    type: 1,
                    colour: getRandomColour()
                }
                grid[foodX][foodY] = food;

                // draw food
                drawSquare(food.x * PLAYER_SIZE + FOOD_OFFSET, food.y * PLAYER_SIZE + FOOD_OFFSET, FOOD_SIZE, food.colour, ctx);
            }
        }

        newTime = now;
    }

    if (play) {
        requestAnimationFrame(() => gameLoop({
            ctx,
            time: newTime,
            headX,
            headY
        }));
    } else {
        // display message
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = 'black';
        ctx.font = '48px serif';
        ctx.fillText('You Noob', CANVAS_SIZE / 2 - 85, CANVAS_SIZE / 2);
    }
}

function drawSquare(x, y, size, colour, ctx) {
    ctx.fillStyle = colour || getRandomColour();
    ctx.fillRect(x, y, size, size);
}

function getRandomColour() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    const colour = `rgb(${r}, ${g}, ${b})`;
    return colour;
}