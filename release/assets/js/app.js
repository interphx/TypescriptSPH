define("boxblur", ["require", "exports"], function (require, exports) {
    "use strict";
    var mul_table = [1, 57, 41, 21, 203, 34, 97, 73, 227, 91, 149, 62, 105, 45, 39, 137, 241, 107, 3, 173, 39, 71, 65, 238, 219, 101, 187, 87, 81, 151, 141, 133, 249, 117, 221, 209, 197, 187, 177, 169, 5, 153, 73, 139, 133, 127, 243, 233, 223, 107, 103, 99, 191, 23, 177, 171, 165, 159, 77, 149, 9, 139, 135, 131, 253, 245, 119, 231, 224, 109, 211, 103, 25, 195, 189, 23, 45, 175, 171, 83, 81, 79, 155, 151, 147, 9, 141, 137, 67, 131, 129, 251, 123, 30, 235, 115, 113, 221, 217, 53, 13, 51, 50, 49, 193, 189, 185, 91, 179, 175, 43, 169, 83, 163, 5, 79, 155, 19, 75, 147, 145, 143, 35, 69, 17, 67, 33, 65, 255, 251, 247, 243, 239, 59, 29, 229, 113, 111, 219, 27, 213, 105, 207, 51, 201, 199, 49, 193, 191, 47, 93, 183, 181, 179, 11, 87, 43, 85, 167, 165, 163, 161, 159, 157, 155, 77, 19, 75, 37, 73, 145, 143, 141, 35, 138, 137, 135, 67, 33, 131, 129, 255, 63, 250, 247, 61, 121, 239, 237, 117, 29, 229, 227, 225, 111, 55, 109, 216, 213, 211, 209, 207, 205, 203, 201, 199, 197, 195, 193, 48, 190, 47, 93, 185, 183, 181, 179, 178, 176, 175, 173, 171, 85, 21, 167, 165, 41, 163, 161, 5, 79, 157, 78, 154, 153, 19, 75, 149, 74, 147, 73, 144, 143, 71, 141, 140, 139, 137, 17, 135, 134, 133, 66, 131, 65, 129, 1];
    var shg_table = [0, 9, 10, 10, 14, 12, 14, 14, 16, 15, 16, 15, 16, 15, 15, 17, 18, 17, 12, 18, 16, 17, 17, 19, 19, 18, 19, 18, 18, 19, 19, 19, 20, 19, 20, 20, 20, 20, 20, 20, 15, 20, 19, 20, 20, 20, 21, 21, 21, 20, 20, 20, 21, 18, 21, 21, 21, 21, 20, 21, 17, 21, 21, 21, 22, 22, 21, 22, 22, 21, 22, 21, 19, 22, 22, 19, 20, 22, 22, 21, 21, 21, 22, 22, 22, 18, 22, 22, 21, 22, 22, 23, 22, 20, 23, 22, 22, 23, 23, 21, 19, 21, 21, 21, 23, 23, 23, 22, 23, 23, 21, 23, 22, 23, 18, 22, 23, 20, 22, 23, 23, 23, 21, 22, 20, 22, 21, 22, 24, 24, 24, 24, 24, 22, 21, 24, 23, 23, 24, 21, 24, 23, 24, 22, 24, 24, 22, 24, 24, 22, 23, 24, 24, 24, 20, 23, 22, 23, 24, 24, 24, 24, 24, 24, 24, 23, 21, 23, 22, 23, 24, 24, 24, 22, 24, 24, 24, 23, 22, 24, 24, 25, 23, 25, 25, 23, 24, 25, 25, 24, 22, 25, 25, 25, 24, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 23, 25, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24, 22, 25, 25, 23, 25, 25, 20, 24, 25, 24, 25, 25, 22, 24, 25, 24, 25, 24, 25, 25, 24, 25, 25, 25, 25, 22, 25, 25, 25, 24, 25, 24, 25, 18];
    function boxBlurImageData(imageData, width, height, radius, iterations) {
        radius |= 0;
        iterations |= 0;
        if (iterations > 3)
            iterations = 3;
        if (iterations < 1)
            iterations = 1;
        var imageData;
        var pixels = imageData.data;
        var rsum, gsum, bsum, asum, x, y, i, p, p1, p2, yp, yi, yw, idx, pa;
        var wm = width - 1;
        var hm = height - 1;
        var wh = width * height;
        var rad1 = radius + 1;
        var mul_sum = mul_table[radius];
        var shg_sum = shg_table[radius];
        var r = [];
        var g = [];
        var b = [];
        var a = [];
        var vmin = [];
        var vmax = [];
        while (iterations-- > 0) {
            yw = yi = 0;
            for (y = 0; y < height; y++) {
                rsum = pixels[yw] * rad1;
                gsum = pixels[yw + 1] * rad1;
                bsum = pixels[yw + 2] * rad1;
                asum = pixels[yw + 3] * rad1;
                for (i = 1; i <= radius; i++) {
                    p = yw + (((i > wm ? wm : i)) << 2);
                    rsum += pixels[p++];
                    gsum += pixels[p++];
                    bsum += pixels[p++];
                    asum += pixels[p];
                }
                for (x = 0; x < width; x++) {
                    r[yi] = rsum;
                    g[yi] = gsum;
                    b[yi] = bsum;
                    a[yi] = asum;
                    if (y == 0) {
                        vmin[x] = ((p = x + rad1) < wm ? p : wm) << 2;
                        vmax[x] = ((p = x - radius) > 0 ? p << 2 : 0);
                    }
                    p1 = yw + vmin[x];
                    p2 = yw + vmax[x];
                    rsum += pixels[p1++] - pixels[p2++];
                    gsum += pixels[p1++] - pixels[p2++];
                    bsum += pixels[p1++] - pixels[p2++];
                    asum += pixels[p1] - pixels[p2];
                    yi++;
                }
                yw += (width << 2);
            }
            for (x = 0; x < width; x++) {
                yp = x;
                rsum = r[yp] * rad1;
                gsum = g[yp] * rad1;
                bsum = b[yp] * rad1;
                asum = a[yp] * rad1;
                for (i = 1; i <= radius; i++) {
                    yp += (i > hm ? 0 : width);
                    rsum += r[yp];
                    gsum += g[yp];
                    bsum += b[yp];
                    asum += a[yp];
                }
                yi = x << 2;
                for (y = 0; y < height; y++) {
                    pixels[yi + 3] = pa = (asum * mul_sum) >>> shg_sum;
                    if (pa > 0) {
                        pa = 255 / pa;
                        pixels[yi] = ((rsum * mul_sum) >>> shg_sum) * pa;
                        pixels[yi + 1] = ((gsum * mul_sum) >>> shg_sum) * pa;
                        pixels[yi + 2] = ((bsum * mul_sum) >>> shg_sum) * pa;
                    }
                    else {
                        pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
                    }
                    if (x == 0) {
                        vmin[y] = ((p = y + rad1) < hm ? p : hm) * width;
                        vmax[y] = ((p = y - radius) > 0 ? p * width : 0);
                    }
                    p1 = x + vmin[y];
                    p2 = x + vmax[y];
                    rsum += r[p1] - r[p2];
                    gsum += g[p1] - g[p2];
                    bsum += b[p1] - b[p2];
                    asum += a[p1] - a[p2];
                    yi += width << 2;
                }
            }
        }
    }
    exports.boxBlurImageData = boxBlurImageData;
});
define("app", ["require", "exports", "boxblur"], function (require, exports, boxblur_1) {
    "use strict";
    var getBallImage = (function () {
        var cache = {};
        function getBallImage(goo, radius) {
            if (!cache[goo]) {
                cache[goo] = {};
            }
            if (!cache[goo][radius]) {
                var width = radius * 2;
                var height = radius * 2;
                var canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext('2d');
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
    var SPHRenderer = (function () {
        function SPHRenderer(context) {
            this.context = context;
            this.bufferA = document.createElement('canvas');
            this.bufferB = document.createElement('canvas');
            this.contextA = this.bufferA.getContext('2d');
            this.contextB = this.bufferB.getContext('2d');
            this.scale = 0.25;
            this.trailPersistence = 0.8;
            this.bufferA.width = this.bufferB.width = context.canvas.width * this.scale;
            this.bufferA.height = this.bufferB.height = context.canvas.height * this.scale;
        }
        SPHRenderer.prototype.render = function (simulator) {
            var particles = simulator.particles;
            var threshold = 0.1;
            var goo = 1.3;
            var thresholdBallConst = -(Math.pow(threshold, 1 / goo) - 1);
            var colorThreshold = threshold * 255;
            var foamThreshold = threshold / 1.5 * 255;
            var radius = 10 * this.scale;
            this.contextB.clearRect(0, 0, this.bufferA.width, this.bufferA.height);
            this.contextB.globalAlpha = this.trailPersistence;
            this.contextB.drawImage(this.bufferA, 0, 0);
            this.contextA.clearRect(0, 0, this.bufferA.width, this.bufferA.height);
            this.contextA.drawImage(this.bufferB, 0, 0);
            var imageData = this.contextA.getImageData(0, 0, this.bufferA.width, this.bufferA.height);
            boxblur_1.boxBlurImageData(imageData, this.bufferA.width, this.bufferA.height, 16 * this.scale, 1);
            this.contextA.putImageData(imageData, 0, 0);
            for (var _i = 0, particles_1 = particles; _i < particles_1.length; _i++) {
                var particle = particles_1[_i];
                var x = particle.x * this.scale;
                var y = particle.y * this.scale;
                var image = getBallImage(goo, radius);
                this.contextA.drawImage(image, (x - radius) | 0, (y - radius) | 0);
            }
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
                }
                else if (value >= foamThreshold) {
                    data[index] = 255;
                    data[index - 1] = 220;
                    data[index - 2] = 150;
                }
                else {
                    data[index] = 0;
                }
            }
            this.context.putImageData(imageData, 0, 0);
        };
        return SPHRenderer;
    }());
    var SPHSimulator = (function () {
        function SPHSimulator() {
            this.particles = [];
            this.gravityX = 0;
            this.gravityY = 20;
            this.interactionRadius = 35;
            this.worldBoundsXMin = 0;
            this.worldBoundsYMin = 0;
            this.worldBoundsXMax = 800;
            this.worldBoundsYMax = 600;
            this.worldBoundsWidth = this.worldBoundsXMax - this.worldBoundsXMin;
            this.worldBoundsHeight = this.worldBoundsYMax - this.worldBoundsYMin;
            this.maxParticleNeighbors = 25;
            this.tempNeighbors = new Array(this.maxParticleNeighbors);
            this.tempPotentialNeighborArrays = new Array(9);
            this.emptyArray = [];
            this.stiffness = 0.04;
            this.stiffnessNear = 0.01;
            this.kSpring = 0.3;
            this.alpha = 0.3;
            this.densiyRest = 10;
            this.velocityCap = 150;
            this.sigma = 0;
            this.beta = 0.3;
            this.constantTimestep = 1 / 60;
            this.spaceUpdateSkipFrames = 8;
            this.tempInverseQCache = new Array(this.maxParticleNeighbors);
            this.tempMagnitudeCache = new Array(this.maxParticleNeighbors);
            this.spaceUpdateCountdown = this.spaceUpdateSkipFrames;
            this.spaceCellSize = this.interactionRadius + this.getMaxParticleMovementPerFrame() * this.spaceUpdateSkipFrames + 1;
            this.spaceWidth = Math.ceil(this.worldBoundsWidth / this.spaceCellSize);
            this.spaceHeight = Math.ceil(this.worldBoundsHeight / this.spaceCellSize);
            this.spaceSize = Math.ceil(this.spaceWidth * this.spaceHeight);
            this.space = new Array(this.spaceSize);
            for (var i = 0; i < this.spaceSize; ++i) {
                this.space[i] = [];
            }
        }
        SPHSimulator.prototype.pointWithinBounds = function (x, y) {
            return (x >= this.worldBoundsXMin) && (x < this.worldBoundsXMax) && (y >= this.worldBoundsYMin) && (y < this.worldBoundsYMax);
        };
        SPHSimulator.prototype.getSpatialCellIndexFor = function (x, y) {
            var spaceCellX = (x / this.spaceCellSize) | 0;
            var spaceCellY = (y / this.spaceCellSize) | 0;
            var spaceCellIndex = (spaceCellY * this.spaceWidth + spaceCellX) | 0;
            return spaceCellIndex;
        };
        SPHSimulator.prototype.placeParticle = function (particle, cell) {
            cell.push(particle);
        };
        SPHSimulator.prototype.removeParticle = function (particle, cell) {
            var idx = cell.indexOf(particle);
            cell[idx] = cell[cell.length - 1];
            cell.length -= 1;
        };
        SPHSimulator.prototype.withParticleAndNeighborhood = function (particle, cellX, cellY, op) {
            var space = this.space;
            var spaceWidth = this.spaceWidth;
            var spaceSize = this.spaceSize;
            var cellIndex = cellY * spaceWidth + cellX;
            var cellYMulWidth = cellY * spaceWidth;
            var leftCellX = cellX - 1;
            var rightCellX = cellX + 1;
            var topCellYMulWidth = (cellY - 1) * spaceWidth;
            var bottomCellYMulWidth = (cellY + 1) * spaceWidth;
            var centerIndex = cellIndex;
            var topIndex = topCellYMulWidth + cellX;
            var rightIndex = cellYMulWidth + rightCellX;
            var bottomIndex = bottomCellYMulWidth + cellX;
            var leftIndex = cellYMulWidth + leftCellX;
            var topLeftIndex = topCellYMulWidth + leftCellX;
            var topRightIndex = topCellYMulWidth + rightCellX;
            var bottomRightIndex = bottomCellYMulWidth + rightCellX;
            var bottomLeftIndex = bottomCellYMulWidth + leftCellX;
            op(particle, space[centerIndex]);
            if (topIndex >= 0 && topIndex < spaceSize) {
                op(particle, space[topIndex]);
            }
            if (rightIndex >= 0 && rightIndex < spaceSize) {
                op(particle, space[rightIndex]);
            }
            if (bottomIndex >= 0 && bottomIndex < spaceSize) {
                op(particle, space[bottomIndex]);
            }
            if (leftIndex >= 0 && leftIndex < spaceSize) {
                op(particle, space[leftIndex]);
            }
            if (topLeftIndex >= 0 && topLeftIndex < spaceSize) {
                op(particle, space[topLeftIndex]);
            }
            if (topRightIndex >= 0 && topRightIndex < spaceSize) {
                op(particle, space[topRightIndex]);
            }
            if (bottomRightIndex >= 0 && bottomRightIndex < spaceSize) {
                op(particle, space[bottomRightIndex]);
            }
            if (bottomLeftIndex >= 0 && bottomLeftIndex < spaceSize) {
                op(particle, space[bottomLeftIndex]);
            }
        };
        SPHSimulator.prototype.updateSpace = function () {
            var spaceWidth = this.spaceWidth;
            var len = this.particles.length;
            var placeParticle = this.placeParticle;
            var removeParticle = this.removeParticle;
            for (var i = 0; i < len; ++i) {
                var particle = this.particles[i];
                var x = particle.x;
                var y = particle.y;
                if (!this.pointWithinBounds(x, y))
                    continue;
                var newSpatialCellIndex = this.getSpatialCellIndexFor(x, y);
                var oldSpatialCellIndex = particle.spatialCellIndex;
                if (oldSpatialCellIndex !== newSpatialCellIndex) {
                    var oldX = oldSpatialCellIndex % spaceWidth;
                    var oldY = (oldSpatialCellIndex / spaceWidth) | 0;
                    var newX = newSpatialCellIndex % spaceWidth;
                    var newY = (newSpatialCellIndex / spaceWidth) | 0;
                    this.withParticleAndNeighborhood(particle, oldX, oldY, removeParticle);
                    this.withParticleAndNeighborhood(particle, newX, newY, placeParticle);
                    particle.spatialCellIndex = newSpatialCellIndex;
                }
            }
        };
        SPHSimulator.prototype.getMaxParticleMovementPerFrame = function () {
            return this.velocityCap * 1.1 * this.constantTimestep;
        };
        SPHSimulator.prototype.distance = function (a, b) {
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            return Math.sqrt(dx * dx + dy * dy);
        };
        SPHSimulator.prototype.addParticle = function (x, y, vx, vy) {
            if (vx === void 0) { vx = 0; }
            if (vy === void 0) { vy = 0; }
            var spatialCellIndex = this.getSpatialCellIndexFor(x, y);
            var particle = { x: x, y: y, vx: vx, vy: vy,
                xPrev: x,
                yPrev: y,
                density: 0,
                densityNear: 0,
                pressure: 0,
                pressureNear: 0,
                spatialCellIndex: spatialCellIndex,
                neighborsCount: 0
            };
            this.particles.push(particle);
            this.withParticleAndNeighborhood(particle, spatialCellIndex % this.spaceWidth, (spatialCellIndex / this.spaceWidth) | 0, this.placeParticle);
        };
        SPHSimulator.prototype.getParticleNeighbors = function (originParticleIndex) {
            var maxNeighbors = this.maxParticleNeighbors;
            var spaceWidth = this.spaceWidth;
            var interactionRadiusSquared = this.interactionRadius * this.interactionRadius;
            var space = this.space;
            var tempNeighbors = this.tempNeighbors;
            tempNeighbors.length = maxNeighbors;
            var originParticle = this.particles[originParticleIndex];
            var originX = originParticle.x;
            var originY = originParticle.y;
            var cell = space[originParticle.spatialCellIndex];
            var nextAddedIndex = 0;
            for (var i = 0; i < cell.length; ++i) {
                var particle = cell[i];
                if (particle === originParticle)
                    continue;
                var dx = particle.x - originX;
                var dy = particle.y - originY;
                if (dx * dx + dy * dy >= interactionRadiusSquared)
                    continue;
                tempNeighbors[nextAddedIndex++] = particle;
                if (nextAddedIndex > maxNeighbors)
                    break;
            }
            tempNeighbors.length = nextAddedIndex;
            return tempNeighbors;
        };
        SPHSimulator.prototype.doubleDensityRelax = function (dt) {
            var tempInverseQCache = this.tempInverseQCache;
            var tempMagnitudeCache = this.tempMagnitudeCache;
            var particles = this.particles;
            var len = particles.length;
            for (var i = 0; i < len; ++i) {
                var particleA = particles[i];
                var particleAX = particleA.x;
                var particleAY = particleA.y;
                var neighbors = this.getParticleNeighbors(i);
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
                    var inverseQ = tempInverseQCache[j];
                    var rij_dx = particleB.x - particleAX;
                    var rij_dy = particleB.y - particleAY;
                    var magnitude = tempMagnitudeCache[j];
                    if (magnitude === 0)
                        continue;
                    var k = dt * dt * (particleA.pressure * inverseQ + particleA.pressureNear * inverseQ * inverseQ) / magnitude;
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
        };
        SPHSimulator.prototype.applyViscosity = function (dt) {
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
                    var rijMagnitude = Math.sqrt(rijX * rijX + rijY * rijY);
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
        };
        SPHSimulator.prototype.update = function (dt) {
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
                if (particle.x > this.worldBoundsXMax)
                    tempVX -= particle.x - this.worldBoundsXMax;
                if (particle.y > this.worldBoundsYMax)
                    tempVY -= particle.y - this.worldBoundsYMax;
                if (particle.x < this.worldBoundsXMin)
                    tempVX += this.worldBoundsXMin - particle.x;
                if (particle.y < this.worldBoundsYMin)
                    tempVY += this.worldBoundsYMin - particle.y;
                particle.vx += tempVX;
                particle.vy += tempVY;
                if (particle.vx < -this.velocityCap)
                    particle.vx = -this.velocityCap;
                if (particle.vx > this.velocityCap)
                    particle.vx = this.velocityCap;
                if (particle.vy < -this.velocityCap)
                    particle.vy = -this.velocityCap;
                if (particle.vy > this.velocityCap)
                    particle.vy = this.velocityCap;
            }
            if (--this.spaceUpdateCountdown <= 0) {
                this.updateSpace();
                this.spaceUpdateCountdown = this.spaceUpdateSkipFrames;
            }
        };
        return SPHSimulator;
    }());
    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window['mozRequestAnimationFrame'] ||
        function (f) {
            return setTimeout(f, 0);
        };
    function main() {
        var canvas = document.getElementById('display');
        var context = canvas.getContext('2d');
        var mouseX = -1;
        var mouseY = -1;
        var pourThrottle = 1 / 30;
        var pourTime = Infinity;
        var onPointerDown = function (event) {
            event.preventDefault();
            mouseX = (event.clientX || event.touches[0].clientX - event.target.offsetLeft);
            mouseY = (event.clientY || event.touches[0].clientY - event.target.offsetTop);
            pourTime = 0;
        };
        var onPointerMove = function (event) {
            mouseX = (event.clientX || event.touches[0].clientX - event.target.offsetLeft);
            mouseY = (event.clientY || event.touches[0].clientY - event.target.offsetTop);
        };
        var onPointerUp = function (event) {
            mouseX = (event.clientX || event.touches[0].clientX - event.target.offsetLeft);
            mouseY = (event.clientY || event.touches[0].clientY - event.target.offsetTop);
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
        function fixedUpdate(dt) {
            sphSimulator.update(dt);
        }
        var frame = 0;
        function render() {
            context.fillStyle = 'white';
            context.clearRect(0, 0, canvas.width, canvas.height);
            particleRenderer.render(sphSimulator);
        }
        var FPSCounter = (function () {
            function FPSCounter() {
                this.framesPassed = 0;
                this.lastTime = -Infinity;
                this.fps = 0;
            }
            FPSCounter.prototype.tick = function () {
                this.framesPassed += 1;
                var time = +new Date();
                if (time - this.lastTime >= 1000) {
                    this.fps = this.framesPassed;
                    this.framesPassed = 0;
                    this.lastTime = time;
                }
            };
            FPSCounter.prototype.getFPS = function () {
                return this.fps;
            };
            return FPSCounter;
        }());
        var fpsCounter = new FPSCounter();
        var infoDiv = document.getElementById('info');
        var accumulator = 0;
        var fixedDelta = 1 / 30;
        var maxDelta = 0.25;
        var t0 = +new Date();
        function update() {
            fpsCounter.tick();
            infoDiv.textContent = 'FPS: ' + fpsCounter.getFPS().toString();
            var lastRenderSkipped = false;
            var skipRender = false;
            var t1 = +new Date();
            var dt = (t1 - t0) / 1000;
            if (dt >= maxDelta) {
                dt = maxDelta;
            }
            if (!lastRenderSkipped && dt >= 1 / 30) {
                var skipRender = true;
                lastRenderSkipped = true;
            }
            else {
                lastRenderSkipped = false;
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
                if (!skipRender) {
                    render();
                }
                skipRender = false;
            }
            requestFrame(update);
        }
        requestFrame(update);
    }
    main();
});
