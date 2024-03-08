const http = require('http')
const fs = require('fs')
const mockData = require('../data.json');

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/sse') {
    let body = '';
    let intervalId;

    req.on('data', chunk => {
      body += chunk.toString();
    })

    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*', // 允许跨域
        'Access-Control-Allow-Headers': 'Content-Type'
      })

      let id = 0
      intervalId = setInterval(() => {
        res.write(`event: customEvent\n`)
        res.write(`id: ${id}\n`)
        res.write(`retry: 10000\n`)

        const data = { id, time: new Date().toISOString(), payload: mockData }
        res.write(`data: ${JSON.stringify(data)}\n\n`)

        id++
        if (id >= 4) {
          clearInterval(intervalId)
          res.end()
        }

      }, 1000);
    })

  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,last-event-id')
    res.end();
  }
}).listen(3000);

console.log('Server listening on port 3000')