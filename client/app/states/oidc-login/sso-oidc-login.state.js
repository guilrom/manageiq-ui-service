import templateUrl from './sso-oidc-login.html'

/** @ngInject */
export function SsoOidcLoginState (routerHelper) {
  routerHelper.configureStates(getStates())
}

function getStates () {
  return {
    // 'sso-oidc-login': {
    'login': {
      parent: 'blank',
      url: '/sso-login',
      templateUrl,
      controller: StateController,
      controllerAs: 'vm',
      title: N_('External Login'),
      data: {
        layout: 'blank'
      }
    }
  }
}

/** @ngInject */
function StateController ($window, $state, Text, RBAC, API_LOGIN, API_PASSWORD, AuthenticationApi, Session, $rootScope, Notifications, Language, ApplianceInfo, CollectionsApi) {
  const vm = this

  init()

  vm.text = Text.login
  vm.credentials = {
    login: API_LOGIN,
    password: API_PASSWORD
  }
  vm.onSubmit = onSubmit
  vm.initiateOidcLogin = initiateOidcLogin
  vm.initiateAdminOidcLogin = initiateAdminOidcLogin

  if ($window.location.href.includes('?timeout')) {
    Notifications.message('danger', '', __('Your session has timed out.'), true)
    Session.destroy()
  }

  if ($window.location.href.includes('?pause')) {
    const params = (new URL($window.document.location)).searchParams
    const pauseLength = params.get('pause')
    Session.setPause(pauseLength)
  }

  if ($window.location.href.includes('?ensureAuthServerSide')) {
    vm.ensureAuthServerSide = true
  }  

  if (Session.privilegesError) {
    Notifications.error(__('User does not have privileges to login.'))
    Session.destroy()
  }

  function initiateOidcLogin () {
    // $window.location.href = $state.href('oidc_login')
    $window.location.href = '/ui/service/oidc_login?ensureAuthServerSide'
  }
  function initiateAdminOidcLogin () {
    $window.location.href = '/'
  }

  function ensureAuthServerSide () {
    // Handling Ext login callback
    if (vm.ensureAuthServerSide) {
      // @todo: check if not already authenticated
      if (vm.authMode.oidc_enabled) {
        const authType = 'oidc'
      } else if (vm.authMode.saml_enabled) {
        const authType = 'saml'
      } else {
        const authType = null
      }
      if (null !== authType) {
        performExtAuthServerSide(authType)
        vm.ensureAuthServerSide = false
      }
    }
  }

  function performExtAuthServerSide (authType) {
    Session.timeoutNotified = false
    Session.privilegesError = false

    return AuthenticationApi.ssoLogin(authType)
    .then(Session.loadUser)
    .then(Session.requestWsToken)
    .then((response) => {
      if (angular.isDefined(response)) {
        Language.onLogin(response)
        ApplianceInfo.set(response)
        RBAC.setRole(response.identity.role)
      }

      if (RBAC.suiAuthorized()) {
        if (angular.isDefined($rootScope.notifications) && $rootScope.notifications.data.length > 0) {
          $rootScope.notifications.data.splice(0, $rootScope.notifications.data.length)
        }
        console.log('Authorization OK, redirecting to dashboard')
        $window.location.href = $state.href('dashboard')
      } else {
        Session.privilegesError = true
        Notifications.error(__('You do not have permission to view the Service UI. Please contact your administrator to update your group permissions.'))
        Session.destroy()
      }
    })
    .catch((response) => {
      console.log('External Login failed, sorry.', response)
      if (response.status === 401) {
        const message = response.data.error.message
        Notifications.message('danger', '', __('External Login failed, sorry. ') + `(${message})`, false)
      }
      Session.destroy()
    })
  }

  function onSubmit () {
    Session.timeoutNotified = false
    Session.privilegesError = false

    return AuthenticationApi.login(vm.credentials.login, vm.credentials.password)
    .then(Session.loadUser)
    .then(Session.requestWsToken)
    .then((response) => {
      if (angular.isDefined(response)) {
        Language.onLogin(response)
        ApplianceInfo.set(response)
        RBAC.setRole(response.identity.role)
      }

      if (RBAC.suiAuthorized()) {
        if (angular.isDefined($rootScope.notifications) && $rootScope.notifications.data.length > 0) {
          $rootScope.notifications.data.splice(0, $rootScope.notifications.data.length)
        }
        $window.location.href = $state.href('dashboard')
      } else {
        Session.privilegesError = true
        Notifications.error(__('You do not have permission to view the Service UI. Contact your administrator to update your group permissions.'))
        Session.destroy()
      }
    })
    .catch((response) => {
      if (response.status === 401) {
        vm.credentials.login = ''
        vm.credentials.password = ''
        const message = response.data.error.message
        Notifications.message('danger', '', __('Login failed, possibly invalid credentials. ') + `(${message})`, false)
      }
      Session.destroy()
    })
  }

  function init () {
    CollectionsApi.query('product_info').then((response) => {
      vm.brandInfo = response.branding_info
      $rootScope.favicon = vm.brandInfo.favicon
      vm.authMode = response.auth_mode
      ensureAuthServerSide()
    })
  }
}
