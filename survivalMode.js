// survivalMode.js
// ============================
// CHAOS KEYBOARD BATTLE - SURVIVAL MODE (with Leaderboard integration)
// ============================

let canvas, ctx;
let paused = false;
let gameOverState = false;
let startTime = 0;
let pauseStartTime = 0;
let totalPausedTime = 0;
let enemySpawnInterval, powerUpSpawnInterval;
const enemySpawnRate = 2000;
const powerUpSpawnRate = 10000;
let animationFrameId;

// Audio elements (from index.html)
let bgMusic, shootSound, hitSound, shieldBreakSound;

// Player name
let playerName = 'Player 1';

// Entity arrays
const enemies = [];
const enemyBullets = [];
const powerUps = [];

// Player setup
const player = {
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  speed: 5,
  baseSpeed: 5,
  health: 100,
  score: 0,
  bullets: [],
  shieldActive: false,
  dashCooldown: 0,
  lastShot: 0,
};

// Input state
const keys = {};

function attachEventListeners() {
  document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'p') togglePause();
    if (e.key.toLowerCase() === 'f') shoot360();
  });
  document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
  });
}

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 50),
    y: -50,
    width: 50,
    height: 50,
    speed: Math.random() * 2 + 1 + getWave() * 0.2,
    health: 30 + getWave() * 5,
    lastShot: Date.now(),
  });
}

function spawnPowerUp() {
  const types = ["health", "shield", "speed", "bullet"];
  const type = types[Math.floor(Math.random() * types.length)];
  powerUps.push({
    x: Math.random() * (canvas.width - 30),
    y: Math.random() * (canvas.height - 30),
    width: 30,
    height: 30,
    type,
    spawnTime: Date.now(),
  });
}

function shootBullet() {
  if (shootSound) {
    shootSound.currentTime = 0;
    shootSound.play();
  }
  player.bullets.push({
    x: player.x + player.width/2,
    y: player.y,
    width: 10,
    height: 10,
    vx: 0,
    vy: -6
  });
}

function shoot360() {
  if (shootSound) {
    shootSound.currentTime = 0;
    shootSound.play();
  }
  for (let deg = 0; deg < 360; deg += 45) {
    const rad = deg * Math.PI/180;
    player.bullets.push({
      x: player.x + player.width/2,
      y: player.y + player.height/2,
      width: 8,
      height: 8,
      vx: Math.cos(rad) * 5,
      vy: Math.sin(rad) * 5
    });
  }
}

function dash() {
  if (player.dashCooldown <= 0) {
    player.speed = player.baseSpeed * 3;
    player.dashCooldown = 2000;
    setTimeout(() => player.speed = player.baseSpeed, 300);
  }
}

function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function getWave() {
  return Math.floor((Date.now() - startTime - totalPausedTime) / 30000) + 1;
}

