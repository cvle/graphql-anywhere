"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var getFromAST_1 = require("./getFromAST");
var directives_1 = require("./directives");
var storeUtils_1 = require("./storeUtils");
var astTools_1 = require("./astTools");
function graphql(resolver, document, rootValue, contextValue, variableValues, execOptions) {
    if (execOptions === void 0) { execOptions = {}; }
    var resultMapper = execOptions.resultMapper;
    var fragmentMatcher = execOptions.fragmentMatcher || (function () { return true; });
    var execContext = {
        contextValue: contextValue,
        variableValues: variableValues,
        resultMapper: resultMapper,
        resolver: resolver,
        fragmentMatcher: fragmentMatcher,
    };
    var resolved = astTools_1.resolveNamedFragmentsAndDirectives(document, {
        fragmentMatcher: function (idValue, typeCondition) {
            return fragmentMatcher(idValue, typeCondition, contextValue);
        },
        variables: variableValues,
        rootValue: rootValue,
    });
    var mainDefinition = getFromAST_1.getMainDefinition(resolved);
    return executeSelectionSet(mainDefinition.selectionSet, rootValue, execContext);
}
exports.graphql = graphql;
function executeSelectionSet(selectionSet, rootValue, execContext) {
    var contextValue = execContext.contextValue;
    var result = {};
    var inlineFragments = selectionSet.selections.filter(function (selection) { return storeUtils_1.isInlineFragment(selection); });
    if (inlineFragments.length) {
        var resolvedSelectionSet_1 = __assign({}, selectionSet, { selections: selectionSet.selections.filter(function (selection) { return !storeUtils_1.isInlineFragment(selection); }) });
        inlineFragments.forEach(function (fragment) {
            var typeCondition = fragment.typeCondition.name.value;
            if (execContext.fragmentMatcher(rootValue, typeCondition, contextValue)) {
                resolvedSelectionSet_1 = astTools_1.mergeSelectionSets(resolvedSelectionSet_1, fragment.selectionSet);
            }
        });
        return executeSelectionSet(resolvedSelectionSet_1, rootValue, execContext);
    }
    selectionSet.selections.forEach(function (selection) {
        if (storeUtils_1.isField(selection)) {
            var fieldResult = executeField(selection, rootValue, execContext);
            var resultFieldKey = storeUtils_1.resultKeyNameFromField(selection);
            if (fieldResult !== undefined) {
                if (resultFieldKey in result) {
                    throw new Error("unexpected error");
                }
                result[resultFieldKey] = fieldResult;
            }
        }
        else {
            throw new Error("unknown definition " + selection.kind);
        }
    });
    if (execContext.resultMapper) {
        return execContext.resultMapper(result, rootValue);
    }
    return result;
}
function executeField(field, rootValue, execContext) {
    var variables = execContext.variableValues, contextValue = execContext.contextValue, resolver = execContext.resolver;
    var fieldName = field.name.value;
    var args = storeUtils_1.argumentsObjectFromField(field, variables);
    var info = {
        isLeaf: !field.selectionSet,
        resultKey: storeUtils_1.resultKeyNameFromField(field),
        directives: directives_1.getDirectiveInfoFromField(field, variables),
    };
    var result = resolver(fieldName, rootValue, args, contextValue, info);
    if (!field.selectionSet) {
        return result;
    }
    if (result == null) {
        return result;
    }
    if (Array.isArray(result)) {
        return executeSubSelectedArray(field, result, execContext);
    }
    return executeSelectionSet(field.selectionSet, result, execContext);
}
function executeSubSelectedArray(field, result, execContext) {
    return result.map(function (item) {
        if (item === null) {
            return null;
        }
        if (Array.isArray(item)) {
            return executeSubSelectedArray(field, item, execContext);
        }
        return executeSelectionSet(field.selectionSet, item, execContext);
    });
}
//# sourceMappingURL=graphql.js.map