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
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, f'"{script}" {params}', None, 1)
    sys.exit(0)

# --- Configuration ---
ROOT_PATH = "."                             # Dossier de base
IGNORE_DIRS = {"node_modules", ".git"}        # Répertoires à ignorer
MARK_FILES = {"ThemeSwitcher.jsx", "theme.css"}  # Fichiers à marquer avec l'emoji ✅
OUTPUT_FILE = "arborescence_complete.txt"                      # Fichier de sortie

# Vide ou crée le fichier de sortie
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("")

# --- Fonction récursive pour générer l'arborescence complète ---
def generate_tree(current_path, file_handle, indent=""):
    try:
        # Récupérer tous les items, trier de manière à lister d'abord les dossiers
        items = sorted(os.listdir(current_path), key=lambda x: (not os.path.isdir(os.path.join(current_path, x)), x.lower()))
    except PermissionError:
        file_handle.write(indent + "└── [Accès refusé]\n")
        return

    for index, item in enumerate(items):
        full_path = os.path.join(current_path, item)
        is_last = (index == len(items) - 1)
        branch = "└── " if is_last else "├── "

        # Si c'est un dossier, on vérifie s'il faut l'ignorer
        if os.path.isdir(full_path):
            if item in IGNORE_DIRS:
                continue
            file_handle.write(f"{indent}{branch}{item}\n")
            new_indent = indent + ("    " if is_last else "│   ")
            generate_tree(full_path, file_handle, new_indent)
        else:
            # Fichier : ajoute une marque si son nom est dans MARK_FILES
            mark = "  ✅" if item in MARK_FILES else ""
            file_handle.write(f"{indent}{branch}{item}{mark}\n")

# --- Lancement de la génération de l'arborescence ---
root_abs_path = os.path.abspath(ROOT_PATH)
root_name = os.path.basename(root_abs_path)

with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
    # Affiche le nom du dossier racine
    f.write(f"{root_name}/\n")
    generate_tree(root_abs_path, f)

# --- Ouverture automatique du fichier dans Notepad ---
subprocess.Popen(["notepad.exe", OUTPUT_FILE])
