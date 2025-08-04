const sounds = {
  boot: document.getElementById("boot-sound"),
  beep: document.getElementById("beep-sound"),
  open: document.getElementById("open-sound"),
  error: document.getElementById("error-sound"),
  hum: document.getElementById("hum-sound")
};

sounds.hum.loop = true;
sounds.hum.volume = 0.1;

let soundEnabled = true;
let theme = "dark";
let currentDir = "~";
let history = [];
let historyIndex = -1;

const output = document.getElementById("console-output");
const input = document.getElementById("console-input");
const breadcrumbs = document.getElementById("breadcrumbs");
const terminal = document.getElementById("terminal");
const bootScreen = document.getElementById("boot-screen");
const bootLogs = document.getElementById("boot-logs");
const namePrompt = document.getElementById("name-prompt");
const nameInput = document.getElementById("user-name");
const clock = document.getElementById("system-time");

const bootMessages = [
  "▒▒ Initializing DVC Terminal BIOS v1.91 ▒▒",
  "▒▒ 640KB RAM | 8-bit Audio Enabled | ANSI MODE ▒▒",
  "▒▒ [ OK ] Sound chip detected",
  "▒▒ [ OK ] Display driver: CRT Simulated",
  "▒▒ [ OK ] Local session storage enabled",
  "▒▒ Awaiting user authentication..."
];

// File system
const fileSystem = {
  "~": {
    type: "folder",
    children: {
      projects: {
        type: "folder",
        children: {
          "GP-App.txt": "Photography meets SwiftUI",
          "Craftify.txt": "Minecraft recipe app for iOS",
          "CityMart.txt": "Roblox rural store simulation"
        }
      },
      about: {
        type: "file",
        content: `Dave Van Cauwenberghe – Indie dev from Ghent
Loves UI, cozy visuals, and console geekery.`
      },
      links: {
        type: "folder",
        children: {
          "GitHub.link": "https://github.com/davevancauwenberghe",
          "YouTube.link": "https://youtube.com/@davevancauwenberghe"
        }
      }
    }
  }
};

