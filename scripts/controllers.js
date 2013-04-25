(function (ng) {
  app.controller({
    // Main
    navigation: function ($scope) {
      $scope.toggle = function (item) {
        $scope.active = (item === $scope.active ? null : item);
      };
    },
    home: function ($scope) {
    },
    'create.session': function ($scope) {
      $scope.login = function () {
        $scope.session.create($scope.credentials).then(function () {
          $scope.credentials = {}; // Clear login form
        });
      };
    },
    'create.registration': function ($scope, server) {
      $scope.register = function () {
        server.emit('create:user', _.pick($scope.registration, 'name', 'email', 'password'));
      };
    },

    // User
    users: function ($scope, server) {
      server.emit('get:users').then(function (data) {
        $scope.users = data;
      });
    },
    user: function ($scope, $routeParams, server) {
      $scope.original = {};

      $scope.revert = function (key) {
        $scope[key] = _.clone($scope.original[key]);
      };

      server.emit('get:user', { _id: $routeParams.id }).then(function (data) {
        $scope.user = data;
        $scope.original.user = _.clone(data);
      });

      $scope.update = function () {
        $scope.edit = false;
        server.emit('update:user', $scope.user).then(
          function () {},
          function (error) {
            $scope.revert('user');
            $scope.edit = true;
          }
        );
      };

      $scope.cancel = function () {
        $scope.revert('user');
        $scope.edit = false;
      }
    },

    // System
    systems: function ($scope, server) {
      server.emit('get:systems').then(function (data) {
        $scope.systems = data;
      });
    },
    system: function ($scope, $routeParams, server) {
      $scope.original = {};

      $scope.revert = function (key) {
        $scope[key] = _.clone($scope.original[key]);
      };

      server.emit('get:system', { _id: $routeParams.id }).then(function (data) {
        $scope.system = data;
        $scope.original.system = _.clone(data);
      });

      $scope.update = function () {
        $scope.edit = false;
        server.emit('update:system', $scope.system).then(
          function () {},
          function (error) {
            $scope.revert('system');
            $scope.edit = true;
          }
        );
      };

      $scope.cancel = function () {
        $scope.revert('system');
        $scope.edit = false;
      }
    },
    'create.system': function ($scope, server) {
      $scope.create = function () {
        server.emit('create:system', _.pick($scope.system, 'name', 'description'));
      };
    }
  });
}(angular));
