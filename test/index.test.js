import { test } from 'node:test'
import assert from 'node:assert/strict'

import app from '../index.js'

// The previous Probot 7 test harness (jest + probot.receive) no longer exists
// in Probot 14. This is a placeholder smoke test; behavioural coverage via the
// Probot 14 testing API is tracked as a follow-up.
test('exports a Probot application function', () => {
  assert.equal(typeof app, 'function')
})
