(function (ng) {
  app.controller({
    NavigationController: function ($scope) {
      $scope.toggle = function (item) {
        $scope.active = (item === $scope.active ? null : item);
      };
    },

    LoginController: function ($scope) {
      $scope.login = function () {
        $scope.session.create($scope.credentials).then(function () {
          $scope.credentials = {}; // Clear login form
        });
      };
    },
    RegisterController: function ($scope, server) {
      $scope.register = function () {
        server.emit('create:user', _.pick($scope.registration, 'name', 'email', 'password'));
      };
    },

    HomeController: function ($scope) {
    },
    UsersController: function ($scope, server) {
      server.emit('get:users').then(function (result) {
        $scope.users = result;
      });
    },
    SystemsController: function ($scope, server) {
      server.emit('get:systems').then(function (result) {
        $scope.systems = result;
      });
    }
  });
}(angular));
