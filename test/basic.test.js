'use strict';

const Test = require('tap').test;
const Pkg = require('../package.json');

Test('paclage version', (t) => {
  t.plan(1);
  t.is('0.9.0', Pkg.version);
});

Test('package name', (t) => {
  t.plan(1);
  t.is('hapi-postgress-pool', Pkg.name);
});