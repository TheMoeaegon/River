# 🚀 River

**River** is a blazing fast Node.js CLI tool for searching text in large files. It scans files efficiently with streaming pipelines, ensuring minimal memory usage—even with massive log files.

---

## ✨ Features

- Stream-based search (handles very large files)
- Memory-efficient (never loads full file into memory)
- Fast pattern matching (multiple terms supported)
- Colorful match highlighting in terminal
- Output matches to a new file if desired
- Progress bar and speed display

---

## 🛠 Requirements

- Node.js v18 or later
- npm (Node package manager)

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/TheMoeaegon/River.git

# Change directory
cd River

# Make the install script executable and run it
chmod +x install.sh
./install.sh
```
> *This will automatically set up your environment and make the CLI available globally as `search`.*

---

## ⚡ Usage

### Basic Search

```bash
river ERROR -f app.log
```
_Search for lines containing “ERROR” in app.log_

### Multiple Terms

```bash
river WARN ERROR -f app.log
```
_Find lines with either “WARN” or “ERROR”_

### Output to File

```bash
river ERROR -f app.log -o errors.log
```
_Output all matching lines to `errors.log`_

---

## 📝 Example Terminal Output

```
[#########################---------] 58.7% | 5.9 MB/s | ETA: 3.6s
ERROR: Something went wrong!
WARN: This is a warning
...
✅ done in 2.83s | 6.5 MB/s | 15 matches
```

---

## 🔗 Links

- [GitHub Repository](https://github.com/TheMoeaegon/River)

---

_Built with ❤️ by themoeaegon_
