import {
  PROJECT_MIN_TEXT_CHARS,
  PROJECT_MIN_TEXT_MESSAGE,
} from "./projectFormLimits";

/** Show error after clicking Next/Create, or immediately while typing if below the minimum character count. */
export function resolveProjectNewTextFieldError(
  value: string,
  schemaError: string | undefined,
  showSubmitErrors: boolean
): string | undefined {
  if (showSubmitErrors && schemaError) return schemaError;
  const len = value.trim().length;
  if (len > 0 && len < PROJECT_MIN_TEXT_CHARS) {
    return schemaError ?? PROJECT_MIN_TEXT_MESSAGE;
  }
  return undefined;
}

/** List-level error (e.g. no items added) — only shown after attempting to submit the step. */
export function resolveProjectNewListRootError(
  schemaError: string | undefined,
  showSubmitErrors: boolean
): string | undefined {
  if (!schemaError || !showSubmitErrors) return undefined;
  return schemaError;
}

export function resolveProjectNewListItemError(
  item: string,
  schemaError: string | undefined,
  showSubmitErrors: boolean
): string | undefined {
  return resolveProjectNewTextFieldError(item, schemaError, showSubmitErrors);
}
