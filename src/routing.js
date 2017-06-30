import {chain, merge, toPairs, findKey, pickBy, trim} from 'lodash';

const isParam = segment => segment.substr(0, 1) === ':';
const toSegments = pathname => trim(pathname, '/').split('/');

const buildRoute = (segments, methods) => {
  const segment = segments.shift();
  const edge = segments.length === 0;

  return {
    [segment]: merge(
      { $param: isParam(segment) },
      edge
        ? { $edge: edge, $methods: methods }
        : buildRoute(segments, methods)
    )
  };
}

const buildParams = (param, value) =>
  param ? { params: { [param.substr(1)]: value } } : {};

const lookup = (segments, routes) => {
  const segment = segments.shift();
  const isLastSegment = segments.length === 0;
  const direct = routes[segment];

  const [param, match] =
    // check if we have a direct segment match and if we're in the last segment
    // and if so make sure that this as an edge
    direct && (isLastSegment ? direct.$edge : true)
    ? [null, direct]

    // if no explicit segment match is found, look for matching url params
    : chain(routes)
      .pickBy(route => route.$param)
      .toPairs()
      .head()
      .value()

    // if we don't find any route with a parameter at this segment, fail
    // by returning a falsy value for both param and match
    || [null, null];

  if (!match) {
    return;
  }

  if (isLastSegment) {
    if (match.$edge) {
      return merge(
        { methods: match.$methods },
        buildParams(param, segment)
      );
    }

    return;
  }

  return merge(
    lookup(segments, match),
    buildParams(param, segment)
  );
}

export const buildRouteTree = (routes) => {
  return merge.apply(null,
    toPairs(routes)
    .map(([route, methods]) => buildRoute(toSegments(route), methods))
  );
};

export const lookupRoute = (pathname, routes) => {
  const segments = toSegments(pathname);
  return lookup(segments, routes);
};
