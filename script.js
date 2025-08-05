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
const loginLoader = document.getElementById("login-loader");

const bootMessages = [
  "▒▒ Initializing dvc. terminalOS BIOS v0.4.3 ▒▒",
  "▒▒ 640KB RAM | 8-bit Audio Enabled | ANSI MODE ▒▒",
  "▒▒ [ OK ] Sound chip detected",
  "▒▒ [ OK ] Display driver: CRT Simulated",
  "▒▒ [ OK ] Local session storage enabled",
  "▒▒ Awaiting user authentication..."
];

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

function writeLine(text = "") {
  const line = document.createElement("pre");
  line.innerText = text; // ✅ allows \n to render properly
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
      writeLine(`Unknown command: '${cmd}'\nType 'help' for options.`);
  }
}

function bootLogSequence(callback) {
  let i = 0;
  const interval = setInterval(() => {
    if (i < bootMessages.length) {
      bootLogs.innerText += bootMessages[i++] + "\n";
    } else {
      clearInterval(interval);
      namePrompt.style.display = "block";
      nameInput.focus();
      if (callback) callback();
    }
  }, 600);
}

function initTerminal() {
  bootScreen.style.display = "none";
  terminal.style.display = "block";
  setBreadcrumbs();
  updateClock();
  play("boot");
  if (soundEnabled) sounds.hum.play();
  const name = localStorage.getItem("dvc_username") || "User";
  writeLine(`Welcome, ${name}.`);
  writeLine("Type 'help' or click a folder to begin.");
  renderDir();
}

nameInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const val = nameInput.value.trim();
    const banned = ["fuck", "gay", "nigger", "nazi", "root"];
    const isSafe = /^[a-zA-Z0-9 _-]+$/.test(val) && !banned.includes(val.toLowerCase());

    if (val.length < 2 || !isSafe) {
      alert("Invalid name. Please choose another.");
      return;
    }

    loginLoader?.classList.add("show");

    setTimeout(() => {
      localStorage.setItem("dvc_username", val);
      initTerminal();
    }, 1200); // fake delay
  }
});

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
  const stored = localStorage.getItem("dvc_username");
  if (stored) {
    bootLogs.innerText = `User '${stored}' already logged on.\nPress ENTER to continue.\n`;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") initTerminal();
    }, { once: true });
  } else {
    bootLogSequence();
  }
});
