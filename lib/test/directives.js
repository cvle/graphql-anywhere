"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var src_1 = require("../src");
var graphql_tag_1 = require("graphql-tag");
describe('directives', function () {
    it('skips a field that has the skip directive', function () {
        var resolver = function () { throw new Error('should not be called'); };
        var query = graphql_tag_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      {\n        a @skip(if: true)\n      }\n    "], ["\n      {\n        a @skip(if: true)\n      }\n    "])));
        var result = src_1.default(resolver, query);
        chai_1.assert.deepEqual(result, {});
    });
    it('includes info about arbitrary directives', function () {
        var resolver = function (fieldName, root, args, context, info) {
            var doSomethingDifferent = info.directives.doSomethingDifferent;
            var data = root[info.resultKey];
            if (doSomethingDifferent) {
                if (doSomethingDifferent.but === 'notTooCrazy') {
                    return data;
                }
                return undefined;
            }
            return data;
        };
        var input = {
            a: 'something',
            b: 'hidden',
        };
        var query = graphql_tag_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      {\n        a @doSomethingDifferent(but: notTooCrazy)\n        b @doSomethingDifferent(but: nope)\n      }\n    "], ["\n      {\n        a @doSomethingDifferent(but: notTooCrazy)\n        b @doSomethingDifferent(but: nope)\n      }\n    "])));
        var result = src_1.default(resolver, query, input);
        chai_1.assert.deepEqual(result, { a: 'something' });
    });
});
var templateObject_1, templateObject_2;
//# sourceMappingURL=directives.js.map