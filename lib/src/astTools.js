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
function getDefinitionName(definition) {
    switch (definition.kind) {
        case 'FragmentSpread':
            return definition.name.value;
        case 'Field':
            return "Field_" + (definition.alias ? definition.alias.value : definition.name.value);
        case 'InlineFragment':
            return "InlineFragment_" + definition.typeCondition.name.value;
        default:
            throw new Error("unknown definition kind " + definition.kind);
    }
}
function mergeDefinitions(a, b) {
    var name = getDefinitionName(a);
    if (!!a.selectionSet !== !!b.selectionSet) {
        throw Error("incompatible field definition for " + name);
    }
    if (!a.selectionSet) {
        return b;
    }
    var selectionSet = mergeSelectionSets(a.selectionSet, b.selectionSet);
    return __assign({}, b, { selectionSet: selectionSet });
}
exports.mergeDefinitions = mergeDefinitions;
function mergeSelectionSets(a, b) {
    var selectionsMap = a.selections.concat(b.selections).reduce(function (o, sel) {
        var selName = getDefinitionName(sel);
        if (!(selName in o)) {
            o[selName] = sel;
            return o;
        }
        o[selName] = mergeDefinitions(o[selName], sel);
        return o;
    }, {});
    var selections = Object.keys(selectionsMap).map(function (key) { return selectionsMap[key]; });
    return __assign({}, b, { selections: selections });
}
exports.mergeSelectionSets = mergeSelectionSets;
function getTransformedSelections(definition, gqlType, execContext) {
    var fragmentMap = execContext.fragmentMap, variables = execContext.variables;
    var selectionsMap = definition.selectionSet.selections.reduce(function (o, sel) {
        if (!directives_1.shouldInclude(sel, variables)) {
            return o;
        }
        if (sel.kind !== 'FragmentSpread') {
            var transformed = transformDefinition(sel, execContext);
            var name_1 = getDefinitionName(sel);
            if (name_1 in o) {
                o[name_1] = mergeDefinitions(o[name_1], transformed);
                return o;
            }
            o[name_1] = transformed;
            return o;
        }
        var fragment = fragmentMap[sel.name.value];
        if (!fragment) {
            throw new Error("fragment " + fragment.name.value + " does not exist");
        }
        var typeCondition = fragment.typeCondition.name.value;
        if (gqlType !== typeCondition) {
            var node = __assign({}, fragment, { kind: 'InlineFragment' });
            var transformed = transformDefinition(node, execContext);
            var name_2 = getDefinitionName(node);
            if (name_2 in o) {
                o[name_2] = mergeDefinitions(o[name_2], transformed);
                return o;
            }
            o[name_2] = transformed;
            return o;
        }
        var fragmentSelections = getTransformedSelections(fragmentMap[name], typeCondition, execContext);
        fragmentSelections.forEach(function (s) {
            if (!directives_1.shouldInclude(s, variables)) {
                return;
            }
            var selName = getDefinitionName(s);
            if (!(selName in o)) {
                o[selName] = s;
                return;
            }
            o[selName] = mergeDefinitions(o[selName], s);
        });
        return o;
    }, {});
    var selections = Object.keys(selectionsMap).map(function (key) { return selectionsMap[key]; });
    return selections;
}
function transformDefinition(definition, execContext) {
    if (!definition.selectionSet) {
        return definition;
    }
    return __assign({}, definition, { selectionSet: __assign({}, definition.selectionSet, { selections: getTransformedSelections(definition, execContext.rootValue.id, execContext) }) });
}
function resolveNamedFragmentsAndDirectives(document, options) {
    if (options === void 0) { options = {}; }
    var mainDefinition = getFromAST_1.getMainDefinition(document);
    var fragments = getFromAST_1.getFragmentDefinitions(document);
    var fragmentMap = getFromAST_1.createFragmentMap(fragments);
    var variables = options.variables || {};
    var rootValue = options.rootValue || {};
    var execContext = {
        fragmentMap: fragmentMap,
        variables: variables,
        rootValue: rootValue,
    };
    return {
        kind: 'Document',
        definitions: [transformDefinition(mainDefinition, execContext)],
    };
}
exports.resolveNamedFragmentsAndDirectives = resolveNamedFragmentsAndDirectives;
//# sourceMappingURL=astTools.js.map