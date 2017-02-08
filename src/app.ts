import {boxBlurImageData} from 'boxblur';

var getBallImage = (function(){
  var cache : {[goo: number]: {[radius: number]: HTMLCanvasElement}} = {};

  function getBallImage(goo: number, radius: number) {
    if (!cache[goo]) {
      cache[goo] = {};
    }
    if (!cache[goo][radius]) {
      var width = radius * 2;
      var height = radius * 2;

      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      var ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      var imageData = ctx.getImageData(0, 0, width, height);
      var data = imageData.data;

      for (var y = 0; y < height; ++y) {
        for (var x = 0; x < width; ++x) {
          var index = (y * width + x) * 4;
          var distanceToBall = Math.sqrt(Math.pow(x - radius, 2) + Math.pow(y - radius, 2));
          var intensity = Math.pow(Math.max(0, (1 - distanceToBall / radius)), goo) * 255;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 255;
          data[index + 3] = Math.floor(intensity);
        }
      }

      ctx.putImageData(imageData, 0, 0);

      cache[goo][radius] = canvas;
    }

    return cache[goo][radius];
  }

  return getBallImage;
})();

class SPHRenderer {
  bufferA: HTMLCanvasElement = document.createElement('canvas');
  bufferB: HTMLCanvasElement = document.createElement('canvas');
  contextA: CanvasRenderingContext2D = this.bufferA.getContext('2d') as CanvasRenderingContext2D;
  contextB: CanvasRenderingContext2D = this.bufferB.getContext('2d') as CanvasRenderingContext2D;
  scale: number = 0.25;
  trailPersistence: number = 0.8;

  constructor(private context: CanvasRenderingContext2D) {
    this.bufferA.width = this.bufferB.width = context.canvas.width * this.scale;
    this.bufferA.height = this.bufferB.height = context.canvas.height * this.scale;
  }

  render(particles: Vector2[]) {
    var threshold = 0.1;
    var goo = 1.3;
    var thresholdBallConst = -(Math.pow(threshold, 1 / goo) - 1);
    var colorThreshold = threshold*255;
    var foamThreshold = threshold / 1.5 * 255;
    var radius = 10 * this.scale;


    // Begin buffer swapping
    this.contextB.clearRect(0, 0, this.bufferA.width, this.bufferA.height);
    this.contextB.globalAlpha = this.trailPersistence;
    this.contextB.drawImage(this.bufferA, 0, 0);

    this.contextA.clearRect(0, 0, this.bufferA.width, this.bufferA.height);
    this.contextA.drawImage(this.bufferB, 0, 0);

    var imageData = this.contextA.getImageData(0, 0, this.bufferA.width, this.bufferA.height);
    boxBlurImageData(imageData, this.bufferA.width, this.bufferA.height, 16 * this.scale, 1);
    this.contextA.putImageData(imageData, 0, 0);
    // End buffer swapping

    // Begin rendering

    for (var particle of particles) {
      //var radius = 5 + 25 * (particle as SPHParticle).neighborsCount / 25;
      var x = particle.x * this.scale;
      var y = particle.y * this.scale;
      var image = getBallImage(goo, radius);
      this.contextA.drawImage(image, (x - radius) | 0, (y - radius) | 0);
    }

    // End rendering

    this.context.drawImage(this.bufferA, 0, 0, this.context.canvas.width, this.context.canvas.height);

    var imageData = this.context.getImageData(0, 0, this.context.canvas.width, this.context.canvas.height);
    var data = imageData.data;

    for (var i = 0, len = data.length; i < len; i += 4) {
      var index = i + 3;

      var value = data[index];

      if (value >= colorThreshold) {
        data[index] = 255;
        data[index - 1] = 250;
        data[index - 2] = 50;
      } else if (value >= foamThreshold) {
        data[index] = 255;
        data[index - 1] = 220;
        data[index - 2] = 150;
      } else {
        data[index] = 0;
      }
    }

    this.context.putImageData(imageData, 0, 0);
  }
}


interface SPHParticle {
  xPrev: number;
  yPrev: number;
  density: number;
  densityNear: number;
  pressure: number;
  pressureNear: number;
  x: number;
  y: number;
  vx: number;
  vy: number;

  spatialCellIndex: number;
}

interface Vector2 {
  x: number;
  y: number;
}

