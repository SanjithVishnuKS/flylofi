// FlyLofi Focus Flight — Cabin Entertainment, Window Shade & Standout Systems
(() => {
  'use strict';

  // 1. Cabin Mouse & Touch Parallax for 3D Window Depth
  const stage = document.getElementById('stage');
  const portal = document.getElementById('airplaneWindowPortal');
  if (stage && portal) {
    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
      portal.style.setProperty('--parallax-x', `${x}px`);
      portal.style.setProperty('--parallax-y', `${y}px`);
    });
    stage.addEventListener('pointerleave', () => {
      portal.style.setProperty('--parallax-x', '0px');
      portal.style.setProperty('--parallax-y', '0px');
    });
  }

  // 2. DOM Elements
  const lofiAudio = document.getElementById('mediaLofi');
  const cabinAudio = document.getElementById('mediaCabin');
  const flightVideo = document.getElementById('flightVideo');
  const lofiPlayToggle = document.getElementById('lofiPlayToggle');
  const playIcon = document.getElementById('playIcon');
  const playLabel = document.getElementById('playLabel');
  const lofiTrackSelect = document.getElementById('lofiTrackSelect');
  const cabinBtn = document.getElementById('cabinBtn');
  const cabinLabel = document.getElementById('cabinLabel');
  const videoSceneSelect = document.getElementById('videoSceneSelect');
  const volumeSlider = document.getElementById('volume');
  const customAudioFile = document.getElementById('customAudioFile');
  const customVideoFile = document.getElementById('customVideoFile');

  // Standout Elements
  const windowShade = document.getElementById('windowShade');
  const shadeHandle = document.getElementById('shadeHandle');
  const seatbeltSign = document.getElementById('seatbeltSignHud');
  const chimeDot = document.getElementById('chimeDot');
  const trayToggle = document.getElementById('trayTableToggle');
  const trayClose = document.getElementById('trayCloseBtn');
  const trayDrawer = document.getElementById('trayTableDrawer');
  const trayTaskInput = document.getElementById('trayTaskInput');
  const trayTaskDone = document.getElementById('trayTaskDone');
  const trayNotesInput = document.getElementById('trayNotesInput');
  const smartTintGlass = document.getElementById('smartTintGlass');

  if (!lofiAudio || !cabinAudio || !flightVideo) return;

  // Video strictly muted to protect audio isolation
  flightVideo.muted = true;
  flightVideo.defaultMuted = true;
  flightVideo.volume = 0;

  // 3. Audio & Video Candidate Path Generator
  function getCandidatePaths(src) {
    if (!src || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      return [src];
    }
    const clean = src.replace(/^(\.\.\/|\.\/|\/)/, '');
    const host = window.location.hostname || 'localhost';
    const candidates = [
      clean,
      './' + clean,
      '/assets/web/' + clean,
      'assets/web/' + clean,
      '../' + clean,
      '/' + clean,
      `http://${host}:8080/${clean}`,
      `http://192.168.0.28:8080/${clean}`,
      `http://localhost:8080/${clean}`,
      `http://127.0.0.1:8080/${clean}`,
      `http://10.0.2.2:8080/${clean}`
    ];
    return [...new Set(candidates)];
  }

  // Web Audio Fallback Synthesizer Engine (Zero-Bandwidth Infinite Cabin & Lofi Ambient)
  let synthAudioCtx = null;
  let cabinSynthGain = null;
  let cabinNoiseSource = null;
  let isProceduralCabinActive = false;
  let lofiSynthGain = null;
  let lofiSynthTimer = null;
  let isProceduralLofiActive = false;

  function getSynthContext() {
    if (!synthAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) synthAudioCtx = new AudioCtx();
    }
    if (synthAudioCtx && synthAudioCtx.state === 'suspended') {
      synthAudioCtx.resume();
    }
    return synthAudioCtx;
  }

  function startProceduralCabinSynth() {
    const ctx = getSynthContext();
    if (!ctx) return;
    stopProceduralCabinSynth();

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const out = noiseBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
        b6 = white * 0.115926;
      }
    }

    cabinNoiseSource = ctx.createBufferSource();
    cabinNoiseSource.buffer = noiseBuffer;
    cabinNoiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, ctx.currentTime);
    filter.Q.setValueAtTime(1.1, ctx.currentTime);

    cabinSynthGain = ctx.createGain();
    const vol = getVolumeLevel() * 0.28;
    cabinSynthGain.gain.setValueAtTime(vol, ctx.currentTime);

    cabinNoiseSource.connect(filter);
    filter.connect(cabinSynthGain);
    cabinSynthGain.connect(ctx.destination);
    cabinNoiseSource.start(0);
    isProceduralCabinActive = true;
  }

  function stopProceduralCabinSynth() {
    if (cabinNoiseSource) {
      try { cabinNoiseSource.stop(0); } catch(e) {}
      try { cabinNoiseSource.disconnect(); } catch(e) {}
      cabinNoiseSource = null;
    }
    isProceduralCabinActive = false;
  }

  function startProceduralLofiSynth() {
    const ctx = getSynthContext();
    if (!ctx) return;
    stopProceduralLofiSynth();

    lofiSynthGain = ctx.createGain();
    const vol = getVolumeLevel() * 0.22;
    lofiSynthGain.gain.setValueAtTime(vol, ctx.currentTime);

    const lofiFilter = ctx.createBiquadFilter();
    lofiFilter.type = 'lowpass';
    lofiFilter.frequency.setValueAtTime(1100, ctx.currentTime);
    lofiSynthGain.connect(lofiFilter);
    lofiFilter.connect(ctx.destination);

    // Warm relaxing 7th chords: Dm7, G7, Cmaj7, Am7
    const chords = [
      [146.83, 220.00, 261.63, 329.63],
      [196.00, 246.94, 293.66, 349.23],
      [130.81, 196.00, 246.94, 329.63],
      [110.00, 164.81, 220.00, 261.63]
    ];

    let chordIdx = 0;
    const playNextChord = () => {
      if (!isProceduralLofiActive) return;
      const curNotes = chords[chordIdx % chords.length];
      chordIdx++;
      const now = ctx.currentTime;
      curNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(0.08, now + 0.15);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(noteGain);
        noteGain.connect(lofiSynthGain);
        osc.start(now);
        osc.stop(now + 4.0);
      });
      lofiSynthTimer = setTimeout(playNextChord, 3800);
    };

    isProceduralLofiActive = true;
    playNextChord();
  }

  function stopProceduralLofiSynth() {
    isProceduralLofiActive = false;
    if (lofiSynthTimer) {
      clearTimeout(lofiSynthTimer);
      lofiSynthTimer = null;
    }
  }

  // Master Volume
  const getVolumeLevel = () => {
    return volumeSlider ? Number(volumeSlider.value) / 100 : 0.45;
  };

  function updateAudioVolumes() {
    const vol = getVolumeLevel();
    lofiAudio.volume = vol;
    cabinAudio.volume = vol * 0.65;
    if (lofiSynthGain && synthAudioCtx) lofiSynthGain.gain.setValueAtTime(vol * 0.22, synthAudioCtx.currentTime);
    if (cabinSynthGain && synthAudioCtx) cabinSynthGain.gain.setValueAtTime(vol * 0.28, synthAudioCtx.currentTime);
  }
  updateAudioVolumes();

  if (volumeSlider) {
    volumeSlider.addEventListener('input', updateAudioVolumes);
  }

  // Robust Media Playback with Path Fallback
  async function playSourceWithFallback(mediaElement, candidateList, index = 0) {
    if (!candidateList || index >= candidateList.length) {
      throw new Error('All candidate paths failed');
    }
    const currentSrc = candidateList[index];
    mediaElement.src = currentSrc;
    updateAudioVolumes();

    try {
      await mediaElement.play();
      return currentSrc;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      return playSourceWithFallback(mediaElement, candidateList, index + 1);
    }
  }

  // 4. Lofi Music Player (Single-Channel, Zero Overlap)
  let isMusicPlaying = false;

  function updatePlayButtonUI(playing) {
    isMusicPlaying = playing;
    if (lofiPlayToggle) {
      if (playing) {
        lofiPlayToggle.classList.add('playing');
        if (playIcon) playIcon.textContent = '⏸';
        if (playLabel) playLabel.textContent = 'Pause';
      } else {
        lofiPlayToggle.classList.remove('playing');
        if (playIcon) playIcon.textContent = '▶';
        if (playLabel) playLabel.textContent = 'Play Lofi';
      }
    }
  }

  async function startTrackPlayback(src) {
    if (!src) return;
    if (src === '__custom_audio__') {
      if (customAudioFile) customAudioFile.click();
      return;
    }

    if (!lofiAudio.paused) {
      lofiAudio.pause();
    }
    stopProceduralLofiSynth();

    const candidates = getCandidatePaths(src);
    try {
      await playSourceWithFallback(lofiAudio, candidates);
      updatePlayButtonUI(true);
      try {
        localStorage.setItem('flylofi_last_track', src);
      } catch (e) {}
    } catch (err) {
      console.warn('Lofi track playback failed for:', src, err);
      // Fallback 1: Try built-in afternoon jazz
      if (!src.includes('afternoon-jazz')) {
        try {
          const fallbackCandidates = getCandidatePaths('media/flight/audio/afternoon-jazz.webm');
          await playSourceWithFallback(lofiAudio, fallbackCandidates);
          updatePlayButtonUI(true);
          return;
        } catch (e2) {
          console.warn('Afternoon jazz fallback failed:', e2);
        }
      }
      // Fallback 2: Procedural synthesizer fallback
      startProceduralLofiSynth();
      updatePlayButtonUI(true);
    }
  }

  function togglePlayPause() {
    if (isMusicPlaying && (!lofiAudio.paused || isProceduralLofiActive)) {
      lofiAudio.pause();
      stopProceduralLofiSynth();
      updatePlayButtonUI(false);
    } else {
      const selectedSrc = lofiTrackSelect ? lofiTrackSelect.value : 'media/flight/audio/afternoon-jazz.webm';
      startTrackPlayback(selectedSrc);
    }
  }

  if (lofiPlayToggle) {
    lofiPlayToggle.addEventListener('click', togglePlayPause);
  }

  if (lofiTrackSelect) {
    lofiTrackSelect.addEventListener('change', () => {
      const val = lofiTrackSelect.value;
      if (val === '__custom_audio__') {
        if (customAudioFile) customAudioFile.click();
      } else {
        startTrackPlayback(val);
      }
    });
  }

  lofiAudio.addEventListener('play', () => {
    stopProceduralLofiSynth();
    updatePlayButtonUI(true);
  });
  lofiAudio.addEventListener('pause', () => {
    if (!isProceduralLofiActive) updatePlayButtonUI(false);
  });
  lofiAudio.addEventListener('ended', () => {
    if (isMusicPlaying) {
      lofiAudio.currentTime = 0;
      lofiAudio.play().catch(() => {});
    }
  });

  if (customAudioFile && lofiTrackSelect) {
    customAudioFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const blobUrl = URL.createObjectURL(file);
      const cleanName = '♪ ' + file.name.replace(/\.[^/.]+$/, '').slice(0, 18);

      const opt = document.createElement('option');
      opt.value = blobUrl;
      opt.textContent = cleanName;
      lofiTrackSelect.prepend(opt);
      lofiTrackSelect.value = blobUrl;

      startTrackPlayback(blobUrl);
    });
  }

  // 5. Cabin White Noise Ambience
  const cabinCandidates = [
    'media/flight/audio/airplane-cabin-white.webm',
    './media/flight/audio/airplane-cabin-white.webm',
    '/assets/web/media/flight/audio/airplane-cabin-white.webm',
    'assets/web/media/flight/audio/airplane-cabin-white.webm',
    '../media/flight/audio/airplane-cabin-white.webm',
    '/media/flight/audio/airplane-cabin-white.webm',
    'http://192.168.0.28:8080/media/flight/audio/airplane-cabin-white.webm',
    'http://localhost:8080/media/flight/audio/airplane-cabin-white.webm',
    'http://10.0.2.2:8080/media/flight/audio/airplane-cabin-white.webm'
  ];

  let isCabinActive = false;

  function updateCabinUI(active) {
    isCabinActive = active;
    if (cabinBtn) {
      if (active) {
        cabinBtn.classList.add('active');
        if (cabinLabel) cabinLabel.textContent = 'Cabin: ON';
      } else {
        cabinBtn.classList.remove('active');
        if (cabinLabel) cabinLabel.textContent = 'Cabin: Off';
      }
    }
  }

  async function toggleCabin() {
    if (isCabinActive && (!cabinAudio.paused || isProceduralCabinActive)) {
      cabinAudio.pause();
      stopProceduralCabinSynth();
      updateCabinUI(false);
    } else {
      try {
        await playSourceWithFallback(cabinAudio, cabinCandidates);
        updateCabinUI(true);
      } catch (err) {
        console.warn('Cabin white noise audio file failed, using Web Audio pink noise generator:', err);
        startProceduralCabinSynth();
        updateCabinUI(true);
      }
    }
  }

  if (cabinBtn) {
    cabinBtn.addEventListener('click', toggleCabin);
  }

  cabinAudio.addEventListener('play', () => {
    stopProceduralCabinSynth();
    updateCabinUI(true);
  });
  cabinAudio.addEventListener('pause', () => {
    if (!isProceduralCabinActive) updateCabinUI(false);
  });
  cabinAudio.addEventListener('ended', () => {
    if (isCabinActive) {
      cabinAudio.currentTime = 0;
      cabinAudio.play().catch(() => {});
    }
  });

  // 6. Scenic Video & Photorealistic Backdrop Engine (Matching User Aerial Photo)
  function loadVideoScene(sceneSrc) {
    const photoScene = document.getElementById('photoScene');
    const photoSceneImg = document.getElementById('photoSceneImg');
    const sceneCanvas = document.getElementById('scene');
    const stage = document.getElementById('stage');

    if (!sceneSrc) return;

    if (sceneSrc === '__canvas__') {
      flightVideo.pause();
      if (photoScene) photoScene.style.display = 'none';
      if (sceneCanvas) sceneCanvas.style.display = 'block';
      if (stage) stage.classList.remove('video-live');
      return;
    }

    if (sceneSrc === '__custom_video__') {
      if (customVideoFile) customVideoFile.click();
      return;
    }

    if (sceneSrc.endsWith('.jpg') || sceneSrc.endsWith('.jpeg') || sceneSrc.endsWith('.png')) {
      flightVideo.pause();
      if (stage) stage.classList.remove('video-live');
      if (sceneCanvas) sceneCanvas.style.display = 'none';
      if (photoScene) {
        photoScene.style.display = 'block';
        photoScene.style.opacity = '1';
      }

      if (photoSceneImg) {
        const clean = sceneSrc.replace(/^(\.\.\/|\.\/|\/)/, '');
        const candidates = [
          sceneSrc,
          './' + clean,
          '../' + clean,
          'focus-flight/' + clean,
          '/focus-flight/' + clean,
          '/assets/web/' + clean,
          'assets/web/' + clean
        ];
        let cIdx = 0;
        photoSceneImg.onerror = () => {
          cIdx++;
          if (cIdx < candidates.length) {
            photoSceneImg.src = candidates[cIdx];
          }
        };
        photoSceneImg.src = candidates[0];
      }
      return;
    }

    // Video Playback (Only when user explicitly chooses video)
    if (photoScene) photoScene.style.display = 'block';
    if (sceneCanvas) sceneCanvas.style.display = 'none';

    flightVideo.muted = true;
    flightVideo.defaultMuted = true;
    flightVideo.volume = 0;

    const candidates = getCandidatePaths(sceneSrc);
    let loaded = false;

    for (const url of candidates) {
      try {
        flightVideo.src = url;
        flightVideo.load();
        flightVideo.play().then(() => {
          if (stage) stage.classList.add('video-live');
        }).catch(() => {});
        loaded = true;
        break;
      } catch (e) {}
    }

    if (!loaded && stage) {
      stage.classList.remove('video-live');
    }
  }

  if (videoSceneSelect) {
    videoSceneSelect.addEventListener('change', () => {
      const val = videoSceneSelect.value;
      if (val.includes('car_front_passenger')) {
        applySeatPerspective('FP');
      } else if (val.includes('car_rear_passenger')) {
        applySeatPerspective('RL');
      } else if (val.includes('bus_observation_deck')) {
        applySeatPerspective('01A');
      } else if (val.includes('bus_window_berth')) {
        applySeatPerspective('02A');
      } else if (val.includes('seat_firstclass_suite')) {
        applySeatPerspective('01A');
      } else if (val.includes('seat_middle_cabin')) {
        applySeatPerspective('14B');
      } else if (val.includes('seat_aisle_cabin')) {
        applySeatPerspective('14C');
      } else if (val.includes('seat_02f_wing')) {
        applySeatPerspective('02F');
      } else if (val.includes('seat_18a_night')) {
        applySeatPerspective('18A');
      } else if (val.includes('seat_14a_aerial')) {
        applySeatPerspective('14A');
      } else {
        if (stage) {
          stage.classList.remove('pov-cabin-interior', 'pov-middle', 'pov-aisle', 'pov-firstclass', 'pov-car-front', 'pov-car-rear', 'pov-bus-front', 'pov-bus-berth');
          stage.classList.add('pov-window');
        }
        loadVideoScene(val);
      }
    });
  }

  if (customVideoFile && videoSceneSelect) {
    customVideoFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const blobUrl = URL.createObjectURL(file);
      const cleanName = '🎬 ' + file.name.replace(/\.[^/.]+$/, '').slice(0, 18);

      const opt = document.createElement('option');
      opt.value = blobUrl;
      opt.textContent = cleanName;
      videoSceneSelect.prepend(opt);
      videoSceneSelect.value = blobUrl;

      loadVideoScene(blobUrl);
    });
  }

  const unlockAutoplay = () => {
    if (stage && !stage.classList.contains('video-live') && videoSceneSelect?.value && videoSceneSelect.value !== '__canvas__') {
      flightVideo.muted = true;
      flightVideo.play().then(() => {
        stage.classList.add('video-live');
      }).catch(() => {});
    }
    window.removeEventListener('pointerdown', unlockAutoplay);
    window.removeEventListener('keydown', unlockAutoplay);
  };
  window.addEventListener('pointerdown', unlockAutoplay, { once: true });
  window.addEventListener('keydown', unlockAutoplay, { once: true });

  // ==========================================================================
  // 7. Interactive Aircraft Window Shade Physical Drag Engine
  // ==========================================================================
  let isDraggingShade = false;
  let shadeStartY = 0;
  let currentShadePercent = 0;

  function playShadeMechanicalSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  function setShadePull(percent, animate = false) {
    currentShadePercent = Math.max(0, Math.min(100, percent));
    document.documentElement.style.setProperty('--window-shade-pull', `${currentShadePercent}%`);
    if (windowShade) {
      windowShade.classList.toggle('animating', animate);
      windowShade.classList.toggle('closed', currentShadePercent > 85);
    }
  }

  if (shadeHandle && windowShade) {
    shadeHandle.addEventListener('pointerdown', (e) => {
      isDraggingShade = true;
      shadeStartY = e.clientY;
      windowShade.classList.remove('animating');
      shadeHandle.setPointerCapture(e.pointerId);
      playShadeMechanicalSound();
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDraggingShade) return;
      const portalEl = document.getElementById('airplaneWindowPortal');
      const portalHeight = portalEl ? portalEl.clientHeight : 500;
      const deltaY = e.clientY - shadeStartY;
      const addedPct = (deltaY / portalHeight) * 100;
      setShadePull(currentShadePercent + addedPct);
      shadeStartY = e.clientY;
      if (Math.abs(deltaY) > 8) playShadeMechanicalSound();
    });

    window.addEventListener('pointerup', () => {
      if (!isDraggingShade) return;
      isDraggingShade = false;
      // Snap to closed if > 60%, else snap open
      if (currentShadePercent > 55) {
        setShadePull(92, true);
      } else {
        setShadePull(0, true);
      }
      playShadeMechanicalSound();
    });

    // Tap handle to toggle
    shadeHandle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentShadePercent > 30) {
        setShadePull(0, true);
      } else {
        setShadePull(92, true);
      }
      playShadeMechanicalSound();
    });
  }

  // ==========================================================================
  // 8. STANDOUT FEATURE: AUTHENTIC TWO-TONE CABIN CHIME ("Ding-Dong!")
  // ==========================================================================
  function playCabinTwoToneChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tone 1: High tone (D5 - 587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.28, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);

      // Tone 2: Low chime tone (A4 - 440 Hz) starting slightly after
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440.00, ctx.currentTime + 0.22);
      gain2.gain.setValueAtTime(0.001, ctx.currentTime);
      gain2.gain.setValueAtTime(0.32, ctx.currentTime + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.22);
      osc2.stop(ctx.currentTime + 0.85);

      // Flash overhead seatbelt sign
      if (seatbeltSign) {
        seatbeltSign.style.boxShadow = '0 0 24px rgba(131, 224, 181, 0.7)';
        setTimeout(() => { seatbeltSign.style.boxShadow = ''; }, 900);
      }
    } catch (e) {}
  }

  if (seatbeltSign) {
    seatbeltSign.addEventListener('click', () => {
      playCabinTwoToneChime();
    });
  }

  // Play subtle chime on boarding entry
  setTimeout(() => {
    playCabinTwoToneChime();
  }, 1200);

  // ==========================================================================
  // 9. STANDOUT FEATURE: SEAT 01A FIRST CLASS SMART TINT
  // ==========================================================================
  const savedFlightData = JSON.parse(localStorage.getItem('focusFlightActive') || '{}');
  if (savedFlightData?.seat === '01A' && smartTintGlass) {
    let tintLevel = 0;
    const tintLevels = [0, 0.25, 0.5, 0.75, 0.9];
    
    // Add Smart Tint button to deck
    const deckRow = document.querySelector('.cruise-media-deck .deck-row:last-child');
    if (deckRow) {
      const tintBtn = document.createElement('button');
      tintBtn.className = 'deck-btn';
      tintBtn.id = 'smartTintBtn';
      tintBtn.title = 'Adjust Boeing 787 Electrochromic Smart Tint Window';
      tintBtn.innerHTML = '<span>🔘 Tint: 0</span>';
      tintBtn.addEventListener('click', () => {
        tintLevel = (tintLevel + 1) % tintLevels.length;
        document.documentElement.style.setProperty('--tint-opacity', String(tintLevels[tintLevel]));
        tintBtn.innerHTML = `<span>🔘 Tint: ${tintLevel}</span>`;
        playShadeMechanicalSound();
      });
      deckRow.appendChild(tintBtn);
    }
  }

  // ==========================================================================
  // 10. STANDOUT FEATURE: IN-FLIGHT TRAY TABLE / FOCUS MISSION NOTEPAD
  // ==========================================================================
  if (trayToggle && trayDrawer) {
    trayToggle.addEventListener('click', () => {
      trayDrawer.classList.toggle('open');
    });
  }

  if (trayClose && trayDrawer) {
    trayClose.addEventListener('click', () => {
      trayDrawer.classList.remove('open');
    });
  }

  // Restore saved task & notes from localStorage
  if (trayTaskInput) {
    trayTaskInput.value = localStorage.getItem('flylofi_flight_task') || '';
    trayTaskInput.addEventListener('input', () => {
      localStorage.setItem('flylofi_flight_task', trayTaskInput.value);
    });
  }

  if (trayTaskDone) {
    trayTaskDone.checked = localStorage.getItem('flylofi_flight_task_done') === 'true';
    trayTaskDone.addEventListener('change', () => {
      localStorage.setItem('flylofi_flight_task_done', String(trayTaskDone.checked));
      if (trayTaskDone.checked) {
        playCabinTwoToneChime();
      }
    });
  }

  if (trayNotesInput) {
    trayNotesInput.value = localStorage.getItem('flylofi_flight_notes') || '';
    trayNotesInput.addEventListener('input', () => {
      localStorage.setItem('flylofi_flight_notes', trayNotesInput.value);
    });
  }

  // 11. Server Media Auto-Discovery (/api/media)
  async function discoverServerMedia() {
    const apiEndpoints = [
      '/api/media',
      `http://${window.location.hostname || 'localhost'}:8080/api/media`,
      'http://localhost:8080/api/media'
    ];

    let mediaFiles = null;
    for (const endpoint of apiEndpoints) {
      try {
        const resp = await fetch(endpoint, { mode: 'cors' });
        if (resp.ok) {
          mediaFiles = await resp.json();
          break;
        }
      } catch (e) {}
    }

    if (!Array.isArray(mediaFiles)) return;

    mediaFiles.forEach((file) => {
      const lower = file.name.toLowerCase();

      if (file.type === 'audio' || /\.(mp3|wav|ogg|m4a|webm|flac)$/i.test(lower)) {
        if (lower.includes('cabin') || lower.includes('white')) {
          if (!cabinCandidates.includes(file.path)) {
            cabinCandidates.unshift(file.path);
          }
        } else if (lofiTrackSelect) {
          const exists = [...lofiTrackSelect.options].some((opt) => opt.value.includes(file.name));
          if (!exists) {
            const opt = document.createElement('option');
            opt.value = file.path;
            const label = '🎵 ' + file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            opt.textContent = label.slice(0, 24);
            lofiTrackSelect.appendChild(opt);
          }
        }
      }

      if (file.type === 'video' || /\.(mp4|webm|mov)$/i.test(lower)) {
        if (videoSceneSelect) {
          const exists = [...videoSceneSelect.options].some((opt) => opt.value.includes(file.name));
          if (!exists) {
            const opt = document.createElement('option');
            opt.value = file.path;
            const label = '🎬 ' + file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            opt.textContent = label.slice(0, 24);
            videoSceneSelect.appendChild(opt);
          }
        }
      }
    });
  }

  discoverServerMedia().catch(() => {});

  // ==========================================================================
  // 11. PHOTOREALISTIC SEAT PERSPECTIVE ENGINE & IN-FLIGHT SWITCHER
  function getSeatInfo(seatCode) {
    const s = String(seatCode || '14A').toUpperCase().trim();
    const mode = new URLSearchParams(window.location.search).get('mode') || savedFlightData?.transitMode || 'flight';

    // Car Mode Seats
    if (mode === 'car' || s === 'FP' || s === 'RL' || s === 'RR' || s.startsWith('CAR-')) {
      if (s === 'RL' || s.includes('RL')) {
        return {
          img: 'media/flight/scenes/car_rear_passenger.jpg',
          type: 'Rear Left Passenger Window',
          desc: 'Raindrops tracing glass, side streetlights & executive armrest',
          pov: 'car-rear',
          class: 'EXECUTIVE REAR'
        };
      }
      if (s === 'RR' || s.includes('RR')) {
        return {
          img: 'media/flight/scenes/car_rear_passenger.jpg',
          type: 'Rear Right Passenger Window',
          desc: 'Highway neon bokeh & cozy corner window view',
          pov: 'car-rear',
          class: 'EXECUTIVE REAR'
        };
      }
      return {
        img: 'media/flight/scenes/car_front_passenger.jpg',
        type: 'Front Passenger (Shotgun)',
        desc: 'Wide windshield, glowing dashboard radio & rainy highway view',
        pov: 'car-front',
        class: 'PASSENGER SHOTGUN'
      };
    }

    // Bus Mode Seats
    if (mode === 'bus' || s.startsWith('BUS-')) {
      if (s === '01A' || s === '01B' || s.includes('OBS')) {
        return {
          img: 'media/flight/scenes/bus_observation_deck.jpg',
          type: 'Upper-Deck Observation Panorama',
          desc: 'Curved panoramic windscreen over winding misty pines',
          pov: 'bus-front',
          class: 'OBSERVATION PANORAMA'
        };
      }
      const isWindow = s.endsWith('A') || s.endsWith('D');
      return {
        img: 'media/flight/scenes/bus_window_berth.jpg',
        type: isWindow ? 'Upper Sleeper Berth (Window)' : 'Aisle Sleeper Berth',
        desc: isWindow ? 'Misty forest pines, mountain fog & wooden ledge' : 'Quiet focus bunk with personal reading spotlight',
        pov: 'bus-berth',
        class: isWindow ? 'WINDOW BERTH' : 'AISLE BERTH'
      };
    }

    // Flight Mode Seats (Rows 01 to 15, Seats A to F)
    const match = s.match(/(\d+)([A-F])/);
    const row = match ? parseInt(match[1], 10) : 14;
    const col = match ? match[2] : 'A';

    const isFirstClass = row <= 2;
    const isMiddle = col === 'B' || col === 'E';
    const isAisle = col === 'C' || col === 'D';

    if (isFirstClass) {
      if (col === 'F') {
        return {
          img: 'media/flight/scenes/seat_01a_horizon.jpg',
          type: 'First Class Suite (Horizon)',
          desc: 'Golden stratospheric sunset horizon suite',
          pov: 'firstclass',
          class: 'FIRST SUITE'
        };
      }
      return {
        img: 'media/flight/scenes/seat_firstclass_suite.jpg',
        type: 'First Class Suite',
        desc: 'Walnut suite pod with smart tint window & executive console',
        pov: 'firstclass',
        class: 'FIRST SUITE'
      };
    }

    if (isMiddle) {
      return {
        img: 'media/flight/scenes/seat_middle_cabin.jpg',
        type: 'Middle Seat Cabin POV',
        desc: 'Forward IFE monitor, fold-down tray table with journal & side window',
        pov: 'middle',
        class: 'CABIN MIDDLE'
      };
    }

    if (isAisle) {
      return {
        img: 'media/flight/scenes/seat_aisle_cabin.jpg',
        type: 'Aisle Seat Cabin POV',
        desc: 'Extra legroom, overhead reading spotlight beam & row window view',
        pov: 'aisle',
        class: 'EXTRA LEGROOM'
      };
    }

    // Window Seats (A, F)
    if (row <= 6) {
      return {
        img: 'media/flight/scenes/seat_02f_wing.jpg',
        type: 'Wing & Jet Engine',
        desc: 'Swept aircraft wing and turbine over vast cloud deck',
        pov: 'window',
        class: 'OVERWING'
      };
    } else if (row <= 15) {
      return {
        img: 'media/flight/scenes/seat_14a_aerial_earth.jpg',
        type: 'Aerial Earth Vista',
        desc: 'Lush green agricultural farmland & rivers',
        pov: 'window',
        class: 'SCENIC WINDOW'
      };
    } else {
      return {
        img: 'media/flight/scenes/seat_18a_night.jpg',
        type: 'Night Flight Vista',
        desc: 'Metropolitan golden illuminated city light grids & starlight',
        pov: 'window',
        class: 'NIGHT WINDOW'
      };
    }
  }

  const seatDatum = document.getElementById('seatDatum');
  const seatSwitchPopover = document.getElementById('seatSwitchPopover');
  const traySeatLabel = document.getElementById('traySeatLabel');
  const cabinPovImg = document.getElementById('cabinPovImg');
  const readingSpotlightLayer = document.getElementById('readingSpotlightLayer');
  const spotlightToggleBtn = document.getElementById('spotlightToggleBtn');
  const smartTintBtn = document.getElementById('smartTintBtn');

  function applySeatPerspective(seatCode) {
    const info = getSeatInfo(seatCode);

    if (info.pov === 'middle' || info.pov === 'aisle' || info.pov === 'firstclass' || info.pov.startsWith('car-') || info.pov.startsWith('bus-')) {
      if (stage) {
        stage.classList.add('pov-cabin-interior', `pov-${info.pov}`);
        stage.classList.remove('pov-window', 'video-live');
        ['pov-middle', 'pov-aisle', 'pov-firstclass', 'pov-car-front', 'pov-car-rear', 'pov-bus-front', 'pov-bus-berth'].forEach((c) => {
          if (c !== `pov-${info.pov}`) stage.classList.remove(c);
        });
      }

      if (cabinPovImg) {
        const clean = info.img.replace(/^(\.\.\/|\.\/|\/)/, '');
        const candidates = [
          info.img,
          './' + clean,
          '../' + clean,
          'focus-flight/' + clean,
          '/focus-flight/' + clean,
          '/assets/web/' + clean,
          'assets/web/' + clean
        ];
        let cIdx = 0;
        cabinPovImg.onerror = () => {
          cIdx++;
          if (cIdx < candidates.length) {
            cabinPovImg.src = candidates[cIdx];
          }
        };
        cabinPovImg.src = candidates[0];
      }

      if (flightVideo) flightVideo.pause();
    } else {
      // Direct Window Portal (POV Window)
      if (stage) {
        stage.classList.remove('pov-cabin-interior', 'pov-middle', 'pov-aisle', 'pov-firstclass', 'pov-car-front', 'pov-car-rear', 'pov-bus-front', 'pov-bus-berth');
        stage.classList.add('pov-window');
      }
      loadVideoScene(info.img);
    }

    if (seatDatum) seatDatum.textContent = `${seatCode} · ${info.type}`;
    if (traySeatLabel) traySeatLabel.textContent = `${seatCode} · ${info.type}`.toUpperCase();

    // Update active class on popover buttons & mini-grid buttons
    document.querySelectorAll('.seat-switch-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.seat === seatCode);
    });
    document.querySelectorAll('.popover-seat-grid-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.seat === seatCode);
    });

    // Update videoSceneSelect if present
    if (videoSceneSelect) {
      const filename = info.img.split('/').pop();
      const matchOpt = [...videoSceneSelect.options].find((opt) => opt.value.includes(filename));
      if (matchOpt) videoSceneSelect.value = matchOpt.value;
    }

    // Save to active session
    try {
      const d = JSON.parse(localStorage.getItem('focusFlightActive') || '{}');
      d.seat = seatCode;
      d.seatType = info.type;
      d.sceneImg = info.img;
      localStorage.setItem('focusFlightActive', JSON.stringify(d));
    } catch(e) {}
  }

  // Reading Spotlight Toggle (Aisle Seat)
  let isSpotlightOn = true;
  if (spotlightToggleBtn && readingSpotlightLayer) {
    spotlightToggleBtn.addEventListener('click', () => {
      isSpotlightOn = !isSpotlightOn;
      readingSpotlightLayer.classList.toggle('off', !isSpotlightOn);
      spotlightToggleBtn.classList.toggle('off', !isSpotlightOn);
      spotlightToggleBtn.textContent = isSpotlightOn ? '💡 Reading Spotlight: ON' : '💡 Reading Spotlight: OFF';
      playCabinTwoToneChime();
    });
  }

  // Smart Tint Toggle (First Class Suite)
  const tintLabels = ['🪟 Smart Tint: Clear', '🪟 Smart Tint: 25%', '🪟 Smart Tint: 50%', '🪟 Smart Tint: 75%', '🪟 Smart Tint: Cobalt'];
  let tintIdx = 2;
  if (smartTintBtn) {
    smartTintBtn.addEventListener('click', () => {
      tintIdx = (tintIdx + 1) % tintLabels.length;
      smartTintBtn.textContent = tintLabels[tintIdx];
      const smartTintGlass = document.getElementById('smartTintGlass');
      if (smartTintGlass) {
        smartTintGlass.style.opacity = String(tintIdx * 0.22);
      }
      playCabinTwoToneChime();
    });
  }

  // Populate Mini Aircraft Seat Grid (Rows 01 to 15, Seats A-F)
  const gridContainer = document.getElementById('popoverAircraftGrid');
  if (gridContainer && gridContainer.children.length === 0) {
    for (let r = 1; r <= 15; r++) {
      const rowNum = String(r).padStart(2, '0');
      const rowDiv = document.createElement('div');
      rowDiv.className = 'popover-grid-row';

      const numSpan = document.createElement('span');
      numSpan.className = 'popover-grid-row-num';
      numSpan.textContent = rowNum;
      rowDiv.appendChild(numSpan);

      const isFirst = r <= 2;
      const cols = isFirst ? ['A', 'B', 'aisle', 'E', 'F'] : ['A', 'B', 'C', 'aisle', 'D', 'E', 'F'];

      cols.forEach((col) => {
        if (col === 'aisle') {
          const aisleDiv = document.createElement('div');
          aisleDiv.className = 'popover-grid-aisle';
          rowDiv.appendChild(aisleDiv);
          return;
        }
        const seatCode = `${rowNum}${col}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'popover-seat-grid-btn';
        if (col === 'A' || col === 'F') btn.classList.add('window-seat');
        if (isFirst) btn.classList.add('first-class');
        btn.dataset.seat = seatCode;
        btn.textContent = col;
        btn.title = `Seat ${seatCode} (${col === 'A' || col === 'F' ? 'Window' : col === 'B' || col === 'E' ? 'Middle Desk' : 'Aisle'})`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          applySeatPerspective(seatCode);
          if (seatSwitchPopover) seatSwitchPopover.hidden = true;
          playCabinTwoToneChime();
        });
        rowDiv.appendChild(btn);
      });
      gridContainer.appendChild(rowDiv);
    }
  }

  // Popover Tab Switching (Curated POVs vs All Seats Grid)
  const tabCurated = document.getElementById('tabCurated');
  const tabAllSeats = document.getElementById('tabAllSeats');
  const popoverCuratedView = document.getElementById('popoverCuratedView');
  const popoverAllSeatsView = document.getElementById('popoverAllSeatsView');

  if (tabCurated && tabAllSeats && popoverCuratedView && popoverAllSeatsView) {
    tabCurated.addEventListener('click', (e) => {
      e.stopPropagation();
      tabCurated.classList.add('active');
      tabAllSeats.classList.remove('active');
      popoverCuratedView.hidden = false;
      popoverAllSeatsView.hidden = true;
    });

    tabAllSeats.addEventListener('click', (e) => {
      e.stopPropagation();
      tabAllSeats.classList.add('active');
      tabCurated.classList.remove('active');
      popoverCuratedView.hidden = true;
      popoverAllSeatsView.hidden = false;
    });
  }

  // Detect Active Transit Mode & Seat
  const urlParamMode = new URLSearchParams(window.location.search).get('mode');
  const urlParamSeat = new URLSearchParams(window.location.search).get('seat');
  const currentTransitMode = urlParamMode || savedFlightData?.transitMode || 'flight';
  const popoverModeBadge = document.getElementById('popoverModeBadge');
  const popoverFlightSections = document.getElementById('popoverFlightSections');
  const popoverCarSection = document.getElementById('popoverCarSection');
  const popoverBusSection = document.getElementById('popoverBusSection');

  if (popoverModeBadge) {
    if (currentTransitMode === 'car') {
      popoverModeBadge.textContent = '🚗 CAR';
      if (popoverCarSection) popoverCarSection.hidden = false;
      if (popoverFlightSections) popoverFlightSections.hidden = true;
      if (popoverBusSection) popoverBusSection.hidden = true;
      if (tabAllSeats) tabAllSeats.style.display = 'none';
    } else if (currentTransitMode === 'bus') {
      popoverModeBadge.textContent = '🚌 BUS';
      if (popoverBusSection) popoverBusSection.hidden = false;
      if (popoverFlightSections) popoverFlightSections.hidden = true;
      if (popoverCarSection) popoverCarSection.hidden = true;
      if (tabAllSeats) tabAllSeats.style.display = 'none';
    } else {
      popoverModeBadge.textContent = '✈️ FLIGHT';
      if (popoverFlightSections) popoverFlightSections.hidden = false;
      if (popoverCarSection) popoverCarSection.hidden = true;
      if (popoverBusSection) popoverBusSection.hidden = true;
    }
  }

  // Update Cockpit / Vehicle Telemetry HUD
  const tLabel1 = document.getElementById('telemLabel1');
  const tVal1 = document.getElementById('telemVal1');
  const tLabel2 = document.getElementById('telemLabel2');
  const tVal2 = document.getElementById('telemVal2');
  const tLabel3 = document.getElementById('telemLabel3');
  const tVal3 = document.getElementById('telemVal3');
  const tLabel4 = document.getElementById('telemLabel4');
  const tVal4 = document.getElementById('telemVal4');

  if (currentTransitMode === 'car') {
    if (tLabel1) tLabel1.textContent = 'SPD';
    if (tVal1) tVal1.textContent = '68 MPH';
    if (tLabel2) tLabel2.textContent = 'GEAR';
    if (tVal2) tVal2.textContent = 'D7';
    if (tLabel3) tLabel3.textContent = 'ROAD';
    if (tVal3) tVal3.textContent = 'WET HWY';
    if (tLabel4) tLabel4.textContent = 'CABIN';
    if (tVal4) tVal4.textContent = 'WARM';
  } else if (currentTransitMode === 'bus') {
    if (tLabel1) tLabel1.textContent = 'SPD';
    if (tVal1) tVal1.textContent = '55 MPH';
    if (tLabel2) tLabel2.textContent = 'ROUTE';
    if (tVal2) tVal2.textContent = 'COACH';
    if (tLabel3) tLabel3.textContent = 'BERTH';
    if (tVal3) tVal3.textContent = 'PRIV';
    if (tLabel4) tLabel4.textContent = 'CABIN';
    if (tVal4) tVal4.textContent = 'SLEEP';
  } else {
    if (tLabel1) tLabel1.textContent = 'ALT';
    if (tVal1) tVal1.textContent = '36,000 FT';
    if (tLabel2) tLabel2.textContent = 'GS';
    if (tVal2) tVal2.textContent = '518 KTS';
    if (tLabel3) tLabel3.textContent = 'OAT';
    if (tVal3) tVal3.textContent = '-54°C';
    if (tLabel4) tLabel4.textContent = 'CABIN';
    if (tVal4) tVal4.textContent = 'NORM';
  }

  // Update Brand Icon & Title based on Mode
  const brandIcon = document.getElementById('brandIcon');
  const brandTitle = document.getElementById('brandTitle');
  if (currentTransitMode === 'car') {
    if (brandIcon) brandIcon.textContent = '🚗';
    if (brandTitle) brandTitle.textContent = 'Flylofi Drive';
  } else if (currentTransitMode === 'bus') {
    if (brandIcon) brandIcon.textContent = '🚌';
    if (brandTitle) brandTitle.textContent = 'Flylofi Bus';
  } else {
    if (brandIcon) brandIcon.textContent = '✈';
    if (brandTitle) brandTitle.textContent = 'Flylofi';
  }

  // Initialize seat from storage or default
  const defaultSeat = currentTransitMode === 'car' ? 'FP' : currentTransitMode === 'bus' ? '01A' : '14A';
  const initialSeat = (urlParamSeat || savedFlightData?.seat || defaultSeat).toUpperCase();
  applySeatPerspective(initialSeat);

  // In-Flight Seat Picker Popover Toggle
  if (seatDatum && seatSwitchPopover) {
    seatDatum.addEventListener('click', (e) => {
      e.stopPropagation();
      seatSwitchPopover.hidden = !seatSwitchPopover.hidden;
    });

    document.addEventListener('click', (e) => {
      if (!seatSwitchPopover.contains(e.target) && e.target !== seatDatum) {
        seatSwitchPopover.hidden = true;
      }
    });

    document.querySelectorAll('.seat-switch-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const seat = btn.dataset.seat;
        applySeatPerspective(seat);
        seatSwitchPopover.hidden = true;
        playCabinTwoToneChime();
      });
    });
  }

  // Flight Navigation Return Button (Reliable Dual Message & Hash Navigation)
  const standaloneBtn = document.getElementById('standaloneExitBtn');
  if (standaloneBtn) {
    standaloneBtn.addEventListener('click', () => {
      window.location.href = 'index.html#ticket';
    });
  }
  const returnBtn = document.getElementById('cruiseReturnBtn');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      if (window.self !== window.top) {
        window.parent.postMessage({ type: 'flylofi-exit-cruise' }, '*');
        window.parent.postMessage({ type: 'flylofi-exit' }, '*');
      } else {
        window.location.href = 'index.html#ticket';
      }
    });
  }

  // Legacy Global API Aliases
  window.FlyLofiAudio = {
    play: startTrackPlayback,
    pause: () => { lofiAudio.pause(); updatePlayButtonUI(false); },
    togglePlay: togglePlayPause,
    toggleCabin: toggleCabin,
    setVolume: (val) => {
      if (volumeSlider) volumeSlider.value = String(val);
      updateAudioVolumes();
    },
    loadScene: loadVideoScene,
    playChime: playCabinTwoToneChime,
    setShade: setShadePull
  };
})();
