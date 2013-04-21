(function (ng) {
  app.controller({
    NavigationController: function ($scope) {
      $scope.toggle = function (item) {
        $scope.active = (item === $scope.active ? null : item);
      };
    },

    HomeController: function ($scope) {
    },

    // Users
    UsersController: function ($scope, server) {
      server.emit('get:users').then(function (data) {
        $scope.users = data;
      });
    },
    UserController: function ($scope, $routeParams, server) {
      server.emit('get:user', { _id: $routeParams.id }).then(function (data) {
        $scope.user = data;
      });
    },

    // Systems
    SystemsController: function ($scope, server) {
      server.emit('get:systems').then(function (data) {
        $scope.systems = data;
      });
    },

    // Misc
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
    }
  });
}(angular));