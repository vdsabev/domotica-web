(function () {
  app.controller({
    NavigationController: function ($scope, $location, view) {
      $scope.items = [
        { text: 'Home',     icon: 'icon-home',  href: '/' },
        { text: 'Login',    icon: 'icon-key',   templateUrl: view('navigation/login') },
        { text: 'Register', icon: 'icon-user',  templateUrl: view('navigation/register') },
        { text: 'Users',    icon: 'icon-group', href: '/users' },
        { text: 'Systems',  icon: 'icon-tasks', href: '/systems' }
      ];

      $scope.toggle = function (item) {
        $scope.active = (item === $scope.active ? null : item);
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
      server.emit('get:systems').then(function (result) {
        $scope.systems = result;
      });
    }
  });
}());
