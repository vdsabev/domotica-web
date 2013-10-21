(function (ng) {
  app.constant('$settings', {
    version: new Date().getTime(), // Only used in development
    delay: 200,

    session: { // Default values
      language: 'en-US',
      keyField: '_key',
      maxLength: 60 * 60e3, // 1 hour
      maxExtendedLength: 30 * 24 * 60 * 60e3, // 30 days
    },

    languages: {
      bg: 'Български',
      'en-US': 'English (US)'
    }
  });
}(angular));
