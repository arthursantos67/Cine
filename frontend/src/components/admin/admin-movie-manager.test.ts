import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "@/api/client";
import { extractFieldErrors } from "./AdminMovieForm";

// --- extractFieldErrors ---

test("extractFieldErrors returns empty object for non-ApiError", () => {
  assert.deepEqual(extractFieldErrors(new Error("network")), {});
  assert.deepEqual(extractFieldErrors("string error"), {});
  assert.deepEqual(extractFieldErrors(null), {});
});

test("extractFieldErrors returns empty object for ApiError with non-validation code", () => {
  const error = new ApiError("Not found", 404, {
    code: "RESOURCE_NOT_FOUND",
    details: { title: ["Required."] },
  });

  assert.deepEqual(extractFieldErrors(error), {});
});

test("extractFieldErrors extracts field-level messages from VALIDATION_FAILED error", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      title: ["Este campo é obrigatório."],
      duration_minutes: ["Informe um valor positivo."],
    },
  });

  assert.deepEqual(extractFieldErrors(error), {
    duration_minutes: "Informe um valor positivo.",
    title: "Este campo é obrigatório.",
  });
});

test("extractFieldErrors joins multiple messages for the same field", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      title: ["Muito curto.", "Caracteres inválidos."],
    },
  });

  const result = extractFieldErrors(error);

  assert.equal(result.title, "Muito curto. Caracteres inválidos.");
});

test("extractFieldErrors handles single string value (not array)", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      poster_url: "Informe uma URL válida.",
    },
  });

  assert.equal(extractFieldErrors(error).poster_url, "Informe uma URL válida.");
});

test("extractFieldErrors returns empty object when details is null", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: null,
  });

  assert.deepEqual(extractFieldErrors(error), {});
});

test("extractFieldErrors handles non_field_errors key", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      non_field_errors: ["Título e data de lançamento já existem."],
    },
  });

  assert.equal(
    extractFieldErrors(error).non_field_errors,
    "Título e data de lançamento já existem."
  );
});
