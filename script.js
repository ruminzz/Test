/* ========= script.js =========
   - Đếm ngược tới 00:00:00 ngày 17/02/2026 (sử dụng Date(year, monthIndex, day, hour, min, sec)
     để đảm bảo mốc thời gian được hiểu là thời gian địa phương (local time).
   - Khi về 0: ẩn phần countdown, hiển thị thông điệp chúc Tết với hiệu ứng lấp lánh,
     bật canvas và vẽ pháo hoa (Canvas API).
   - Có phần chơi âm thanh nếu bạn thêm file 'firework.mp3' vào cùng thư mục (không bắt buộc).
*/

/* ------------------- Cấu hình mốc thời gian ------------------- */
/* Date: Tháng (monthIndex) bắt đầu từ 0 -> 1 = February */
const targetDate = new Date(Date.now() + 3000); // 3 giây nữa nổ

/* ------------------- DOM ------------------- */
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

const countdownEl = document.getElementById('countdown');
const newYearMessage = document.getElementById('newYearMessage');

const canvas = document.getElementById('fireworksCanvas');

/* ------------------- Hàm tiện ích: format số (thêm 0 nếu <10) ------------------- */
function pad(n) {
  return n < 10 ? '0' + n : n.toString();
}

/* ------------------- Cập nhật đếm ngược ------------------- */
let countdownInterval = null;

