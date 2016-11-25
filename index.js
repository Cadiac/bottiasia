const express = require('express')
const morgan = require('morgan')
const pathfinding = require('pathfinding');

const app = express()

let matrix = [
    [0, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 1, 0, 0],
];

let grid = new pathfinding.Grid(matrix);
const finder = new pathfinding.AStarFinder();

app.use(morgan('dev'))

app.get('/', (req, res) => {
  res.send('hello, world!')
})

app.get('/path', (req, res) => {
  const path = finder.findPath(1, 2, 4, 2, grid);
  res.json(path)
})

app.listen(30003, () => {
  console.log('Example app listening on port 30003!')
})
