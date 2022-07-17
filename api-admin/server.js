const http = require('http')

const app = require('./app')
const socketAction = require('./api/socket')
const socketActionType = require('./api/socket/type')
const port = process.env.PORT || 3011
console.log('Server started at : ' + port)
const server = http.createServer(app)
const io = require('./api/config/socket').init(server)
server.listen(port)
require('./backup')
const socketConfig = require('./api/config/socket').getIO()

io.on('connection', async (socket) => {
  socket.on(socketActionType.CHANGE_PRICE, async (data) => {
    socketAction.changePrice(data.tip_id, data.price)
  })
  socket.on(socketActionType.PORTFOLIO_UPDATE, async (data) => {
    socketAction.portFolioStatusUpdate(data)
  })
  socket.on(socketActionType.PORTFOLIO_CHANGE_PRICE, async (data) => {
    socketAction.portFolioPriceChange(data)
  })
  socket.on(socketActionType.PORTFOLIO_SELL, async (data) => {
    socketAction.portFolioSellStock(data)
  })
})

// get only inactive and active
