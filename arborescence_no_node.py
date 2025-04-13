import os
import sys
import ctypes
import subprocess

# --- Vérification des droits administrateur ---
def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False

if not is_admin():
    # Relance le script avec élévation (UAC)
    script = sys.argv[0]
    params = " ".join(sys.argv[1:])
    # On utilise ShellExecute avec le verbe "runas" pour demander l'élévation
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, f'"{script}" {params}', None, 1)
    sys.exit(0)

# --- Configuration ---
ROOT_PATH = "."  # Dossier de base
IGNORE_DIRS = {"node_modules", ".git"}  # Répertoires à ignorer
MARK_FILES = {"ThemeSwitcher.jsx", "theme.css"}  # Fichiers à marquer avec l'emoji ✅
OUTPUT_FILE = "arborescence_no_node.txt"

# Efface ou crée le fichier de sortie
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("")

# --- Fonction récursive pour générer l'arborescence ---
def generate_tree(current_path, file_handle, indent=""):
    try:
        items = os.listdir(current_path)
    except PermissionError:
        # Si l'accès à un dossier est refusé, on passe
        file_handle.write(indent + "└── [Accès refusé]\n")
        return

    # Trier : répertoires en premier puis fichiers, triés par nom (insensible à la casse)
    items = sorted(items, key=lambda x: (not os.path.isdir(os.path.join(current_path, x)), x.lower()))

    for index, item in enumerate(items):
        full_path = os.path.join(current_path, item)
        # Si l'élément est un dossier et qu'il fait partie des dossiers ignorés, on le saute
        if os.path.isdir(full_path) and item in IGNORE_DIRS:
            continue

        is_last = (index == len(items) - 1)
        branch = "└── " if is_last else "├── "

        # Pour les fichiers, ajoute l'emoji si le nom correspond
        mark = "  ✅" if os.path.isfile(full_path) and item in MARK_FILES else ""

        line = f"{indent}{branch}{item}{mark}"
        file_handle.write(line + "\n")

        # Si c'est un répertoire, appel récursif
        if os.path.isdir(full_path):
            new_indent = indent + ("    " if is_last else "│   ")
            generate_tree(full_path, file_handle, new_indent)

# --- Génération de l'arborescence ---
root_abs_path = os.path.abspath(ROOT_PATH)
root_name = os.path.basename(root_abs_path)
with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
    # Affiche le répertoire racine
    f.write(f"{root_name}/\n")
    generate_tree(root_abs_path, f)

# --- Ouverture automatique du fichier dans Notepad ---
subprocess.Popen(["notepad.exe", OUTPUT_FILE])
