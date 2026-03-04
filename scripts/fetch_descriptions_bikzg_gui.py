#!/usr/bin/env python3
"""
Графический интерфейс для загрузки описаний с bikzg.ru.
Полный лог пишется в файл; в окне — только прогресс и итог (удачно/ошибки/без описаний).

Запуск: python3 scripts/fetch_descriptions_bikzg_gui.py [путь_к_проекту]
"""

import os
import re
import subprocess
import sys
import threading
import tkinter as tk
from datetime import datetime
from pathlib import Path
from tkinter import ttk, filedialog, messagebox, scrolledtext

# Путь к скрипту (рядом с этим файлом)
SCRIPT_DIR = Path(__file__).resolve().parent
FETCH_SCRIPT = SCRIPT_DIR / "fetch_descriptions_bikzg.py"


def find_project_root(start: Path) -> Path | None:
    """Найти корень проекта (где есть папка catalog)."""
    p = start.resolve()
    for _ in range(10):
        if (p / "catalog").is_dir():
            return p
        if p.parent == p:
            break
        p = p.parent
    return None


class FetchGUI:
    def __init__(self, initial_path: str | None = None):
        self.root = tk.Tk()
        self.root.title("Загрузка описаний с bikzg.ru")
        self.root.minsize(480, 420)
        self.root.geometry("620x520")

        self.process: subprocess.Popen | None = None
        self.log_file = None
        self.log_path: Path | None = None
        self.stats = {"done": 0, "total": 0, "ok": 0, "err": 0, "empty": 0}
        self.last_lines: list[tuple[str, str]] = []  # (path, status)
        self.max_last = 200
        self.lock = threading.Lock()

        self._build_ui(initial_path)

    def _build_ui(self, initial_path: str | None):
        main = ttk.Frame(self.root, padding=10)
        main.pack(fill=tk.BOTH, expand=True)

        # Путь к проекту
        row = ttk.Frame(main)
        row.pack(fill=tk.X, pady=(0, 6))
        ttk.Label(row, text="Корень проекта:").pack(side=tk.LEFT)
        self.path_var = tk.StringVar(value=initial_path or os.getcwd())
        self.path_entry = ttk.Entry(row, textvariable=self.path_var, width=50)
        self.path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(8, 4))

        def browse():
            d = filedialog.askdirectory(title="Выберите корень проекта", initialdir=self.path_var.get())
            if d:
                self.path_var.set(d)

        ttk.Button(row, text="…", width=3, command=browse).pack(side=tk.LEFT)

        # Опции
        opt = ttk.Frame(main)
        opt.pack(fill=tk.X, pady=(0, 8))
        ttk.Label(opt, text="Потоков:").pack(side=tk.LEFT)
        self.workers_var = tk.StringVar(value="4")
        ttk.Spinbox(opt, from_=1, to=16, width=4, textvariable=self.workers_var).pack(side=tk.LEFT, padx=(4, 12))
        ttk.Label(opt, text="Таймаут (с):").pack(side=tk.LEFT, padx=(8, 0))
        self.timeout_var = tk.StringVar(value="60")
        ttk.Spinbox(opt, from_=15, to=120, width=4, textvariable=self.timeout_var).pack(side=tk.LEFT, padx=(4, 12))
        self.no_cache_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(opt, text="Без кэша", variable=self.no_cache_var).pack(side=tk.LEFT, padx=(8, 0))

        # Файл лога
        log_row = ttk.Frame(main)
        log_row.pack(fill=tk.X, pady=(0, 6))
        ttk.Label(log_row, text="Лог (файл):").pack(side=tk.LEFT)
        self.log_var = tk.StringVar()
        self.log_entry = ttk.Entry(log_row, textvariable=self.log_var, width=45)
        self.log_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(8, 4))

        def set_default_log():
            root_path = self.path_var.get().strip() or "."
            p = Path(root_path).resolve()
            name = f"bikzg_fetch_{datetime.now().strftime('%Y%m%d_%H%M')}.log"
            self.log_var.set(str(p / name))

        ttk.Button(log_row, text="По умолчанию", command=set_default_log).pack(side=tk.LEFT)
        set_default_log()

        # Кнопки
        btn_row = ttk.Frame(main)
        btn_row.pack(fill=tk.X, pady=(4, 8))
        self.start_btn = ttk.Button(btn_row, text="Старт", command=self.start)
        self.start_btn.pack(side=tk.LEFT, padx=(0, 6))
        self.stop_btn = ttk.Button(btn_row, text="Стоп", command=self.stop, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(btn_row, text="Открыть лог", command=self.open_log).pack(side=tk.LEFT)

        # Прогресс и сводка
        prog_frame = ttk.LabelFrame(main, text="Прогресс и итог", padding=6)
        prog_frame.pack(fill=tk.X, pady=(0, 6))
        self.progress_var = tk.StringVar(value="—")
        ttk.Label(prog_frame, textvariable=self.progress_var).pack(anchor=tk.W)
        self.progress_bar = ttk.Progressbar(prog_frame, mode="determinate")
        self.progress_bar.pack(fill=tk.X, pady=(4, 6))
        self.summary_var = tk.StringVar(value="Удачно: —  Ошибки: —  Без описаний: —")
        ttk.Label(prog_frame, textvariable=self.summary_var).pack(anchor=tk.W)

        # Список последних результатов (кратко)
        list_frame = ttk.LabelFrame(main, text="Результаты по страницам (последние)", padding=4)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 6))
        self.result_text = scrolledtext.ScrolledText(list_frame, height=12, font=("Consolas", 10), state=tk.DISABLED)
        self.result_text.pack(fill=tk.BOTH, expand=True)
        self.result_text.tag_config("удачно", foreground="#0a0")
        self.result_text.tag_config("ошибка", foreground="#c00")
        self.result_text.tag_config("нет данных", foreground="#666")

        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _on_close(self):
        if self.process and self.process.poll() is None:
            if messagebox.askyesno("Выход", "Загрузка идёт. Остановить и выйти? Кэш будет сохранён."):
                self.stop()
        self.root.destroy()

    def _parse_line(self, line: str) -> tuple[str | None, str | None]:
        """Вернуть (путь, статус): удачно | ошибка | нет данных."""
        # [123/647] catalog/.../index.html | 3 т., +2 оп.
        # [123/647] catalog/... | 3 т., 0 оп.
        # [123/647] catalog/... | ОШИБКА: ...
        m = re.match(r"\[(\d+)/(\d+)\]\s+(.+?)\s+\|\s+(.+)", line)
        if not m:
            return None, None
        done, total, path, rest = m.groups()
        self.stats["done"] = int(done)
        self.stats["total"] = int(total)
        path = path.strip()
        rest = rest.strip()
        if "ОШИБКА" in rest:
            status = "ошибка"
            self.stats["err"] += 1
        elif "+" in rest and "оп." in rest:
            status = "удачно"
            self.stats["ok"] += 1
        else:
            status = "нет данных"
            self.stats["empty"] += 1
        return path, status

    def _append_result(self, path: str, status: str):
        with self.lock:
            self.last_lines.append((path, status))
            if len(self.last_lines) > self.max_last:
                self.last_lines.pop(0)

    def _update_ui(self):
        with self.lock:
            s = self.stats
        self.root.after(0, lambda: self._set_progress(s["done"], s["total"]))
        self.root.after(0, lambda: self._set_summary(s["ok"], s["err"], s["empty"]))
        self.root.after(0, self._refresh_result_list)

    def _set_progress(self, done: int, total: int):
        self.progress_var.set(f"Обработано {done} из {total} страниц")
        if total > 0:
            self.progress_bar["maximum"] = total
            self.progress_bar["value"] = done

    def _set_summary(self, ok: int, err: int, empty: int):
        self.summary_var.set(f"Удачно: {ok}   Ошибки: {err}   Без описаний: {empty}")

    def _refresh_result_list(self):
        with self.lock:
            lines = list(self.last_lines)
        self.result_text.config(state=tk.NORMAL)
        self.result_text.delete(1.0, tk.END)
        for path, status in lines[-80:]:  # показываем последние 80
            short = path if len(path) <= 70 else "..." + path[-67:]
            self.result_text.insert(tk.END, f"  {short}\n", "path")
            self.result_text.insert(tk.END, f"    → {status}\n", status)
        self.result_text.config(state=tk.DISABLED)
        self.result_text.see(tk.END)

    def _read_stream(self, pipe, log_handle):
        for line in iter(pipe.readline, ""):
            if not line:
                break
            try:
                log_handle.write(line)
                log_handle.flush()
            except OSError:
                pass
            line = line.strip()
            path, status = self._parse_line(line)
            if path and status:
                self._append_result(path, status)
                self._update_ui()

    def start(self):
        path = self.path_var.get().strip() or "."
        root_path = Path(path).resolve()
        if not (root_path / "catalog").is_dir():
            messagebox.showerror("Ошибка", "В выбранной папке нет каталога catalog.")
            return
        log_path = self.log_var.get().strip()
        if not log_path:
            messagebox.showerror("Ошибка", "Укажите файл для лога.")
            return
        self.log_path = Path(log_path).resolve()
        try:
            self.log_file = open(self.log_path, "w", encoding="utf-8")
        except OSError as e:
            messagebox.showerror("Ошибка", f"Не удалось создать файл лога: {e}")
            return

        self.stats = {"done": 0, "total": 0, "ok": 0, "err": 0, "empty": 0}
        self.last_lines.clear()
        self.progress_var.set("Запуск…")
        self.progress_bar["value"] = 0
        self.progress_bar["maximum"] = 100
        self.summary_var.set("Удачно: 0   Ошибки: 0   Без описаний: 0")
        self.result_text.config(state=tk.NORMAL)
        self.result_text.delete(1.0, tk.END)
        self.result_text.config(state=tk.DISABLED)
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)

        cmd = [
            sys.executable,
            str(FETCH_SCRIPT),
            "--workers", self.workers_var.get().strip() or "4",
            "--timeout", self.timeout_var.get().strip() or "60",
            str(root_path),
        ]
        if self.no_cache_var.get():
            cmd.insert(-1, "--no-cache")
        # Полный лог в файл; в консоль скрипта не выводим
        self.process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=str(root_path),
        )
        self.log_file.write(f"Команда: {' '.join(cmd)}\n")
        self.log_file.write("=" * 60 + "\n\n")
        self.log_file.flush()

        def run():
            try:
                self._read_stream(self.process.stdout, self.log_file)
            finally:
                if self.log_file:
                    try:
                        self.log_file.close()
                    except OSError:
                        pass
                    self.log_file = None
                self.root.after(0, self._on_finished)

        t = threading.Thread(target=run, daemon=True)
        t.start()

    def _on_finished(self):
        if self.process:
            self.process.wait()
            self.process = None
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)
        self.progress_var.set("Готово.")
        self._update_ui()
        if self.log_path:
            messagebox.showinfo("Готово", f"Лог сохранён: {self.log_path}")

    def stop(self):
        if self.process and self.process.poll() is None:
            self.process.terminate()
            self.stop_btn.config(state=tk.DISABLED)

    def open_log(self):
        p = self.log_var.get().strip() or self.log_path
        if not p:
            messagebox.showinfo("Лог", "Сначала укажите файл лога и запустите загрузку.")
            return
        path = Path(p).resolve()
        if not path.is_file():
            messagebox.showinfo("Лог", f"Файл ещё не создан: {path}")
            return
        if sys.platform == "win32":
            os.startfile(str(path))
        else:
            subprocess.run(["xdg-open", str(path)], check=False)

    def run(self):
        self.root.mainloop()


def main():
    initial = sys.argv[1] if len(sys.argv) > 1 else None
    if initial:
        root = find_project_root(Path(initial))
        if root:
            initial = str(root)
    app = FetchGUI(initial_path=initial)
    app.run()


if __name__ == "__main__":
    main()
