'use strict';

const Test = require('tap').test;
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');
const Pkg = require('../package.json');

Test('Expose plugin',(t) => {
  const stub = {
    pg: {},
    pool: function (options) {}
  };

  const Plugin = Proxyquire('../', {
    'pg': stub.pg,
    'pg-pool': stub.pool
  });
  const Server = Hapi.Server;
  const server = new Server();
  server.connection({ port: 3000, host: 'localhost' });
  server.register({
    register: Plugin,
    options: {
      native: true,
      attach: 'onPreHandler',
      detach: 'stop',
      connections: [
        {
          user: 'postgres',
          password: 'postgres',
          port: 5432,
          host: 'localhost'
        },
        {
          user: 'postgres',
          password: 'postgres',
          port: 5433,
          host: 'localhost',
          key: 'worker-2'
        }
      ]
    }
  }, (err) => {
    t.is(err, undefined);
    t.type(server.plugins[Pkg.name], 'object', 'plugin is exposed');
    t.type(server.plugins[Pkg.name].pg, 'object', 'plugin exposed `pg` object');
    t.type(server.plugins[Pkg.name].pg['worker-2'], 'object', 'plugin exposed pool connection');
    t.ok(server.plugins[Pkg.name].pg['0'], 'set index as key when key is not passed');
    t.end();
  });
});

Test('safe get connection', (t) => {
  const stub = {
    pg: {},
    pool: function (options) {
      return { test: 'ok' };
    }
  };

  const Plugin = Proxyquire('../', {
    'pg': stub.pg,
    'pg-pool': stub.pool
  });
  const Server = Hapi.Server;
  const server = new Server();
  server.connection({ port: 3000, host: 'localhost' });
  server.register({
    register: Plugin,
    options: {
      native: true,
      default: 'worker-2',
      attach: 'onPreHandler',
      detach: 'stop',
      connections: [
        {
          key: 'worker-4',
          user: 'postgres',
          password: 'postgres',
          port: 5432,
          host: 'localhost'
        },
        {
          user: 'postgres',
          password: 'postgres',
          port: 5433,
          host: 'localhost',
          key: 'worker-2'
        }
      ]
    }
  }, (err) => {
    t.is(err, undefined);
    t.type(server.plugins[Pkg.name].pg._get('worker-4'), 'string', 'Should return worker-4');
    t.equal(server.plugins[Pkg.name].pg._get('worker-10'), 'worker-2');
    t.equal(server.plugins[Pkg.name].pg._get('worker-2'), 'worker-2');
    t.equal(server.plugins[Pkg.name].pg._get(0), 'worker-2');
    t.end();
  });
});