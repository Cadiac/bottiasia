const express = require('express')
const morgan = require('morgan')
const pathfinding = require('pathfinding')
const apisauce = require('apisauce')
const bodyParser = require('body-parser')

const app = express()

// Config server api here
const api = apisauce.create({
  //baseURL: 'http://192.168.1.2:8080',
  baseURL: 'http://localhost:8080',
})

let matrix = []
let exit = {
  x: 0,
  y: 0
}
let player = {}
let items = []
let targetItem = null

const finder = new pathfinding.AStarFinder()

app.use(morgan('dev'))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('hello, world!')
})

// server posts this endpoint on every move and this should return the move
app.post('/move', (req, res, next) => {
  matrix = []

  player = req.body.playerState
  exit = req.body.gameState.map.exit
  items = req.body.gameState.items

  for (let i = 0; i < items.length; ++i){
    let item = items[i]
    if (item.position.x === player.position.x && item.position.y === player.position.y){
      res.json('PICK')
      next()
    }
  }

  //console.log(req.body.gameState.map.tiles)

  req.body.gameState.map.tiles.forEach((row, y) => {
    let parsedRow = []
    for(let x = 0; x < row.length; ++x) {
      let column = row.charAt(x)
      switch (column) {
        case 'x':
          parsedRow.push(1)
          break
        case '#':
          parsedRow.push(1)
          break
        case '_':
          parsedRow.push(0)
          break
        case 'o':
          parsedRow.push(0)
          break
        default:
          console.log("apuapua en tiedä mikä tää on " + column)
          break
      }
    }
    matrix.push(parsedRow)
  })

  //console.log("exit is " + exit)
  console.log('player is at ' + player.position.x + ',' + player.position.y)

  let grid = new pathfinding.Grid(matrix)

  let path = []

  if (targetItem) {
    // Does it still exist?
    let exists = items.some((item) => {
      return item.position.x === targetItem.position.x && item.position.y === targetItem.position.y
    })

    // find new target
    if (!exists) {
      targetItem = null

      items.forEach((item) => {
        if (targetItem) {
          if ( targetItem.price < item.price ) {
            targetItem = item
          }
        } else {
          targetItem = item
        }
      })
    }
  } else {
    // find new target
    items.forEach((item) => {
      if (targetItem) {
        if ( targetItem.price < item.price ) {
          targetItem = item
        }
      } else {
        targetItem = item
      }
    })
  }

  path = finder.findPath(player.position.x, player.position.y, targetItem.x, targetItem.y, grid)

  let direction = {
    x: 0,
    y: 0
  }

  // TODO: path length
  direction.x = path[1][0] - path[0][0]
  direction.y = path[1][1] - path[0][1]

  let command = 'USE'

  if (direction.x === 1) {
    command = 'RIGHT'
  } else if (direction.x === -1) {
    command = 'LEFT'
  } else if (direction.y === 1) {
    command = 'DOWN'
  } else if (direction.y === -1) {
    command = 'UP'
  }

  console.log(direction)
  console.log(command)

  console.log(path)
  res.json(command)
})

app.listen(30003, () => {
  console.log('Bottiasia listening on port 30003!')
})

// TODO - register should post own IP
api.post('/register', {
    playerName: "bottiasia",
    //url: "http://192.168.1.11:30003/move"
    url: "http://localhost:30003/move"
  })
  .then(console.log)
