const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://api.curonnhealth.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
      secure: false,
    })
  );
};
