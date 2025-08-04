// script.js
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
const clock = document.getElementById("system-time");

// Simulated file system
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
        content: `Dave Van Cauwenberghe – Indie dev from Ghent\nLoves UI, cozy visuals, and console geekery.`
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

// Utilities
function writeLine(text = "") {
  output.innerHTML += text + "\n";
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

// Terminal Commands
function renderDir() {
  const node = getCurrentNode();
  writeLine();
  Object.entries(node.children).forEach(([name, val]) => {
    const line = val.type === "folder" || typeof val === "object"
      ? `- ${name}/`
      : `• ${name}`;
    const span = document.createElement("span");
    span.textContent = line;
    span.classList.add("clickable");
    span.onclick = () => {
      if (val.type === "folder" || typeof val === "object") {
        handleCommand(`cd ${name}`);
      } else {
        handleCommand(`open ${name}`);
      }
    };
    output.appendChild(span);
    output.innerHTML += "\n";
  });
}

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
- open <file>      Open file or link
- clear, cls       Clear screen
- mute, soundoff   Toggle sound
- theme            Toggle theme`);
      break;

    case "ls":
    case "dir":
      renderDir();
      break;

    case "cd":
      if (!args[0]) return writeLine("Usage: cd <folder>");
      const newPath = `${currentDir}/${args[0]}`;
      const node = getNode(newPath);
      if (node?.type === "folder" || typeof node === "object") {
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
    case "toggle":
      soundEnabled = !soundEnabled;
      if (!soundEnabled) {
        Object.values(sounds).forEach(s => { s.pause?.(); });
      } else {
        sounds.hum.play();
      }
      writeLine(`Sound ${soundEnabled ? "enabled" : "muted"}`);
      break;

    case "theme":
    case "lightmode":
    case "darkmode":
      theme = theme === "dark" ? "light" : "dark";
      document.body.classList.toggle("light-mode", theme === "light");
      writeLine(`Theme set to ${theme}`);
      break;

    default:
      play("error");
      writeLine(`Unknown command: '${cmd}'\nType 'help' for options.`);
  }
}

// Boot & Keyboard
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

window.addEventListener("load", () => {
  setTimeout(() => {
    bootScreen.style.display = "none";
    terminal.style.display = "block";
    setBreadcrumbs();
    updateClock();
    play("boot");
    if (soundEnabled) sounds.hum.play();
    writeLine("Welcome, Dave.");
    writeLine("Type 'help' or click a folder to begin.");
    renderDir();
  }, 2500);
});
