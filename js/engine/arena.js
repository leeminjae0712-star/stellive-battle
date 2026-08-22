/**
 * Arena Engine (1:1 Pure Square Arena)
 * Standard 1:1 Aspect Ratio like Instagram Reels / Shorts.
 */

class Arena {
  constructor(size = 560) {
    this.resize(size, size);
    this.restitution = 1.0;
  }

  resize(width, height) {
    // Keep it a strict 1:1 square
    const minDim = Math.min(width, height);
    this.width = width;
    this.height = height;
    this.cx = width / 2;
    this.cy = height / 2;

    // Pure 1:1 Square Box bounds
    this.boxSize = minDim * 0.88;
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

    // 1. Background
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. 1:1 Square Battle Floor
    ctx.fillStyle = '#161928';
    ctx.fillRect(this.left, this.top, this.boxSize, this.boxSize);

    // 3. Subtle Floor Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = this.left; x <= this.right; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, this.top);
      ctx.lineTo(x, this.bottom);
      ctx.stroke();
    }
    for (let y = this.top; y <= this.bottom; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(this.left, y);
      ctx.lineTo(this.right, y);
      ctx.stroke();
    }

    // 4. Center Circle & Division Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.halfSize * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.cx, this.top);
    ctx.lineTo(this.cx, this.bottom);
    ctx.moveTo(this.left, this.cy);
    ctx.lineTo(this.right, this.cy);
    ctx.stroke();

    // 5. 1:1 Square Outer Border (Thick, Clean & Crisp)
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.left, this.top, this.boxSize, this.boxSize);

    // 6. Corner Brackets
    const bLen = 24;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(this.left - 2, this.top + bLen);
    ctx.lineTo(this.left - 2, this.top - 2);
    ctx.lineTo(this.left + bLen, this.top - 2);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(this.right + 2, this.top + bLen);
    ctx.lineTo(this.right + 2, this.top - 2);
    ctx.lineTo(this.right - bLen, this.top - 2);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(this.left - 2, this.bottom - bLen);
    ctx.lineTo(this.left - 2, this.bottom + 2);
    ctx.lineTo(this.left + bLen, this.bottom + 2);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(this.right + 2, this.bottom - bLen);
    ctx.lineTo(this.right + 2, this.bottom + 2);
    ctx.lineTo(this.right - bLen, this.bottom + 2);
    ctx.stroke();

    ctx.restore();
  }
}
