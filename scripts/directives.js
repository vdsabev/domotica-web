(function (ng, $) {
  app.directive('whenActive', function ($location) {
    return {
      scope: true,
      link: function (scope, element, attrs) {
        scope.$on('$routeChangeSuccess', function () {
          element.toggleClass('active', $location.path() === element.attr('href'));
        });
      }
    };
  });

  app.directive('chart', function () {
    return {
      restrict: 'E',
      link: function (scope, element, attrs) {
        var chart;

        scope.$watchCollection(attrs.ngModel, function (model) {
          if (!model) return;

          watchSeries();
          if (!chart) {
            chart = $.plot(element, model.data, model.options);
          }
          else {
            chart.setData(model.data);
            chart.setupGrid();
            chart.draw();
          }
        });

        scope.$watch(attrs.ngModel + '.data.length', function (length, oldLength) {
          if (!chart || length === oldLength) return;

          watchSeries();
          chart.setData(scope[attrs.ngModel].data);
          chart.draw();
        });

        var series = [];
        function watchSeries() {
          _.each(series, function (unwatch) { unwatch() });
          for (var index = 0; index < scope[attrs.ngModel].data.length; index++) {
            series.push(scope.$watchCollection(attrs.ngModel + '.data[' + index + ']', function () {
              chart.setData(scope[attrs.ngModel].data);
              chart.setupGrid();
              chart.draw();
            }));
          }
        }
      }
    };
  });
}(angular, jQuery));
