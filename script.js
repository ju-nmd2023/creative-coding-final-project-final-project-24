let handpose;
let video;
let hands = [];
let prevHandPos = null;

function preload() {
  handpose = ml5.handPose();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handpose.detectStart(video, getHandsData);
  
  background(0); 
}

function draw() {
  // Ta inte bort tidigare ritningar 
  
  for (let hand of hands) {
    let indexFinger = hand.index_finger_tip;
    let thumb = hand.thumb_tip;

    let centerX = (indexFinger.x + thumb.x) / 2;
    let centerY = (indexFinger.y + thumb.y) / 2;

    // Rita linje från föregående position till nuvarande position
    if (prevHandPos != null) {
      stroke(255, 100, 150); 
      strokeWeight(3);
      line(prevHandPos.x, prevHandPos.y, centerX, centerY);
    }
    
    prevHandPos = { x: centerX, y: centerY };
  }
}

function getHandsData(results) {
  hands = results;
}
