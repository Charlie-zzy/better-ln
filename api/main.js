import { createProxyMiddleware } from 'http-proxy-middleware'

const config = 1
module.exports = (req, res) => {
  createProxyMiddleware({
    target: 'http://218.60.150.150/',
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('cookie', 'SESSION=' + req.query.SESSION)
    },
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
      proxyRes.headers['MONSTER-XIAN-BEI'] = '114514.1919810'
      try {
        proxyRes.headers['set-cookie'] =
          proxyRes.headers['set-cookie'][0].split(';')[0]
      } catch {}
    },
  })(req, res)
}
