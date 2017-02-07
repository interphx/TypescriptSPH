function createArray<T>(value: T, size: number): T[] {
  var result = new Array(size);
  for (var i = 0; i < size; ++i) {
    result[i] = value;
  }
  return result;
}

export class GridSolver {
  public readonly u: number[];
  public readonly v: number[];
  public readonly uPrev:number[];
  public readonly vPrev: number[];
  public readonly density: number[];
  private densityPrev: number[];
  private size: number;
  private widthPlusTwo: number;
  private heightPlusTwo: number;
  private viscosity: number = 0;
  private diff: number = 0;

  constructor(public readonly width: number, public readonly height: number) {
    this.widthPlusTwo = width + 2;
    this.heightPlusTwo = height + 2;
    this.size = this.widthPlusTwo * this.heightPlusTwo;

    this.u = createArray(0, this.size);
    this.v = createArray(0, this.size);
    this.uPrev = createArray(0, this.size);
    this.vPrev = createArray(0, this.size);
    this.density = createArray(0, this.size);
    this.densityPrev = createArray(0, this.size);

    this.idx = this.idx.bind(this);
  }

  idx(i: number, j: number): number {
    return j * this.widthPlusTwo + i;
  }

  applySources(x: number[], sources: number[], dt: number) {
    for (var i = 0; i < this.size; ++i) {
      x[i] += sources[i] * dt;
    }
  }

  advect(b: number, d: number[], d0: number[], u: number[], v: number[], dt: number) {
    var dt0 = dt * this.width;
    for (var i = 1; i <= this.width; ++i) {
      for (var j = 1; j <= this.height; ++j) {
        var x = i - dt0 * u[j * this.widthPlusTwo + i];
        var y = j - dt0 * v[j * this.widthPlusTwo + i];

        if (x < 0.5) x = 0.5;
        if (x > this.width + 0.5) x = this.width + 0.5;
        var i0 = x | 0;
        var i1 = i0 + 1;

        if (y < 0.5) y = 0.5;
        if (y > this.height + 0.5) y = this.height + 0.5;
        var j0 = y | 0;
        var j1 = j0 + 1;

        var s1 = x - i0;
        var s0 = 1 - s1;
        var t1 = y - j0;
        var t0 = 1 - t1;
        d[j * this.widthPlusTwo + i] =
          s0 * (t0 * d0[j0 * this.widthPlusTwo + i0] + t1 * d0[j1 * this.widthPlusTwo + i0]) +
          s1 * (t0 * d0[j0 * this.widthPlusTwo + i1] + t1 * d0[j1 * this.widthPlusTwo + i1]);
      }
    }
    this.setBoundary(b, d);
  }

  densityStep(x: number[], x0: number[], u: number[], v: number[], diff: number, dt: number) {
    this.applySources(x, x0, dt);

    var tmp = x0;
    x0 = x;
    x = tmp;

    this.diffuse(0, x, x0, diff, dt);

    var tmp = x0;
    x0 = x;
    x = tmp;

    this.advect(0, x, x0, u, v, dt);
  }

  velocityStep(u: number[], v: number[], u0: number[], v0: number[], viscosity: number, dt: number) {
    this.applySources(u, u0, dt);
    this.applySources(v, v0, dt);

    var tmp = u0;
    u0 = u;
    u = tmp;

    this.diffuse(1, u, u0, viscosity, dt);

    var tmp = v0;
    v0 = v;
    v = tmp;

    this.diffuse(2, v, v0, viscosity, dt);

    this.project(u, v, u0, v0);

    var tmp = u0;
    u0 = u;
    u = tmp;

    var tmp = v0;
    v0 = v;
    v = tmp;

    this.advect(1, u, u0, u0, v0, dt);
    this.advect(2, v, v0, u0, v0, dt);
    this.project(u, v, u0, v0);
  }

