import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "@/api/client";
import { adminApi } from "@/api/admin";
import { extractRoomFieldErrors } from "./AdminRoomForm";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const room = {
  capacity: 100,
  description: "Sala com poltronas reclináveis.",
  display_name: "Sala VIP Prime",
  experience_type: "vip",
  id: "room-1",
  name: "Sala 1",
};

const paginatedRooms = {
  count: 1,
  next: null,
  previous: null,
  results: [room],
};

const seatRow = {
  id: "row-a",
  name: "A",
  room: "room-1",
};

const paginatedRows = {
  count: 1,
  next: null,
  previous: null,
  results: [seatRow],
};

const seat = {
  companion_seat: null,
  id: "seat-a1",
  is_accessible: false,
  number: 1,
  row: "row-a",
};

const paginatedSeats = {
  count: 1,
  next: null,
  previous: null,
  results: [seat],
};

// ─── adminApi.listRooms ───────────────────────────────────────────────────────

test("adminApi.listRooms fetches the paginated room list", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/rooms/");
      return Response.json(paginatedRooms);
    };
    const response = await adminApi.listRooms();
    assert.equal(response.count, 1);
    assert.equal(response.results[0].name, "Sala 1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.listRooms builds search param", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      assert.equal(
        input,
        "http://localhost:8000/api/v1/catalog/rooms/?search=VIP"
      );
      return Response.json(paginatedRooms);
    };
    await adminApi.listRooms({ search: "VIP" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.getRoom ─────────────────────────────────────────────────────────

test("adminApi.getRoom fetches a single room by id", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/rooms/room-1/");
      return Response.json(room);
    };
    const result = await adminApi.getRoom("room-1");
    assert.equal(result.id, "room-1");
    assert.equal(result.capacity, 100);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.getRoom rejects unexpected response shape", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ id: "room-1" });
    await assert.rejects(
      adminApi.getRoom("room-1"),
      /Unexpected admin room detail response/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.createRoom ──────────────────────────────────────────────────────

test("adminApi.createRoom posts the room payload", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/catalog/rooms/");
      assert.equal(init?.method, "POST");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.name, "Sala 1");
      assert.equal(body.capacity, 100);
      return Response.json(room);
    };
    const created = await adminApi.createRoom({
      capacity: 100,
      experience_type: "vip",
      name: "Sala 1",
    });
    assert.equal(created.id, "room-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.updateRoom ──────────────────────────────────────────────────────

test("adminApi.updateRoom patches the room by id", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(
        input,
        "http://localhost:8000/api/v1/catalog/rooms/room-1/"
      );
      assert.equal(init?.method, "PATCH");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.display_name, "Nova VIP");
      return Response.json({ ...room, display_name: "Nova VIP" });
    };
    const updated = await adminApi.updateRoom("room-1", {
      display_name: "Nova VIP",
    });
    assert.equal(updated.display_name, "Nova VIP");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.deleteRoom ──────────────────────────────────────────────────────

test("adminApi.deleteRoom sends a DELETE request", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(
        input,
        "http://localhost:8000/api/v1/catalog/rooms/room-1/"
      );
      assert.equal(init?.method, "DELETE");
      return new Response(null, { status: 204 });
    };
    await adminApi.deleteRoom("room-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.listAllSeatRows ─────────────────────────────────────────────────

test("adminApi.listAllSeatRows fetches and filters rows by room", async () => {
  const originalFetch = globalThis.fetch;
  const otherRow = { id: "row-x", name: "X", room: "room-other" };
  try {
    globalThis.fetch = async () =>
      Response.json({
        ...paginatedRows,
        results: [seatRow, otherRow],
      });
    const rows = await adminApi.listAllSeatRows("room-1");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "row-a");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("adminApi.listAllSeatRows paginates through multiple pages", async () => {
  const originalFetch = globalThis.fetch;
  const rowB = { id: "row-b", name: "B", room: "room-1" };
  let callCount = 0;
  try {
    globalThis.fetch = async (input) => {
      callCount++;
      if (callCount === 1) {
        return Response.json({
          count: 2,
          next: "http://localhost:8000/api/v1/reservation/seat-rows/?page=2",
          previous: null,
          results: [seatRow],
        });
      }
      assert.match(String(input), /page=2/);
      return Response.json({
        count: 2,
        next: null,
        previous: null,
        results: [rowB],
      });
    };
    const rows = await adminApi.listAllSeatRows("room-1");
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, "A");
    assert.equal(rows[1].name, "B");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.createSeatRow ───────────────────────────────────────────────────

test("adminApi.createSeatRow posts the seat row payload", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(
        input,
        "http://localhost:8000/api/v1/reservation/seat-rows/"
      );
      assert.equal(init?.method, "POST");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.name, "A");
      assert.equal(body.room, "room-1");
      return Response.json(seatRow);
    };
    const created = await adminApi.createSeatRow({ name: "A", room: "room-1" });
    assert.equal(created.id, "row-a");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.deleteSeatRow ───────────────────────────────────────────────────

test("adminApi.deleteSeatRow sends a DELETE request", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(
        input,
        "http://localhost:8000/api/v1/reservation/seat-rows/row-a/"
      );
      assert.equal(init?.method, "DELETE");
      return new Response(null, { status: 204 });
    };
    await adminApi.deleteSeatRow("row-a");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.listAllSeats ────────────────────────────────────────────────────

test("adminApi.listAllSeats fetches all seats without filtering", async () => {
  const originalFetch = globalThis.fetch;
  const otherSeat = { companion_seat: null, id: "seat-x1", is_accessible: false, number: 1, row: "row-other" };
  try {
    globalThis.fetch = async () =>
      Response.json({
        ...paginatedSeats,
        results: [seat, otherSeat],
      });
    const seats = await adminApi.listAllSeats();
    assert.equal(seats.length, 2);
    assert.equal(seats[0].id, "seat-a1");
    assert.equal(seats[1].id, "seat-x1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.createSeat ─────────────────────────────────────────────────────

test("adminApi.createSeat posts the seat payload", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, "http://localhost:8000/api/v1/reservation/seats/");
      assert.equal(init?.method, "POST");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.row, "row-a");
      assert.equal(body.number, 1);
      assert.equal(body.is_accessible, false);
      return Response.json(seat);
    };
    const created = await adminApi.createSeat({
      is_accessible: false,
      number: 1,
      row: "row-a",
    });
    assert.equal(created.id, "seat-a1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.updateSeat ─────────────────────────────────────────────────────

test("adminApi.updateSeat patches the seat by id", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(
        input,
        "http://localhost:8000/api/v1/reservation/seats/seat-a1/"
      );
      assert.equal(init?.method, "PATCH");
      const body = JSON.parse(init?.body as string);
      assert.equal(body.is_accessible, true);
      return Response.json({ ...seat, is_accessible: true });
    };
    const updated = await adminApi.updateSeat("seat-a1", { is_accessible: true });
    assert.equal(updated.is_accessible, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── adminApi.deleteSeat ─────────────────────────────────────────────────────

test("adminApi.deleteSeat sends a DELETE request", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(
        input,
        "http://localhost:8000/api/v1/reservation/seats/seat-a1/"
      );
      assert.equal(init?.method, "DELETE");
      return new Response(null, { status: 204 });
    };
    await adminApi.deleteSeat("seat-a1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ─── extractRoomFieldErrors ───────────────────────────────────────────────────

test("extractRoomFieldErrors returns empty object for non-ApiError", () => {
  assert.deepEqual(extractRoomFieldErrors(new Error("network")), {});
  assert.deepEqual(extractRoomFieldErrors(null), {});
});

test("extractRoomFieldErrors returns empty for non-validation ApiError", () => {
  const error = new ApiError("Not found", 404, {
    code: "RESOURCE_NOT_FOUND",
    details: { name: ["Required."] },
  });
  assert.deepEqual(extractRoomFieldErrors(error), {});
});

test("extractRoomFieldErrors extracts field errors from VALIDATION_FAILED", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      capacity: ["Room capacity cannot be lower than the number of registered seats."],
      name: ["Este campo é obrigatório."],
    },
  });
  const result = extractRoomFieldErrors(error);
  assert.equal(result.name, "Este campo é obrigatório.");
  assert.match(
    result.capacity ?? "",
    /capacity/i
  );
});

test("extractRoomFieldErrors handles non_field_errors", () => {
  const error = new ApiError("Validation failed", 400, {
    code: "VALIDATION_FAILED",
    details: {
      non_field_errors: ["Room name must be unique."],
    },
  });
  assert.equal(
    extractRoomFieldErrors(error).non_field_errors,
    "Room name must be unique."
  );
});
