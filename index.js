const express = require('express')
const morgan = require('morgan')
const pathfinding = require('pathfinding')
const apisauce = require('apisauce')
const bodyParser = require('body-parser')
const ip = require('ip')

const app = express()

const serverIp = '192.168.1.2'
const serverPort = ':8080'

// Config server api here
const api = apisauce.create({
  baseURL: 'http://' + serverIp + serverPort,
})

let matrix = []
let path = []
let exit = {
  x: 0,
  y: 0
}
let player = {}
let items = []
let targetItem = null
let exiting = false

const finder = new pathfinding.AStarFinder()

app.use(morgan('dev'))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('hello, world!')
})

function hasMoneyFor(item) {
  if (item){
    return (((100 - item.discountPercent)/100) * item.price) <= (player.money - 50)
  } else {
    return false
  }
}

// server posts this endpoint on every move and this should return the move
app.post('/move', (req, res, next) => {
  const requestIp = req.headers['x-real-ip'] || req.connection.remoteAddress;

  if (requestIp != ('::ffff:' + serverIp)){
    console.log("joku huijaa :(")
    return
  }

  exiting = false
  player = req.body.playerState
  players = req.body.gameState.players
  exit = req.body.gameState.map.exit
  items = req.body.gameState.items

  // can we pick up an item
  for (let i = 0; i < items.length; ++i){
    let item = items[i]
    if (item.position.x === player.position.x &&
        item.position.y === player.position.y &&
        targetItem.position.x === item.position.x &&
        targetItem.position.y === item.position.y &&
        hasMoneyFor(item)){
      console.log("Picking up item at " + player.position.x + ',' + player.position.y)
      console.log("PICK")
      res.json('PICK')
      return
    }
  }

  // can we shoot OTHER players?
  if (player.usableItems.length > 0 && players.length > 1){
    console.log("Lets shoot!")
    console.log("USE")
    res.json('USE')
    return
  }

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
          if ( targetItem.discountPercent < item.discountPercent && hasMoneyFor(item) ) {
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
        if ( targetItem.discountPercent < item.discountPercent && hasMoneyFor(item) ) {
          targetItem = item
        }
      } else {
        targetItem = item
      }
    })
  }

  // Do we have money or should we just head home?
  // Are we going to die?
  if (!hasMoneyFor(targetItem)) {
    if (player.health < 30) {
      exiting = true
      console.log("I'm about to die, lets head home.")
    } else if (items.length === 0 && player.money > 500){
      exiting = false
      console.log("No items on map but I'm not dying yet, lets wait")
    } else {
      exiting = true
      console.log("Lets go home.")
    }
  }

  path = []
  matrix = []

  // parse map
  req.body.gameState.map.tiles.forEach((row, y) => {
    let parsedRow = []
    for(let x = 0; x < row.length; ++x) {
      let column = row.charAt(x)
      switch (column) {
        case 'x':
          parsedRow.push(1)
          break
        case '#':
          // if item is on a trap make the tile walkable
          let itemOnTrap = items.some((item) => {
            return item.position.x === x && item.position.y === y
          })
          parsedRow.push(itemOnTrap ? 0 : 1)
          break
        case '_':
          parsedRow.push(0)
          break
        case 'o':
          parsedRow.push(exiting ? 0 : 1)
          break
        default:
          console.log("apuapua en tiedä mikä tää on " + column)
          break
      }
    }
    matrix.push(parsedRow)
  })

  let grid = new pathfinding.Grid(matrix)

  let target = {
    x: player.position.x,
    y: player.position.y
  }

  if (!exiting){
    target = targetItem.position
  } else {
    target = exit
  }

  path = finder.findPath(player.position.x, player.position.y, target.x, target.y, grid)

  let direction = {
    x: 0,
    y: 0
  }

  // TODO: path length
  if (path.length >= 2){
    direction.x = path[1][0] - path[0][0]
    direction.y = path[1][1] - path[0][1]
  }

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

  console.log('Player: ' + player.position.x + ',' + player.position.y + ' ' + player.health + 'hp ' + player.money + '€')
  console.log("Exiting: " + exiting)
  console.log("Direction: " + direction.x + ',' + direction.y)
  console.log("Target: " + target.x + "," + target.y)
  console.log(command)

  //console.log(path)
  res.json(command)
})

app.listen(30003, () => {
  console.log('Bottiasia listening on port 30003!')
})

// TODO - register should post own IP
api.post('/register', {
    playerName: "bottiasia",
    url: "http://" + ip.address() + ":30003/move"
  })
  .then(console.log)
