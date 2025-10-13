let handpose;
let video;
let hands = [];
let prevHandPos = null;

let colorPicker, brushSizeSlider, opacitySlider, clearButton, styleSlider;
let synth, loop;
let audioStarted = false;
let audioButton;

let particles = [];
let justReset = false;

function preload() {
  handpose = ml5.handPose();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  handpose.detectStart(video, getHandsData);

  colorPicker = createColorPicker('#ff00ff');
  colorPicker.position(10, 10);

  createP("Brush Size").position(10, 40).style("color", "#fff");
  brushSizeSlider = createSlider(2, 20, 5);
  brushSizeSlider.position(10, 70);

  createP("Opacity").position(10, 90).style("color", "#fff");
  opacitySlider = createSlider(10, 255, 180);
  opacitySlider.position(10, 120);

  createP("Particle Style").position(10, 140).style("color", "#fff");
  styleSlider = createSlider(0, 1, 0.3, 0.01);
  styleSlider.position(10, 170);

  clearButton = createButton('Reset Canvas');
  clearButton.position(10, 200);
  clearButton.mousePressed(resetCanvas);

  colorPicker.input(() => prevHandPos = null);

  initAudio();
  background(0);
  blendMode(ADD);
}

function draw() {
  if (!justReset) {
    fill(0, 0, 0, 25);
    rect(0, 0, width, height);
  } else {
    justReset = false;
  }

  for (let hand of hands) {
    let indexFinger = hand.index_finger_tip;
    let thumb = hand.thumb_tip;

    let centerX = width - (indexFinger.x + thumb.x) / 2;
    let centerY = (indexFinger.y + thumb.y) / 2;

    for (let i = 0; i < 10; i++) {
      let offsetX = random(-20, 20);
      let offsetY = random(-20, 20);
      particles.push(makeParticle(centerX + offsetX, centerY + offsetY));
    }

    if (audioStarted && synth) {
      let freq = map(centerX, 0, width, 200, 1000);
      let vol = map(centerY, 0, height, -20, 0);
      synth.volume.value = vol;

      if (frameCount % 10 === 0) {
        synth.triggerAttackRelease(freq, "16n");
      }
    }

    prevHandPos = { x: centerX, y: centerY };
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    updateParticle(particles[i]);
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function resetCanvas() {
  console.log("Resetting canvas...");
  
  particles = [];
  prevHandPos = null;
  
  blendMode(BLEND);
  background(0);
  blendMode(ADD);
  
  justReset = true;
  
  console.log("Canvas reset complete!");
}
function makeParticle(x, y) {
  let c = colorPicker.color();
  c.setAlpha(opacitySlider.value());
  return {
    x: x,
    y: y,
    vx: random(-1, 1),
    vy: random(-1, 1),
    life: random(100, 250),
    age: 0,
    size: random(brushSizeSlider.value() * 0.2, brushSizeSlider.value() * 0.6),
    c: c,
    noiseOffset: random(1000),
  };
}

function updateParticle(p) {
  let style = styleSlider.value();

  // --- rörelse och brusflöde ---
  let n = noise(p.x * 0.002, p.y * 0.002, frameCount * 0.01);
  let angle = n * TWO_PI * 2.0;
  p.vx += cos(angle) * 0.1;
  p.vy += sin(angle) * 0.1;

  // --- Vera Molnár-inspirerad geometrisk påverkan ---
  if (frameCount % 200 < 100) {
    // lockas mot närmaste "grid"-position för molnár-effekt
    let gridSize = 40;
    let targetX = round(p.x / gridSize) * gridSize;
    let targetY = round(p.y / gridSize) * gridSize;
    p.x = lerp(p.x, targetX, 0.02);
    p.y = lerp(p.y, targetY, 0.02);
  }

  // --- uppdatera position ---
  p.x += p.vx;
  p.y += p.vy;

  p.vx *= 0.95;
  p.vy *= 0.95;

  p.age++;
  p.life--;

  // --- färg och transparens ---
  let alpha = map(p.life, 0, 200, 0, opacitySlider.value());
  let c = color(red(p.c), green(p.c), blue(p.c), alpha);

  // --- olika visuella stilar beroende på slider ---
  if (style < 0.4) {
    noStroke();
    fill(c);
    ellipse(p.x, p.y, p.size);
  } else if (style >= 0.4 && style < 0.8) {
    noStroke();
    fill(c);
    ellipse(p.x, p.y, p.size * 0.6);
    push();
    stroke(c);
    strokeWeight(0.5);
    drawArtisticCircle(p.x, p.y, p.size, c);
    pop();
  } else {
    drawArtisticCircle(p.x, p.y, p.size, c);
  }
}


function drawArtisticCircle(x, y, size, c) {
  push();
  translate(x, y);
  noFill();
  stroke(c);
  strokeWeight(0.6);
  let r = size / 2;
  let loops = int(random(3, 5));
  let steps = int(random(20, 60));
  for (let i = 0; i < loops; i++) {
    beginShape();
    let px = random(-r, r);
    let py = random(-r, r);
    for (let j = 0; j < steps; j++) {
      vertex(px, py);
      let ang = random(TWO_PI);
      let stepLen = r * 0.15 * random(0.3, 1);
      px += cos(ang) * stepLen;
      py += sin(ang) * stepLen;
    }
    endShape();
  }
  pop();
}

function getHandsData(results) {
  hands = results;
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