class SPHSimulator {
  public readonly particles: SPHParticle[] = [];
  public gravityX: number = 0;
  public gravityY: number = 20;
  public interactionRadius: number = 35;          // 20
  public readonly worldBoundsXMin: number = 0;
  public readonly worldBoundsYMin: number = 0;
  public readonly worldBoundsXMax: number = 800;
  public readonly worldBoundsYMax: number = 600;
  public readonly worldBoundsWidth: number = this.worldBoundsXMax - this.worldBoundsXMin;
  public readonly worldBoundsHeight: number = this.worldBoundsYMax - this.worldBoundsYMin;

  public readonly maxParticleNeighbors: number = 25;
  private readonly tempNeighbors: SPHParticle[] = new Array(this.maxParticleNeighbors);
  private readonly tempPotentialNeighborArrays: SPHParticle[][] = new Array(9);
  private readonly emptyArray: any[] = [];

  public readonly stiffness: number = 0.04;      // 0.04
  public readonly stiffnessNear: number = 0.01;   // 0.01
  public readonly kSpring: number = 0.3;          // 0.3
  public readonly alpha: number = 0.3;            // 0.3
  public readonly densiyRest: number = 10;        // 10
  public readonly velocityCap: number = 150;      // 150
  public readonly sigma: number = 0;              // 0
  public readonly beta: number = 0.3;             // 0.3
  public readonly constantTimestep: number = 1 / 60;

  public readonly space: SPHParticle[][];
  public readonly spaceCellSize: number;
  public readonly spaceWidth: number;
  public readonly spaceHeight: number;
  public readonly spaceSize: number;
  public readonly spaceUpdateSkipFrames: number = 8;

  constructor() {
    this.spaceCellSize = this.interactionRadius + this.getMaxParticleMovementPerFrame() * this.spaceUpdateSkipFrames + 1;
    this.spaceWidth = Math.ceil(this.worldBoundsWidth / this.spaceCellSize);
    this.spaceHeight = Math.ceil(this.worldBoundsHeight / this.spaceCellSize);
    this.spaceSize = Math.ceil(this.spaceWidth * this.spaceHeight);
    this.space = new Array(this.spaceSize);
    for (var i = 0; i < this.spaceSize; ++i) {
      this.space[i] = [];
    }
  }

  pointWithinBounds(x: number, y: number): boolean {
    return (x >= this.worldBoundsXMin) && (x < this.worldBoundsXMax) && (y >= this.worldBoundsYMin) && (y < this.worldBoundsYMax);
  }

  getSpatialCellIndexFor(x: number, y: number) {
    var spaceCellX = (x / this.spaceCellSize) | 0;
    var spaceCellY = (y / this.spaceCellSize) | 0;
    var spaceCellIndex = (spaceCellY * this.spaceWidth + spaceCellX) | 0;
    return spaceCellIndex;
  }

  updateSpace() {
    var len = this.particles.length;

    for (var i = 0; i < len; ++i) {
      var particle = this.particles[i];
      var x = particle.x;
      var y = particle.y;

      if (!this.pointWithinBounds(x, y)) continue;

      var newSpatialCellIndex = this.getSpatialCellIndexFor(x, y);
      var oldSpatialCellIndex = particle.spatialCellIndex;

      if (oldSpatialCellIndex !== newSpatialCellIndex) {
        var newCell = this.space[newSpatialCellIndex];
        var oldCell = this.space[oldSpatialCellIndex];

        var oldCellMaxIndex = oldCell.length - 1;
        var oldCellIndexOfParticle = oldCell.indexOf(particle);
        oldCell[oldCellIndexOfParticle] = oldCell[oldCellMaxIndex];
        oldCell.length -= 1;

        newCell.push(particle);
        particle.spatialCellIndex = newSpatialCellIndex;
      }
    }
  }

  getMaxParticleMovementPerFrame() {
    return this.velocityCap * 1.1 * this.constantTimestep;
  }

