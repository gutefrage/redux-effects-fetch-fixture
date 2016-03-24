/**
 * Require all Specs
 */
var testsContext = require.context('.', true, /Spec$/);
testsContext.keys().forEach(testsContext);
