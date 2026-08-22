/**
 * Arena Engine (Minimalist Clean 1:1 Pure White Box Arena)
 * Completely removes soccer field lines, grids, center circles, and neon glows.
 * Renders a crisp, solid white border on a clean dark floor.
 */

class Arena {
  constructor(size = 600) {
    this.resize(size, size);
    this.restitution = 1.0;
  }

  resize(width, height) {
    const minDim = Math.min(width, height);
    this.width = width;
    this.height = height;
    this.cx = width / 2;
    this.cy = height / 2;

    // Utilize 95% of canvas area with clean padding
    this.boxSize = minDim * 0.94;
    this.halfSize = this.boxSize / 2;
    this.left = this.cx - this.halfSize;
    this.right = this.cx + this.halfSize;
    this.top = this.cy - this.halfSize;
    this.bottom = this.cy + this.halfSize;
    this.halfW = this.halfSize;
    this.halfH = this.halfSize;
  }

  isInside(x, y, radius = 0) {
    return (
      x - radius >= this.left &&
      x + radius <= this.right &&
      y - radius >= this.top &&
      y + radius <= this.bottom
    );
  }

  render(ctx) {
    ctx.save();

    // 1. Clean Solid Dark Canvas Background
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Clean Solid Dark Arena Floor (Zero soccer lines, zero grid, zero circles)
    ctx.fillStyle = '#141724';
    ctx.fillRect(this.left, this.top, this.boxSize, this.boxSize);

    // 3. Crisp Pure White 1:1 Square Border (No Neon Blur)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.left, this.top, this.boxSize, this.boxSize);

    ctx.restore();
  }
}
