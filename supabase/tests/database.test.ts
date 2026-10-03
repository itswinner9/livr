import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { vector } from "@electric-sql/pglite-pgvector";
import { postgis } from "@electric-sql/pglite-postgis";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const ADMIN = "00000000-0000-4000-8000-000000000001";
const MODERATOR = "00000000-0000-4000-8000-000000000002";
const MANAGER = "00000000-0000-4000-8000-000000000003";
const RENTER1 = "00000000-0000-4000-8000-000000000011";
const RENTER2 = "00000000-0000-4000-8000-000000000012";
const RENTER4 = "00000000-0000-4000-8000-000000000014";
const P1 = "10000000-0000-4000-8000-000000000001";
const P2 = "10000000-0000-4000-8000-000000000002";
const P3 = "10000000-0000-4000-8000-000000000003";
const P4 = "10000000-0000-4000-8000-000000000004";
const P5 = "10000000-0000-4000-8000-000000000005";
const R1 = "20000000-0000-4000-8000-000000000001";
const R2 = "20000000-0000-4000-8000-000000000002";
const R4_PENDING = "20000000-0000-4000-8000-000000000004";

let db: PGlite;

type Role = "anon" | "authenticated" | "service_role";

async function as<T>(role: Role, sub: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`
    select set_config('request.jwt.claim.sub', '${sub ?? ""}', false);
    select set_config('request.jwt.claim.role', '${role}', false);
    set role ${role};
  `);
  try {
    return await fn();
  } finally {
    await db.exec(`
      reset role;
      select set_config('request.jwt.claim.sub', '', false);
      select set_config('request.jwt.claim.role', '', false);
    `);
  }
}

async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const res = await db.query<T>(sql, params);
  return res.rows[0];
}

beforeAll(async () => {
  db = await PGlite.create({ extensions: { vector, postgis, pg_trgm, pgcrypto } });
  await db.exec(read("tests/supabase-stub.sql"));
  await db.exec(read("migrations/20260926000000_livrank_init.sql"));
  await db.exec(read("migrations/20260926000100_advisor_hardening.sql"));
  await db.exec(read("migrations/20260926000200_find_or_create_property.sql"));
  await db.exec(read("migrations/20260926000300_contribution_lookups.sql"));
  await db.exec(read("migrations/20260926000400_property_units.sql"));
  await db.exec(read("migrations/20260926000500_review_hold_flags.sql"));
  await db.exec(read("migrations/20261001000000_review_replies.sql"));
  await db.exec(read("migrations/20261001233000_staff_profile_counts.sql"));
  await db.exec(read("migrations/20261003000000_daily_home.sql"));
  await db.exec(read("migrations/20261004000000_review_photos.sql"));
  await db.exec(read("seed.sql"));
}, 120_000);

describe("schema + seed", () => {
  it("creates profiles for new auth users with role 'user' by default", async () => {
    const r = await one<{ role: string }>("select role from profiles where id = $1", [RENTER1]);
    expect(r.role).toBe("user");
    const prefs = await one<{ n: number }>("select count(*)::int n from notification_preferences");
    expect(prefs.n).toBe(7);
  });

  it("maintains LivRank-calculated counters from published content only", async () => {
    const p = await one<{ review_count: number; rent_report_count: number; avg_overall_rating: string; has_manager: boolean }>(
      "select review_count, rent_report_count, avg_overall_rating, has_manager from properties where id = $1",
      [P1],
    );
    expect(p.review_count).toBe(3);
    expect(p.rent_report_count).toBe(5);
    expect(Number(p.avg_overall_rating)).toBeCloseTo(3.67, 2);
    expect(p.has_manager).toBe(true);
  });

  it("keeps proposed properties out of public views", async () => {
    const r = await as("anon", null, () =>
      one<{ n: number }>("select count(*)::int n from public_properties where id = $1", [P5]),
    );
    expect(r.n).toBe(0);
  });

  it("lets staff count every profile and blocks renters", async () => {
    const staff = await as("authenticated", ADMIN, () =>
      one<{ total: number; renters: number; managers: number; staff: number }>("select * from staff_profile_counts()"),
    );
    expect(staff.total).toBe(7);
    expect(staff.staff).toBe(2);
    expect(staff.managers).toBe(1);
    const renterView = await as("authenticated", RENTER1, () =>
      one<{ n: number }>("select count(*)::int n from profiles"),
    );
    expect(renterView.n).toBe(1);
  });
});

