// Original synthesis. No recordings, soundtrack samples or remote audio.
// The scene supplies presentation parameters only, never vocabulary records.
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
export function soundscapeMix({ depth = 0, focused = false, event = null } = {}) {
  depth = clamp(depth, 0, 1);
  return {
    air: 0.014 + depth * 0.052,
    cutoff: 680 + depth * 780 + (focused ? 240 : 0),
    bass: event === 'blackhole' ? 0.16 : 0.055 + depth * 0.035,
    shimmer: focused ? 0.07 : 0.025 + depth * 0.022,
    wet: 0.24 + depth * 0.18,
  };
}

function noiseBuffer(context, seconds, seed, decay = false) {
  const buffer = context.createBuffer(2, Math.ceil(context.sampleRate * seconds), context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel);
    let brown = 0,
      state = (seed + channel * 3181) >>> 0;
    for (let i = 0; i < samples.length; i++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const white = state / 2147483648 - 1;
      brown = (brown + white * 0.035) / 1.035;
      const t = i / samples.length;
      const envelope = decay ? Math.pow(1 - t, 3.2) : Math.min(1, t * 80, (1 - t) * 80);
      samples[i] = (white * 0.11 + brown * 1.8) * envelope;
    }
  }
  return buffer;
}

// Also accepts OfflineAudioContext for measurable, repeatable audio validation.
export function createSoundscapeGraph(context) {
  const sources = new Set(),
    nodes = new Set(),
    transients = new Set(),
    panners = new Set();
  let spatial = true;
  const track = (node) => {
    nodes.add(node);
    return node;
  };
  const gain = (value) => {
    const node = track(context.createGain());
    node.gain.value = value;
    return node;
  };
  const input = gain(0.8),
    master = gain(0),
    bass = gain(0.055),
    shimmer = gain(0.025),
    air = gain(0.014);
  const filter = track(context.createBiquadFilter());
  filter.type = 'lowpass';
  filter.frequency.value = 680;
  filter.Q.value = 0.35;
  const highpass = track(context.createBiquadFilter());
  highpass.type = 'highpass';
  highpass.frequency.value = 27;
  const limiter = track(context.createDynamicsCompressor());
  limiter.threshold.value = -16;
  limiter.knee.value = 12;
  limiter.ratio.value = 5;
  limiter.attack.value = 0.02;
  limiter.release.value = 0.4;
  const reverb = track(context.createConvolver());
  reverb.buffer = noiseBuffer(context, 4.8, 87135, true);
  const wet = gain(0.24);
  const predelay = track(context.createDelay(0.2));
  predelay.delayTime.value = 0.045;
  const tailFilter = track(context.createBiquadFilter());
  tailFilter.type = 'lowpass';
  tailFilter.frequency.value = 2600;
  tailFilter.Q.value = 0.3;
  const safety = track(context.createWaveShaper());
  safety.curve = Float32Array.from({ length: 4096 }, (_, i) => 0.92 * Math.tanh(((i / 4095) * 2 - 1) * 2));
  safety.oversample = '2x';
  input.connect(filter);
  filter.connect(highpass);
  highpass.connect(limiter);
  filter.connect(predelay);
  predelay.connect(reverb);
  reverb.connect(tailFilter);
  tailFilter.connect(wet);
  wet.connect(limiter);
  limiter.connect(safety);
  safety.connect(master);
  master.connect(context.destination);
  bass.connect(input);
  shimmer.connect(input);
  air.connect(input);
  const start = context.currentTime;
  function spatialVoice(position = [0, 0, -3]) {
    const panner = track(context.createPanner());
    panner.panningModel = spatial ? 'HRTF' : 'equalpower';
    panner.distanceModel = 'inverse';
    panner.refDistance = 2;
    panner.rolloffFactor = 0.12;
    panner.positionX.value = clamp(position[0], -8, 8);
    panner.positionY.value = clamp(position[1], -8, 8);
    panner.positionZ.value = clamp(position[2], -16, -0.2);
    panners.add(panner);
    return panner;
  }
  function release(local) {
    for (const node of local) {
      node.disconnect();
      nodes.delete(node);
      panners.delete(node);
    }
  }
  function oscillator(frequency, level, pan, destination, type = 'sine', detune = 0) {
    const osc = track(context.createOscillator()),
      amplitude = gain(level),
      stereo = track(context.createStereoPanner());
    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;
    stereo.pan.value = pan;
    osc.connect(amplitude);
    amplitude.connect(stereo);
    stereo.connect(destination);
    osc.start(start);
    sources.add(osc);
    return { osc, amplitude };
  }
  // Open D-minor/add-nine voicings, with very slow, unsynchronised breathing.
  for (const [i, frequency] of [146.832, 220, 293.664, 329.628, 349.228].entries()) {
    for (const side of [-1, 1]) {
      const voice = oscillator(frequency, 0.07, side * (0.25 + i * 0.11), input, 'triangle', side * (3 + i));
      const lfo = track(context.createOscillator()),
        amount = gain(0.027);
      lfo.frequency.value = 0.018 + i * 0.007 + (side + 1) * 0.003;
      lfo.connect(amount);
      amount.connect(voice.amplitude.gain);
      lfo.start(start);
      sources.add(lfo);
    }
  }
  oscillator(36.708, 0.8, 0, bass);
  oscillator(73.416, 0.24, 0.05, bass);
  oscillator(587.328, 0.55, -0.55, shimmer);
  oscillator(880, 0.25, 0.55, shimmer, 'sine', -4);
  const noise = track(context.createBufferSource());
  noise.buffer = noiseBuffer(context, 8, 4731);
  noise.loop = true;
  const airFilter = track(context.createBiquadFilter());
  airFilter.type = 'bandpass';
  airFilter.frequency.value = 920;
  airFilter.Q.value = 0.6;
  noise.connect(airFilter);
  airFilter.connect(air);
  noise.start(start);
  sources.add(noise);
  let disposed = false;
  const smooth = (param, value, seconds) => {
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, seconds);
  };
  function stopEvents() {
    for (const { source, envelope, local } of transients) {
      smooth(envelope.gain, 0, 0.08);
      try {
        source.stop(context.currentTime + 0.5);
      } catch {
        /* Already ended. */
      }
      source.onended = () => {
        release(local);
      };
    }
    transients.clear();
  }
  return {
    setSpatial(value) {
      spatial = !!value;
      for (const panner of panners) panner.panningModel = spatial ? 'HRTF' : 'equalpower';
    },
    setVolume(value, smoothing = 0.25) {
      if (!disposed) smooth(master.gain, clamp(value, 0, 1) * 0.6, smoothing);
    },
    update(scene) {
      if (disposed) return;
      const mix = soundscapeMix(scene);
      smooth(air.gain, mix.air, 0.8);
      smooth(bass.gain, mix.bass, 1.2);
      smooth(shimmer.gain, mix.shimmer, 0.8);
      smooth(filter.frequency, mix.cutoff, 1.2);
      smooth(wet.gain, mix.wet, 1.5);
    },
    event(kind) {
      if (disposed) return;
      stopEvents();
      if (kind === 'kilonova') {
        const source = track(context.createOscillator()),
          envelope = gain(0),
          panner = spatialVoice([-3, 2, -4]);
        const now = context.currentTime;
        source.type = 'sine';
        source.frequency.setValueAtTime(88, now);
        source.frequency.exponentialRampToValueAtTime(620, now + 8.2);
        source.frequency.exponentialRampToValueAtTime(55, now + 9.5);
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.075, now + 8);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 16);
        source.connect(envelope);
        envelope.connect(panner);
        panner.connect(input);
        const local = [source, envelope, panner],
          entry = { source, envelope, local };
        transients.add(entry);
        source.onended = () => {
          transients.delete(entry);
          release(local);
        };
        source.start(now);
        source.stop(now + 16.1);
      }
      if (!['meteor', 'supernova', 'kilonova'].includes(kind)) return;
      const meteor = kind === 'meteor',
        merger = kind === 'kilonova',
        duration = meteor ? 4.8 : merger ? 20 : 13;
      const source = track(context.createBufferSource()),
        envelope = gain(0),
        tone = track(context.createBiquadFilter()),
        stereo = spatialVoice(meteor ? [-5, 2, -3] : merger ? [-3, 2, -4] : [2, 1, -5]);
      source.buffer = noise.buffer;
      source.loop = true;
      tone.type = meteor ? 'bandpass' : 'lowpass';
      tone.Q.value = 0.5;
      const now = context.currentTime;
      tone.frequency.setValueAtTime(meteor ? 500 : 180, now);
      tone.frequency.exponentialRampToValueAtTime(meteor ? 1900 : 780, now + (meteor ? 1.5 : merger ? 8.5 : 3));
      tone.frequency.exponentialRampToValueAtTime(meteor ? 400 : 90, now + duration);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(
        meteor ? 0.3 : merger ? 0.24 : 0.45,
        now + (meteor ? 0.9 : merger ? 8.5 : 3),
      );
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      if (meteor) {
        stereo.positionX.linearRampToValueAtTime(5, now + duration);
        stereo.positionY.linearRampToValueAtTime(-0.5, now + duration);
      }
      source.connect(tone);
      tone.connect(envelope);
      envelope.connect(stereo);
      stereo.connect(input);
      const local = [source, tone, envelope, stereo],
        entry = { source, envelope, local };
      transients.add(entry);
      source.onended = () => {
        transients.delete(entry);
        release(local);
      };
      source.start(now);
      source.stop(now + duration + 0.1);
    },
    birth(position) {
      if (disposed) return;
      const now = context.currentTime;
      for (const [i, frequency] of [293.664, 587.328, 880].entries()) {
        const source = track(context.createOscillator()),
          envelope = gain(0),
          stereo = spatialVoice(position);
        source.type = 'sine';
        source.frequency.setValueAtTime(frequency * (i === 0 ? 0.5 : 0.997), now);
        source.frequency.exponentialRampToValueAtTime(frequency, now + 0.65);
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.24 / (1 + i), now + 0.12 + i * 0.06);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 3.2 + i * 0.2);
        source.connect(envelope);
        envelope.connect(stereo);
        stereo.connect(input);
        const local = [source, envelope, stereo],
          entry = { source, envelope, local };
        transients.add(entry);
        source.onended = () => {
          transients.delete(entry);
          release(local);
        };
        source.start(now);
        source.stop(now + 4);
      }
    },
    action(kind, position) {
      if (disposed || !['edit', 'remove'].includes(kind)) return;
      const removed = kind === 'remove',
        now = context.currentTime,
        duration = removed ? 1.5 : 0.9;
      for (const [i, frequency] of (removed ? [220, 146.832] : [329.628, 440]).entries()) {
        const source = track(context.createOscillator()),
          envelope = gain(0),
          panner = spatialVoice(position);
        source.type = 'sine';
        source.frequency.setValueAtTime(removed ? frequency : frequency * 0.94, now);
        source.frequency.exponentialRampToValueAtTime(removed ? frequency * 0.5 : frequency, now + duration * 0.65);
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.12 / (i + 1), now + 0.05 + i * 0.025);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        source.connect(envelope);
        envelope.connect(panner);
        panner.connect(input);
        const local = [source, envelope, panner],
          entry = { source, envelope, local };
        transients.add(entry);
        source.onended = () => {
          transients.delete(entry);
          release(local);
        };
        source.start(now);
        source.stop(now + duration + 0.05);
      }
    },
    stopEvents,
    dispose() {
      if (disposed) return;
      disposed = true;
      stopEvents();
      for (const source of sources) {
        try {
          source.stop();
        } catch {
          /* Already ended. */
        }
      }
      for (const node of nodes) node.disconnect();
      sources.clear();
      nodes.clear();
      panners.clear();
    },
  };
}

