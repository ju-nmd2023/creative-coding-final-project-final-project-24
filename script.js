let handpose;
let video;
let hands = [];
let prevHandPos = null;

let colorPicker, brushSizeSlider, opacitySlider, clearButton;
let colorButtons = [];

let synth, loop;
let audioStarted = false;
let audioButton;

function preload() {
  handpose = ml5.handPose();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  handpose.detectStart(video, getHandsData);

  colorPicker = createColorPicker('#ff0000ff');
  colorPicker.position(10, 10);

  brushSizeSlider = createSlider(2, 50, 5);
  brushSizeSlider.position(10, 40);

  opacitySlider = createSlider(10, 255, 180);
  opacitySlider.position(10, 70);

  clearButton = createButton('Rensa canvas');
  clearButton.position(10, 100);
  clearButton.mousePressed(() => background(0));
  colorPicker.input(() => prevHandPos = null);

  initAudio();
  background(0);
}

function draw() {
  for (let hand of hands) {
    let indexFinger = hand.index_finger_tip;
    let thumb = hand.thumb_tip;

    let centerX = width - (indexFinger.x + thumb.x) / 2;
    let centerY = (indexFinger.y + thumb.y) / 2;

    if (prevHandPos != null) {
      let distance = dist(prevHandPos.x, prevHandPos.y, centerX, centerY);
      let numParticles = int(distance / 5);

      for (let i = 0; i <= numParticles; i++) {
        let t = i / numParticles;
        let x = lerp(prevHandPos.x, centerX, t);
        let y = lerp(prevHandPos.y, centerY, t);

        x += random(-2, 2);
        y += random(-2, 2);

        noStroke();
        let c = colorPicker.color();
        c.setAlpha(opacitySlider.value());
        fill(c);
        ellipse(x, y, random(brushSizeSlider.value() / 2, brushSizeSlider.value()));
      }

      if (audioStarted && synth) {
        let freq = map(centerX, 0, width, 200, 1000);
        let vol = map(centerY, 0, height, -20, 0);
        synth.volume.value = vol;

        if (distance > 10) {
          synth.triggerAttackRelease(freq, "16n");
        }
      }
    }

    prevHandPos = { x: centerX, y: centerY };
  }
}

function getHandsData(results) {
  hands = results;
}

async function initAudio() {
  synth = new Tone.Synth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.05,
      decay: 0.1,
      sustain: 0.3,
      release: 0.5
    }
  }).toDestination();

  synth.volume.value = -12;

  audioButton = createButton('Starta Musik');
  audioButton.position(150, 10);
  audioButton.mousePressed(toggleAudio);
}
async function toggleAudio() {
  if (!audioStarted) {
    try {
      await Tone.start();
      console.log('Audio context started');

      synth.triggerAttackRelease('C4', '4n');
      console.log('Test note played');

      audioStarted = true;
      audioButton.html('Stop Sound');
    } catch (error) {
      console.error('Error starting audio:', error);
    }
  } else {
    Tone.Transport.stop();
    audioStarted = false;
    audioButton.html('Start Sound');
  }
}
