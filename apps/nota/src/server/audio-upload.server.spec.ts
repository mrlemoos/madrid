import { describe, expect, it } from 'vitest';
import {
  AUDIO_UPLOAD_MAX_BYTES,
  isAllowedAudioUploadMime,
} from './audio-upload.server';

describe('isAllowedAudioUploadMime', () => {
  it('allows known browser / STT types', () => {
    // Arrange
    const webmAudio = 'audio/webm';
    const webmVideo = 'video/webm';
    const wav = 'audio/wav';
    const mpeg = 'audio/mpeg';
    const mp4Audio = 'Audio/MP4';

    // Act
    const webmAudioOk = isAllowedAudioUploadMime(webmAudio);
    const webmVideoOk = isAllowedAudioUploadMime(webmVideo);
    const wavOk = isAllowedAudioUploadMime(wav);
    const mpegOk = isAllowedAudioUploadMime(mpeg);
    const mp4Ok = isAllowedAudioUploadMime(mp4Audio);

    // Assert
    expect(webmAudioOk).toBe(true);
    expect(webmVideoOk).toBe(true);
    expect(wavOk).toBe(true);
    expect(mpegOk).toBe(true);
    expect(mp4Ok).toBe(true);
  });

  it('rejects arbitrary audio/* subtypes', () => {
    // Arrange
    const ogg = 'audio/ogg';
    const aac = 'audio/aac';
    const vendor = 'audio/vnd.fake';

    // Act
    const oggOk = isAllowedAudioUploadMime(ogg);
    const aacOk = isAllowedAudioUploadMime(aac);
    const vendorOk = isAllowedAudioUploadMime(vendor);

    // Assert
    expect(oggOk).toBe(false);
    expect(aacOk).toBe(false);
    expect(vendorOk).toBe(false);
  });

  it('rejects non-audio types', () => {
    // Arrange
    const octet = 'application/octet-stream';
    const plain = 'text/plain';
    const missing = undefined;

    // Act
    const octetOk = isAllowedAudioUploadMime(octet);
    const plainOk = isAllowedAudioUploadMime(plain);
    const missingOk = isAllowedAudioUploadMime(missing);

    // Assert
    expect(octetOk).toBe(false);
    expect(plainOk).toBe(false);
    expect(missingOk).toBe(false);
  });
});

describe('AUDIO_UPLOAD_MAX_BYTES', () => {
  it('is in the tens-of-megabytes range (DoS / cost guard)', () => {
    // Arrange
    const maxBytes = AUDIO_UPLOAD_MAX_BYTES;
    const sixtyFourMb = 64 * 1024 * 1024;
    const sixteenMb = 16 * 1024 * 1024;

    // Act
    const withinCeiling = maxBytes <= sixtyFourMb;
    const aboveFloor = maxBytes >= sixteenMb;

    // Assert
    expect(withinCeiling).toBe(true);
    expect(aboveFloor).toBe(true);
  });
});
