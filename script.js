let handpose;
let video;
let hands = [];
let prevHandPos = null;

//https://chatgpt.com/share/68df9bc3-385c-800b-be39-8630fd09773c
let colorPicker, brushSizeSlider, opacitySlider, clearButton;
let presetColors = ['#ff00ff', '#00ffff', '#ffffff'];
let colorButtons = [];

let synth, loop;
let audioStarted = false;

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
    }
    
    prevHandPos = { x: centerX, y: centerY };
  }
}

function getHandsData(results) {
  hands = results;
}

let audioButton;

async function initAudio() {
  synth = new Tone.Synth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.3,
      release: 1
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
      
      loop = new Tone.Loop((time) => {
        let notes = ['C4', 'D4', 'E4', 'G4', 'A4'];
        let note = notes[Math.floor(Math.random() * notes.length)];
        console.log('Playing note:', note);
        synth.triggerAttackRelease(note, '8n', time);
      }, '2n'); 
      
      Tone.Transport.start();
      loop.start();
      audioStarted = true;
      
      audioButton.html('Stoppa Musik');
      
    } catch (error) {
      console.error('Error starting audio:', error);
    }
  } else {
    if (loop) {
      loop.stop();
      loop.dispose();
    }
    Tone.Transport.stop();
    audioStarted = false;
    audioButton.html('Starta Musik');
  }
}
