import os
import subprocess

# --- Configuration ---
ROOT_PATH = "."                   # Dossier de base
OUTPUT_FILE = "arborescence_folders.txt"  # Fichier de sortie

# --- Fonction récursive pour générer l'arborescence des dossiers ---
def generate_dir_tree(current_path, file_handle, indent=""):
    try:
        # Récupère uniquement les dossiers
        items = sorted(
            [item for item in os.listdir(current_path)
             if os.path.isdir(os.path.join(current_path, item))],
            key=str.lower
        )
    except PermissionError:
        file_handle.write(indent + "└── [Accès refusé]\n")
        return

    for index, item in enumerate(items):
        is_last = (index == len(items) - 1)
        branch = "└── " if is_last else "├── "
        file_handle.write(f"{indent}{branch}{item}\n")

        # Prépare le nouvel indent pour le niveau suivant
        new_indent = indent + ("    " if is_last else "│   ")
        generate_dir_tree(os.path.join(current_path, item), file_handle, new_indent)

# --- Génération de l'arborescence ---
root_abs_path = os.path.abspath(ROOT_PATH)
root_name = os.path.basename(root_abs_path)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(f"{root_name}/\n")
    generate_dir_tree(root_abs_path, f)

# --- Ouverture automatique du fichier dans Notepad ---
subprocess.Popen(["notepad.exe", OUTPUT_FILE])
