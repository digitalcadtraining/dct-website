const test = require("node:test");
const assert = require("node:assert/strict");
const {
  COUNTRIES,
  validateInternationalStudent,
} = require("../src/services/internationalStudent.service");

test("the admin selector supports 20 distinct non-Indian countries", () => {
  assert.equal(COUNTRIES.length, 20);
  assert.equal(new Set(COUNTRIES.map((country) => country.code)).size, 20);
  assert.ok(!COUNTRIES.some((country) => country.code === "IN"));
});

test("all configured IANA zones can be formatted", () => {
  for (const country of COUNTRIES) {
    for (const zone of country.time_zones) {
      assert.doesNotThrow(() =>
        new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date()));
    }
  }
});

test("legacy Indian registration is not changed", () => {
  assert.equal(validateInternationalStudent({
    student_type: "INDIAN", phone: "9876543210",
  }), null);
  assert.equal(validateInternationalStudent({ phone: "9876543210" }), null);
});

test("US and Canada do not share country identity even though both use +1", () => {
  const us = validateInternationalStudent({
    student_type: "FOREIGN", country_code: "US",
    time_zone: "America/New_York", phone: "2025550123",
  });
  const ca = validateInternationalStudent({
    student_type: "FOREIGN", country_code: "CA",
    time_zone: "America/Toronto", phone: "4165550123",
  });
  assert.equal(us.normalized_phone, "12025550123");
  assert.equal(ca.normalized_phone, "14165550123");
  assert.equal(us.country_code, "US");
  assert.equal(ca.country_code, "CA");
});

test("reject mismatched or missing foreign time zones", () => {
  assert.throws(() => validateInternationalStudent({
    student_type: "FOREIGN", country_code: "MX",
    time_zone: "Asia/Kolkata", phone: "5512345678",
  }), /time zone/);
  assert.throws(() => validateInternationalStudent({
    student_type: "FOREIGN", country_code: "XX",
    time_zone: "America/New_York", phone: "2025550123",
  }), /supported country/);
});

test("reject country prefix typed twice and overly long phone numbers", () => {
  assert.throws(() => validateInternationalStudent({
    student_type: "FOREIGN", country_code: "MY",
    time_zone: "Asia/Kuala_Lumpur", phone: "+60123456789",
  }), /local phone number/);
  assert.throws(() => validateInternationalStudent({
    student_type: "FOREIGN", country_code: "MY",
    time_zone: "Asia/Kuala_Lumpur", phone: "123456789012345",
  }), /valid international phone number/);
});

test("US daylight saving changes the local displayed time without fixed offsets", () => {
  const options = { timeZone: "America/New_York", hour: "numeric", hour12: false };
  const winter = new Intl.DateTimeFormat("en-US", options).format(new Date("2026-01-15T14:00:00Z"));
  const summer = new Intl.DateTimeFormat("en-US", options).format(new Date("2026-07-15T14:00:00Z"));
  assert.equal(Number(winter), 9);
  assert.equal(Number(summer), 10);
});
