"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var src_1 = require("../src");
var graphql_tag_1 = require("graphql-tag");
describe('fragment matcher', function () {
    it('does basic things', function () {
        var resolver = function (fieldName) { return fieldName; };
        var query = graphql_tag_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      {\n        a {\n          b\n          ...yesFrag\n          ...noFrag\n          ... on Yes {\n            e\n          }\n          ... on No {\n            f\n          }\n        }\n      }\n\n      fragment yesFrag on Yes {\n        c\n      }\n\n      fragment noFrag on No {\n        d\n      }\n    "], ["\n      {\n        a {\n          b\n          ...yesFrag\n          ...noFrag\n          ... on Yes {\n            e\n          }\n          ... on No {\n            f\n          }\n        }\n      }\n\n      fragment yesFrag on Yes {\n        c\n      }\n\n      fragment noFrag on No {\n        d\n      }\n    "])));
        var fragmentMatcher = function (_, typeCondition) { return typeCondition === 'Yes'; };
        var resultWithMatcher = src_1.default(resolver, query, '', null, null, { fragmentMatcher: fragmentMatcher });
        chai_1.assert.deepEqual(resultWithMatcher, {
            a: {
                b: 'b',
                c: 'c',
                e: 'e',
            },
        });
        var resultNoMatcher = src_1.default(resolver, query, '', null, null);
        chai_1.assert.deepEqual(resultNoMatcher, {
            a: {
                b: 'b',
                c: 'c',
                d: 'd',
                e: 'e',
                f: 'f',
            },
        });
    });
});
var templateObject_1;
//# sourceMappingURL=matcher.js.map