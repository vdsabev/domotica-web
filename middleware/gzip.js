var _ = require('lodash'),
    env = require('var'),
    express = require('express');

module.exports = function (options) {
  options = _.defaults({ minLength: 0 }, options);
  return express.compress({
    filter: function (req, res) {
      return res.getHeader('Content-Length') > options.minLength &&
             /json|text|javascript/.test(res.getHeader('Content-Type'));
    }
  });
};
