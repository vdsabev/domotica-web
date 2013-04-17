(function (ng) {
  ng.module('app').controller({
    NavigationController: function ($scope, $location, view) {
      $scope.items = {
        home: { icon: 'icon-home', text: 'Home', href: '/' },
        login: { icon: 'icon-key', text: 'Login', templateUrl: view('navigation/login') },
        register: { icon: 'icon-user', text: 'Register', templateUrl: view('navigation/register') },
        users: { icon: 'icon-group', text: 'Users', href: '/users' },
        systems: { icon: 'icon-tasks', text: 'Systems', href: '/systems' }
      };

      $scope.toggle = function (key) {
        $scope.active = (key === $scope.active ? null : key);
      };
    },

    HomeController: function ($scope) {
    },

    LoginController: function ($scope) {
      $scope.login = function () {
        $scope.session.create($scope.credentials);
      };
    },
    RegisterController: function ($scope, server) {
      $scope.register = function () {
        server.emit('create:user', _.pick($scope.registration, 'name', 'email', 'password'));
      };
    },

    UsersController: function ($scope, server) {
      server.emit('get:users').then(function (result) {
        $scope.users = result;
      });
    },
    SystemsController: function ($scope) {
    }
  });
}(angular));
