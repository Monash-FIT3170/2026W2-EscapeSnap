import { Meteor } from 'meteor/meteor';
import os from 'os';

function findLanAddress() {
  const interfaces = os.networkInterfaces();
  for (const ifaceList of Object.values(interfaces)) {
    for (const iface of ifaceList || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

Meteor.methods({
  // Lets the host lobby build a phone-reachable join URL even when the
  // host itself loaded the app via localhost.
  'network.getLanUrl'() {
    const address = findLanAddress();
    if (!address) return null;
    const port = process.env.PORT || 3000;
    return `http://${address}:${port}`;
  },
});
