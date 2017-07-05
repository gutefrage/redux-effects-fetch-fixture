import {chain, merge, toPairs, trim, startsWith} from 'lodash';

const isParam = segment => startsWith(segment, ':');
const toSegments = pathname => trim(pathname, '/').split('/');

/*
 * Builds a route object based on an array of segments. A route object is a
 * plain js object with the edge containing the route methods.
 *
 * @param segments The array of path segments (eg. ['path', ':id', 'action'])
 * @param methods Object containing the methods for the given path
 */
const buildRoute = (segments, methods) => {
  const [segment, ...remainingSegments] = segments;
  const isEdge = remainingSegments.length === 0;

  return {
    [segment]: merge(
      { $param: isParam(segment) },
      isEdge
        ? { $edge: isEdge, $methods: methods }
        : buildRoute(remainingSegments, methods)
    )
  };
};

const buildParams = (param, value) =>
  param ? { params: { [param.substr(1)]: value } } : {};

/*
 * Lookup tries to find a specific route given a route tree. It works by moving
 * up the tree one segment at a time, until it either finds an edge matching
 * the last path segment, or the path could no longer be resolved.
 *
 * @param segments List of path segments
 * @param routes The route tree, as produced by buildRouteTree
 * @returns The route methods or `undefined`
 */
const lookup = (segments, routes) => {
  const [segment, ...remainingSegments] = segments;
  const isLastSegment = remainingSegments.length === 0;
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
    lookup(remainingSegments, match),
    buildParams(param, segment)
  );
};

export const buildRouteTree = (routes) => {
  return merge(
    ...toPairs(routes)
      .map(([route, methods]) => buildRoute(toSegments(route), methods))
  );
};

export const lookupRoute = (pathname, routes) => {
  const segments = toSegments(pathname);
  return lookup(segments, routes);
};
