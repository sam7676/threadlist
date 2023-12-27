const backend = require('./backend.js')


app = backend.app
port = backend.port

app.listen(port, function () {
    console.log(`http://127.0.0.1:${port}/`)
  });