let handpose;
let video;
let hands = [];
let prevHandPos = null;

//https://chatgpt.com/share/68df9bc3-385c-800b-be39-8630fd09773c
let colorPicker, brushSizeSlider, opacitySlider, clearButton;
let presetColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
let colorButtons = [];

function preload() {
  handpose = ml5.handPose();
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // --- Video & handpose ---
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();

  handpose.detectStart(video, getHandsData);

  // --- UI-element ---
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

  // Färgknappar
  for (let i = 0; i < presetColors.length; i++) {
    let btn = createButton('');
    btn.style('background-color', presetColors[i]);
    btn.size(30, 30);
    btn.position(10 + i * 35, 130);
    btn.mousePressed(() => {
      colorPicker.color(presetColors[i]);
      prevHandPos = null;
    });
    colorButtons.push(btn);
  }

  background(0);

  // --- Tone.js setup ---
  try {
    synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.2, release: 0.3 }
    });

    filter = new Tone.Filter(800, "lowpass").toDestination();
    synth.connect(filter);
  } catch (e) {
    console.error("Tone.js kunde inte initieras:", e);
  }

  // --- Ljudstart-knapp ---
  let startButton = createButton('🎵 Starta ljud');
  startButton.position(10, 170);
  startButton.mousePressed(async () => {
    try {
      await Tone.start();
      userStartAudio();
      console.log('🔊 Ljud aktiverat!');
      startButton.remove();
    } catch (err) {
      console.error('Kunde inte starta ljud:', err);
    }
  });
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
    }
    
    prevHandPos = { x: centerX, y: centerY };
  }
}

function getHandsData(results) {
  hands = results;
}
