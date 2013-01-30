(function ($) {
  var App = window.App = function (options) {
    _.extend(this, options);

    // Backbone
    _.extend(this, Backbone.Events);
    this.Model = Backbone.Model.extend({});
    this.Collection = Backbone.Collection.extend({});

    this.Router = Backbone.Router.extend({
      load: function (route) {
        if (route) this.navigate(route);
        Backbone.history.loadUrl();
      },

      routes: {
        // Content
        '': 'home',

        // Systems
        // 'systems': 'systems',
        'systems/:id': 'system',

        // Users
        'users': 'users',
        'users/:username': 'user',
        'settings': 'settings',

        // Errors
        '*other': 'notFound'
      },

      // Pages
      home: function () {
      },

      // Systems
      systems: function () {
        var that = this;
        this.server.emit('get.systems', {}, function (systems) {
          that.main.system = new that.views.Systems({ model: systems });
        });
      },
      system: function (id) {
        var that = this;
        this.server.emit('get.system', { _id: id }, function (system) {
          that.main.system = new that.views.System({ model: system });
        });
      },

      // Users
      users: function () {
        var that = this;
        this.server.emit('get.users', {}, function (users) {
          that.main.user = new that.views.Users({ model: users });
        });
      },
      user: function (username) {
        var that = this;
        this.server.emit('get.users', { username: username }, function (user) {
          that.main.user = new that.views.Profile({ model: user });
        });
      },
      settings: function () {
        if (App.User.get('loggedIn')) {
          this.main.content = new App.Views.Settings({ model: App.User });
        }
        else {
          this.main.router.load('/');
        }
      },

      // Errors
      notFound: function () {
        this.main.content = new App.Views.NotFound();
      }
    });

    this.View = Backbone.View.extend({});

    // Namespaces
    this.models = {};
    this.collections = {};
    this.views = {};

    // Initialize
    this.router = new this.Router();
    this.server = io.connect(this.domain);
    this.user = new this.models.Session();
    new this.views.Main({ el: '#main' });

    // Function Definitions
  };

  $(function () { // Start the app
    new App({ name: 'Domotica', domain: '//localhost:3000' });
  });
}(jQuery));
