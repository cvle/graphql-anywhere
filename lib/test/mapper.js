"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var src_1 = require("../src");
var graphql_tag_1 = require("graphql-tag");
var react_1 = require("react");
var server_1 = require("react-dom/server");
describe('result mapper', function () {
    it('can deal with promises', function () {
        var resolver = function (_, root) {
            return new Promise(function (res) {
                setTimeout(function () {
                    Promise.resolve(root).then(function (val) { return res(val + 'fake'); });
                }, 10);
            });
        };
        function promiseForObject(object) {
            var keys = Object.keys(object);
            var valuesAndPromises = keys.map(function (name) { return object[name]; });
            return Promise.all(valuesAndPromises).then(function (values) { return values.reduce(function (resolvedObject, value, i) {
                resolvedObject[keys[i]] = value;
                return resolvedObject;
            }, Object.create(null)); });
        }
        var query = graphql_tag_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      {\n        a {\n          b\n          c\n        }\n      }\n    "], ["\n      {\n        a {\n          b\n          c\n        }\n      }\n    "])));
        var result = src_1.default(resolver, query, '', null, null, { resultMapper: promiseForObject });
        return result.then(function (value) {
            chai_1.assert.deepEqual(value, {
                a: {
                    b: 'fakefake',
                    c: 'fakefake',
                },
            });
        });
    });
    it('can construct React elements', function () {
        var resolver = function (fieldName, root, args) {
            if (fieldName === 'text') {
                return args.value;
            }
            return react_1.createElement(fieldName, args);
        };
        var reactMapper = function (childObj, root) {
            var reactChildren = Object.keys(childObj).map(function (key) { return childObj[key]; });
            if (root) {
                return react_1.cloneElement.apply(void 0, [root, root.props].concat(reactChildren));
            }
            return reactChildren[0];
        };
        function gqlToReact(document) {
            return src_1.default(resolver, document, '', null, null, { resultMapper: reactMapper });
        }
        var query = graphql_tag_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      {\n        div {\n          s1: span(id: \"my-id\") {\n            text(value: \"This is text\")\n          }\n          s2: span\n        }\n      }\n    "], ["\n      {\n        div {\n          s1: span(id: \"my-id\") {\n            text(value: \"This is text\")\n          }\n          s2: span\n        }\n      }\n    "])));
        chai_1.assert.equal(server_1.renderToStaticMarkup(gqlToReact(query)), '<div><span id="my-id">This is text</span><span></span></div>');
    });
});
var templateObject_1, templateObject_2;
//# sourceMappingURL=mapper.js.map