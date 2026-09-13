import { AlexaBridgeService } from '../src/alexa-bridge.js';
import { TtsService } from '../src/tts.js';

// Only the multicast transport is replaced. Requests use the real server/router.
AlexaBridgeService.prototype.start = async function () { this.ready = true; };
if (process.env.TEST_DELAY_TTS === 'true') {
  TtsService.prototype.init = async function () {
    console.log('TEST_INIT_PENDING');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('TEST_INIT_COMPLETE');
  };
}
await import('../src/index.js');