function updateCountdown() {
  const now = new Date();
  let diff = targetDate - now; // milliseconds

  if (diff <= 0) {
    // Đã tới hoặc vượt qua thời điểm
    clearInterval(countdownInterval);
    onCountdownFinish();
    return;
  }

  // Chuyển đổi thành ngày/giờ/phút/giây
  const sec = Math.floor(diff / 1000);
  const days = Math.floor(sec / (24 * 3600));
  const hours = Math.floor((sec % (24 * 3600)) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = Math.floor(sec % 60);

  daysEl.textContent = pad(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);
}

/* Bắt đầu interval */
updateCountdown();
countdownInterval = setInterval(updateCountdown, 500); // cập nhật nửa giây cho mượt

/* ------------------- Khi đếm xong ------------------- */
function onCountdownFinish() {
  // Ẩn bộ đếm
  countdownEl.classList.add('hidden');

  // Hiện thông điệp Năm Mới và bật hiệu ứng sparkle (CSS)
  newYearMessage.classList.remove('hidden');
  newYearMessage.classList.add('sparkle');

  // Bật canvas pháo hoa
  startFireworks();

  // Thử phát âm thanh (nếu có file firework.mp3 trong cùng thư mục)
  tryPlayAudio('firework.mp3');
}

/* ------------------- Audio (tuỳ chọn) ------------------- */
/* Nếu bạn muốn âm thanh pháo nổ, thêm file firework.mp3 vào cùng thư mục.
   Hàm sẽ thử tạo và phát audio (nếu trình duyệt cho phép). */
function tryPlayAudio(filename) {
  // Không bắt buộc — nếu file không tồn tại sẽ dừng im lặng (bắt lỗi)
  if (!filename) return;
  const audio = new Audio(filename);
  audio.volume = 0.9;
  audio.play().catch((err) => {
    // Trình duyệt có thể chặn autoplay nếu chưa có tương tác người dùng
    // Bạn có thể gọi audio.play() sau một hành động người dùng (click) nếu cần.
    console.warn('Không thể phát âm thanh tự động:', err);
  });
}

/* ------------------- FIREWORKS bằng Canvas API ------------------- */
/* Hệ thống pháo hoa đơn giản nhưng hiệu quả:
   - Tạo các "bloom" (vị trí nổ) và "particles" (mảnh màu bắn ra)
   - Loop vẽ bằng requestAnimationFrame
   - Tối ưu cho hiệu suất: limit số hạt
*/

function startFireworks() {
  // Hiển thị canvas
  canvas.style.display = 'block';
  resizeCanvas();

  const ctx = canvas.getContext('2d');
  let particles = [];
  let blooms = [];
  const maxParticles = 900; // giới hạn tổng hạt
  const gravity = 0.02;
  const friction = 0.998;

  // Resize canvas khi thay đổi kích thước
  window.addEventListener('resize', resizeCanvas);

  // Tạo nổ ban đầu và tiếp tục nổ theo chu kỳ
  const burstTimer = setInterval(() => {
    // Tạo vài nổ ở vị trí ngẫu nhiên phía trên màn hình
    for (let i = 0; i < 3; i++) {
      createBurst(
        Math.random() * canvas.width * 0.9 + canvas.width * 0.05,
        Math.random() * canvas.height * 0.45 + canvas.height * 0.05,
        20 + Math.floor(Math.random() * 40)
      );
    }
  }, 900);

  // Tạo liên tiếp trong 9 giây, sau đó dần giảm tần suất
  setTimeout(() => {
    clearInterval(burstTimer);
    // còn nổ thêm vài lần phân tán
    const tail = setInterval(() => {
      createBurst(
        Math.random() * canvas.width * 0.9 + canvas.width * 0.05,
        Math.random() * canvas.height * 0.45 + canvas.height * 0.05,
        10 + Math.floor(Math.random() * 30)
      );
    }, 1200);
    // dừng sau 12s
    setTimeout(() => {
      clearInterval(tail);
    }, 12000);
  }, 9000);

  // Phong cách: xóa dần nội dung bằng fillRect với alpha để tạo vệt mờ
  let rafId;
  function animate() {
    // mờ dần (tao vệt)
    ctx.fillStyle = 'rgba(7,4,0,0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // vẽ particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += gravity;
      p.vx *= friction;
      p.vy *= friction;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.size *= 0.997;

      if (p.alpha <= 0.02 || p.size <= 0.2) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
      ctx.arc(p.x, p.y, Math.max(0.6, p.size), 0, Math.PI * 2);
      ctx.fill();
    }

    // vẽ blooms (chỉ là điểm sáng chớp)
    for (let i = blooms.length - 1; i >= 0; i--) {
      const b = blooms[i];
      b.life -= 1;
      if (b.life <= 0) {
        blooms.splice(i, 1);
        continue;
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.fillStyle = `rgba(${b.r},${b.g},${b.b},${Math.max(0.02, b.life / b.maxLife)})`;
      ctx.arc(b.x, b.y, (1 + (b.maxLife - b.life) * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    // tạo thêm vài tia sáng rơi (sparse)
    if (particles.length < maxParticles && Math.random() < 0.02) {
      createFall();
    }

    rafId = requestAnimationFrame(animate);
  }

  animate();

  // Hàm resize
  function resizeCanvas() {
    // Thiết lập kích thước nội bộ canvas theo devicePixelRatio để đảm bảo nét
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx && ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Tạo burst: tạo nhiều particles tỏa tròn
  function createBurst(x, y, count) {
    // Bloom chính (flash)
    blooms.push({
      x,
      y,
      r: 255,
      g: 200,
      b: Math.floor(20 + Math.random() * 200),
      life: 18,
      maxLife: 18
    });

    const hue = Math.random() * 360;
    for (let i = 0; i < count; i++) {
      if (particles.length >= maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 3.2) + 1.2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = hsvToRgb(hue + (Math.random() * 40 - 20), 0.9, 1);

      particles.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy * 0.9,
        r: color[0],
        g: color[1],
        b: color[2],
        alpha: 0.98,
        decay: 0.008 + Math.random() * 0.02,
        size: 2 + Math.random() * 3
      });
    }
  }

  // Tạo vài particle rơi chậm để làm nền
  function createFall() {
    const x = Math.random() * canvas.width;
    const y = -10;
    const hue = Math.random() * 360;
    const color = hsvToRgb(hue, 0.85, 1);
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 1 + Math.random() * 1.5,
      r: color[0],
      g: color[1],
      b: color[2],
      alpha: 0.9,
      decay: 0.002 + Math.random() * 0.01,
      size: 1 + Math.random() * 2
    });
  }

  // Chuyển HSV -> RGB (giúp chọn màu rực rỡ)
  function hsvToRgb(h, s, v) {
    h = h % 360;
    if (h < 0) h += 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  // Hàm dừng fireworks (nếu muốn)
  function stop() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resizeCanvas);
    canvas.style.display = 'none';
  }

  // (Tùy) dừng sau 25 giây để giải phóng resource
  setTimeout(() => {
    stop();
  }, 25000);
}
