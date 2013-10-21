(function (ng) {
  app.config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
      // Common
      .when('/', { controller: 'dashboard', templateUrl: '/views/common/dashboard.html' })
      // Converters
      .when('/converters', { controller: 'converter.list', templateUrl: '/views/converter/list.html' })
      .when('/converters/:id', { controller: 'converter.view', templateUrl: '/views/converter/view.html' })
      // Devices
      .when('/devices', { controller: 'device.list', templateUrl: '/views/device/list.html' })
      .when('/devices/:id', { controller: 'device.view', templateUrl: '/views/device/view.html' })
      // Systems
      .when('/systems', { controller: 'system.list', templateUrl: '/views/system/list.html' })
      .when('/systems/:id', { controller: 'system.view', templateUrl: '/views/system/view.html' })
      // Users
      .when('/users', { controller: 'user.list', templateUrl: '/views/user/list.html' })
      .when('/users/:id', { controller: 'user.view', templateUrl: '/views/user/view.html' })
      // Otherwise
      .otherwise({ redirectTo: '/' });
  }]);
}(angular));
