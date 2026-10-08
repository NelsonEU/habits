/**
 * Removes the push notifications entitlement (aps-environment) that expo-notifications always adds.
 *
 * The app only uses local notifications (reminders scheduled on the phone), which don't need it,
 * and a free Apple account ("Personal Team") can't sign an app that has it.
 *
 * Must be listed BEFORE expo-notifications in app.json: file-generation steps ("mods") run in
 * reverse order of the plugin list, so listed before means its step runs after. Checked with
 * `npx expo config --type introspect`. Remove it if the app ever needs real push notifications.
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });
};
