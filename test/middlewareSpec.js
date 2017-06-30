/* global describe, it, expect */

import {fetch} from 'redux-effects-fetch';
import fetchLocal, { responses } from '../src/effectsFetchFixture';
import { buildRouteTree, lookupRoute } from '../src/routing';

describe('effects.fetchLocal', () => {
  describe('local fetch middleware', () => {

    // eval middleware functions that are irrelevant for this test
    const run = (fixture, action) => fetchLocal(fixture)()(() => {})(action);

    it('should throw an error if no fixture is defined', () => {
      const action = fetch('/test');
      expect(() => run({}, action)).toThrowError(/No fixture provided for url/);
    });

    it('should throw an error if no HTTP method is defined', () => {
      const action = fetch('/test');
      const fixture = {
        '/test': {}
      };
      expect(() => run(fixture, action)).toThrowError(/No fixture provided for \[GET\] method/);
    });

    it('should return the defined fixture', (done) => {
      const action = fetch('/test');
      const fixture = {
        '/test': {
          'GET': () => responses.ok({})
        }
      };

      run(fixture, action).then(result => {
        expect(result.status).toBe(200);
        expect(result.statusText).toBe('OK');
        expect(result.value).toEqual({});
        done();
      });
    });

    it('should return a fixture with an url parameter', (done) => {
      const action = fetch('/test/123');
      const fixture = {
        '/test/:id': {
          'GET': () => responses.ok({})
        }
      };

      run(fixture, action).then(result => {
        expect(result.status).toBe(200);
        expect(result.statusText).toBe('OK');
        expect(result.value).toEqual({});
        done();
      });
    });

    it('should prefer non-parameterized paths', (done) => {
      const action = fetch('/test/abc');
      const fixture = {
        '/test/:id': {
          'GET': () => responses.ok({})
        },

        '/test/abc': {
          'GET': () => responses.ok({ ok: true })
        }
      };

      run(fixture, action).then(result => {
        expect(result.status).toBe(200);
        expect(result.statusText).toBe('OK');
        expect(result.value).toEqual({ ok: true });
        done();
      });
    });

    it('should match the full path', (done) => {
      const action = fetch('/test/abc/action', { method: 'POST' });
      const fixture = {
        '/test/:id': {
          'GET': () => responses.ok({})
        },

        '/test/:id/action': {
          'POST': () => responses.ok({ ok: true })
        }
      };

      run(fixture, action).then(result => {
        expect(result.status).toBe(200);
        expect(result.statusText).toBe('OK');
        expect(result.value).toEqual({ ok: true });
        done();
      });
    });

    it('should pass the url parameters as the third argument to the handler function', (done) => {
      const action = fetch('/greet/axel/with/hello');
      const fixture = {
        '/greet/:name/with/:greeting': {
          'GET': (body, delegate, params) => responses.ok(params)
        }
      };

      run(fixture, action).then(result => {
        expect(result.status).toBe(200);
        expect(result.statusText).toBe('OK');
        expect(result.value).toEqual({ name: "axel", greeting: "hello" });
        done();
      });
    });

    it('should work for non-GET HTTP methods', (done) => {
      const action = fetch('/test', {method: 'POST', body: 'FOO'});
      const fixture = {
        '/test': {
          'POST': (body) => responses.ok({body})
        }
      };

      run(fixture, action).then(result => {
        expect(result.status).toBe(200);
        expect(result.statusText).toBe('OK');
        expect(result.value).toEqual({body: 'FOO'});
        done();
      });
    });

    it('should parse JSON bodies if a Content-Type header is set', (done) => {
      const action = fetch('/test', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: '{"key": "value"}'
      });
      const fixture = {
        '/test': {
          'POST': (body) => responses.ok({body})
        }
      };

      run(fixture, action).then(result => {
        expect(result.value).toEqual({body: {key: 'value'}});
        done();
      });
    });

    it('should not parse JSON bodies that are not strings', (done) => {
      const action = fetch('/test', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: {key: 'value'}
      });
      const fixture = {
        '/test': {
          'POST': (body) => responses.ok({body})
        }
      };

      run(fixture, action).then(result => {
        expect(result.value).toEqual({body: {key: 'value'}});
        done();
      });
    });

    it('should allow a fixture to delegate to another fixture', (done) => {
      const action = fetch('/foo');
      const fixture = {
        '/foo': {
          'GET': (body, delegate) => delegate('/test', 'GET', body)
        },
        '/test': {
          'GET': () => responses.ok({found: true})
        }
      };

      run(fixture, action).then(result => {
        expect(result.status).toBe(200);
        expect(result.statusText).toBe('OK');
        expect(result.value).toEqual({found: true});
        done();
      });
    });
  });

  describe('fetch response helpers: responses', () => {

    it('should return an ok response promise', (done) => {
      responses.ok({}).then(result => {
        expect(result.status).toBe(200);
        expect(result.statusText).toBe('OK');
        expect(result.value).toEqual({});
      }).then(done);
    });

    it('should return 401 response in reject promise', (done) => {
      responses.unauthorized('kind', 'message').catch(result => {
        expect(result.status).toBe(401);
        expect(result.statusText).toBe('Unauthorized');
        expect(result.value).toEqual({
          kind: 'kind',
          message: 'message'
        });
      }).then(done);
    });

    it('should return 404 response in reject promise', (done) => {
      responses.notFound('kind', 'message').catch(result => {
        expect(result.status).toBe(404);
        expect(result.statusText).toBe('Not Found');
        expect(result.value).toEqual({
          kind: 'kind',
          message: 'message'
        });
      }).then(done);
    });

    it('should return 500 response in reject promise', (done) => {
      responses.internalServerError.catch(result => {
        expect(result.status).toBe(500);
        expect(result.statusText).toBe('Internal Server Error');
      }).then(done);
    });

  });
});
