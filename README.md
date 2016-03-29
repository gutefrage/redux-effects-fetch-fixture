[![Build Status](https://travis-ci.org/team-boris/redux-effects-fetch-fixture.svg?branch=master)](https://travis-ci.org/team-boris/redux-effects-fetch-fixture)
[![NPM Version](https://img.shields.io/npm/v/redux-effects-fetch-fixture.svg?style=flat)](https://www.npmjs.com/package/redux-effects-fetch-fixture)

# redux-effects-fetch-fixture

This is an extension for [redux-effects-fetch][], which lets you define fixtures for your FETCH actions.
Now you are able to develope completely without any REST backend.

## Installation

```bash
npm install redux-effects-fetch-fixture
```

## Usage

This package is designed to be used in conjunction with [redux-effects][]. Install it like this:

```javascript
  import effects from 'redux-effects';
  import fetch from 'redux-effects-fetch';
  import fetchFixture from 'redux-effects-fetch-fixture';

  const fixtures = { /* your fixtures */ };
  const fetchMiddleware = isProduction ? fetch : fetchFixture(fixtures);
  applyMiddleware(effects, fetchMiddleware)(createStore);
```

## Define fixtures

The fixture definition is structured like this:

```javascript
'<path>': {
  '<HTTP-METHOD>': (body, [delegate]) => httpResponsePromise
```

The path-string acts as a key (no regex, no order), so make sure they are unique.

### response helpers

There are some response helpers to remove some boilerplate.

```javascript
import {responses} from 'redux-effects-fetch-fixture';

// empty 200 response
responses.ok();

// 200 response with body
responses.ok({ userId: 123});

// delayed 200 response
responses.okDelayed({})
```

The error helpers define a `message` and `kind` field in the response body. This will get more flexible in future
releases.

```javascript
import {responses} from 'redux-effects-fetch-fixture';

// rejected promise with Error(message)
responses.error('something went wrong');

// 500 response
responses.internalServerError;

// delayed 404 response
responses.notFound('user.notFound', 'The requested user was not found')

// delayed 401 response
responses.unauthorized('user.unauthorized', 'You are not allowed to access this page')
```

## Examples

A fixture could look like this

```javascript
import {responses} from 'redux-effects-fetch-fixture';

const fixture = {
  '/foo': {
    // this delegates to another fixture
    'GET': (body, delegate) => delegate('/test', 'GET', body)
  },
  // simple definition
  '/test': {
    'GET': () => responses.ok({found: true})
  },
  // define responses for different http methods
  'user/1': {
    'GET': () => responses.ok(),
    'POST': () => responses.ok({created: true})
    'DELETE': () => responses.unauthorized('user.unauthorized', 'not allowed to delete this user')
  },
  // simulate exceptions
  'user/2': {
    'GET': () => responses.internalServerError
  }
};
```

## Build

To build the library

```
npm run build
```

[redux-effects]: https://github.com/redux-effects/redux-effects
[redux-effects-fetch]: https://github.com/redux-effects/redux-effects-fetch