function writeLine(text = "") {
  const line = document.createElement("pre");
  line.textContent = text;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function getNode(path) {
  const parts = path.split("/").filter(Boolean);
  let node = fileSystem["~"];
  for (let i = 1; i < parts.length; i++) {
    node = node.children?.[parts[i]];
    if (!node) return null;
  }
  return node;
}

function getCurrentNode() {
  return getNode(currentDir);
}

function play(name) {
  if (soundEnabled && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

function setBreadcrumbs() {
  breadcrumbs.textContent = currentDir;
}

function updateClock() {
  const now = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/Brussels",
    hour12: false
  });
  clock.textContent = `System time: ${now}`;
}
setInterval(updateClock, 1000);

// Directory
function renderDir() {
  const node = getCurrentNode();
  writeLine();
  Object.entries(node.children).forEach(([name, val]) => {
    const line = val.type === "folder" ? `- ${name}/` : `• ${name}`;
    const span = document.createElement("span");
    span.textContent = line;
    span.classList.add("clickable");
    span.onclick = () => {
      if (val.type === "folder") handleCommand(`cd ${name}`);
      else handleCommand(`open ${name}`);
    };
    output.appendChild(span);
    output.appendChild(document.createElement("br"));
  });
}

// Command parser
function handleCommand(raw) {
  const [cmdRaw, ...args] = raw.trim().split(" ");
  const cmd = cmdRaw.toLowerCase();
  writeLine(`> ${raw}`);
  play("beep");

  switch (cmd) {
    case "help":
    case "?":
      writeLine(`Available commands:
- help, ?          Show help
- ls, dir          List folder
- cd <dir>         Enter folder
- cd ..            Go up one level
- cd /             Go to root
- open <file>      Open file or link
- clear, cls       Clear screen
- mute, soundoff   Toggle sound
- theme            Toggle theme
- exit             Log out / clear session`);
      break;

    case "ls":
    case "dir":
      renderDir();
      break;

    case "cd":
      if (!args[0]) return writeLine("Usage: cd <folder>");
      if (args[0] === "/") {
        currentDir = "~";
        setBreadcrumbs();
        renderDir();
        return;
      }
      if (args[0] === "..") {
        const parts = currentDir.split("/");
        if (parts.length > 1) {
          parts.pop();
          currentDir = parts.join("/") || "~";
        } else {
          currentDir = "~";
        }
        setBreadcrumbs();
        renderDir();
        return;
      }
      const newPath = `${currentDir}/${args[0]}`;
      const node = getNode(newPath);
      if (node?.type === "folder") {
        currentDir = newPath;
        setBreadcrumbs();
        renderDir();
      } else {
        play("error");
        writeLine("Folder not found.");
      }
      break;

    case "open":
      if (!args[0]) return writeLine("Usage: open <file>");
      const file = getCurrentNode().children?.[args[0]];
      if (!file) {
        play("error");
        return writeLine("File not found.");
      }
      if (typeof file === "string") {
        if (args[0].endsWith(".link")) {
          play("open");
          writeLine(`Opening ${file}...`);
          window.open(file, "_blank");
        } else {
          writeLine(file);
        }
      } else {
        writeLine("Cannot open a folder.");
      }
      break;

    case "clear":
    case "cls":
      output.innerHTML = "";
      break;

    case "mute":
    case "soundoff":
      soundEnabled = !soundEnabled;
      if (!soundEnabled) Object.values(sounds).forEach(s => s.pause?.());
      else sounds.hum.play();
      writeLine(`Sound ${soundEnabled ? "enabled" : "muted"}`);
      break;

    case "theme":
      theme = theme === "dark" ? "light" : "dark";
      document.body.classList.toggle("light-mode", theme === "light");
      writeLine(`Theme set to ${theme}`);
      break;

    case "exit":
      localStorage.removeItem("dvc_username");
      location.reload();
      break;

    default:
      play("error");
      writeLine(`Unknown command: '${cmd}'
Type 'help' for options.`);
  }
}

// Boot log
function bootLogSequence(callback) {
  let i = 0;
  const interval = setInterval(() => {
    if (i < bootMessages.length) {
      bootLogs.textContent += bootMessages[i++] + "
";
    } else {
      clearInterval(interval);
      namePrompt.style.display = "block";
      nameInput.focus();
      if (callback) callback();
    }
  }, 600);
}

// Terminal
function initTerminal() {
  setTimeout(() => {
    bootScreen.style.display = "none";
    terminal.style.display = "block";
    setBreadcrumbs();
    updateClock();
    play("boot");
    if (soundEnabled) sounds.hum.play();
    const name = localStorage.getItem("dvc_username") || "Dave";
    writeLine(`Welcome, ${name}.`);
    writeLine("Type 'help' or click a folder to begin.");
    renderDir();
  }, 1000);
}

// Name prompt
nameInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const val = nameInput.value.trim();
    const banned = ["fuck", "gay", "nigger", "niggah", "nazi", "root"];
    const isSafe = /^[a-zA-Z0-9 _-]+$/.test(val) && !banned.includes(val.toLowerCase());
    if (val.length < 2 || !isSafe) {
      alert("Invalid name. Please choose another.");
      return;
    }
    localStorage.setItem("dvc_username", val);
    initTerminal();
  }
});

// Terminal input
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const val = input.value.trim();
    if (val) {
      history.push(val);
      historyIndex = history.length;
      handleCommand(val);
    }
    input.value = "";
  } else if (e.key === "ArrowUp") {
    if (historyIndex > 0) {
      historyIndex--;
      input.value = history[historyIndex] || "";
    }
  } else if (e.key === "ArrowDown") {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex] || "";
    } else {
      input.value = "";
    }
  }
});

// Init
window.addEventListener("load", () => {
  const stored = localStorage.getItem("dvc_username");
  if (stored) {
    bootLogs.textContent = `User '${stored}' already logged on.
Press ENTER to continue.
`;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") initTerminal();
    }, { once: true });
  } else {
    bootLogSequence();
  }
});