import assert from 'node:assert/strict';
import { nextBillingDate, commercialToday } from '../src/lib/billing';
assert.equal(nextBillingDate(new Date('2026-01-31T12:00:00Z'),31).toISOString(),'2026-02-28T12:00:00.000Z');
assert.equal(nextBillingDate(new Date('2026-02-28T12:00:00Z'),31).toISOString(),'2026-03-31T12:00:00.000Z');
assert.equal(nextBillingDate(new Date('2028-01-31T12:00:00Z'),31).toISOString(),'2028-02-29T12:00:00.000Z');
assert.equal(commercialToday(new Date('2026-10-09T01:00:00Z')).toISOString(),'2026-10-08T12:00:00.000Z');
console.log('PASS month ends, leap year, billing anchor and São Paulo business date');