  distance(a: Vector2, b: Vector2): number {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  addParticle(x: number, y: number, vx: number = 0, vy: number = 0) {
    var spatialCellIndex = this.getSpatialCellIndexFor(x, y);
    var particle = {x, y, vx, vy,
      xPrev: x,
      yPrev: y,
      density: 0,
      densityNear: 0,
      pressure: 0,
      pressureNear: 0,

      spatialCellIndex: spatialCellIndex,
      // debugging
      neighborsCount: 0
    };
    this.particles.push(particle);
    this.space[spatialCellIndex].push(particle);
  }

getParticleNeighbors(originParticleIndex: number) {
    // Constants
    var maxNeighbors = this.maxParticleNeighbors;
    var spaceWidth = this.spaceWidth;
    var interactionRadiusSquared = this.interactionRadius * this.interactionRadius;
    var emptyArray = this.emptyArray;
    var space = this.space;
    var spaceSize = this.spaceSize;

    // Reusable arrays
    var tempNeighbors = this.tempNeighbors;
    tempNeighbors.length = maxNeighbors;
    var tempPotentialNeighborArrays = this.tempPotentialNeighborArrays;

    // Origin particle data
    var originParticle = this.particles[originParticleIndex];
    var originX = originParticle.x;
    var originY = originParticle.y;

    var originCellX = originParticle.spatialCellIndex % this.spaceWidth;
    var originCellY = (originParticle.spatialCellIndex / this.spaceWidth) | 0;
    var originCellYMulWidth = originCellY * this.spaceWidth;
    var leftCellX = originCellX - 1;
    var rightCellX = originCellX + 1;
    var topCellYMulWidth = (originCellY - 1) * this.spaceWidth;
    var bottomCellYMulWidth = (originCellY + 1) * this.spaceWidth;

    // Get 9 arrays of potential neighbors
    // Center, Top, Right, Bottom, Left, TL, TR, BR, BL
    var centerIndex = originParticle.spatialCellIndex;
    var topIndex = topCellYMulWidth + originCellX;
    var rightIndex = originCellYMulWidth + rightCellX;
    var bottomIndex = bottomCellYMulWidth + originCellX;
    var leftIndex = originCellYMulWidth + leftCellX;
    var topLeftIndex = topCellYMulWidth + leftCellX;
    var topRightIndex = topCellYMulWidth + rightCellX;
    var bottomRightIndex = bottomCellYMulWidth + rightCellX;
    var bottomLeftIndex = bottomCellYMulWidth + leftCellX;

    tempPotentialNeighborArrays[0] = space[centerIndex];
    tempPotentialNeighborArrays[1] = (topIndex >= 0 && topIndex < spaceSize) ? space[topIndex] : emptyArray;
    tempPotentialNeighborArrays[2] = (rightIndex >= 0 && rightIndex < spaceSize) ? space[rightIndex] : emptyArray;
    tempPotentialNeighborArrays[3] = (bottomIndex >= 0 && bottomIndex < spaceSize) ? space[bottomIndex] : emptyArray;
    tempPotentialNeighborArrays[4] = (leftIndex >= 0 && leftIndex < spaceSize) ? space[leftIndex] : emptyArray;
    tempPotentialNeighborArrays[5] = (topLeftIndex >= 0 && topLeftIndex < spaceSize) ? space[topLeftIndex] : emptyArray;
    tempPotentialNeighborArrays[6] = (topRightIndex >= 0 && topRightIndex < spaceSize) ? space[topRightIndex] : emptyArray;
    tempPotentialNeighborArrays[7] = (bottomRightIndex >= 0 && bottomRightIndex < spaceSize) ? space[bottomRightIndex] : emptyArray;
    tempPotentialNeighborArrays[8] = (bottomLeftIndex >= 0 && bottomLeftIndex < spaceSize) ? space[bottomLeftIndex] : emptyArray;

    var nextAddedIndex = 0;
    for (var i = 0; i < tempPotentialNeighborArrays.length; ++i) {
      var potentialNeighborsArray = tempPotentialNeighborArrays[i];

      for (var j = 0; j < potentialNeighborsArray.length; ++j) {
        var particle = potentialNeighborsArray[j];
        if (particle === originParticle) continue;

        var dx = particle.x - originX;
        var dy = particle.y - originY;
        if (dx*dx + dy*dy >= interactionRadiusSquared) continue;

        tempNeighbors[nextAddedIndex++] = particle;
        if (nextAddedIndex > maxNeighbors) break;
      }

    }

    tempNeighbors.length = nextAddedIndex;

    return tempNeighbors;
  }

  tempInverseQCache: number[] = new Array(this.maxParticleNeighbors);
  tempMagnitudeCache: number[] = new Array(this.maxParticleNeighbors);
  doubleDensityRelax(dt: number) {
    var tempInverseQCache = this.tempInverseQCache;
    var tempMagnitudeCache = this.tempMagnitudeCache;

    var particles = this.particles;

    var len = particles.length;

    for (var i = 0; i < len; ++i) {
      var particleA = particles[i];
      var particleAX = particleA.x;
      var particleAY = particleA.y;
      var neighbors: ArrayLike<SPHParticle> = this.getParticleNeighbors(i);

      particleA.pressure = 0;
      particleA.pressureNear = 0;

      for (var j = 0; j < neighbors.length; ++j) {
        var particleB = neighbors[j];

        var rij = tempMagnitudeCache[j] = this.distance(particleA, particleB);

        var q = rij / this.interactionRadius;
        var inverseQ = tempInverseQCache[j] = 1 - q;
        var inverseQSquared = inverseQ * inverseQ;

        particleA.density += inverseQSquared;
        particleA.densityNear += inverseQSquared * inverseQ;
      }

      particleA.pressure = this.stiffness * (particleA.density - this.densiyRest);
      particleA.pressureNear = this.stiffnessNear * particleA.densityNear;

      var dx = 0;
      var dy = 0;

      for (var j = 0; j < neighbors.length; ++j) {
        var particleB = neighbors[j];

        //var rij = this.distance(particleA, particleB);

        //var q = rij / this.interactionRadius;
        var inverseQ = tempInverseQCache[j];

        var rij_dx = particleB.x - particleAX;
        var rij_dy = particleB.y - particleAY;
        //var magnitude = Math.sqrt(rij_dx*rij_dx + rij_dy*rij_dy);
        var magnitude = tempMagnitudeCache[j];

        if (magnitude === 0) continue;

        var k = dt*dt * (particleA.pressure * inverseQ + particleA.pressureNear * inverseQ*inverseQ) / magnitude;
        var displacementX = k * rij_dx;
        var displacementY = k * rij_dy;


        particleB.x += displacementX / 2;
        particleB.y += displacementY / 2;
        dx -= displacementX / 2;
        dy -= displacementY / 2;
      }

      particleA.x += dx;
      particleA.y += dy;
    }
  }

  applyViscosity(dt: number) {
    var sigma = this.sigma;
    var beta = this.beta;

    var len = this.particles.length;
    for (var i = 0; i < len; ++i) {
      var particleA = this.particles[i];

      var neighbors = this.getParticleNeighbors(i);

      for (var j = 0, neighborsLen = neighbors.length; j < neighborsLen; ++j) {
        var particleB = neighbors[j];

        var rijX = particleB.x - particleA.x;
        var rijY = particleB.y - particleA.y;
        var rijMagnitude = Math.sqrt(rijX*rijX + rijY*rijY);

        var rijXNorm = rijX / rijMagnitude;
        var rijYNorm = rijY / rijMagnitude;

        var q = rijMagnitude / this.interactionRadius;

        var u = (particleA.vx - particleB.vx) * rijXNorm + (particleA.vy - particleB.vy) * rijYNorm;

        if (u > 0) {
          var k = dt * (1 - q) * (sigma * u + beta * u * u) * 0.5;
          var IxHalf = k * rijXNorm;
          var IyHalf = k * rijYNorm;

          particleA.vx -= IxHalf;
          particleA.vy -= IyHalf;

          particleB.vx += IxHalf;
          particleB.vy += IyHalf;
        }

      }
    }
  }

  spaceUpdateCountdown: number = this.spaceUpdateSkipFrames;
  update(dt: number) {
    this.applyViscosity(dt);

    for (var i = 0; i < this.particles.length; ++i) {
      var particle = this.particles[i];

      particle.xPrev = particle.x;
      particle.yPrev = particle.y;

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }

    this.doubleDensityRelax(dt);

    for (var i = 0; i < this.particles.length; ++i) {
      var particle = this.particles[i];

      particle.vx = (particle.x - particle.xPrev) / dt;
      particle.vy = (particle.y - particle.yPrev) / dt;
      particle.vx += this.gravityX * dt;
      particle.vy += this.gravityY * dt;

      var tempVX = 0;
      var tempVY = 0;
      if (particle.x > this.worldBoundsXMax) tempVX -= particle.x - this.worldBoundsXMax;
      if (particle.y > this.worldBoundsYMax) tempVY -= particle.y - this.worldBoundsYMax;
      if (particle.x < this.worldBoundsXMin) tempVX += this.worldBoundsXMin - particle.x;
      if (particle.y < this.worldBoundsYMin) tempVY += this.worldBoundsYMin - particle.y;
      particle.vx += tempVX;
      particle.vy += tempVY;

      if (particle.vx < -this.velocityCap) particle.vx = -this.velocityCap;
      if (particle.vx > this.velocityCap) particle.vx = this.velocityCap;
      if (particle.vy < -this.velocityCap) particle.vy = -this.velocityCap;
      if (particle.vy > this.velocityCap) particle.vy = this.velocityCap;
    }


    if (--this.spaceUpdateCountdown <= 0) {
      this.updateSpace();
      this.spaceUpdateCountdown = this.spaceUpdateSkipFrames;
    }
  }
}

var requestFrame: (f: Function) => number = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window['mozRequestAnimationFrame'] ||
  function(f: Function) {
    return setTimeout(f, 0);
  };

function main() {
    var canvas = document.getElementById('display') as HTMLCanvasElement;
    var context = canvas.getContext('2d') as CanvasRenderingContext2D;

    var mouseX: number = -1;
    var mouseY: number = -1;
    var pourThrottle: number = 1 / 30;
    var pourTime: number = Infinity;

    var onPointerDown = function(event: any) {
      event.preventDefault();

      mouseX = (event.clientX || event.touches[0].clientX - (event.target as HTMLElement).offsetLeft);
      mouseY = (event.clientY || event.touches[0].clientY - (event.target as HTMLElement).offsetTop);
      pourTime = 0;
    };

    var onPointerMove = function(event: any) {
      mouseX = (event.clientX || event.touches[0].clientX - (event.target as HTMLElement).offsetLeft);
      mouseY = (event.clientY || event.touches[0].clientY - (event.target as HTMLElement).offsetTop);
    };

    var onPointerUp = function(event: any) {
      mouseX = (event.clientX || event.touches[0].clientX - (event.target as HTMLElement).offsetLeft);
      mouseY = (event.clientY || event.touches[0].clientY - (event.target as HTMLElement).offsetTop);
      pourTime = Infinity;
    };

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', onPointerDown);

    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchmove', onPointerMove);

    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchend', onPointerUp);
    canvas.addEventListener('touchcancel', onPointerUp);

    var sphSimulator = new SPHSimulator();
    var particleRenderer = new SPHRenderer(context);

    for (var i = 0; i < 300; ++i) {
      sphSimulator.addParticle(Math.random() * canvas.width, Math.random() * canvas.height, 0, 0);
    }

    function fixedUpdate(dt: number) {
      sphSimulator.update(dt);
    }

    var frame = 0;
    function render() {
      context.fillStyle = 'white';
      context.clearRect(0, 0, canvas.width, canvas.height);

      particleRenderer.render(sphSimulator.particles);

      /*context.strokeStyle = 'white';
      context.fillStyle = 'transparent';
      for (var i = 0; i < sphSimulator.spaceSize; ++i) {
        var x = (i % sphSimulator.spaceWidth) * sphSimulator.spaceCellSize;
        var y = Math.floor(i / sphSimulator.spaceWidth) * sphSimulator.spaceCellSize;
        context.strokeText(sphSimulator.space[i].length.toString(), x + sphSimulator.spaceCellSize / 2, y + sphSimulator.spaceCellSize / 2);
      }*/
    }

    class FPSCounter {
      framesPassed: number = 0;
      lastTime: number = -Infinity;
      fps: number = 0;

      constructor() {}
      tick() {
        this.framesPassed += 1;
        var time = +new Date();
        if (time - this.lastTime >= 1000) {
          this.fps = this.framesPassed;
          this.framesPassed = 0;
          this.lastTime = time;
        }
      }
      getFPS() {
        return this.fps;
      }
    }

    var fpsCounter = new FPSCounter();
    var infoDiv = document.getElementById('info') as HTMLDivElement;

    var accumulator = 0;
    var fixedDelta = 1/30;
    var maxDelta = 0.25;
    var t0 = +new Date();
    function update() {
      fpsCounter.tick();
      infoDiv.textContent = 'FPS: ' + fpsCounter.getFPS().toString();

      var t1 = +new Date();
      var dt = (t1 - t0) / 1000;
      if (dt >= maxDelta) {
        dt = maxDelta;
      }
      t0 = t1;
      accumulator += dt * 4;

      pourTime -= dt;
      if (pourTime <= 0) {
        sphSimulator.addParticle(mouseX, mouseY, 0, 0);
        pourTime = pourThrottle;
      }

      if (accumulator >= fixedDelta) {
        while (accumulator >= fixedDelta) {
          fixedUpdate(fixedDelta);
          accumulator -= fixedDelta;
        }
        render();
      }


      requestFrame(update);
    }

    requestFrame(update);
}

main();