describe("anonymous access", () => {
  it("can read published reviews without user ids", async () => {
    const res = await as("anon", null, () => db.query("select * from public_reviews"));
    expect(res.rows.length).toBe(7);
    expect(Object.keys(res.rows[0] as object)).not.toContain("user_id");
    const named = res.rows.find((r) => (r as { id: string }).id === R2) as { author_display_name: string | null };
    expect(named.author_display_name).toBeNull();
  });

  it("cannot read base review or profile tables", async () => {
    await expect(as("anon", null, () => db.query("select * from reviews"))).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, () => db.query("select * from profiles"))).rejects.toThrow(/permission denied/);
  });

  it("cannot create reviews or rent reports", async () => {
    await expect(
      as("anon", null, () =>
        db.query(
          `insert into reviews (property_id, overall_rating, review_title, review_body, renter_status)
           values ($1, 5, 'Anon title', repeat('x', 60), 'former')`,
          [P1],
        ),
      ),
    ).rejects.toThrow();
    await expect(
      as("anon", null, () =>
        db.query(
          `insert into rent_reports (property_id, bedrooms, monthly_rent, renter_status) values ($1, 1, 1000, 'current')`,
          [P1],
        ),
      ),
    ).rejects.toThrow();
  });

  it("cannot call privileged functions", async () => {
    await expect(
      as("anon", null, () => db.query("select merge_properties($1, $2, null, 'x')", [P3, P2])),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as("authenticated", RENTER1, () => db.query("select check_rate_limit('k', 1, 60)")),
    ).rejects.toThrow(/permission denied/);
  });

  it("can search properties with normalized input", async () => {
    const res = await as("anon", null, () =>
      db.query<{ id: string }>("select id from search_properties('123 main street surrey')"),
    );
    expect(res.rows[0]?.id).toBe(P1);
    const byPostal = await as("anon", null, () =>
      db.query<{ id: string }>("select id from search_properties('v3t1a1')"),
    );
    expect(byPostal.rows[0]?.id).toBe(P1);
  });
});

