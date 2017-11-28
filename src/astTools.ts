import {
  getMainDefinition,
  getFragmentDefinitions,
  createFragmentMap,
  FragmentMap,
} from './getFromAST';

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
function mergeDefinitions(a, b) {
  const name = getDefinitionName(a);
  if (!!a.selectionSet !== !!b.selectionSet) {
    throw Error(`incompatible field definition for ${name}`);
  }
  if (!a.selectionSet) {
    return b;
  }

  const selectionsMap = [...a.selectionSet.selections, ...b.selectionSet.selections].reduce((o, sel) => {
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
    selectionSet: {
      ...b.selectionSet,
      selections,
    },
  };
}

/**
 * Return selections with resolved named fragments.
 */
function getTransformedSelections(definition, execContext) {
  const {
    fragmentMap,
    fragmentMatcher,
  } = execContext;

  const selectionsMap = definition.selectionSet.selections.reduce((o, sel) => {
    const name = getDefinitionName(sel);

    if (sel.kind !== 'FragmentSpread') {
      const transformed = transformDefinition(sel, execContext);

      // Merge existing value.
      if (name in o) {
        o[name] = mergeDefinitions(o[name], transformed);
        return o;
      }

      o[name] = transformed;
      return o;
    }

    const fragment = fragmentMap[name];

    if (!fragment) {
      throw new Error(`fragment ${name} does not exist`);
    }

    const typeCondition = fragment.typeCondition.name.value;

    if (!fragmentMatcher(definition, typeCondition)) {
      return o;
    }

    const fragmentSelections = getTransformedSelections(fragmentMap[name], execContext);
    fragmentSelections.forEach((s) => {
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
 * Resolve fragments in a definition.
 */
function transformDefinition(definition, execContext) {
  if (!definition.selectionSet) {
    return definition;
  }
  return {
    ...definition,
    selectionSet: {
      ...definition.selectionSet,
      selections: getTransformedSelections(definition, execContext),
    },
  };
}

export function resolveNamedFragments(document: any, options: any = {}): any {
  const mainDefinition = getMainDefinition(document);
  const fragments = getFragmentDefinitions(document);
  const fragmentMap = createFragmentMap(fragments);
  const fragmentMatcher = options.fragmentMatcher || (() => true);

  const execContext = {
    fragmentMap,
    fragmentMatcher,
  };

  return {
    kind: 'Document',
    definitions: [transformDefinition(mainDefinition, execContext)],
  };
}
