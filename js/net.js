document.addEventListener('DOMContentLoaded', function(){
const canvas = document.querySelector('.canvas');
const c = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
let title = document.querySelector('.title');
let titleBox = title.getBoundingClientRect();

class Particle {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.baseX = this.x;
    this.baseY = this.y;
    this.directionX = Math.random() * 4 - 2;
    this.directionY = Math.random() * 4 - 2;
    this.collision = false;
  }
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }
  update() {
    this.x += this.directionX;
    this.y += this.directionY;
    if (this.x + this.radius + this.directionX >= canvas.width || this.x - this.radius + this.directionX <= 0) {
      this.directionX = -this.directionX;
    }
    if (this.y + this.radius + this.directionY >= canvas.height || this.y - this.radius + this.directionY <= 0) {
      this.directionY = -this.directionY;
    }
    
    if (this.x + this.radius > titleBox.left && this.x - this.radius < titleBox.left + titleBox.width && this.y + this.radius > titleBox.top && this.y - this.radius < titleBox.top + titleBox.height) {
      this.collision = true;
    } else {
      this.collision = false;    
    }
    if (this.collision === true && this.x + this.radius < titleBox.left + 10) {
      this.directionX = -this.directionX;
    } else if (this.collision === true && this.x - this.radius > titleBox.left + titleBox.width - 10) {
      this.directionX = -this.directionX;
    } else if (this.collision === true && this.y + this.radius < titleBox.top + 10) {
      this.directionY = -this.directionY;
    } else if (this.collision === true && this.y - this.radius > titleBox.top + titleBox.height - 10) {
      this.directionY = -this.directionY;
    }
    
  }
}

function init() {
  for (let i = 0; i < 30; i++) {
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    // let radius = Math.random() * 10 +2;
    const radius = 2;
    // let color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
    const color = `rgb(255, 255, 255)`;
    particlesArray.push(new Particle(x, y, radius, color));
  }
}
init();

function animate() {
  c.clearRect(0,0,canvas.width,canvas.height);
  
  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].draw();
    particlesArray[i].update();
    for (let j = i; j < particlesArray.length; j++) {
      // const angle = Math.atan2(particlesArray[i].y - particlesArray[j].y, 
      //                       particlesArray[i].x - particlesArray[j].x);
      // const velocity = {
      //   x: Math.cos(angle) * 3,
      //   y: Math.sin(angle) * 3
      // }
      let dx = particlesArray[i].x - particlesArray[j].x;
      let dy = particlesArray[i].y - particlesArray[j].y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 250;
      let opacity = 1 - distance/maxDistance;
      if (distance < maxDistance) {
        c.lineWidth = 2;
        c.strokeStyle = `rgba(255,255,255,${opacity})`;
        // c.strokeStyle = `rgba(255,255,255,1)`
        c.beginPath();
        c.moveTo(particlesArray[i].x, particlesArray[i].y);
        c.lineTo(particlesArray[j].x, particlesArray[j].y);
        c.stroke();
      }
    }
  }
  // console.log(particlesArray[0].collision)
  requestAnimationFrame(animate);
}
animate();

});