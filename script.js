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
  video.size(windowWidth, windowHeight);
  video.hide();

  handpose.detectStart(video, getHandsData);
  
  background(0); 
}

function draw() {
  // Ta inte bort tidigare ritningar 
  
  for (let hand of hands) {
    let indexFinger = hand.index_finger_tip;
    let thumb = hand.thumb_tip;

    let centerX = width - (indexFinger.x + thumb.x) / 2; // Inverterad x-led
    let centerY = (indexFinger.y + thumb.y) / 2;

    // Rita partiklar från föregående position till nuvarande position
    if (prevHandPos != null) {
      let distance = dist(prevHandPos.x, prevHandPos.y, centerX, centerY);
      let numParticles = int(distance / 5); // En partikel var 5:e pixel
      
      for (let i = 0; i <= numParticles; i++) {
        let t = i / numParticles;
        let x = lerp(prevHandPos.x, centerX, t);
        let y = lerp(prevHandPos.y, centerY, t);
        
        // Lägg till lite slumpmässig variation
        x += random(-3, 3);
        y += random(-3, 3);
        
        // Rita partikel
        noStroke();
        fill(255, 100, 150, 180);
        ellipse(x, y, random(2, 6));
      }
    }
    
    prevHandPos = { x: centerX, y: centerY };
  }
}

function getHandsData(results) {
  hands = results;
}
