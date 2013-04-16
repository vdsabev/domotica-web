(function (ng) {
  ng.module('Domotica').directive('whenActive', function ($location) {
    return {
      scope: true,
      link: function (scope, element, attrs) {
        scope.$on('$routeChangeSuccess', function () {
          element.toggleClass('active', $location.path() === element.attr('href'));
        });
      }
    };
  });
}(angular));
