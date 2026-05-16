import { HttpError } from "./httpError.mjs";

const HTML_MARKUP_PATTERN = /[<>]/;

export function assertNoHtmlMarkup(fields) {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (HTML_MARKUP_PATTERN.test(String(value ?? ""))) {
      throw new HttpError(400, `${fieldName} no puede contener etiquetas HTML.`);
    }
  }
}
