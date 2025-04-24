document.addEventListener("DOMContentLoaded", function () {
  console.log("Throne Wars RTS Menu Initialized");

  // References to DOM elements
  const startGameBtn = document.getElementById("start-game");
  const multiplayerBtn = document.getElementById("multiplayer");
  const howToPlayBtn = document.getElementById("how-to-play");
  const settingsBtn = document.getElementById("settings");
  const creditsBtn = document.getElementById("credits");
  const exitGameBtn = document.getElementById("exit-game");

  const modalContainer = document.getElementById("modal-container");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.querySelector(".modal-close");

  const menuMusic = document.getElementById("menu-music");

  // Background hexagon animation
  createHexagonBackground();

  // Initialize background music with low volume
  menuMusic.volume = 0.2;

  // Auto-play music when user interacts with the page
  document.addEventListener(
    "click",
    function () {
      if (menuMusic.paused) {
        menuMusic.play().catch((error) => {
          console.log("Audio play failed:", error);
        });
      }
    },
    { once: true }
  );

  // Button event listeners
  startGameBtn.addEventListener("click", function () {
    playButtonSound();
    window.location.href = "/game/";
  });

  multiplayerBtn.addEventListener("click", function () {
    playButtonSound();
    showModal(
      "Multiplayer",
      `
            <div class="modal-section">
                <h3>Game Modes</h3>
                <div class="game-modes">
                    <button class="modal-button">Quick Match</button>
                    <button class="modal-button">Ranked Play</button>
                    <button class="modal-button">Custom Game</button>
                    <button class="modal-button">Join Friend</button>
                </div>
                <p class="coming-soon">Multiplayer mode coming soon in the next update!</p>
            </div>
        `
    );
  });

  howToPlayBtn.addEventListener("click", function () {
    playButtonSound();
    showModal(
      "How to Play",
      `
            <div class="modal-section">
                <h3>Game Basics</h3>
                <p>Throne Wars RTS is a hexagonal grid-based real-time strategy game where you build bases, gather resources, and command armies to defeat your opponents.</p>
                
                <h3>Controls</h3>
                <ul>
                    <li><strong>Left Click:</strong> Select units or buildings</li>
                    <li><strong>Right Click:</strong> Move selected units or set target</li>
                    <li><strong>WASD Keys:</strong> Move camera</li>
                    <li><strong>Mouse Wheel:</strong> Zoom in/out</li>
                    <li><strong>Shift + Click:</strong> Add to selection</li>
                    <li><strong>Ctrl + Numbers (1-9):</strong> Create control groups</li>
                </ul>
                
                <h3>Getting Started</h3>
                <p>1. Build resource collectors to gather gold</p>
                <p>2. Construct barracks to train infantry units</p>
                <p>3. Build factories for advanced vehicles</p>
                <p>4. Expand your territory and conquer enemy bases</p>
                
                <h3>Tutorial</h3>
                <button class="modal-button primary">Start Tutorial</button>
            </div>
        `
    );
  });

  settingsBtn.addEventListener("click", function () {
    playButtonSound();
    showModal(
      "Settings",
      `
            <div class="settings-grid">
                <div class="settings-section">
                    <h3>Graphics</h3>
                    <div class="setting-item">
                        <span>Resolution</span>
                        <select>
                            <option>1920×1080</option>
                            <option>1600×900</option>
                            <option>1280×720</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <span>Quality</span>
                        <select>
                            <option>Ultra</option>
                            <option selected>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <span>Fullscreen</span>
                        <label class="toggle">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Audio</h3>
                    <div class="setting-item">
                        <span>Master Volume</span>
                        <input type="range" min="0" max="100" value="80">
                    </div>
                    <div class="setting-item">
                        <span>Music Volume</span>
                        <input type="range" min="0" max="100" value="60">
                    </div>
                    <div class="setting-item">
                        <span>SFX Volume</span>
                        <input type="range" min="0" max="100" value="75">
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Gameplay</h3>
                    <div class="setting-item">
                        <span>Game Difficulty</span>
                        <select>
                            <option>Easy</option>
                            <option selected>Normal</option>
                            <option>Hard</option>
                            <option>Extreme</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <span>Camera Speed</span>
                        <input type="range" min="1" max="10" value="5">
                    </div>
                    <div class="setting-item">
                        <span>Show Tutorial Tips</span>
                        <label class="toggle">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="settings-footer">
                <button class="modal-button">Restore Defaults</button>
                <button class="modal-button primary">Save Changes</button>
            </div>
        `
    );
  });

  creditsBtn.addEventListener("click", function () {
    playButtonSound();
    showModal(
      "Credits",
      `
            <div class="credits-content">
                <div class="credits-section">
                    <h3>Development Team</h3>
                    <p>Lead Developer: Khoi Le</p>
                    <p>Game Design: Throne Wars Team</p>
                    <p>Art Direction: Creative Department</p>
                </div>
                
                <div class="credits-section">
                    <h3>Technologies</h3>
                    <p>Frontend: HTML5, CSS3, JavaScript</p>
                    <p>Game Engine: Phaser 3</p>
                    <p>Backend: FastAPI, Python</p>
                </div>
                
                <div class="credits-section">
                    <h3>Special Thanks</h3>
                    <p>To all beta testers and the RTS community</p>
                    <p>And you for playing our game!</p>
                </div>
                
                <div class="credits-logo">
                    <div class="logo-emblem">
                        <div class="logo-crown"></div>
                    </div>
                    <h2>THRONE WARS RTS</h2>
                </div>
            </div>
        `
    );
  });

  exitGameBtn.addEventListener("click", function () {
    playButtonSound();
    showModal(
      "Exit Game",
      `
            <div class="exit-confirmation">
                <p>Are you sure you want to exit the game?</p>
                <div class="exit-buttons">
                    <button class="modal-button" id="cancel-exit">Cancel</button>
                    <button class="modal-button danger" id="confirm-exit">Exit Game</button>
                </div>
            </div>
        `
    );

    // Add event listeners for the exit confirmation buttons
    document
      .getElementById("cancel-exit")
      .addEventListener("click", function () {
        closeModal();
      });

    document
      .getElementById("confirm-exit")
      .addEventListener("click", function () {
        // In a web context, we'll just redirect to a farewell page or close the tab
        window.location.href = "/farewell.html";
      });
  });

  // Close modal when clicking the X button
  modalClose.addEventListener("click", closeModal);

  // Close modal when clicking outside the content
  modalContainer.addEventListener("click", function (e) {
    if (e.target === modalContainer) {
      closeModal();
    }
  });

  // Modal functions
  function showModal(title, content) {
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modalContainer.classList.remove("modal-hidden");
  }

  function closeModal() {
    playButtonSound();
    modalContainer.classList.add("modal-hidden");
  }

  // Audio functions
  function playButtonSound() {
    const buttonSound = new Audio("/menu/assets/audio/button-click.mp3");
    buttonSound.volume = 0.3;
    buttonSound.play().catch((error) => {
      console.log("Audio play failed:", error);
    });
  }

  // Create animated hexagon background
  function createHexagonBackground() {
    const hexGrid = document.querySelector(".hexagon-grid");
    const fragment = document.createDocumentFragment();
    const hexSize = 150; // Size of each hexagon

    // Calculate how many hexagons we need based on screen size
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const hexPerRow = Math.ceil(screenWidth / hexSize) + 1;
    const hexRows = Math.ceil(screenHeight / hexSize) + 1;

    for (let row = 0; row < hexRows; row++) {
      for (let col = 0; col < hexPerRow; col++) {
        const hex = document.createElement("div");
        hex.className = "hex-cell";

        // Position hexagons in a grid with offset for odd rows
        const xOffset = row % 2 ? hexSize * 0.5 : 0;
        hex.style.left = `${col * hexSize - hexSize * 0.5 + xOffset}px`;
        hex.style.top = `${row * (hexSize * 0.75) - hexSize * 0.5}px`;

        // Set random appearance timing and animation
        const delay = Math.random() * 3;
        const animDuration = 3 + Math.random() * 5;
        hex.style.animationDelay = `${delay}s`;
        hex.style.animationDuration = `${animDuration}s`;

        fragment.appendChild(hex);
      }
    }

    hexGrid.appendChild(fragment);
  }

  // Add additional animations
  animateMenuItems();

  function animateMenuItems() {
    const menuButtons = document.querySelectorAll(".menu-button");

    menuButtons.forEach((button, index) => {
      button.style.opacity = "0";
      button.style.transform = "translateX(-20px)";

      setTimeout(() => {
        button.style.transition = "all 0.5s ease";
        button.style.opacity = "1";
        button.style.transform = "translateX(0)";
      }, 200 + index * 100); // Stagger the animations
    });
  }
});
