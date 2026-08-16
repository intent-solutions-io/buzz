import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { installMockBridge, TEST_IDENTITIES } from "../helpers/bridge";
import { seedActiveIdentity } from "../helpers/onboarding";

const INVITE_HOST = "invite-flow.example.com";
const INVITE_HTTP_URL = `https://${INVITE_HOST}`;
const INVITE_RELAY_URL = `wss://${INVITE_HOST}`;
const INVITE_CODE = "v2.playwright-manual-invite";
const INVITE_PAGE_URL = `${INVITE_HTTP_URL}/invite/${INVITE_CODE}`;
const CLAIM_URL = `${INVITE_HTTP_URL}/api/invites/claim`;
const ONBOARDING_STORAGE_KEY = "buzz-community-onboarding-transaction.v1";

type Nip98Event = {
  id: string;
  pubkey: string;
  kind: number;
  tags: string[][];
  sig: string;
};

type InviteDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
  responses: Array<{
    body: string;
    method: string;
    status: number;
    url: string;
  }>;
  pendingResponseReads: Array<Promise<void>>;
};

const diagnosticsByPage = new WeakMap<Page, InviteDiagnostics>();

// This spec exists to produce a replayable diagnostic artifact for the exact
// manual recovery path support gives users. Keep traces even when the test
// passes so a successful claim can be compared directly with a field failure.
test.use({ trace: "on" });

