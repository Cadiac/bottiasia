const express = require('express')
const morgan = require('morgan')
const pathfinding = require('pathfinding')
const apisauce = require('apisauce')
const bodyParser = require('body-parser')

const app = express()

// Config server api here
const api = apisauce.create({
  baseURL: 'http://localhost:8080',
})

let matrix = [
    [0, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 1, 0, 0],
]

let grid = new pathfinding.Grid(matrix)
const finder = new pathfinding.AStarFinder()

app.use(morgan('dev'))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('hello, world!')
})

// just for debugging
app.get('/move', (req, res) => {
  const path = finder.findPath(1, 2, 4, 2, grid);
  res.json(path)
})

// server posts this endpoint on every move and this should return the move
app.post('/move', (req, res) => {
  console.log(req.body.gameState.map.tiles)
  const path = finder.findPath(1, 2, 4, 2, grid)
  res.json("DOWN")
})

app.listen(30003, () => {
  console.log('Example app listening on port 30003!')
})

// TODO - register should post own IP
api.post('/register', {
    playerName: "bottiasia",
    url: "http://localhost:30003/move"
  })
  .then(console.log)