export function createSoundscape({ createContext = () => new AudioContext(), onChange = () => {} } = {}) {
  let context,
    graph,
    enabled = false,
    volume = 0.32,
    spatial = true,
    hidden = false,
    disposed = false,
    ticket = 0,
    scene = {};
  const snapshot = () => ({ enabled, volume, spatial, state: context?.state || 'uninitialized', available: !disposed });
  const notify = () => onChange(snapshot());
  return {
    snapshot,
    async toggle() {
      if (disposed) return;
      const current = ++ticket;
      enabled = !enabled;
      if (!enabled) {
        graph?.setVolume(0, 0.025);
        graph?.stopEvents();
        notify();
        if (context) {
          await new Promise((resolve) => setTimeout(resolve, 160));
          if (current === ticket && !enabled && !disposed) await context.suspend();
        }
        notify();
        return;
      }
      try {
        // Called directly from the click: browser activation is not lost to a
        // network request, dynamic import or asynchronous scene initialization.
        if (!context) {
          context = createContext();
          context.onstatechange = notify;
        }
        await context.resume();
        if (current !== ticket || disposed || !enabled || hidden) {
          if (!enabled || hidden) await context.suspend();
          return;
        }
        graph ||= createSoundscapeGraph(context);
        graph.setSpatial(spatial);
        graph.update(scene);
        graph.setVolume(volume);
        notify();
      } catch {
        enabled = false;
        graph?.dispose();
        graph = undefined;
        if (context) {
          try {
            await context.close();
          } catch {
            /* Closed already. */
          }
          context = undefined;
        }
        notify();
      }
    },
    setVolume(value) {
      volume = clamp(value, 0, 1);
      if (enabled) graph?.setVolume(volume);
      notify();
    },
    setSpatial(value) {
      spatial = !!value;
      graph?.setSpatial(spatial);
      notify();
    },
    update(next) {
      scene = next;
      if (enabled && !hidden) graph?.update(next);
    },
    event(kind) {
      if (enabled && !hidden) graph?.event(kind);
    },
    birth(position) {
      if (enabled && !hidden) graph?.birth(position);
    },
    action(kind, position) {
      if (enabled && !hidden) graph?.action(kind, position);
    },
    async setHidden(value) {
      hidden = !!value;
      if (!context || disposed) return;
      try {
        if (hidden) {
          graph?.stopEvents();
          await context.suspend();
        } else if (enabled) {
          await context.resume();
          graph?.update(scene);
        }
      } catch {
        /* A browser may require another explicit gesture to resume. */
      }
      notify();
    },
    async dispose() {
      disposed = true;
      enabled = false;
      ++ticket;
      graph?.dispose();
      if (context && context.state !== 'closed') await context.close();
    },
  };
}
