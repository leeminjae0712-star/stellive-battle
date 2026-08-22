/**
 * Arena Engine (Dynamic 1:1 Aspect Ratio 4-Corner Box Arena)
 * Eliminates all canvas distortion and maintains perfect geometric proportions.
 */

class Arena {
  constructor(width = 800, height = 540) {
    this.resize(width, height);
    this.restitution = 1.0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.cx = width / 2;
    this.cy = height / 2;

    // 88% width, 84% height with clean margin
    this.halfW = (width * 0.88) / 2;
    this.halfH = (height * 0.84) / 2;
    this.left = this.cx - this.halfW;
    this.right = this.cx + this.halfW;
    this.top = this.cy - this.halfH;
    this.bottom = this.cy + this.halfH;
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

    // 2. Battle Ring Inner Fill
    ctx.fillStyle = '#171926';
    ctx.fillRect(this.left, this.top, this.halfW * 2, this.halfH * 2);

    // 3. Subtle Arena Floor Grid Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 45;
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

    // 4. Center Ring (Perfect pure circle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, Math.min(this.halfW, this.halfH) * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.cx, this.top);
    ctx.lineTo(this.cx, this.bottom);
    ctx.moveTo(this.left, this.cy);
    ctx.lineTo(this.right, this.cy);
    ctx.stroke();

    // 5. Clean 4-Corner Outer Border
    ctx.strokeStyle = '#3b4261';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.left, this.top, this.halfW * 2, this.halfH * 2);

    // 6. Modern Tech Corner Accent Brackets
    const bracketLen = 22;
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(this.left - 2, this.top + bracketLen);
    ctx.lineTo(this.left - 2, this.top - 2);
    ctx.lineTo(this.left + bracketLen, this.top - 2);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(this.right + 2, this.top + bracketLen);
    ctx.lineTo(this.right + 2, this.top - 2);
    ctx.lineTo(this.right - bracketLen, this.top - 2);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(this.left - 2, this.bottom - bracketLen);
    ctx.lineTo(this.left - 2, this.bottom + 2);
    ctx.lineTo(this.left + bracketLen, this.bottom + 2);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(this.right + 2, this.bottom - bracketLen);
    ctx.lineTo(this.right + 2, this.bottom + 2);
    ctx.lineTo(this.right - bracketLen, this.bottom + 2);
    ctx.stroke();

    ctx.restore();
  }
}
