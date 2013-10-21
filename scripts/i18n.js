(function (ng) {
  var resources = {};
  var loading = {};

  function parse(resource, data, $interpolate) {
    // Resource arrays can be used for better readability;
    // otherwise, still convert to an array for consistency
    if (!ng.isArray(resource)) {
      resource = [resource];
    }

    var result = [];
    ng.forEach(resource, function (expression, index) {
      if (ng.isObject(expression) && expression.switch) { // Parse expression
        var switchKey = $interpolate(expression.switch)(data);
        var switchValue = expression[switchKey];
        if (switchValue == null) { // An empty string is valid

          if (!isNaN(switchKey)) { // If we're looking for a number, the key could match a regex
            for (var key in expression) {
              if (isNaN(key)) { // It's a regex, see if there's a match
                if (new RegExp('^' + key + '$').test(switchKey)) {
                  switchValue = expression[key];
                  break;
                }
              }
            }
          }

          if (switchValue == null) { // Still no match
            switchValue = expression.else;
          }
        }

        expression = switchValue;
        if (ng.isArray(expression)) { // Parse recursively
          expression = parse(expression, data, $interpolate);
        }
      }

      var value = data ? $interpolate(expression)(data) : expression;
      result.push(value); // TODO: Use unshift if RTL
    });
    return result.join(' '); // TODO: Some languages may use a different word separator
  }

  // Directive
  app.directive('i18n', ['$session', '$i18n', '$i18nLoader', function ($session, $i18n, $i18nLoader) {
    return {
      restrict: 'A',
      scope: false,
      link: function ($scope, $element, $attr) {
        var options;
        parse();

        // Set watches
        if (options.watch) {
          if (ng.isArray(options.watch)) {
            if (options.watch.length === 1) { // Watch collection
              $scope.$watchCollection(options.watch[0], parseAndRender);
            }
            else {
              ng.forEach(options.watch, function (path) {
                $scope[ng.isArray(path) ? '$watchCollection' : '$watch'](path, parseAndRender);
              });
            }
          }
          else { // Just watch the string path
            $scope.$watch(options.watch, parseAndRender);
          }
        }
        else if (resources[$session.language]) { // Static resource - only render once
          render();
        }

        if (!resources[$session.language]) { // Wait until the resource is loaded
          $scope.$root.$on('i18nLoaded', function (event, language, data) {
            if (language === $session.language) { // In case the language changed in the meantime
              render();
            }
          });
          $i18nLoader($scope);
        }

        function parseAndRender() {
          parse();
          render();
        }

        function parse() {
          if ($attr.i18n.indexOf('{') !== -1) { // Parse options
            options = $scope.$eval($attr.i18n);
          }
          else {
            options = { key: $attr.i18n }; // Plain resource key
          }
        }

        function render() {
          if (options.key) {
            $element.html($i18n(options.key, options.data, $scope));
          }
          if (options.attr) {
            var attributes = {};
            ng.forEach(options.attr, function (value, key) {
              if (ng.isObject(value)) {
                attributes[key] = $i18n(value.key, value.data, $scope);
              }
              else {
                attributes[key] = $i18n(value, options.data, $scope);
              }
            });
            $element.attr(attributes);
          }
        }
      }
    };
  }]);

  // Main service
  app.factory('$i18n', ['$interpolate', '$parse', '$session', '$i18nLoader', function ($interpolate, $parse, $session, $i18nLoader) {
    return function (key, data, $scope) {
      var resource = resources[$session.language];
      if (!resource) {
        $i18nLoader($scope);
        return '';
      }

      // Extract resource from object
      resource = $parse(key)(resource);
      return parse(resource, data, $interpolate);
    };
  }]);

  // File loader service
  app.factory('$i18nLoader', ['$http', '$session', '$settings', function ($http, $session, $settings) {
    return function ($scope) {
      var options = { prefix: '/i18n/', language: $session.language, suffix: '.json' };
      if (loading[options.language]) return;
      loading[options.language] = true;

      $http({
        url: [options.prefix, options.language, options.suffix].join(''),
        method: 'GET',
        params: { _: $settings.version },
        cache: true
      }).success(function (data) {
        resources[options.language] = data;
        delete loading[options.language];
        $scope.$root.$emit('i18nLoaded', options.language, data);
      });
    };
  }]);
}(angular));
