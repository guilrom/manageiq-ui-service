/* eslint-disable no-undef, no-console, angular/log, no-path-concat */

const path = require('path')
const http = require('http')
const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const favicon = require('serve-favicon')
const logger = require('morgan')
const httpProxy = require('http-proxy')
const four0four = require('./utils/404')()
const proxyService = require('./utils/proxy')()
const serviceApi = require('./utils/serviceApi')

const buildOutputPath = process.env.BUILD_OUTPUT || './'
const app = express()
const port = process.env.PORT || 3001
const environment = process.env.NODE_ENV

// Overwriting console.log to log in a file

const fs = require('fs')
const util = require('util')
var logFile = fs.createWriteStream('/var/www/miq/vmdb/log' + '/debug_sui.log', {flags : 'w'})
var logStdout = process.stdout

console.log = function () {
  logFile.write(util.format.apply(null, arguments) + '\n')
  logStdout.write(util.format.apply(null, arguments) + '\n')
}
console.error = console.log

// Secure http headers
app.use(helmet())

// Api
app.use('/api', serviceApi)

// Endowing these assets with higher precedence than api will cause issues
app.use(favicon(__dirname + '/favicon.ico'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(logger('dev'))

console.log('About to crank up node')
console.log('PORT=' + port)
console.log('NODE_ENV=' + environment)

switch (environment) {
  case 'build':
    console.log('** BUILD **')
    app.use(express.static('./build'))
    // Any invalid calls for templateUrls are under app/* and should return 404
    app.use('/app/*', function (req, res) {
      four0four.send404(req, res)
    })
    // Any deep link calls should return index.html
    app.use('/*', express.static('./public/index.html'))
    break
  default: {
    const proxyHost = proxyService.proxyHost()
    const proxyErrorHandler = proxyService.proxyErrorHandler

    console.log('** DEV **')
    app.use(express.static(path.resolve(__dirname, buildOutputPath)))

    // dev routes
    app.use('/pictures', function (req, res) {
      pictureProxy.web(req, res, proxyErrorHandler(req, res))
    })

    app.use('/userinfo', function (req, res) {
      // checking headers
      console.log('NodeJS Server headers: ' _req.headers)      
      // trying to pass X_REMOTE_USER headers
      res.set({
          'X-REMOTE-USER': _req.header('HTTP_X_REMOTE_USER'), 
          'X-REMOTE-USER-FULLNAME': _req.header('HTTP_X_REMOTE_USER_FULLNAME'),
          'X-REMOTE-USER-FIRSTNAME': _req.header('HTTP_X_REMOTE_USER_FIRSTNAME'),
          'X-REMOTE-USER-LASTNAME': _req.header('HTTP_X_REMOTE_USER_LASTNAME'),
          'X-REMOTE-USER-EMAIL': _req.header('HTTP_X_REMOTE_USER_EMAIL'),
          'X-REMOTE-USER-GROUPS': _req.header('HTTP_X_REMOTE_USER_GROUPS'),
      })
      res.type('json')
      res.send({ userinfo : 
        {
          'username': _req.header('HTTP_X_REMOTE_USER'), 
          'fullname': _req.header('HTTP_X_REMOTE_USER_FULLNAME'),
          'firstname': _req.header('HTTP_X_REMOTE_USER_FIRSTNAME'),
          'lastname': _req.header('HTTP_X_REMOTE_USER_LASTNAME'),
          'email': _req.header('HTTP_X_REMOTE_USER_EMAIL'),
          'groups': _req.header('HTTP_X_REMOTE_USER_GROUPS')
        }
      })
    })

    const pictureProxy = httpProxy.createProxyServer({
      target: 'http://' + proxyHost + '/pictures'
    })

    app.all('*', function (_req, res, _next) {
      // Just send the index.html for other files to support HTML5Mode
      res.sendFile(path.resolve(__dirname, buildOutputPath + '/index.html'))
    })
    break
  }
}

const server = http.createServer(app)

server.listen(port, function () {
  console.log('Express server listening on port ' + port)
  console.log('env = ' + app.get('env') + '\n__dirname = ' +
    __dirname + '\nprocess.cwd = ' + process.cwd())
})
