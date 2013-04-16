module.exports = function (context, versionKey) {
  return function (req, res, next) {
    context[versionKey] = new Date().getTime();
    return next();
  };
};