function update() {
  if (paused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const wave = getWave();

  // Player movement
  if (keys['a'] && player.x > 0) player.x -= player.speed;
  if (keys['d'] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys['w'] && player.y > 0) player.y -= player.speed;
  if (keys['s'] && player.y + player.height < canvas.height) player.y += player.speed;

  // Shooting
  if (keys[' '] && Date.now() - player.lastShot > 300) {
    shootBullet();
    player.lastShot = Date.now();
  }

  // Shield & Dash
  player.shieldActive = !!keys['q'];
  if (keys['e']) dash();
  if (player.dashCooldown > 0) player.dashCooldown -= 16;

  // Update bullets/enemies/enemy bullets/power-ups (omitted for brevity)
  // Drawing UI (omitted)

  if (player.health <= 0) return showLoseScreen();
  animationFrameId = requestAnimationFrame(update);
}

function showLoseScreen() {
  gameOverState = true;
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  if (bgMusic) bgMusic.pause();
  const title = document.getElementById('gameOverTitle');
  title && (title.innerText = `${playerName} 👎🏻!`);
  document.getElementById('gameOverScreen')?.classList.remove('hidden');
  submitScoreAndShow(); // Submit score and show leaderboard
}

function showWinScreen() {
  gameOverState = true;
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  if (bgMusic) bgMusic.pause();
  const title = document.getElementById('gameOverTitle');
  title && (title.innerText = `${playerName} 🏆!`);
  document.getElementById('gameOverScreen')?.classList.remove('hidden');
  submitScoreAndShow(); // Submit score and show leaderboard
}

function survivalStartGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  playerName = document.getElementById('p1Name').value.trim() || 'Player 1';
  bgMusic = document.getElementById('bgMusic');
  shootSound = document.getElementById('shootSound');
  hitSound = document.getElementById('hitSound');
  shieldBreakSound = document.getElementById('shieldBreakSound');

  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    bgMusic.play();
  }
  const volSlider = document.getElementById('volumeSlider');
  if (volSlider) {
    volSlider.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      [bgMusic, shootSound, hitSound, shieldBreakSound].forEach(s => s && (s.volume = v));
    });
  }

  attachEventListeners();
  player.x = canvas.width/2 - 25;
  player.y = canvas.height - 100;
  player.health = 100;
  player.score = 0;
  player.bullets = [];
  player.shieldActive = false;
  player.speed = player.baseSpeed;
  player.lastShot = 0;
  player.dashCooldown = 0;

  enemies.length = 0;
  enemyBullets.length = 0;
  powerUps.length = 0;
  gameOverState = false;
  paused = false;

  startTime = Date.now();
  totalPausedTime = 0;
  enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate);
  powerUpSpawnInterval = setInterval(spawnPowerUp, powerUpSpawnRate);
  animationFrameId = requestAnimationFrame(update);
}

function togglePause() {
  paused = !paused;
  const ps = document.getElementById('pauseScreen');
  ps?.classList.toggle('hidden');

  if (paused) {
    pauseStartTime = Date.now();
    clearInterval(enemySpawnInterval);
    clearInterval(powerUpSpawnInterval);
    cancelAnimationFrame(animationFrameId);
    bgMusic?.pause();
  } else {
    totalPausedTime += Date.now() - pauseStartTime;
    enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate);
    powerUpSpawnInterval = setInterval(spawnPowerUp, powerUpSpawnRate);
    animationFrameId = requestAnimationFrame(update);
    bgMusic?.play();
  }
}

function restartGame() { location.reload(); }
function playAgain() {
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  document.getElementById('gameOverScreen')?.classList.add('hidden');
  survivalStartGame();
}

// Leaderboard integration
function submitScoreAndShow() {
  const elapsed = Math.floor((Date.now() - startTime - totalPausedTime) / 1000);
  fetch('insert_score.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_name: playerName,
      health_remaining: player.health,
      score: player.score,
      waves_survived: getWave(),
      time_survived: elapsed
    })
  })
  .then(res => res.json())
  .then(() => fetchLeaderboard());
}

function fetchLeaderboard() {
  fetch('leaderboard.php')
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#leaderboardTable tbody');
      tbody.innerHTML = '';
      data.forEach((row, i) => {
        const tr = document.createElement('tr');
        if (
          row.player_name === playerName &&
          row.score === player.score &&
          row.waves_survived === getWave()
        ) {
          tr.classList.add('highlight');
        }
        tr.innerHTML = `
          <td>${i+1}</td>
          <td>${row.player_name}</td>
          <td>${row.health_remaining}</td>
          <td>${row.score}</td>
          <td>${row.waves_survived}</td>
          <td>${row.time_survived}</td>
        `;
        tbody.appendChild(tr);
      });
      document.getElementById('leaderboardScreen').classList.remove('hidden');
    });
}

function openLeaderboard() {
  if (gameOverState) {
    submitScoreAndShow();
  } else {
    fetchLeaderboard();
  }
}

function closeLeaderboard() {
  document.getElementById('leaderboardScreen').classList.add('hidden');
}

// Expose to HTML
window.survivalStartGame = survivalStartGame;
window.togglePause       = togglePause;
window.restartGame       = restartGame;
window.playAgain         = playAgain;
window.openLeaderboard   = openLeaderboard;
window.closeLeaderboard  = closeLeaderboard;
