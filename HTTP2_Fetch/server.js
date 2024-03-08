const http2 = require('http2');
const fs = require('fs');
const mockData = require('../data.json');

// 加载SSL证书
const serverOptions = {
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem')
};

// 创建HTTP/2服务器
const server = http2.createSecureServer(serverOptions);

server.on('error', (err) => console.error(err));

server.on('stream', (stream, headers) => {
  const path = headers[':path'];

  if (path === '/' || path === 'index.html') {
    // 如果请求根路径，返回 index.html 文件
    fs.readFile('index.html', (err, data) => {
      if (err) {
        stream.respond({
          ':status': '500'
        })
        stream.end('Error loading')
      } else {
        stream.respond({
          ':status': '200',
          'Content-Type': 'text/html'
        })
        stream.end(data)
      }
    })
  } else if (path.includes('/sse')) {

    // 如果请求 /events 路径，建立 SSE 连接
    stream.respond({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*', // 允许跨域
      'Access-Control-Allow-Headers': '*',
      ':status': '200'
    })

    // 每隔 1 秒发送一条消息
    let id = 0
    const intervalId = setInterval(() => {
      // stream.write(`event: customEvent\n`)
      stream.write(`id: ${id}\n`)
      stream.write(`retry: 10000\n`)
      const params = path.split('?')[1]
      const data = { id, time: new Date().toISOString(), params: mockData }
      stream.write(`data: ${JSON.stringify(data)}\n\n`)
      id++
      if (id >= 3) {
        clearInterval(intervalId)
        stream.end()
      }
    }, 0.5 * 1000);

    // 当客户端关闭连接时停止发送消息
    stream.on('close', () => {
      clearInterval(intervalId)
      id = 0
      stream.end('Server Close')
    })
  } else {
    // 如果请求的路径无效，返回 404 状态码
    stream.respond({
      ':status': '404'
    })
    stream.end('Error')
  }

});

// 监听端口
const port = 3001;
server.listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});
