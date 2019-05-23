import base64js from 'base64-js'
const TextEncoderLite = require('text-encoder-lite').TextEncoderLite

// utf8-capable window.btoa
function base64encode (str, encoding = 'utf-8') {
  let bytes = new (window.TextEncoder || TextEncoderLite)(encoding).encode(str)
  return base64js.fromByteArray(bytes)
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
      $http.get(API_BASE + '/api/sso/auth?requester_type=ui', {
        headers: {
          'X-Auth-Token': undefined
        }
      }).then(loginSuccess, loginFailure)

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
