let handpose;
let video;
let hands = [];
let prevHandPos = null;

let colorPicker, brushSizeSlider, opacitySlider, clearButton, styleSlider;
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

  createP("Brush Size").position(10, 40).style("color", "#fff");
  brushSizeSlider = createSlider(5, 60, 15);
  brushSizeSlider.position(10, 70);

  createP("Opacity").position(10, 80).style("color", "#fff");
  opacitySlider = createSlider(10, 255, 180);
  opacitySlider.position(10, 110);

  createP("Particle Style").position(10, 120).style("color", "#fff");
  styleSlider = createSlider(0, 1, 0, 0.01);
  styleSlider.position(10, 150);

  clearButton = createButton('Reset canvas');
  clearButton.position(10, 180);
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

        let c = colorPicker.color();
        c.setAlpha(opacitySlider.value());

        let styleValue = styleSlider.value();

        if (styleValue < 0.5) {
          noStroke();
          fill(c);
          ellipse(x, y, random(brushSizeSlider.value() / 2, brushSizeSlider.value()));
        } else if (styleValue >= 0.5 && styleValue < 1) {
          let blend = map(styleValue, 0.5, 1, 0, 1);
          noStroke();
          let c2 = color(red(c), green(c), blue(c), opacitySlider.value() * (1 - blend));
          fill(c2);
          ellipse(x, y, random(brushSizeSlider.value() / 2, brushSizeSlider.value()));
          push();
          stroke(c);
          strokeWeight(0.6 + blend);
          drawArtisticCircle(x, y, brushSizeSlider.value() * blend, c);
          pop();
        } else {
          drawArtisticCircle(x, y, brushSizeSlider.value(), c);
        }
      }

      // My Sound
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

// Georg Nees–inspierd particale
function drawArtisticCircle(x, y, size, c) {
  push();
  translate(x, y);
  noFill();
  stroke(c);
  strokeWeight(0.8);

  let r = size / 2;
  let loops = int(random(3, 6)); 
  let steps = int(random(30, 100));

  for (let i = 0; i < loops; i++) {
    beginShape();
    let px = random(-r, r);
    let py = random(-r, r);
    for (let j = 0; j < steps; j++) {
      vertex(px, py);
      let ang = random(TWO_PI);
      let stepLen = r * 0.1 * random(0.3, 1);
      px += cos(ang) * stepLen;
      py += sin(ang) * stepLen;
    }
    endShape();
  }

  pop();
}

async function initAudio() {
  synth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.5 }
  }).toDestination();

  synth.volume.value = -12;

  audioButton = createButton('Start Sound');
  audioButton.position(150, 10);
  audioButton.mousePressed(toggleAudio);
}

async function toggleAudio() {
  if (!audioStarted) {
    try {
      await Tone.start();
      synth.triggerAttackRelease('C4', '4n');
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
