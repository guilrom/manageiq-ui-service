import base64js from 'base64-js'
const TextEncoderLite = require('text-encoder-lite').TextEncoderLite

// utf8-capable window.btoa
function base64encode (str, encoding = 'utf-8') {
  let bytes = new (window.TextEncoder || TextEncoderLite)(encoding).encode(str)
  return base64js.fromByteArray(bytes)
}

// retrieve a specific header from request to a given url
function fetchRequestHeader(url, header) { 
  // Return a new promise.
  return new Promise((resolve, reject) => {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest()
    req.open('HEAD', url)

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        console.log('Request headers: ' + req.getAllResponseHeaders())
        // Resolve the promise with the targetted response header
        resolve(req.getResponseHeader(header))
      }
      else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText))
      }
    }

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"))
    }

    // Make the request
    req.send()
  })
}


/** @ngInject */
export function AuthenticationApiFactory ($http, API_BASE, Session, Notifications) {
  var service = {
    login: login,
    ssoLogin: ssoLogin
  }

  return service

  function ssoLogin (authType) {
    return new Promise((resolve, reject) => {

      //fetchRequestHeader(document.location, 'X-REMOTE-USER')
      // $http.get(API_BASE + '/oidc_login/redirect_uri?info=json')

      console.log('Entering in ssoLogin')

      $http.get(API_BASE + '/userinfo')
      .then(function (result) {

          console.log('result.data: ' + result.data)
          console.log('result.data.userinfo: ' + result.data.userinfo)
          console.log('result.data.userinfo.username: ' + result.data.userinfo.username)

          // @temp

          // $http.defaults.headers.common['X-REMOTE-USER'] = 'guilrom'
          // $http.defaults.headers.common['X-REMOTE-USER-FULLNAME'] = 'Romain GUILLOT'
          // $http.defaults.headers.common['X-REMOTE-USER-FIRSTNAME'] = 'Romain'
          // $http.defaults.headers.common['X-REMOTE-USER-LASTNAME'] = 'GUILLOT'
          // $http.defaults.headers.common['X-REMOTE-USER-EMAIL'] = 'guilrom@gmail.com'
          // $http.defaults.headers.common['X-REMOTE-USER-GROUPS'] = 'EvmGroup-super_administrator, super_administrator'

          $http.defaults.headers.common['X-REMOTE-USER'] = result.data.userinfo.username
          $http.defaults.headers.common['X-REMOTE-USER-FULLNAME'] = result.data.userinfo.fullname
          $http.defaults.headers.common['X-REMOTE-USER-FIRSTNAME'] = result.data.userinfo.firstname
          $http.defaults.headers.common['X-REMOTE-USER-LASTNAME'] = result.data.userinfo.lastname
          $http.defaults.headers.common['X-REMOTE-USER-EMAIL'] = result.data.userinfo.email
          $http.defaults.headers.common['X-REMOTE-USER-GROUPS'] = result.data.userinfo.groups

          $http.get(API_BASE + '/api/sso/auth?requester_type=ui', {
            // headers: { //@temp hack : hardcoded values
            //   'X-REMOTE-USER': 'guilrom', 
            //   'X-REMOTE-USER-FULLNAME': 'Romain GUILLOT',
            //   'X-REMOTE-USER-FIRSTNAME': 'Romain',
            //   'X-REMOTE-USER-LASTNAME': 'GUILLOT',
            //   'X-REMOTE-USER-EMAIL': 'guilrom@gmail.com',
            //   'X-REMOTE-USER-GROUPS': 'EvmGroup-super_administrator, super_administrator',
            //   'X-Auth-Token': undefined
            // }
          }).then(loginSuccess, loginFailure)

        }, function (errMsg) {
          reject(errMsg);
      })


      function loginSuccess (response) {
        console.log("loginSuccess > response.data: ", response.data)
        console.log("loginSuccess > response.data.auth_token: ", response.data.auth_token)
        Session.setAuthToken(response.data.auth_token)
        Session.setAuthType(authType)
        resolve(response)
      }

      function loginFailure (response) {
        Session.destroy()
        reject(response)
      }
    })
  }

  function login (userLogin, password) {
    return new Promise((resolve, reject) => {
      $http.get(API_BASE + '/api/auth?requester_type=ui', {
        headers: {
          'Authorization': 'Basic ' + base64encode([userLogin, password].join(':')),
          'X-Auth-Token': undefined
        }
      }).then(loginSuccess, loginFailure)

      function loginSuccess (response) {
        Session.setAuthToken(response.data.auth_token)
        resolve(response)
      }

      function loginFailure (response) {
        Session.destroy()
        reject(response)
      }
    })
  }
}
