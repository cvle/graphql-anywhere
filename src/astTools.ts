import {
  getMainDefinition,
  getFragmentDefinitions,
  createFragmentMap,
  FragmentMap,
} from './getFromAST';

import {
  shouldInclude,
} from './directives';

function getDefinitionName(definition) {
  switch (definition.kind) {
  case 'FragmentSpread':
    return definition.name.value;
  case 'Field':
    return `Field_${definition.alias ? definition.alias.value : definition.name.value}`;
  case 'InlineFragment':
    return `InlineFragment_${definition.typeCondition.name.value}`;
  default:
    throw new Error(`unknown definition kind ${definition.kind}`);
  }
}

/**
 * Merge selections of 2 definitions.
 */
export function mergeDefinitions(a, b) {
  const name = getDefinitionName(a);

  if (!!a.selectionSet !== !!b.selectionSet) {
    throw Error(`incompatible field definition for ${name}`);
  }

  if (!a.selectionSet) {
    return b;
  }

  const selectionSet = mergeSelectionSets(a.selectionSet, b.selectionSet);

  return {
    ...b,
    selectionSet,
  };
}

/**
 * Merge selectionSets
 */
export function mergeSelectionSets(a, b) {
  const selectionsMap = [...a.selections, ...b.selections].reduce((o, sel) => {
    const selName = getDefinitionName(sel);
    if (!(selName in o)) {
      o[selName] = sel;
      return o;
    }
    o[selName] = mergeDefinitions(o[selName], sel);
    return o;
  }, {});

  const selections = Object.keys(selectionsMap).map((key) => selectionsMap[key]);

  return {
    ...b,
    selections,
  };
}

/**
 * Return selections with resolved named fragments and directives.
 */
function getTransformedSelections(definition, gqlType, execContext) {
  const {
    fragmentMap,
    variables,
  } = execContext;

  const selectionsMap = definition.selectionSet.selections.reduce((o, sel) => {
    if (!shouldInclude(sel, variables)) {
      // Skip this entirely
      return o;
    }
    if (sel.kind !== 'FragmentSpread') {
      const transformed = transformDefinition(sel, gqlType, execContext);
      const name = getDefinitionName(sel);

      // Merge existing value.
      if (name in o) {
        o[name] = mergeDefinitions(o[name], transformed);
        return o;
      }

      o[name] = transformed;
      return o;
    }

    const fragment = fragmentMap[sel.name.value];

    if (!fragment) {
      throw new Error(`fragment ${fragment.name.value} does not exist`);
    }

    const typeCondition = fragment.typeCondition.name.value;

    if (gqlType !== typeCondition) {
      const node = {
        ...fragment,
        kind: 'InlineFragment',
      };
      const transformed = transformDefinition(node, typeCondition, execContext);
      const name = getDefinitionName(node);

      // Merge existing value.
      if (name in o) {
        o[name] = mergeDefinitions(o[name], transformed);
        return o;
      }

      o[name] = transformed;
      return o;
    }

    const fragmentSelections = getTransformedSelections(fragment, typeCondition, execContext);
    fragmentSelections.forEach((s) => {

      if (!shouldInclude(s, variables)) {
        // Skip this entirely
        return;
     }

      const selName = getDefinitionName(s);
      if (!(selName in o)) {
        o[selName] = s;
        return;
      }

      o[selName] = mergeDefinitions(o[selName], s);
    });
    return o;
  }, {});

  const selections = Object.keys(selectionsMap).map((key) => selectionsMap[key]);
  return selections;
}

/**
 * Resolve named fragments and directives in a definition.
 */
function transformDefinition(definition, type, execContext) {
  if (!definition.selectionSet) {
    return definition;
  }
  return {
    ...definition,
    selectionSet: {
      ...definition.selectionSet,
      selections: getTransformedSelections(definition, type, execContext),
    },
  };
}

export function resolveNamedFragmentsAndDirectives(document: any, options: any = {}): any {
  const mainDefinition = getMainDefinition(document);
  const fragments = getFragmentDefinitions(document);
  const fragmentMap = createFragmentMap(fragments);
  const variables = options.variables || {};
  const rootValue = options.rootValue || {};

  const execContext = {
    fragmentMap,
    variables,
    rootValue,
  };

  return {
    kind: 'Document',
    definitions: [transformDefinition(mainDefinition, execContext.rootValue.id, execContext)],
  };
}
