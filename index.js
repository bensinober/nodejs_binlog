/* index.js */

const ZongJi = require('zongji')
const wss = require('websocket').server
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8001
/* replication master */
const mysql_host = process.env.MYSQL_HOST || '127.0.0.1'
const mysql_user = process.env.MYSQL_USER || 'root'
const mysql_pass = process.env.MYSQL_PASS || 'secret'

/* server for index.html and wss */

const server = http.createServer((req, res) => {
  console.log('incoming request from ' +req.headers.host);
  fs.readFile('./index.html', (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Trouble in paradise!');  
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
    }
  })
}).listen(port, null, () => { console.log("http server listening on :" + port) })

/* Very simple websocket server attached to server*/
const wsServer = new wss({
  httpServer: server
})

wsServer.on("request", (req) => {
  console.log((new Date()) + ' Connection from origin ' + req.origin + '.')
  const conn = req.accept(null, req.origin)
})

/* mysql replicator listener */
const zongji = new ZongJi({ 
  host     : mysql_host,
  user     : mysql_user,
  password : mysql_pass 
});

// Each change to the replication log results in an event
zongji.on('binlog', (evt) => {
  const evtName = evt.getEventName()
  const table = evt.tableMap[evt.tableId].tableName

  if (['writerows','deleterows','updaterows'].some(v => { return evtName === v })) {
    if (evt.rows.length === 1) {
      let res = {}
      res.event = evtName
      res.table = table
      res.fields = evt.rows[0]
      wsServer.connections.forEach(client => {
        client.send(JSON.stringify(res))
      })
    }
  }
})

zongji.on('error', (err) => {
  console.log(err)
})

// Start parsing binlog, exclude some tables
zongji.start({
  startAtEnd: true, // or we'll likely get massive amounts of data ...
  includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows'],
  excludeSchema: { 'koha_name': ['sessions', 'action_logs', 'statistics']}
})

process.on('SIGINT', function() {
  console.log('Got SIGINT.')
  zongji.stop()
  process.exit()
})

