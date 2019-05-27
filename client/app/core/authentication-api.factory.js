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
  return new Promise(function(resolve, reject) => {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest()
    req.open('HEAD', url)

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        console.log('Request headers: ' + req.get​AllResponse​Headers())
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

      fetchRequestHeader(document.location, 'X-REMOTE-USER')
      .then(username) {

        $http.get(API_BASE + '/api/sso/auth?requester_type=ui', {
          headers: {
            'X-REMOTE-USER': username, //@temp
            'X-Auth-Token': undefined
          }
        }).then(loginSuccess, loginFailure)

      }


      function loginSuccess (response) {
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
