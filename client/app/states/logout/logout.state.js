/** @ngInject */
export function LogoutState (routerHelper) {
  routerHelper.configureStates(getStates())
}

function getStates () {
  return {
    'logout': {
      url: '/logout',
      controller: StateController,
      controllerAs: 'vm',
      title: N_('Logout')
    }
  }
}

/** @ngInject */
function StateController (Session, API_BASE, $window) {
  activate()

  function activate () {
    var targetLocation
    const authType = Session.getAuthType()
    console.log('authType: ', authType)
    Session.destroy()
    const location = $window.location.href
    if (location.includes(`/ui/service`)) {
      targetLocation = `/ui/service/`
    } else {
      targetLocation = `/`
    }
    if ('oidc' == authType) {
      $window.location.href = '/oidc_login/redirect_uri?logout=' + encodeURI(API_BASE + targetLocation) 
    } else {
      $window.location.href = targetLocation
    }
  }
}
