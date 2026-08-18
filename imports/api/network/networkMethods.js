import { Meteor } from 'meteor/meteor';
import dgram from 'dgram';
import os from 'os';

// Ask the OS which local address it would use to reach the outside world.
// This follows the routing table, so it picks the real Wi-Fi/Ethernet adapter
// rather than a VirtualBox/VMware/WSL virtual one, which os.networkInterfaces()
// often enumerates first. No packets are sent — connect() on a UDP socket only
// fixes the local end of the route.
function findRoutedAddress() {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    let settled = false;

    const finish = (address) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // already closed
      }
      resolve(address);
    };

    const timer = setTimeout(() => finish(null), 1000);

    socket.once('error', () => finish(null));

    try {
      socket.connect(80, '8.8.8.8', () => finish(socket.address().address));
    } catch {
      finish(null);
    }
  });
}

// Fallback for hosts with no route out (offline demo on an isolated network):
// first non-internal IPv4, skipping adapters that are known to be virtual.
const VIRTUAL_ADAPTER =
  /virtualbox|vmware|vmnet|vethernet|hyper-v|loopback|docker|tailscale|zerotier|tunnel|vpn/i;

function findLanAddress() {
  const entries = Object.entries(os.networkInterfaces());
  const candidates = [];

  for (const [name, ifaceList] of entries) {
    for (const iface of ifaceList || []) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      candidates.push({ name, address: iface.address });
    }
  }

  const physical = candidates.find(({ name }) => !VIRTUAL_ADAPTER.test(name));
  return (physical || candidates[0])?.address ?? null;
}

Meteor.methods({
  // Lets the host lobby build a phone-reachable join URL even when the
  // host itself loaded the app via localhost.
  async 'network.getLanUrl'() {
    const address = (await findRoutedAddress()) || findLanAddress();
    if (!address) return null;
    const port = process.env.PORT || 3000;
    return `http://${address}:${port}`;
  },
});
