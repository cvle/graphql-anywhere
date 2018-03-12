import {
  DocumentNode,
  SelectionSetNode,
  FieldNode,
  FragmentDefinitionNode,
  InlineFragmentNode,
} from 'graphql';

import {
  getMainDefinition,
  getFragmentDefinitions,
  createFragmentMap,
  FragmentMap,
} from './getFromAST';

import {
  DirectiveInfo,
  getDirectiveInfoFromField,
} from './directives';

import {
  isField,
  isInlineFragment,
  resultKeyNameFromField,
  argumentsObjectFromField,
} from './storeUtils';

export type Resolver = (
  fieldName: string,
  rootValue: any,
  args: any,
  context: any,
  info: ExecInfo,
) => any;

import {
  TransformDocumentOptions,
  transformDocument,
  mergeSelectionSets,
} from 'graphql-ast-tools';

export type VariableMap = { [name: string]: any };

export type ResultMapper = (values: { [fieldName: string]: any }, rootValue: any) => any;
export type FragmentMatcher = (rootValue: any, typeCondition: string, context: any) => boolean;

export type ExecContext = {
  contextValue: any;
  variableValues: VariableMap;
  resultMapper: ResultMapper;
  resolver: Resolver;
  fragmentMatcher: FragmentMatcher;
};

export type ExecInfo = {
  isLeaf: boolean;
  resultKey: string;
  directives: DirectiveInfo;
};

export type ExecOptions = {
  resultMapper?: ResultMapper;
  fragmentMatcher?: FragmentMatcher;
  includeAll?: boolean;
};

// Based on graphql function from graphql-js:
// graphql(
//   schema: GraphQLSchema,
//   requestString: string,
//   rootValue?: ?any,
//   contextValue?: ?any,
//   variableValues?: ?{[key: string]: any},
//   operationName?: ?string
// ): Promise<GraphQLResult>
export function graphql(
  resolver: Resolver,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: VariableMap,
  execOptions: ExecOptions = {},
  transformOptions: TransformDocumentOptions = {},
) {
  const resultMapper = execOptions.resultMapper;

  // Default matcher always matches all fragments
  const fragmentMatcher = execOptions.fragmentMatcher || (() => true);

  // If set ignore skip and if directives.
  const includeAll = !!execOptions.includeAll;

  // Default to {} when passing in falsy values.
  const variables = variableValues || {};

  const execContext: ExecContext = {
    contextValue,
    variableValues: variables,
    resultMapper,
    resolver,
    fragmentMatcher,
  };

  // Resolve named fragments
  const resolved = transformDocument(document, {
    ...transformOptions,
    // Passing variables will resolve @skip and @include directives.
    variables: includeAll ? undefined : variables,
  });

  const mainDefinition = getMainDefinition(resolved);

  return executeSelectionSet(
    mainDefinition.selectionSet,
    rootValue,
    execContext,
  );
}


function executeSelectionSet(
  selectionSet: SelectionSetNode,
  rootValue: any,
  execContext: ExecContext,
) {
  const {
    contextValue,
  } = execContext;

  const result = {};

  const inlineFragments = selectionSet.selections.filter((selection) => isInlineFragment(selection));
  if (inlineFragments.length) {
    let resolvedSelectionSet = {
      ...selectionSet,
      selections: selectionSet.selections.filter((selection) => !isInlineFragment(selection)),
    };
    inlineFragments.forEach((fragment: InlineFragmentNode) => {
      const typeCondition = fragment.typeCondition.name.value;

      if (execContext.fragmentMatcher(rootValue, typeCondition, contextValue)) {
        resolvedSelectionSet = mergeSelectionSets(resolvedSelectionSet, fragment.selectionSet);
      }
    });
    return executeSelectionSet(resolvedSelectionSet, rootValue, execContext);
  }

  selectionSet.selections.forEach((selection) => {
    if (isField(selection)) {
      const fieldResult = executeField(
        selection,
        rootValue,
        execContext,
      );

      const resultFieldKey = resultKeyNameFromField(selection);

      if (fieldResult !== undefined) {
        if (resultFieldKey in result) {
          // Should never happen if the ast preparation was correct.
          throw new Error(`unexpected error`);
        }
        result[resultFieldKey] = fieldResult;
      }
    } else {
      throw new Error(`unknown definition ${selection.kind}`);
    }
  });

  if (execContext.resultMapper) {
    return execContext.resultMapper(result, rootValue);
  }

  return result;
}

function executeField(
  field: FieldNode,
  rootValue: any,
  execContext: ExecContext,
): any {
  const {
    variableValues: variables,
    contextValue,
    resolver,
  } = execContext;

  const fieldName = field.name.value;
  const args = argumentsObjectFromField(field, variables);

  const info: ExecInfo = {
    isLeaf: !field.selectionSet,
    resultKey: resultKeyNameFromField(field),
    directives: getDirectiveInfoFromField(field, variables),
  };

  const result = resolver(fieldName, rootValue, args, contextValue, info);

  // Handle all scalar types here
  if (!field.selectionSet) {
    return result;
  }

  // From here down, the field has a selection set, which means it's trying to
  // query a GraphQLObjectType
  if (result == null) {
    // Basically any field in a GraphQL response can be null, or missing
    return result;
  }

  if (Array.isArray(result)) {
    return executeSubSelectedArray(field, result, execContext);
  }

  // Returned value is an object, and the query has a sub-selection. Recurse.
  return executeSelectionSet(
    field.selectionSet,
    result,
    execContext,
  );
}

function executeSubSelectedArray(
  field,
  result,
  execContext,
) {
  return result.map((item) => {
    // null value in array
    if (item === null) {
      return null;
    }

    // This is a nested array, recurse
    if (Array.isArray(item)) {
      return executeSubSelectedArray(field, item, execContext);
    }

    // This is an object, run the selection set on it
    return executeSelectionSet(
      field.selectionSet,
      item,
      execContext,
    );
  });
}