test.beforeEach(async ({ page }) => {
  const diagnostics: InviteDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    responses: [],
    pendingResponseReads: [],
  };
  diagnosticsByPage.set(page, diagnostics);

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.consoleErrors.push(
        `[${message.type()}] ${message.text()}`.slice(0, 1_000),
      );
    }
  });
  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(error.message.slice(0, 1_000));
  });
  page.on("requestfailed", (request) => {
    if (!request.url().includes(INVITE_HOST)) return;
    diagnostics.requestFailures.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "unknown failure"}`,
    );
  });
  page.on("response", (response) => {
    if (
      !response.url().includes("/api/join-policy") &&
      !response.url().includes("/api/invites/claim")
    ) {
      return;
    }
    const read = response
      .text()
      .then((body) => {
        diagnostics.responses.push({
          body: body.slice(0, 2_000),
          method: response.request().method(),
          status: response.status(),
          url: response.url(),
        });
      })
      .catch((error: unknown) => {
        diagnostics.responses.push({
          body: `response body unavailable: ${error instanceof Error ? error.message : String(error)}`,
          method: response.request().method(),
          status: response.status(),
          url: response.url(),
        });
      });
    diagnostics.pendingResponseReads.push(read);
  });

  // A real stored key is required here: claimInvite signs a NIP-98 event, and
  // the test asserts the resulting pubkey, payload hash, and signature shape.
  await seedActiveIdentity(page, TEST_IDENTITIES.tyler);
  await installMockBridge(page, { profileHasEvent: true });
});

test.afterEach(async ({ page }, testInfo: TestInfo) => {
  const diagnostics = diagnosticsByPage.get(page);
  if (!diagnostics) return;
  await Promise.allSettled(diagnostics.pendingResponseReads);

  const appState = await page
    .evaluate((storageKey) => {
      const communitiesRaw = window.localStorage.getItem("buzz-communities");
      return {
        activeCommunityId: window.localStorage.getItem(
          "buzz-active-community-id",
        ),
        communities: communitiesRaw ? JSON.parse(communitiesRaw) : null,
        onboardingTransaction: window.localStorage.getItem(storageKey),
      };
    }, ONBOARDING_STORAGE_KEY)
    .catch((error: unknown) => ({
      stateReadError: error instanceof Error ? error.message : String(error),
    }));

  const diagnosticsPath = testInfo.outputPath(
    "manual-invite-join-diagnostics.json",
  );
  await writeFile(
    diagnosticsPath,
    JSON.stringify(
      {
        appState,
        consoleErrors: diagnostics.consoleErrors,
        pageErrors: diagnostics.pageErrors,
        requestFailures: diagnostics.requestFailures,
        responses: diagnostics.responses,
      },
      null,
      2,
    ),
  );
  await testInfo.attach("manual-invite-join-diagnostics", {
    path: diagnosticsPath,
    contentType: "application/json",
  });
});

async function openManualInviteForm(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("sidebar-profile-avatar-button")).toBeVisible();
  await page.getByTestId("sidebar-profile-avatar-button").click();
  await page.getByTestId("community-switcher").click();
  await page.getByRole("menuitem", { name: "Add a community" }).click();
  await page.getByTestId("add-community-join").click();
  await expect(
    page.getByRole("heading", { name: "Join an existing community" }),
  ).toBeVisible();
}

async function enterInviteAndJoin(page: Page) {
  await page.getByLabel("Community URL or invite link").fill(INVITE_PAGE_URL);
  const joinButton = page.getByTestId("invite-redeem-submit");
  await expect(joinButton).toBeEnabled();
  await expect(joinButton).toHaveText("Join community");
  await joinButton.click();
}

function nip98Tag(event: Nip98Event, name: string) {
  return event.tags.find((tag) => tag[0] === name)?.[1];
}

test("manual Add community v2 invite claims membership and activates the relay", async ({
  page,
}) => {
  let claimRequest:
    | {
        authorizationEvent: Nip98Event;
        body: Record<string, unknown>;
        raw: string;
      }
    | undefined;

  await page.route(`${INVITE_HTTP_URL}/api/join-policy`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ policy: null }),
    });
  });
  await page.route(CLAIM_URL, async (route) => {
    const raw = route.request().postData() ?? "";
    const authorization = route.request().headers().authorization ?? "";
    const encodedEvent = authorization.replace(/^Nostr\s+/, "");
    claimRequest = {
      authorizationEvent: JSON.parse(
        Buffer.from(encodedEvent, "base64").toString("utf8"),
      ) as Nip98Event,
      body: JSON.parse(raw) as Record<string, unknown>,
      raw,
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "joined",
        community_id: "invite-flow-community",
        host: INVITE_HOST,
        role: "member",
      }),
    });
  });

  await openManualInviteForm(page);
  await enterInviteAndJoin(page);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("buzz-communities");
        const activeId = window.localStorage.getItem(
          "buzz-active-community-id",
        );
        const communities = raw
          ? (JSON.parse(raw) as Array<{ id?: string; relayUrl?: string }>)
          : [];
        return communities.find(({ id }) => id === activeId)?.relayUrl;
      }),
    )
    .toBe(INVITE_RELAY_URL);
  await expect
    .poll(() =>
      page.evaluate(
        (storageKey) => window.localStorage.getItem(storageKey),
        ONBOARDING_STORAGE_KEY,
      ),
    )
    .toBeNull();
  await expect(page.getByTestId("sidebar-profile-avatar-button")).toBeVisible();

  if (!claimRequest) throw new Error("Invite claim request was never observed");
  expect(claimRequest.body).toEqual({ code: INVITE_CODE });
  expect(claimRequest.authorizationEvent.kind).toBe(27_235);
  expect(claimRequest.authorizationEvent.pubkey).toBe(
    TEST_IDENTITIES.tyler.pubkey,
  );
  expect(claimRequest.authorizationEvent.id).toMatch(/^[0-9a-f]{64}$/);
  expect(claimRequest.authorizationEvent.sig).toMatch(/^[0-9a-f]{128}$/);
  expect(nip98Tag(claimRequest.authorizationEvent, "u")).toBe(CLAIM_URL);
  expect(nip98Tag(claimRequest.authorizationEvent, "method")).toBe("POST");
  expect(nip98Tag(claimRequest.authorizationEvent, "payload")).toBe(
    createHash("sha256").update(claimRequest.raw).digest("hex"),
  );
  expect(nip98Tag(claimRequest.authorizationEvent, "nonce")).toBeTruthy();
});

test("manual Add community v2 invite keeps the user on Retry when claim is rejected", async ({
  page,
}) => {
  let claimCalls = 0;
  await page.route(`${INVITE_HTTP_URL}/api/join-policy`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ policy: null }),
    });
  });
  await page.route(CLAIM_URL, async (route) => {
    claimCalls += 1;
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ error: "invite_invalid" }),
    });
  });

  await openManualInviteForm(page);
  await enterInviteAndJoin(page);

  await expect(
    page.getByRole("heading", { name: "Joining invite-flow" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "This invite is invalid. Check the link or ask for a new invite.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  expect(claimCalls).toBe(1);
  await expect
    .poll(() =>
      page.evaluate((storageKey) => {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;
        const transaction = JSON.parse(raw) as {
          error?: string;
          relayUrl?: string;
          stage?: string;
        };
        return {
          error: transaction.error,
          relayUrl: transaction.relayUrl,
          stage: transaction.stage,
        };
      }, ONBOARDING_STORAGE_KEY),
    )
    .toEqual({
      error: "This invite is invalid. Check the link or ask for a new invite.",
      relayUrl: INVITE_RELAY_URL,
      stage: "claiming",
    });
});
