const bootScreen = document.getElementById("boot-screen");
const terminal = document.getElementById("terminal");
const output = document.getElementById("console-output");
const input = document.getElementById("console-input");
const breadcrumbs = document.getElementById("breadcrumbs");

const sounds = {
  boot: document.getElementById("boot-sound"),
  beep: document.getElementById("beep-sound"),
  open: document.getElementById("open-sound"),
  error: document.getElementById("error-sound")
};

let soundEnabled = true;
let currentDir = "~";
let theme = "dark";

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
        content: `Dave Van Cauwenberghe – Indie dev from Ghent 🇧🇪\nLoves UI, cozy visuals, and console geekery.`
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

// Utility
function writeLine(text = "") {
  output.innerHTML += text + "\n";
  output.scrollTop = output.scrollHeight;
}

function getNode(path) {
  const parts = path.split("/").filter(Boolean);
  let node = fileSystem["~"];
  for (let i = 1; i < parts.length; i++) {
    if (node?.children?.[parts[i]]) {
      node = node.children[parts[i]];
    } else return null;
  }
  return node;
}

function getCurrentNode() {
  return getNode(currentDir);
}

function play(sound) {
  if (soundEnabled && sounds[sound]) {
    sounds[sound].currentTime = 0;
    sounds[sound].play();
  }
}

function renderDir() {
  const node = getCurrentNode();
  writeLine();
  Object.entries(node.children).forEach(([name, value]) => {
    const span = document.createElement("span");
    span.textContent = value.type === "folder" || typeof value === "object" ? `📁 ${name}` : `📄 ${name}`;
    span.classList.add("clickable");
    span.onclick = () => {
      if (value.type === "folder" || typeof value === "object") {
        handleCommand(`cd ${name}`);
      } else {
        handleCommand(`open ${name}`);
      }
    };
    output.appendChild(span);
    output.innerHTML += "\n";
  });
}

function setBreadcrumbs() {
  breadcrumbs.textContent = currentDir;
}

function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";
  document.body.classList.toggle("light-mode", theme === "light");
  writeLine(`Theme set to ${theme}`);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  writeLine(`Sound ${soundEnabled ? "enabled" : "muted"}`);
}

// Command Handler
function handleCommand(inputValue) {
  const [cmdRaw, ...args] = inputValue.trim().split(" ");
  const cmd = cmdRaw.toLowerCase();

  play("beep");
  writeLine(`> ${inputValue}`);

  switch (cmd) {
    case "help":
    case "?":
      writeLine(`Available commands:
  help, ?            Show this help message
  ls, dir            List current directory
  cd <dir>           Enter folder
  open <file>        Open file or link
  clear, cls         Clear console
  mute, soundoff     Toggle sound
  theme              Toggle light/dark mode`);
      break;

    case "ls":
    case "dir":
      renderDir();
      break;

    case "cd":
    case "open":
      if (!args[0]) return writeLine("Usage: cd/open <name>");

      const node = getCurrentNode();
      const target = node.children?.[args[0]];

      if (!target) {
        play("error");
        return writeLine("No such file or folder.");
      }

      if (target.type === "folder" || typeof target === "object") {
        currentDir += `/${args[0]}`;
        setBreadcrumbs();
        renderDir();
      } else if (typeof target === "string") {
        if (args[0].endsWith(".link")) {
          play("open");
          writeLine(`Opening ${target}...`);
          window.open(target, "_blank");
        } else {
          writeLine(target);
        }
      } else {
        play("error");
        writeLine("Unknown file type.");
      }
      break;

    case "clear":
    case "cls":
      output.innerHTML = "";
      break;

    case "mute":
    case "soundoff":
    case "toggle":
      toggleSound();
      break;

    case "theme":
    case "lightmode":
    case "darkmode":
      toggleTheme();
      break;

    default:
      play("error");
      writeLine(`Unknown command: ${cmd}\nType 'help' to see available commands.`);
  }
}

// Init
window.addEventListener("load", () => {
  play("boot");
  setTimeout(() => {
    bootScreen.style.display = "none";
    terminal.style.display = "block";
    setBreadcrumbs();
    writeLine("Welcome, Dave.\nType 'help' or click a folder to browse.");
    renderDir();
  }, 2500);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const cmd = input.value.trim();
    input.value = "";
    if (cmd) handleCommand(cmd);
  }
});
