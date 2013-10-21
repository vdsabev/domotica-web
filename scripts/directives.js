(function (ng, $) {
  app.directive('whenActive', ['$location', function ($location) {
    return {
      link: function ($scope, $element, $attr) {
        $scope.$on('$routeChangeSuccess', function () {
          $element.toggleClass('active', $attr.href === $location.path());
        });
      }
    };
  }]);

  app.directive('chart', function () {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="chart"></div>',
      link: function ($scope, $element, $attr) {
        var $, data, options;

        // Watch model
        $scope.$watchCollection($attr.ngModel, init);
        function init(model) {
          if (!model) return;

          $ = {};
          data = $scope[$attr.ngModel].data;
          options = _.extend({
            margin: { top: 20, right: 10, bottom: 20, left: 30 },
            xaxis: { span: 60e3 },
            yaxis: {}
          }, $scope[$attr.ngModel].options);

          options.width = $element[0].offsetWidth - options.margin.left - options.margin.right;
          options.height = $element[0].offsetHeight - options.margin.top - options.margin.bottom;

          // Math functions
          $.x = d3.time.scale().range([0, options.width]);
          $.y = d3.scale.linear().range([options.height, 0]);

          $.xaxis = d3.svg.axis().scale($.x).orient('bottom');
          $.yaxis = d3.svg.axis().scale($.y).orient('left');
          $.area = d3.svg.area()
                         .x(function (value) { return $.x(value[0]) })
                         .y0(options.height)
                         .y1(function (value) { return $.y(value[1]) })
                         .interpolate('monotone');

          // DOM
          $.dom = {
            svg: d3.select($element[0]).append('svg').attr({
              width: options.width + options.margin.left + options.margin.right,
              height: options.height + options.margin.top + options.margin.bottom
            }).append('g').attr({
              transform: 'translate(' + options.margin.left + ',' + options.margin.top + ')'
            })
          };

          calculateAxisDomains();

          // X Axis
          $.dom.xaxis = $.dom.svg.append('g')
                                 .attr('class', 'x axis')
                                 .attr('transform', 'translate(0,' + options.height + ')')
                                 .call($.xaxis);

          if (options.xaxis.label) {
            $.dom.xaxis.append('text')
                       .attr('dx', options.width)
                       .attr('dy', '1.35em')
                       .text(options.xaxis.label);
          }

          // Y Axis
          $.dom.yaxis = $.dom.svg.append('g')
                                 .attr('class', 'y axis')
                                 .call($.yaxis);

          if (options.yaxis.label) {
            $.dom.yaxis.append('text')
                       .attr('dx', '0.5em')
                       .attr('dy', options.height / 2)
                       .text(options.yaxis.label);
          }

          // Area
          $.dom.area = $.dom.svg.append('path')
                                .datum(data)
                                .attr('class', 'area')
                                .attr('d', $.area);
        }

        // Watch data
        $scope.$watchCollection($attr.ngModel + '.data', render);
        function render() {
          if (!$) return;

          calculateAxisDomains();

          $.dom.xaxis.call($.xaxis);
          $.dom.yaxis.call($.yaxis);
          if (data.length !== 0) {
            if (!$.dom.yvalue) {
              $.dom.yvalue = $.dom.svg.append('text')
                                      .attr('dx', options.width)
                                      .attr('dy', options.height / 2)
                                      .attr('text-anchor', 'end');
            }
            $.dom.yvalue.text(_.last(data)[1]);
          }
          $.dom.area.attr('d', $.area);
        };

        function calculateAxisDomains() {
          var lastTime = d3.max(data, function (value) { return value[0] });
          $.x.domain(lastTime != null ?
            [lastTime - options.xaxis.span, lastTime] :
            d3.extent(data, _.first)
          );

          $.y.domain([
            options.yaxis.min != null ? options.yaxis.min : d3.min(data, _.last),
            options.yaxis.max != null ? options.yaxis.max : d3.max(data, _.last)
          ]);
        }
      }
    };
  });
}(angular));
