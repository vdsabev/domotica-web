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
      replace: true,
      template: '<div class="chart"></div>',
      link: function (scope, element, attrs) {
        var chart, data, options;

        // Watch model
        scope.$watchCollection(attrs.ngModel, init);
        function init (model) {
          if (!model) return;

          chart = {};
          data = scope[attrs.ngModel].data;
          options = _.extend({
            margin: {
              top: element.css('margin-top') || 20,
              right: element.css('margin-right') || 10,
              bottom: element.css('margin-bottom') || 20,
              left: element.css('margin-left') || 30
            },
            xaxis: { span: 60e3 },
            yaxis: {}
          }, scope[attrs.ngModel].options);

          options.width = element[0].offsetWidth - options.margin.left - options.margin.right;
          options.height = element[0].offsetHeight - options.margin.top - options.margin.bottom;

          // Math functions
          chart.x = d3.time.scale().range([0, options.width]);
          chart.y = d3.scale.linear().range([options.height, 0]);

          chart.xaxis = d3.svg.axis().scale(chart.x).orient('bottom');
          chart.yaxis = d3.svg.axis().scale(chart.y).orient('left');
          chart.area = d3.svg.area()
                         .x(function (value) { return chart.x(value[0]) })
                         .y0(options.height)
                         .y1(function (value) { return chart.y(value[1]) })
                         .interpolate('monotone');

          // DOM
          chart.dom = {
            svg: d3.select(element[0]).append('svg')
                   .attr('width', options.width + options.margin.left + options.margin.right)
                   .attr('height', options.height + options.margin.top + options.margin.bottom)
                   .append('g')
                   .attr('transform', 'translate(' + options.margin.left + ',' + options.margin.top + ')')
          };

          calculateAxisDomains();

          // X Axis
          chart.dom.xaxis = chart.dom.svg.append('g')
                                 .attr('class', 'x axis')
                                 .attr('transform', 'translate(0,' + options.height + ')')
                                 .call(chart.xaxis);

          if (options.xaxis.label) {
            chart.dom.xaxis.append('text')
                     .attr('dx', options.width)
                     .attr('dy', '1.35em')
                     .text(options.xaxis.label);
          }

          // Y Axis
          chart.dom.yaxis = chart.dom.svg.append('g')
                                     .attr('class', 'y axis')
                                     .call(chart.yaxis);

          if (options.yaxis.label) {
            chart.dom.yaxis.append('text')
                     .attr('dx', '0.5em')
                     .attr('dy', options.height / 2)
                     .text(options.yaxis.label);
          }

          // Area
          chart.dom.area = chart.dom.svg.append('path')
                                    .datum(data)
                                    .attr('class', 'area')
                                    .attr('d', chart.area);
        }

        // Watch data
        scope.$watchCollection(attrs.ngModel + '.data', render);
        function render() {
          if (!chart) return;

          calculateAxisDomains();

          chart.dom.xaxis.call(chart.xaxis);
          chart.dom.yaxis.call(chart.yaxis);
          if (data.length !== 0) {
            if (!chart.dom.yvalue) {
              chart.dom.yvalue = chart.dom.svg.append('text')
                                          .attr('dx', options.width)
                                          .attr('dy', options.height / 2)
                                          .attr('text-anchor', 'end');
            }
            chart.dom.yvalue.text(_.last(data)[1]);
          }
          chart.dom.area.attr('d', chart.area);
        };

        function calculateAxisDomains() {
          var lastTime = d3.max(data, function (value) { return value[0] });
          chart.x.domain(lastTime != null ?
            [lastTime - options.xaxis.span, lastTime] :
            d3.extent(data, _.first)
          );

          chart.y.domain([
            options.yaxis.min != null ? options.yaxis.min : d3.min(data, _.last),
            options.yaxis.max != null ? options.yaxis.max : d3.max(data, _.last)
          ]);
        }
      }
    };
  });
}(angular));
