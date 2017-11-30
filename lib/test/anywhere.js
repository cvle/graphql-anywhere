"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var src_1 = require("../src");
var graphql_tag_1 = require("graphql-tag");
describe('graphql anywhere', function () {
    it('does basic things', function () {
        var resolver = function (_, root) { return root + 'fake'; };
        var query = graphql_tag_1.default(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      {\n        a {\n          b\n          ...frag\n        }\n      }\n\n      fragment frag on X {\n        c\n      }\n    "], ["\n      {\n        a {\n          b\n          ...frag\n        }\n      }\n\n      fragment frag on X {\n        c\n      }\n    "])));
        var result = src_1.default(resolver, query, '', null, null);
        chai_1.assert.deepEqual(result, {
            a: {
                b: 'fakefake',
                c: 'fakefake',
            },
        });
    });
    it('works with enum args', function () {
        var resolver = function (fieldName, root, args) { return args.value; };
        var query = graphql_tag_1.default(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      {\n        a(value: ENUM_VALUE)\n      }\n    "], ["\n      {\n        a(value: ENUM_VALUE)\n      }\n    "])));
        var result = src_1.default(resolver, query);
        chai_1.assert.deepEqual(result, {
            a: 'ENUM_VALUE',
        });
    });
    it('traverses arrays returned from the resolver', function () {
        var resolver = function () { return [1, 2]; };
        var query = graphql_tag_1.default(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      {\n        a {\n          b\n        }\n      }\n    "], ["\n      {\n        a {\n          b\n        }\n      }\n    "])));
        var result = src_1.default(resolver, query);
        chai_1.assert.deepEqual(result, {
            a: [
                {
                    b: [1, 2],
                },
                {
                    b: [1, 2],
                },
            ],
        });
    });
    it('can traverse an object', function () {
        var obj = {
            a: {
                b: 'fun',
                c: ['also fun', 'also fun 2'],
                d: 'not fun',
            },
        };
        var resolver = function (fieldName, root) { return root[fieldName]; };
        var query = graphql_tag_1.default(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      {\n        a {\n          b\n          c\n        }\n      }\n    "], ["\n      {\n        a {\n          b\n          c\n        }\n      }\n    "])));
        var result = src_1.default(resolver, query, obj, null, null);
        chai_1.assert.deepEqual(result, {
            a: {
                b: 'fun',
                c: ['also fun', 'also fun 2'],
            },
        });
    });
    it('can traverse nested arrays', function () {
        var obj = {
            a: [{
                    b: [
                        [{ c: 1 }, { c: 2 }],
                        [{ c: 3 }, { c: 4 }],
                    ],
                }],
        };
        var resolver = function (fieldName, root) { return root[fieldName]; };
        var query = graphql_tag_1.default(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n      {\n        a {\n          b {\n            c\n          }\n        }\n      }\n    "], ["\n      {\n        a {\n          b {\n            c\n          }\n        }\n      }\n    "])));
        var result = src_1.default(resolver, query, obj, null, null);
        chai_1.assert.deepEqual(result, {
            a: [{
                    b: [
                        [{ c: 1 }, { c: 2 }],
                        [{ c: 3 }, { c: 4 }],
                    ],
                }],
        });
    });
    it('can use arguments, both inline and variables', function () {
        var resolver = function (fieldName, _, args) { return args; };
        var query = graphql_tag_1.default(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n      {\n        inline(int: 5, float: 3.14, string: \"string\")\n        variables(int: $int, float: $float, string: $string)\n      }\n    "], ["\n      {\n        inline(int: 5, float: 3.14, string: \"string\")\n        variables(int: $int, float: $float, string: $string)\n      }\n    "])));
        var variables = {
            int: 6,
            float: 6.28,
            string: 'varString',
        };
        var result = src_1.default(resolver, query, null, null, variables);
        chai_1.assert.deepEqual(result, {
            inline: {
                int: 5,
                float: 3.14,
                string: 'string',
            },
            variables: {
                int: 6,
                float: 6.28,
                string: 'varString',
            },
        });
    });
    it('will tolerate missing variables', function () {
        var resolver = function (fieldName, _, args) { return args; };
        var query = graphql_tag_1.default(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n      {\n        variables(int: $int, float: $float, string: $string, missing: $missing)\n      }\n    "], ["\n      {\n        variables(int: $int, float: $float, string: $string, missing: $missing)\n      }\n    "])));
        var variables = {
            int: 6,
            float: 6.28,
            string: 'varString',
        };
        var result = src_1.default(resolver, query, null, null, variables);
        chai_1.assert.deepEqual(result, {
            variables: {
                int: 6,
                float: 6.28,
                string: 'varString',
                missing: undefined,
            },
        });
    });
    it('can use skip and include', function () {
        var resolver = function (fieldName) { return fieldName; };
        var query = graphql_tag_1.default(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n      {\n        a {\n          b @skip(if: true)\n          c @include(if: true)\n          d @skip(if: false)\n          e @include(if: false)\n        }\n      }\n    "], ["\n      {\n        a {\n          b @skip(if: true)\n          c @include(if: true)\n          d @skip(if: false)\n          e @include(if: false)\n        }\n      }\n    "])));
        var result = src_1.default(resolver, query, null, null, null);
        chai_1.assert.deepEqual(result, {
            a: {
                c: 'c',
                d: 'd',
            },
        });
    });
    it('can use inline and named fragments', function () {
        var resolver = function (fieldName) { return fieldName; };
        var query = graphql_tag_1.default(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n      {\n        a {\n          ... on Type {\n            b\n            c\n          }\n          ...deFrag\n        }\n      }\n\n      fragment deFrag on Type {\n        d\n        e\n      }\n    "], ["\n      {\n        a {\n          ... on Type {\n            b\n            c\n          }\n          ...deFrag\n        }\n      }\n\n      fragment deFrag on Type {\n        d\n        e\n      }\n    "])));
        var result = src_1.default(resolver, query, null, null, null);
        chai_1.assert.deepEqual(result, {
            a: {
                b: 'b',
                c: 'c',
                d: 'd',
                e: 'e',
            },
        });
    });
    it('can resolve deeply nested fragments', function () {
        var resolver = function (fieldName, root) {
            return root[fieldName];
        };
        var query = graphql_tag_1.default(templateObject_10 || (templateObject_10 = __makeTemplateObject(["\n      {\n        stringField,\n        numberField,\n        nullField,\n        ... on Item {\n          nestedObj {\n            stringField\n            nullField\n            deepNestedObj {\n              stringField\n              nullField\n            }\n          }\n        }\n        ... on Item {\n          nestedObj {\n            numberField\n            nullField\n            deepNestedObj {\n              numberField\n              nullField\n            }\n          }\n        }\n        ... on Item {\n          nullObject\n        }\n        nestedObj {\n          inlinedObjectStringField\n        }\n      }\n    "], ["\n      {\n        stringField,\n        numberField,\n        nullField,\n        ... on Item {\n          nestedObj {\n            stringField\n            nullField\n            deepNestedObj {\n              stringField\n              nullField\n            }\n          }\n        }\n        ... on Item {\n          nestedObj {\n            numberField\n            nullField\n            deepNestedObj {\n              numberField\n              nullField\n            }\n          }\n        }\n        ... on Item {\n          nullObject\n        }\n        nestedObj {\n          inlinedObjectStringField\n        }\n      }\n    "])));
        var result = {
            id: 'abcd',
            stringField: 'This is a string!',
            numberField: 5,
            nullField: null,
            nestedObj: {
                id: 'abcde',
                stringField: 'This is a string too!',
                numberField: 6,
                nullField: null,
                deepNestedObj: {
                    stringField: 'This is a deep string',
                    numberField: 7,
                    nullField: null,
                },
                inlinedObjectStringField: 'This is a string of an inlined object',
            },
            nullObject: null,
        };
        var queryResult = src_1.default(resolver, query, result);
        chai_1.assert.deepEqual(queryResult, {
            stringField: 'This is a string!',
            numberField: 5,
            nullField: null,
            nestedObj: {
                stringField: 'This is a string too!',
                numberField: 6,
                nullField: null,
                deepNestedObj: {
                    stringField: 'This is a deep string',
                    numberField: 7,
                    nullField: null,
                },
                inlinedObjectStringField: 'This is a string of an inlined object',
            },
            nullObject: null,
        });
    });
    it('can resolve deeply nested fragments with arrays', function () {
        var resolver = function (fieldName, root) {
            return root[fieldName];
        };
        var query = graphql_tag_1.default(templateObject_11 || (templateObject_11 = __makeTemplateObject(["\n      {\n        ...on Item {\n          array { id field1 }\n        }\n        ...on Item {\n          array { id field2 }\n        }\n        ...on Item {\n          array { id field3 }\n        }\n      }\n    "], ["\n      {\n        ...on Item {\n          array { id field1 }\n        }\n        ...on Item {\n          array { id field2 }\n        }\n        ...on Item {\n          array { id field3 }\n        }\n      }\n    "])));
        var result = {
            array: [{
                    id: 'abcde',
                    field1: 1,
                    field2: 2,
                    field3: 3,
                }],
        };
        var queryResult = src_1.default(resolver, query, result);
        chai_1.assert.deepEqual(queryResult, {
            array: [{
                    id: 'abcde',
                    field1: 1,
                    field2: 2,
                    field3: 3,
                }],
        });
    });
    it('readme example', function () {
        var gitHubAPIResponse = {
            'url': 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
            'title': 'Found a bug',
            'body': 'I\'m having a problem with this.',
            'user': {
                'login': 'octocat',
                'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
                'url': 'https://api.github.com/users/octocat',
            },
            'labels': [
                {
                    'url': 'https://api.github.com/repos/octocat/Hello-World/labels/bug',
                    'name': 'bug',
                    'color': 'f29513',
                },
            ],
        };
        var query = graphql_tag_1.default(templateObject_12 || (templateObject_12 = __makeTemplateObject(["\n      {\n        title\n        user {\n          login\n        }\n        labels {\n          name\n        }\n      }\n    "], ["\n      {\n        title\n        user {\n          login\n        }\n        labels {\n          name\n        }\n      }\n    "])));
        var resolver = function (fieldName, root) { return root[fieldName]; };
        var result = src_1.default(resolver, query, gitHubAPIResponse);
        chai_1.assert.deepEqual(result, {
            'title': 'Found a bug',
            'user': {
                'login': 'octocat',
            },
            'labels': [
                {
                    'name': 'bug',
                },
            ],
        });
    });
    it('readme example 2', function () {
        var query = graphql_tag_1.default(templateObject_13 || (templateObject_13 = __makeTemplateObject(["\n      {\n        author {\n          name: string\n          age: int\n          address {\n            state: string\n          }\n        }\n      }\n    "], ["\n      {\n        author {\n          name: string\n          age: int\n          address {\n            state: string\n          }\n        }\n      }\n    "])));
        var resolver = function (fieldName) { return ({
            string: 'This is a string',
            int: 5,
        }[fieldName] || 'continue'); };
        var result = src_1.default(resolver, query);
        chai_1.assert.deepEqual(result, {
            author: {
                name: 'This is a string',
                age: 5,
                address: {
                    state: 'This is a string',
                },
            },
        });
    });
    it('read from Redux normalized store', function () {
        var data = {
            result: [1, 2],
            entities: {
                articles: {
                    1: { id: 1, title: 'Some Article', author: 1 },
                    2: { id: 2, title: 'Other Article', author: 1 },
                },
                users: {
                    1: { id: 1, name: 'Dan' },
                },
            },
        };
        var query = graphql_tag_1.default(templateObject_14 || (templateObject_14 = __makeTemplateObject(["\n      {\n        result {\n          title\n          author {\n            name\n          }\n        }\n      }\n    "], ["\n      {\n        result {\n          title\n          author {\n            name\n          }\n        }\n      }\n    "])));
        var schema = {
            articles: {
                author: 'users',
            },
        };
        var resolver = function (fieldName, rootValue, args, context) {
            if (!rootValue) {
                return context.result.map(function (id) {
                    return __assign({}, context.entities.articles[id], { __typename: 'articles' });
                });
            }
            var typename = rootValue.__typename;
            if (typename && schema[typename] && schema[typename][fieldName]) {
                var targetType = schema[typename][fieldName];
                return __assign({}, context.entities[targetType][rootValue[fieldName]], { __typename: targetType });
            }
            return rootValue[fieldName];
        };
        var result = src_1.default(resolver, query, null, data);
        chai_1.assert.deepEqual(result, {
            result: [
                {
                    title: 'Some Article',
                    author: {
                        name: 'Dan',
                    },
                },
                {
                    title: 'Other Article',
                    author: {
                        name: 'Dan',
                    },
                },
            ],
        });
    });
    it('passes info including isLeaf, resultKey and directives', function () {
        var leafMap = {};
        var resolver = function (fieldName, root, args, context, info) {
            leafMap[fieldName] = info;
            return 'continue';
        };
        var query = graphql_tag_1.default(templateObject_15 || (templateObject_15 = __makeTemplateObject(["\n      {\n        alias: a {\n          b\n          hasDirective @skip(if: false) @otherDirective(arg: $x)\n        }\n      }\n    "], ["\n      {\n        alias: a {\n          b\n          hasDirective @skip(if: false) @otherDirective(arg: $x)\n        }\n      }\n    "])));
        src_1.default(resolver, query, null, null, { x: 'argument' });
        chai_1.assert.deepEqual(leafMap, {
            a: {
                directives: null,
                isLeaf: false,
                resultKey: 'alias',
            },
            b: {
                directives: null,
                isLeaf: true,
                resultKey: 'b',
            },
            hasDirective: {
                directives: {
                    skip: { if: false },
                    otherDirective: { arg: 'argument' },
                },
                isLeaf: true,
                resultKey: 'hasDirective',
            },
        });
    });
    it('can filter GraphQL results', function () {
        var data = {
            alias: 'Bob',
            name: 'Wrong',
            height: 1.89,
            avatar: {
                square: 'abc',
                circle: 'def',
                triangle: 'qwe',
            },
        };
        var fragment = graphql_tag_1.default(templateObject_16 || (templateObject_16 = __makeTemplateObject(["\n      fragment PersonDetails on Person {\n        alias: name\n        height(unit: METERS)\n        avatar {\n          square\n          ... on Avatar {\n            circle\n          }\n        }\n      }\n    "], ["\n      fragment PersonDetails on Person {\n        alias: name\n        height(unit: METERS)\n        avatar {\n          square\n          ... on Avatar {\n            circle\n          }\n        }\n      }\n    "])));
        var resolver = function (fieldName, root, args, context, info) {
            return root[info.resultKey];
        };
        var filtered = src_1.default(resolver, fragment, data);
        chai_1.assert.deepEqual(filtered, {
            alias: 'Bob',
            height: 1.89,
            avatar: {
                square: 'abc',
                circle: 'def',
            },
        });
    });
    it('can handle mutations', function () {
        var resolver = function (fieldName, root, args) {
            if (fieldName === 'operateOnNumbers') {
                return args;
            }
            else if (fieldName === 'add') {
                return root.a + root.b;
            }
            else if (fieldName === 'subtract') {
                return root.a - root.b;
            }
            else if (fieldName === 'multiply') {
                return root.a * root.b;
            }
            else if (fieldName === 'divide') {
                return root.a / root.b;
            }
        };
        var query = graphql_tag_1.default(templateObject_17 || (templateObject_17 = __makeTemplateObject(["\n      mutation {\n        operateOnNumbers(a: 10, b: 2) {\n          add\n          subtract\n          multiply\n          divide\n        }\n      }\n    "], ["\n      mutation {\n        operateOnNumbers(a: 10, b: 2) {\n          add\n          subtract\n          multiply\n          divide\n        }\n      }\n    "])));
        var result = src_1.default(resolver, query, '', null, null);
        chai_1.assert.deepEqual(result, {
            operateOnNumbers: {
                add: 12,
                subtract: 8,
                multiply: 20,
                divide: 5,
            },
        });
    });
    it('can handle subscriptions', function () {
        var data = {
            user: {
                id: 1,
                name: 'Some User',
                height: 1.89,
            },
        };
        var resolver = function (fieldName, root) { return root[fieldName]; };
        var query = graphql_tag_1.default(templateObject_18 || (templateObject_18 = __makeTemplateObject(["\n      subscription {\n        user {\n          id\n          name\n          height\n        }\n      }\n    "], ["\n      subscription {\n        user {\n          id\n          name\n          height\n        }\n      }\n    "])));
        var result = src_1.default(resolver, query, data);
        chai_1.assert.deepEqual(result, {
            user: {
                id: 1,
                name: 'Some User',
                height: 1.89,
            },
        });
    });
    it('can handle documents with multiple fragments', function () {
        var data = {
            user: {
                id: 1,
                name: 'Some User',
                height: 1.89,
            },
        };
        var resolver = function (fieldName, root) { return root[fieldName]; };
        var query = graphql_tag_1.default(templateObject_19 || (templateObject_19 = __makeTemplateObject(["\n      fragment A on User {\n        name\n      }\n\n      fragment B on User {\n        height\n      }\n\n      query {\n        user {\n          id\n          ...A\n          ...B\n        }\n      }\n    "], ["\n      fragment A on User {\n        name\n      }\n\n      fragment B on User {\n        height\n      }\n\n      query {\n        user {\n          id\n          ...A\n          ...B\n        }\n      }\n    "])));
        var result = src_1.default(resolver, query, data);
        chai_1.assert.deepEqual(result, {
            user: {
                id: 1,
                name: 'Some User',
                height: 1.89,
            },
        });
    });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19;
//# sourceMappingURL=anywhere.js.map