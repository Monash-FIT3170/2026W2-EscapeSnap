import { Meteor } from 'meteor/meteor';
import '/imports/api/games/methods';

Meteor.startup(() => {
  console.log('[EscapeSnap] server ready');
});

Meteor.methods({
  // Called when COCO-SSD is not confident enough to auto-decide.
  // Layer 2 (Gemini) will replace the stub body - the interface is fixed.
  // Returns { outcome: 'pass' | 'fail', explanation: string }
  'submissions.validate'(imageBuffer, targetObject) {
    console.log(
      `[submissions.validate] target="${targetObject}" imageSize=${imageBuffer?.byteLength ?? 0}B`
    );

    // Stub: hardcoded pass so the full client server client flow can be tested end-to-end
    return { outcome: 'pass', explanation: 'stub - Gemini integration pending' };
  },
});
