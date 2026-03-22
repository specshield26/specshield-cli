'use strict';

/**
 * Classify raw diffs into breaking changes, additions, modifications, warnings.
 */

const BREAKING_TYPES = new Set([
  'ENDPOINT_REMOVED',
  'METHOD_REMOVED',
  'PARAMETER_REMOVED',
  'PARAMETER_TYPE_CHANGED',
  'PARAMETER_BECAME_REQUIRED',
  'REQUEST_FIELD_REMOVED',
  'REQUEST_FIELD_TYPE_CHANGED',
  'REQUEST_REQUIRED_FIELD_ADDED',
  'RESPONSE_FIELD_REMOVED',
  'RESPONSE_FIELD_TYPE_CHANGED',
  'RESPONSE_REMOVED',
  'FIELD_BECAME_REQUIRED',
  'ENUM_VALUE_REMOVED',
  'REQUEST_TYPE_CHANGED',
  'RESPONSE_TYPE_CHANGED',
  'SCHEMA_REMOVED',
]);

const ADDITION_TYPES = new Set([
  'ENDPOINT_ADDED',
  'METHOD_ADDED',
  'PARAMETER_ADDED',
  'REQUEST_FIELD_ADDED',
  'RESPONSE_FIELD_ADDED',
  'RESPONSE_ADDED',
  'SCHEMA_ADDED',
]);

const MODIFICATION_TYPES = new Set([
  'FIELD_BECAME_OPTIONAL',
  'PARAMETER_BECAME_OPTIONAL',
]);

const WARNING_TYPES = new Set([
  // future use
]);

function classifyChanges(diffs) {
  const result = {
    breakingChanges: [],
    additions: [],
    modifications: [],
    warnings: [],
  };

  for (const diff of diffs) {
    const change = {
      type: diff.type,
      path: diff.path || null,
      method: diff.method || null,
      field: diff.field || null,
      oldValue: diff.oldValue || null,
      newValue: diff.newValue || null,
      description: diff.description,
    };

    if (BREAKING_TYPES.has(diff.type)) {
      result.breakingChanges.push(change);
    } else if (ADDITION_TYPES.has(diff.type)) {
      result.additions.push(change);
    } else if (MODIFICATION_TYPES.has(diff.type)) {
      result.modifications.push(change);
    } else if (WARNING_TYPES.has(diff.type)) {
      result.warnings.push(change);
    } else {
      // Unknown type — treat as modification
      result.modifications.push(change);
    }
  }

  return result;
}

module.exports = { classifyChanges };
