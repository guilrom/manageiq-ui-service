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
          console.log('result.headers(X-REMOTE-USER): ', result.headers('X-REMOTE-USER'))
          console.log('result.headers(X_REMOTE_USER): ', result.headers('X_REMOTE_USER'))

          // @temp

          // $http.defaults.headers.common['X-REMOTE-USER'] = 'guilrom'
          // $http.defaults.headers.common['X-REMOTE-USER-FULLNAME'] = 'Romain GUILLOT'
          // $http.defaults.headers.common['X-REMOTE-USER-FIRSTNAME'] = 'Romain'
          // $http.defaults.headers.common['X-REMOTE-USER-LASTNAME'] = 'GUILLOT'
          // $http.defaults.headers.common['X-REMOTE-USER-EMAIL'] = 'guilrom@gmail.com'
          // $http.defaults.headers.common['X-REMOTE-USER-GROUPS'] = 'EvmGroup-super_administrator, super_administrator'

          // $http.defaults.headers.common['X-REMOTE-USER'] = result.data.userinfo.username
          // $http.defaults.headers.common['X-REMOTE-USER-FULLNAME'] = result.data.userinfo.fullname
          // $http.defaults.headers.common['X-REMOTE-USER-FIRSTNAME'] = result.data.userinfo.firstname
          // $http.defaults.headers.common['X-REMOTE-USER-LASTNAME'] = result.data.userinfo.lastname
          // $http.defaults.headers.common['X-REMOTE-USER-EMAIL'] = result.data.userinfo.email
          // $http.defaults.headers.common['X-REMOTE-USER-GROUPS'] = result.data.userinfo.groups

          $http.defaults.headers.common['X-REMOTE-USER'] = result.headers('X-REMOTE-USER')
          $http.defaults.headers.common['X-REMOTE-USER-FULLNAME'] = result.headers('X-REMOTE-USER-FULLNAME')
          $http.defaults.headers.common['X-REMOTE-USER-FIRSTNAME'] = result.headers('X-REMOTE-USER-FIRSTNAME')
          $http.defaults.headers.common['X-REMOTE-USER-LASTNAME'] = result.headers('X-REMOTE-USER-LASTNAME')
          $http.defaults.headers.common['X-REMOTE-USER-EMAIL'] = result.headers('X-REMOTE-EMAIL')
          $http.defaults.headers.common['X-REMOTE-USER-GROUPS'] = result.headers('X-REMOTE-GROUPS')

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
