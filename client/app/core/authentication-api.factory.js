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

      console.log('Entering in ssoLogin')

      $http.get(API_BASE + '/ui/service/oidc_userinfo')
      .then(function (result) {

          console.log('result.data: ', result.data)
          console.log('result.headers(): ', result.headers())

          $http.defaults.headers.common['X-REMOTE-USER'] = result.headers('X_REMOTE_USER')
          $http.defaults.headers.common['X-REMOTE-USER-FULLNAME'] = result.headers('X_REMOTE_USER_FULLNAME')
          $http.defaults.headers.common['X-REMOTE-USER-FIRSTNAME'] = result.headers('X_REMOTE_USER_FIRSTNAME')
          $http.defaults.headers.common['X-REMOTE-USER-LASTNAME'] = result.headers('X_REMOTE_USER_LASTNAME')
          $http.defaults.headers.common['X-REMOTE-USER-EMAIL'] = result.headers('X_REMOTE_USER_EMAIL')
          $http.defaults.headers.common['X-REMOTE-USER-GROUPS'] = result.headers('X_REMOTE_USER_GROUPS')

          $http.get(API_BASE + '/api/sso/auth?requester_type=ui', {
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
