import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTeamTag, teamIdentityText } from '../lib/team-identity.mjs';

test('canonical public club tags accept their optional display hash', () => {
  assert.equal(normalizeTeamTag(' #bany-12ab '), 'BANY-12AB');
  assert.equal(normalizeTeamTag('X-0001'), 'X-0001');
});
test('private codes, links and arbitrary labels never become team prefixes', () => {
  for (const value of [undefined, null, '', 'AUTO TAG', 'PRIVATE-INVITE-123456', 'https://example.test/#BANY-12AB', '##BANY-12AB', 'LONGER-1234', 'BANY-ZZZZ']) assert.equal(normalizeTeamTag(value), null);
});
test('identity labels add a public prefix without modifying the human nickname', () => {
  const nickname = 'नंदिनी “Six & Out”';
  assert.equal(teamIdentityText(nickname, '#BANY-12AB'), `#BANY-12AB ${nickname}`);
  assert.equal(teamIdentityText(nickname, 'PRIVATE-INVITE-123456'), nickname);
  assert.equal(teamIdentityText('#Existing name', null), '#Existing name');
});
