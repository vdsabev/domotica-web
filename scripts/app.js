(function (ng) {
  var app = window.app = ng.module('domotica', ['ngAnimate', 'ngRoute']);

  // Server
  app.factory('$server', ['$rootScope', '$q', '$route', '$settings', '$log', function ($rootScope, $q, $route, $settings, $log) {
    // Define socket and server proxy
    var socket;
    var server = {
      on: function (event, callback, registerEvent) {
        if (registerEvent || registerEvent === undefined) {
          if (!this.events[event]) {
            this.events[event] = [];
          }
          this.events[event].push(callback);
        }

        socket.on(event, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      off: function (event, callback) {
        socket.removeAllListeners.apply(this, arguments);

        if (callback) {
          var callbacks = this.events[event];
          if (callbacks) {
            callbacks.splice(callbacks.indexOf(callback), 1);
            if (callbacks.length === 0) {
              delete this.events[event];
            }
          }
        }
        else {
          delete this.events[event];
        }
      },
      events: {},
      emit: function (event, data) {
        var req = { data: data };

        // Add session key to the request
        var needsSessionKey = event !== 'destroy:session';
        if (needsSessionKey && $rootScope.session.loggedIn) {
          req[$rootScope.session.keyField] = $rootScope.session.key();
        }

        var deferred = $q.defer();
        socket.emit(event, req, function (error, res) {
          $rootScope.$apply(function () {
            if (error) {
              switch (error) {
                case 'UNAUTHORIZED':
                case 'SESSION_EXPIRED':
                  if ($rootScope.session.loggedIn) {
                    $rootScope.session.destroy();
                  }
                  break;
              }
              deferred.reject(error);
            }
            else {
              // Touch session
              if (needsSessionKey) {
                $rootScope.session.timestamp = new Date().getTime();
                $rootScope.session.key(res[$rootScope.session.keyField]);
              }
              deferred.resolve(res.data);
            }
          });
        });
        return deferred.promise;
      }
    };

    $rootScope.$on('$routeChangeStart', function () {
      _.each(server.events, function (callback, event) {
        server.off(event);
      });
    });

    // Define and load session
    $rootScope.session = {
      data: {},

      key: function (value) {
        if (value !== undefined) { // Set
          return this.data[this.keyField] = value;
        }
        return this.data[this.keyField]; // Get
      },

      // Local persistence
      save: _.debounce(function () {
        var session = _.pick(this, 'data', 'loggedIn', 'timestamp', 'language'); // TODO: Move language to $ui
        var options = {};
        if (this.loggedIn) {
          options.TTL = this.remember ? this.maxExtendedLength : this.maxLength;
        }
        $.jStorage.set('session', session, options);
      }, $settings.delay),
      load: function () {
        return _.extend(this, $settings.session, $.jStorage.get('session'));
      },

      // Server operations
      create: function (credentials) {
        var session = this;
        return server.emit('create:session', credentials).then(function (data) {
          // server.on('session:' + data._id, function (data) {
            // TODO: notifications
          // }, false);
          session.remember = credentials.remember;
          session.loggedIn = true;
          session.data = data;
          session.save();
          $route.reload();
        });
      },
      destroy: function () {
        var session = this;
        return server.emit('destroy:session').then(function () {
          // server.off('session:' + session.data._id);
          session.loggedIn = false;
          session.data = {};
          session.save();
          $route.reload();
        });
      }
    };
    $rootScope.session.load();

    // Watch for language changes
    $rootScope.$watch('session.language', function () {
      $rootScope.session.save();
      $route.reload();
    });

    // Establish connection
    var query = '';
    if ($rootScope.session.key()) {
      query = '?' + $rootScope.session.keyField + '=' + $rootScope.session.key();
    }
    socket = io.connect('//localhost:3000' + query, { // TODO: Make more flexible
      'reconnection limit': 60e3,
      'max reconnection attempts': Infinity
    });
    socket.on('connect', function () {
      if ($rootScope.session.loggedIn) {
        $rootScope.session.timestamp = new Date().getTime();
        server.emit('refresh:session').then(function () {
          $rootScope.connected = true;
        });
      }
      else {
        $rootScope.$apply(function () {
          $rootScope.connected = true;
        });
      }
    });
    socket.on('disconnect', function () {
      $rootScope.$apply(function () {
        $rootScope.connected = false;
      });
    });
    socket.on('error', function (error) {
      $log.error(error);
      alert(error && error.message || error); // TODO: Use a friendlier interface
    });

    $rootScope.connect = function () {
      socket.socket.connect();
    };

    return server;
  }]);

  app.factory('$session', ['$rootScope', function ($rootScope) {
    return $rootScope.session;
  }]);
}(angular));