describe("authenticated renters", () => {
  it("submissions are forced to pending and owned by the caller", async () => {
    const row = await as("authenticated", RENTER2, () =>
      one<{ status: string; user_id: string; is_demo: boolean }>(
        `insert into reviews (property_id, user_id, overall_rating, review_title, review_body, renter_status, status, is_demo)
         values ($1, $2, 5, 'Trying to self-publish', repeat('y', 80), 'former', 'published', true)
         returning status, user_id, is_demo`,
        [P3, RENTER2],
      ),
    );
    expect(row.status).toBe("pending");
    expect(row.user_id).toBe(RENTER2);
    expect(row.is_demo).toBe(false);
  });

  it("keeps server-attached hold reasons on insert", async () => {
    const row = await as("authenticated", RENTER2, () =>
      one<{ status: string; heuristic_flags: { reasons?: string[] } | null }>(
        `insert into reviews (property_id, user_id, overall_rating, review_title, review_body, renter_status, heuristic_flags)
         values ($1, $2, 4, 'Hold reason example', repeat('w', 80), 'former', '{"reasons":["email"]}'::jsonb)
         returning status, heuristic_flags`,
        [P5, RENTER2],
      ),
    );
    expect(row.status).toBe("pending");
    expect(row.heuristic_flags?.reasons).toEqual(["email"]);
  });

  it("cannot insert a review on behalf of someone else", async () => {
    const row = await as("authenticated", RENTER2, () =>
      one<{ user_id: string }>(
        `insert into reviews (property_id, user_id, overall_rating, review_title, review_body, renter_status)
         values ('10000000-0000-4000-8000-000000000004', $1, 5, 'Impersonation', repeat('z', 80), 'former')
         returning user_id`,
        [RENTER1],
      ),
    );
    expect(row.user_id).toBe(RENTER2);
  });

  it("cannot forge review revision history", async () => {
    await as("authenticated", RENTER2, () => db.query("select record_review_revision($1, 'forged')", [R1]));
    const rev = await one<{ n: number }>("select count(*)::int n from review_revisions where reason = 'forged'");
    expect(rev.n).toBe(0);
  });

  it("cannot modify another user's review or rent report", async () => {
    const res = await as("authenticated", RENTER2, () =>
      db.query("update reviews set review_title = 'hijacked' where id = $1", [R1]),
    );
    expect(res.affectedRows).toBe(0);
    const rr = await as("authenticated", RENTER2, () =>
      db.query("update rent_reports set monthly_rent = 1 where user_id = $1", [RENTER1]),
    );
    expect(rr.affectedRows).toBe(0);
  });

  it("cannot read another user's profile", async () => {
    const res = await as("authenticated", RENTER2, () =>
      db.query("select * from profiles where id = $1", [RENTER1]),
    );
    expect(res.rows.length).toBe(0);
  });

  it("cannot change their own role or subscription", async () => {
    await expect(
      as("authenticated", RENTER2, () => db.query("update profiles set role = 'admin' where id = $1", [RENTER2])),
    ).rejects.toThrow(/protected profile fields/);
    await expect(
      as("authenticated", RENTER2, () =>
        db.query("update profiles set subscription_status = 'premium' where id = $1", [RENTER2]),
      ),
    ).rejects.toThrow(/protected profile fields/);
    const ok = await as("authenticated", RENTER2, () =>
      db.query("update profiles set display_name = 'Renter Two' where id = $1", [RENTER2]),
    );
    expect(ok.affectedRows).toBe(1);
  });

  it("editing a published review sends it back to moderation with a revision", async () => {
    await as("authenticated", RENTER1, () =>
      db.query("update reviews set review_body = $2, status = 'published' where id = $1", [
        R1,
        "Updated text: I lived here for two years and maintenance usually took about two weeks for non-urgent repairs.",
      ]),
    );
    const r = await one<{ status: string }>("select status from reviews where id = $1", [R1]);
    expect(r.status).toBe("pending");
    const rev = await one<{ n: number }>("select count(*)::int n from review_revisions where review_id = $1", [R1]);
    expect(rev.n).toBe(1);
    const p = await one<{ review_count: number }>("select review_count from properties where id = $1", [P1]);
    expect(p.review_count).toBe(2);
    await db.query("update reviews set status = 'published' where id = $1", [R1]);
  });

  it("helpful votes update denormalized counts, one per user", async () => {
    await as("authenticated", RENTER4, () =>
      db.query("insert into review_votes (review_id, user_id, vote) values ($1, $2, 'helpful')", [R2, RENTER4]),
    );
    const r = await one<{ helpful_count: number }>("select helpful_count from reviews where id = $1", [R2]);
    expect(r.helpful_count).toBe(2);
    await expect(
      as("authenticated", RENTER4, () =>
        db.query("insert into review_votes (review_id, user_id, vote) values ($1, $2, 'helpful')", [R2, RENTER4]),
      ),
    ).rejects.toThrow();
  });

  it("cannot vote on or flag unpublished reviews", async () => {
    await expect(
      as("authenticated", RENTER2, () =>
        db.query("insert into review_votes (review_id, user_id, vote) values ($1, $2, 'helpful')", [R4_PENDING, RENTER2]),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("managers", () => {
  it("cannot modify renter reviews", async () => {
    const res = await as("authenticated", MANAGER, () =>
      db.query("update reviews set overall_rating = 5 where property_id = $1", [P1]),
    );
    expect(res.affectedRows).toBe(0);
    const del = await as("authenticated", MANAGER, () => db.query("delete from reviews where property_id = $1", [P1]));
    expect(del.affectedRows).toBe(0);
  });

  it("can respond (pending) only on approved claimed properties", async () => {
    const row = await as("authenticated", MANAGER, () =>
      one<{ status: string }>(
        `insert into management_responses (review_id, property_id, manager_user_id, response_body, status)
         values ($1, $2, $3, 'Thanks for sharing, we are looking into repair timelines.', 'published') returning status`,
        [R1, P1, MANAGER],
      ),
    );
    expect(row.status).toBe("pending");
    await expect(
      as("authenticated", MANAGER, () =>
        db.query(
          `insert into management_responses (review_id, property_id, manager_user_id, response_body)
           values ('20000000-0000-4000-8000-000000000005', $1, $2, 'Response on an unclaimed property.')`,
          [P2, MANAGER],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("moderators", () => {
  it("can approve pending reviews and counters update", async () => {
    const res = await as("authenticated", MODERATOR, () =>
      db.query("update reviews set status = 'published' where id = $1", [R4_PENDING]),
    );
    expect(res.affectedRows).toBe(1);
    const p = await one<{ review_count: number }>("select review_count from properties where id = $1", [P1]);
    expect(p.review_count).toBe(4);
    const r = await one<{ published_at: string | null }>("select published_at from reviews where id = $1", [R4_PENDING]);
    expect(r.published_at).not.toBeNull();
  });

  it("approving content on a proposed property makes it public", async () => {
    await db.query("update reviews set status = 'published' where property_id = $1", [P5]);
    const p = await one<{ status: string }>("select status from properties where id = $1", [P5]);
    expect(p.status).toBe("active");
  });

  it("regular users cannot read the audit log", async () => {
    const res = await as("authenticated", RENTER1, () => db.query("select * from audit_logs"));
    expect(res.rows.length).toBe(0);
    const admin = await as("authenticated", ADMIN, () => db.query("select * from audit_logs"));
    expect(admin.rows.length).toBeGreaterThan(0);
  });
});

describe("service functions", () => {
  it("rate limits per key", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await as("service_role", null, () =>
        one<{ ok: boolean }>("select check_rate_limit('test:key', 2, 60) as ok"),
      );
      results.push(r.ok);
    }
    expect(results).toEqual([true, true, false]);
  });

  it("merges duplicate properties without deleting renter content", async () => {
    const before = await one<{ n: number }>("select count(*)::int n from reviews where property_id in ($1, $2)", [P3, P2]);
    const moved = await as("service_role", null, () =>
      one<{ m: Record<string, number> }>("select merge_properties($1, $2, $3, 'duplicate') as m", [P3, P2, ADMIN]),
    );
    expect(moved.m.reviews).toBeGreaterThan(0);
    const after = await one<{ n: number }>("select count(*)::int n from reviews where property_id = $1", [P2]);
    expect(after.n).toBe(before.n);
    const src = await one<{ status: string; merged_into_id: string }>(
      "select status, merged_into_id from properties where id = $1",
      [P3],
    );
    expect(src.status).toBe("merged");
    expect(src.merged_into_id).toBe(P2);
    const redirect = await one<{ property_id: string }>(
      "select property_id from property_slug_redirects where slug = '2200-sample-road-burnaby-bc'",
    );
    expect(redirect.property_id).toBe(P2);
    const audit = await one<{ n: number }>("select count(*)::int n from audit_logs where action = 'property.merge'");
    expect(audit.n).toBe(1);
  });

  it("vector search only returns published reviews", async () => {
    const vec = `[${Array.from({ length: 1536 }, (_, i) => (i === 0 ? 1 : 0)).join(",")}]`;
    await db.query(
      "insert into review_embeddings (review_id, embedding, model_name, content_hash) values ($1, $2, 'test', 'h1'), ($3, $2, 'test', 'h2')",
      [R2, vec, "20000000-0000-4000-8000-000000000009"],
    );
    const res = await as("service_role", null, () =>
      db.query<{ review_id: string }>("select review_id from match_review_embeddings($1::vector, null, 5, 0)", [vec]),
    );
    expect(res.rows.map((r) => r.review_id)).toEqual([R2]);
  });
});

describe("find_or_create_property", () => {
  type Resolved = { id: string; slug: string; status: string; created: boolean };
  const call = (addr: {
    line1: string;
    city: string;
    normalized: string;
    slug: string;
    placeId?: string | null;
  }) =>
    `select * from find_or_create_property('${addr.line1}', null, '${addr.city}', 'BC', 'V5K 0A1',
      '${addr.normalized}', '${addr.city.toLowerCase()}', 'V5K0A1', '${addr.slug}', 49.28, -123.04,
      ${addr.placeId ? `'${addr.placeId}'` : "null"})`;
  const kingsway = {
    line1: "10 Kingsway",
    city: "Vancouver",
    normalized: "10 kingsway vancouver bc",
    slug: "10-kingsway-vancouver-bc",
    placeId: "mbx.kingsway.10",
  };

  it("rejects anonymous callers", async () => {
    await expect(as("anon", null, () => db.query(call(kingsway)))).rejects.toThrow();
  });

  it("creates a pending property that is not public", async () => {
    const r = await as("authenticated", RENTER1, () => one<Resolved>(call(kingsway)));
    expect(r.created).toBe(true);
    expect(r.status).toBe("pending");
    expect(r.slug).toBe(kingsway.slug);
    const row = await one<{ created_by: string; latitude: number; is_demo: boolean }>(
      "select created_by, latitude, is_demo from properties where id = $1",
      [r.id],
    );
    expect(row.created_by).toBe(RENTER1);
    expect(row.latitude).toBeCloseTo(49.28);
    expect(row.is_demo).toBe(false);
    const pub = await one<{ n: number }>("select count(*)::int n from public_properties where id = $1", [r.id]);
    expect(pub.n).toBe(0);
  });

  it("dedupes by normalized address and by provider place id for other users", async () => {
    const first = await one<{ id: string }>("select id from properties where normalized_address = $1", [
      kingsway.normalized,
    ]);
    const sameAddress = await as("authenticated", RENTER2, () => one<Resolved>(call({ ...kingsway, placeId: null })));
    expect(sameAddress.created).toBe(false);
    expect(sameAddress.id).toBe(first.id);
    const samePlace = await as("authenticated", RENTER2, () =>
      one<Resolved>(call({ ...kingsway, normalized: "10 kingsway vancouver british columbia" })),
    );
    expect(samePlace.id).toBe(first.id);
  });

  it("returns existing active properties unchanged", async () => {
    const r = await as("authenticated", RENTER2, () =>
      one<Resolved>(
        call({
          line1: "123 Main Street",
          city: "Surrey",
          normalized: "123 main street surrey bc",
          slug: "123-main-street-surrey-bc",
        }),
      ),
    );
    expect(r).toMatchObject({ id: P1, status: "active", created: false });
  });

  it("lets signed-in renters load a pending property for contribution, but not anonymous visitors", async () => {
    const r = await as("authenticated", RENTER2, () =>
      one<{ p: { status: string; slug: string } | null }>("select get_contribution_property($1) as p", [kingsway.slug]),
    );
    expect(r.p).toMatchObject({ status: "pending", slug: kingsway.slug });
    expect(r.p).not.toHaveProperty("created_by");
    await expect(
      as("anon", null, () => db.query("select get_contribution_property($1)", [kingsway.slug])),
    ).rejects.toThrow();
    const hidden = await as("authenticated", RENTER2, () =>
      one<{ p: unknown }>("select get_contribution_property($1) as p", [P3]),
    );
    expect(hidden.p).toBeNull();
  });

  it("looks up an address without exposing property details", async () => {
    const r = await as("anon", null, () =>
      one<{ id: string; status: string }>("select * from lookup_property_for_address($1, null)", [kingsway.normalized]),
    );
    expect(r.status).toBe("pending");
    expect(Object.keys(r).sort()).toEqual(["id", "slug", "status"]);
  });

  it("goes public once a review on it is approved", async () => {
    const prop = await one<{ id: string }>("select id from properties where normalized_address = $1", [
      kingsway.normalized,
    ]);
    const review = await as("authenticated", RENTER2, () =>
      one<{ id: string }>(
        `insert into reviews (property_id, user_id, overall_rating, review_title, review_body, renter_status)
         values ($1, $2, 4, 'Solid first review', $3, 'current') returning id`,
        [prop.id, RENTER2, "A detailed renter experience that is comfortably longer than fifty characters."],
      ),
    );
    await as("authenticated", MODERATOR, () =>
      db.query("update reviews set status = 'published' where id = $1", [review.id]),
    );
    const pub = await one<{ n: number }>("select count(*)::int n from public_properties where id = $1", [prop.id]);
    expect(pub.n).toBe(1);
  });
});

describe("property units", () => {
  const body = "A detailed renter experience that is comfortably longer than fifty characters.";
  const unitFor = (sub: string, property: string, label: string) =>
    as("authenticated", sub, () =>
      one<{ id: string }>("select find_or_create_unit($1, $2) as id", [property, label]),
    ).then((r) => r.id);

  it("normalizes labels and dedupes units per building", async () => {
    const a = await unitFor(RENTER4, P2, "Unit 12b");
    const b = await unitFor(RENTER1, P2, "#12B");
    const c = await unitFor(RENTER1, P2, "apt. 12 B");
    expect(b).toBe(a);
    expect(c).toBe(a);
    const row = await one<{ unit_key: string }>("select unit_key from property_units where id = $1", [a]);
    expect(row.unit_key).toBe("12B");
    const other = await unitFor(RENTER1, P1, "12B");
    expect(other).not.toBe(a);
  });

  it("rejects anonymous callers, junk labels, and unknown or merged buildings", async () => {
    await expect(as("anon", null, () => db.query("select find_or_create_unit($1, '1204')", [P1]))).rejects.toThrow();
    for (const bad of ["", "   ", "call me maybe", "12345678901", "-12", "12/4"]) {
      await expect(unitFor(RENTER1, P1, bad)).rejects.toThrow(/invalid unit/);
    }
    await expect(unitFor(RENTER1, P3, "101")).rejects.toThrow(/property not found/);
  });

  it("does not expose the units table directly", async () => {
    await expect(as("anon", null, () => db.query("select * from property_units"))).rejects.toThrow(/permission denied/);
    const r = await as("authenticated", RENTER1, () => db.query("select * from property_units"));
    expect(r.rows).toHaveLength(0);
  });

  it("shows units publicly only on former renters' reviews", async () => {
    const reviews = await as("anon", null, () =>
      db.query<{ id: string; unit_key: string | null }>("select id, unit_key from public_reviews where property_id = $1", [P1]),
    );
    const byId = Object.fromEntries(reviews.rows.map((r) => [r.id, r.unit_key]));
    expect(byId[R1]).toBe("1204");
    expect(byId[R2]).toBeNull();
    const units = await as("anon", null, () =>
      db.query<{ unit_key: string; review_count: number }>(
        "select unit_key, review_count from public_property_units where property_id = $1 order by unit_key",
        [P1],
      ),
    );
    expect(units.rows).toEqual([
      { unit_key: "1204", review_count: 1 },
      { unit_key: "807", review_count: 1 },
    ]);
  });

  it("keeps building stats counting every review", async () => {
    const p = await one<{ review_count: number; published: number; current: number }>(
      `select review_count,
              (select count(*)::int from reviews where property_id = $1 and status = 'published') as published,
              (select count(*)::int from reviews where property_id = $1 and status = 'published' and renter_status = 'current') as current
       from properties where id = $1`,
      [P1],
    );
    expect(p.current).toBeGreaterThan(0);
    expect(p.review_count).toBe(p.published);
  });

  it("rejects a unit from a different building", async () => {
    const p2Unit = await unitFor(RENTER4, P2, "900");
    await expect(
      as("authenticated", RENTER4, () =>
        db.query(
          `insert into reviews (property_id, user_id, unit_id, overall_rating, review_title, review_body, renter_status)
           values ($1, $2, $3, 3, 'Wrong building', $4, 'former')`,
          [P1, RENTER4, p2Unit, body],
        ),
      ),
    ).rejects.toThrow(/reviews_unit_same_property/);
  });

  it("allows one review per unit per renter, across different units", async () => {
    const u1 = await unitFor(RENTER4, P2, "301");
    const u2 = await unitFor(RENTER4, P2, "302");
    const insert = (unit: string) =>
      as("authenticated", RENTER4, () =>
        db.query(
          `insert into reviews (property_id, user_id, unit_id, overall_rating, review_title, review_body, renter_status)
           values ($1, $2, $3, 4, 'Unit review', $4, 'former')`,
          [P2, RENTER4, unit, body],
        ),
      );
    await insert(u1);
    await insert(u2);
    await expect(insert(u1)).rejects.toThrow(/duplicate key/);
  });

  it("carries units across when a review moves to another building", async () => {
    const source = await as("authenticated", RENTER4, () =>
      one<{ id: string }>(
        `select id from reviews where property_id = $1 and user_id = $2 and unit_id is not null limit 1`,
        [P2, RENTER4],
      ),
    );
    const before = await one<{ unit_key: string }>(
      "select u.unit_key from reviews r join property_units u on u.id = r.unit_id where r.id = $1",
      [source.id],
    );
    await db.query("update reviews set property_id = $1 where id = $2", [P1, source.id]);
    const after = await one<{ unit_key: string; property_id: string }>(
      "select u.unit_key, u.property_id from reviews r join property_units u on u.id = r.unit_id where r.id = $1",
      [source.id],
    );
    expect(after).toEqual({ unit_key: before.unit_key, property_id: P1 });
  });
});

describe("review replies", () => {
  const replyBody = "I lived here too and the hallway was quiet after ten most nights.";

  it("forces renter inserts to pending and ignores building stats", async () => {
    const before = await one<{ review_count: number; avg_overall_rating: string | null }>(
      "select review_count, avg_overall_rating from properties where id = $1",
      [P1],
    );
    const row = await as("authenticated", RENTER2, () =>
      one<{ status: string; user_id: string }>(
        `insert into review_replies (review_id, user_id, body, status)
         values ($1, $2, $3, 'published')
         returning status, user_id`,
        [R1, RENTER2, replyBody],
      ),
    );
    expect(row.status).toBe("pending");
    expect(row.user_id).toBe(RENTER2);
    await db.query("update review_replies set status = 'published' where review_id = $1 and user_id = $2", [
      R1,
      RENTER2,
    ]);
    const after = await one<{ review_count: number; avg_overall_rating: string | null }>(
      "select review_count, avg_overall_rating from properties where id = $1",
      [P1],
    );
    expect(after).toEqual(before);
  });

  it("keeps unpublished replies off the public view", async () => {
    await as("authenticated", RENTER2, () =>
      db.query(
        `insert into review_replies (review_id, user_id, body)
         values ($1, $2, $3)`,
        [R2, RENTER2, "This should stay in the queue until a moderator publishes it here."],
      ),
    );
    await db.query("update properties set is_demo = false where id = $1", [P1]);
    const pending = await as("anon", null, () =>
      db.query("select id from public_review_replies where review_id = $1", [R2]),
    );
    const live = await as("anon", null, () =>
      db.query<{ body: string }>("select body from public_review_replies where review_id = $1", [R1]),
    );
    await db.query("update properties set is_demo = true where id = $1", [P1]);
    expect(pending.rows.length).toBe(0);
    expect(live.rows[0]?.body).toBe(replyBody);
  });

  it("cannot reply to an unpublished review or read the base table as anon", async () => {
    const unpublished = await one<{ id: string }>(
      `insert into reviews (property_id, user_id, overall_rating, review_title, review_body, renter_status, status)
       values ($1, $2, 3, 'Unpublished reply parent', $3, 'former', 'pending')
       returning id`,
      [P4, RENTER4, "This pending review should not accept a public reply from another renter yet."],
    );
    await expect(
      as("authenticated", RENTER2, () =>
        db.query(
          `insert into review_replies (review_id, user_id, body)
           values ($1, $2, $3)`,
          [unpublished.id, RENTER2, "Trying to reply to a review that is still waiting on moderation."],
        ),
      ),
    ).rejects.toThrow();
    await expect(as("anon", null, () => db.query("select * from review_replies"))).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("daily home", () => {
  it("keeps notes, logs, and searches private to the owner", async () => {
    await as("authenticated", RENTER1, () =>
      db.query(
        `insert into saved_searches (user_id, city, province) values ($1, 'Surrey', 'BC')`,
        [RENTER1],
      ),
    );
    await as("authenticated", RENTER1, () =>
      db.query(
        `insert into home_notes (user_id, topic, body) values ($1, 'noise', 'Late elevator this week')`,
        [RENTER1],
      ),
    );
    const own = await as("authenticated", RENTER1, () =>
      one<{ n: number }>("select count(*)::int n from saved_searches"),
    );
    const other = await as("authenticated", RENTER2, () =>
      one<{ n: number }>("select count(*)::int n from saved_searches"),
    );
    const notes = await as("authenticated", RENTER2, () =>
      one<{ n: number }>("select count(*)::int n from home_notes"),
    );
    expect(own.n).toBe(1);
    expect(other.n).toBe(0);
    expect(notes.n).toBe(0);
    await expect(as("anon", null, () => db.query("select * from rent_logs"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("allows only one home building per renter", async () => {
    await as("authenticated", RENTER4, () =>
      db.query(`insert into saved_properties (user_id, property_id, is_home) values ($1, $2, true)`, [
        RENTER4,
        P3,
      ]),
    );
    await expect(
      as("authenticated", RENTER4, () =>
        db.query(`insert into saved_properties (user_id, property_id, is_home) values ($1, $2, true)`, [
          RENTER4,
          P4,
        ]),
      ),
    ).rejects.toThrow();
  });
});

describe("review photos", () => {
  const P_LIVE = "10000000-0000-4000-8000-000000000099";
  const R_LIVE = "20000000-0000-4000-8000-000000000099";
  const BODY = "Lived here for a year and took photos of the lobby, laundry, and a slow repair.";

  it("lets a renter attach photos to their own review only", async () => {
    await as("authenticated", RENTER1, () =>
      db.query(
        `insert into review_photos (review_id, user_id, storage_path, sort_order)
         values ($1, $2, $3, 0)`,
        [R1, RENTER1, `${RENTER1}/${R1}/lobby.jpg`],
      ),
    );
    const own = await as("authenticated", RENTER1, () =>
      one<{ n: number }>("select count(*)::int n from review_photos"),
    );
    const other = await as("authenticated", RENTER2, () =>
      one<{ n: number }>("select count(*)::int n from review_photos"),
    );
    expect(own.n).toBeGreaterThan(0);
    expect(other.n).toBe(0);
    await expect(
      as("authenticated", RENTER2, () =>
        db.query(
          `insert into review_photos (review_id, user_id, storage_path)
           values ($1, $2, $3)`,
          [R1, RENTER2, `${RENTER2}/${R1}/sneak.jpg`],
        ),
      ),
    ).rejects.toThrow(/own review|permission denied|row-level/i);
    await expect(as("anon", null, () => db.query("select * from review_photos"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("caps a review at four photos and hides unpublished ones", async () => {
    await db.query(
      `insert into properties (
         id, address_line_1, city, province, postal_code, property_type,
         normalized_address, normalized_city, normalized_postal_code, slug, status, is_demo
       ) values (
         $1, '900 Live Street', 'Surrey', 'BC', 'V3T 1A2', 'apartment',
         '900 live street surrey bc', 'surrey', 'V3T1A2', '900-live-street-surrey-bc', 'active', false
       )`,
      [P_LIVE],
    );
    await db.query(
      `insert into reviews (
         id, property_id, user_id, overall_rating, maintenance_rating, management_rating,
         noise_rating, cleanliness_rating, building_condition_rating, value_rating,
         review_title, review_body, renter_status, status, published_at
       ) values (
         $1, $2, $3, 4, 4, 4, 4, 4, 4, 4,
         'Photos of the building', $4, 'former', 'published', now()
       )`,
      [R_LIVE, P_LIVE, RENTER4, BODY],
    );
    for (let i = 0; i < 4; i += 1) {
      await as("authenticated", RENTER4, () =>
        db.query(
          `insert into review_photos (review_id, user_id, storage_path, sort_order)
           values ($1, $2, $3, $4)`,
          [R_LIVE, RENTER4, `${RENTER4}/${R_LIVE}/shot-${i}.jpg`, i],
        ),
      );
    }
    await expect(
      as("authenticated", RENTER4, () =>
        db.query(
          `insert into review_photos (review_id, user_id, storage_path, sort_order)
           values ($1, $2, $3, 4)`,
          [R_LIVE, RENTER4, `${RENTER4}/${R_LIVE}/shot-4.jpg`],
        ),
      ),
    ).rejects.toThrow(/at most 4/i);

    const published = await as("anon", null, () =>
      one<{ n: number }>("select count(*)::int n from public_review_photos where review_id = $1", [R_LIVE]),
    );
    expect(published.n).toBe(4);

    await as("authenticated", RENTER4, () =>
      db.query(
        `insert into review_photos (review_id, user_id, storage_path)
         values ($1, $2, $3)`,
        [R4_PENDING, RENTER4, `${RENTER4}/${R4_PENDING}/pending.jpg`],
      ),
    );
    const hidden = await as("anon", null, () =>
      one<{ n: number }>("select count(*)::int n from public_review_photos where review_id = $1", [
        R4_PENDING,
      ]),
    );
    expect(hidden.n).toBe(0);
  });
});