  project(u: number[], v: number[], p: number[], div: number[]) {
    var idx = this.idx;

     for (var i = 1 ; i <= this.width; i++ ){
         var prevRow   = idx(i - 1, 0);
         var thisRow   = idx(i, 0);
         var nextRow   = idx(i + 1, 0);

         var valueBefore  = thisRow - 1;
         var valueNext    = thisRow + 1;

         var to = this.width + valueNext;
         for (var k = valueNext; k < to; k++ ) {
             p[k] = 0;
             div[k] = (u[++valueNext] - u[++valueBefore] + v[++nextRow] - v[++prevRow]) * this.centerPos;
         }
     }

     this.set_bnd(0, div);
     this.set_bnd(0, p);

     for (k=0 ; k<this.settings.iterations; k++) {
         for (j=1 ; j<=this.settings.resolution; j++) {
             lastRow = this.IX[0][j-1];
             thisRow = this.IX[0][j];
             nextRow = this.IX[0][j+1];
             prevX = p[thisRow];
             thisRow++;
             for (i=1; i<=this.settings.resolution; i++){
                 p[thisRow] = prevX = (div[thisRow] + p[++lastRow] + p[++thisRow] + p[++nextRow] + prevX ) * this.settings.fract;
             }
         }
         this.set_bnd(0, p);
     }

     for (j = 1; j <=  this.settings.resolution; j++ ) {
         lastRow =  this.IX[0][j-1];
         thisRow =  this.IX[0][j];
         nextRow =  this.IX[0][j+1];

         valueBefore  = thisRow - 1;
         valueNext    = thisRow + 1;

         for (i = 1; i <=  this.settings.resolution; i++) {
             u[++thisRow] -= this.scale * (p[++valueNext] - p[++valueBefore]);
             v[thisRow]   -= this.scale * (p[++nextRow]   - p[++lastRow]);
         }
     }
     this.set_bnd(1, u);
     this.set_bnd(2, v);
    /*var h = 1.0 / this.width;
    for (var i = 1; i <= this.width; ++i) {
      for (var j = 1; j <= this.height; ++j) {
        div[j * this.widthPlusTwo + i] = -0.5 * h * (
          u[j * this.widthPlusTwo + i+1] - u[j * this.widthPlusTwo + i-1] +
          v[(j+1) * this.widthPlusTwo + i] - v[(j-1) * this.widthPlusTwo + i]);
        p[j * this.widthPlusTwo + i] = 0;
      }
    }
    this.setBoundary(0, div);
    this.setBoundary(0, p);

    for (var k = 0; k < 20; ++k) {
      for (var i = 1; i <= this.width; ++i) {
        for (var j = 1; j <= this.height; ++j) {
          p[idx(i, j)] = (
            div[idx(i, j)] +
            p[idx(i - 1, j)] +
            p[idx(i + 1, j)] +
            p[idx(i, j - 1)] +
            p[idx(i, j + 1)]
          ) / 4;
        }
      }
      this.setBoundary(0, p);
    }

    for (var i = 1; i <= this.width; ++i) {
      for (var j = 1; j < this.height; ++j) {
        u[idx(i, j)] -= 0.5*(p[idx(i + 1, j)] - p[idx(i - 1, j)]) / h;
        v[idx(i, j)] -= 0.5*(p[idx(i, j + 1)] - p[idx(i, j - 1)]) / h;
      }
    }*/
    this.setBoundary(1, u);
    this.setBoundary(2, v);
  }

  setBoundary(b: number, x: number[]) {
    var idx = this.idx;

    for (var i = 1; i <= this.width; ++i) {
      x[idx(0, i)] = b === 1 ? -x[idx(1, i)] : x[idx(1, i)];
      x[idx(this.width + 1, i)] = b === 1 ? -x[idx(this.width, i)] : x[idx(this.width, i)];
      x[idx(i, 0)] = b === 2 ? -x[idx(i, 1)] : x[idx(i, 1)];
      x[idx(i, this.height + 1)] = b === 2 ? -x[idx(i, this.height)] : x[idx(i, this.height)];
    }

    x[idx(0, 0)] = 0.5 * (x[idx(1, 0)] + x[idx(0, 1)]);
    x[idx(0, this.height + 1)] = 0.5 * (x[idx(1, this.height + 1)] + x[idx(0, this.height)]);
    x[idx(this.width + 1, 0)] = 0.5 * (x[idx(this.width, 0)] + x[idx(this.width + 1, 1)]);
    x[idx(this.width + 1, this.height + 1)] = 0.5 * (x[idx(this.width, this.height + 1)] + x[idx(this.width + 1, this.height)]);
  }

  diffuse(b: number, x: number[], x0: number[], diff: number, dt: number) {
    /*var a = diff * this.width * this.height * dt;

    for (var k = 0; k < 20; ++k) {
      for (var i = 1; i <= this.width; ++i) {
        for (var j = 1; j <= this.height; ++j) {
          x[j * this.widthPlusTwo + i] = (
              x0[j * this.widthPlusTwo + i] + a * (
                x[j * this.widthPlusTwo + i-1] +
                x[j * this.widthPlusTwo + i+1] +
                x[(j-1) * this.widthPlusTwo + i] +
                x[(j+1) * this.widthPlusTwo + i])
            ) / (1 + 4*a);
        }
      }
      this.setBoundary(b, x);
    }*/
    for (var i = 1; i < this.size; ++i) {
      x[i] = x0[i] * 1;
    }
    this.setBoundary(b, x);

  }

  update(dt: number) {
    this.velocityStep(this.u, this.v, this.uPrev, this.vPrev, this.viscosity, dt);
    this.densityStep(this.density, this.densityPrev, this.u, this.v, this.diff, dt);
  }
}
