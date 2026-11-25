import Router from '@koa/router';

export const healthRouter = new Router({ prefix: '/health' });

healthRouter.get('/', (ctx) => {
  ctx.status = 200;
  ctx.body = { status: 'ok' };
});
