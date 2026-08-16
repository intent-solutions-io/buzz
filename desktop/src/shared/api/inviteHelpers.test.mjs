import assert from "node:assert/strict";
import test from "node:test";

import {
  inviteClaimErrorMessage,
  inviteErrorMessage,
  isInviteExhaustedError,
  isInviteExpiredError,
  relayHttpFromWs,
} from "./inviteHelpers.ts";

test("invite claim sentinels are translated into recovery guidance", () => {
  assert.equal(
    inviteClaimErrorMessage(new Error("invite_invalid")),
    "This invite is invalid. Check the link or ask for a new invite.",
  );
  assert.equal(
    inviteClaimErrorMessage(new Error("invite_expired")),
    "This invite code has expired — ask for a new one.",
  );
  assert.equal(
    inviteClaimErrorMessage(new Error("invite_exhausted")),
    "This invite has reached its use limit. Ask for a new invite.",
  );
  assert.equal(
    inviteClaimErrorMessage(new Error("join_policy_required")),
    "This invite approval has expired. Re-open the invite link to try again.",
  );
  assert.equal(
    inviteClaimErrorMessage(new Error("network unavailable")),
    "network unavailable",
  );
});

test("relayHttpFromWs maps secure and local relay schemes", () => {
  assert.equal(
    relayHttpFromWs("wss://relay.example/path"),
    "https://relay.example/path",
  );
  assert.equal(relayHttpFromWs("ws://localhost:7000"), "http://localhost:7000");
});

test("relayHttpFromWs rejects unexpected schemes", () => {
  assert.throws(
    () => relayHttpFromWs("https://relay.example"),
    /Expected ws:\/\/ or wss:\/\//,
  );
  assert.throws(
    () => relayHttpFromWs("relay.example"),
    /Expected ws:\/\/ or wss:\/\//,
  );
});

test("invite expiry sentinel is recognized without hiding other errors", () => {
  assert.equal(isInviteExpiredError(new Error("invite_expired")), true);
  assert.equal(isInviteExpiredError(new Error("invite_invalid")), false);
  assert.equal(
    inviteErrorMessage("network unavailable"),
    "network unavailable",
  );
});

test("invite exhaustion sentinel is recognized distinctly from expiry", () => {
  assert.equal(isInviteExhaustedError(new Error("invite_exhausted")), true);
  assert.equal(isInviteExhaustedError(new Error("invite_expired")), false);
  assert.equal(isInviteExhaustedError(new Error("invite_invalid")), false);
});
