# Ajout de l'assembly nécessaire pour la boîte de dialogue
Add-Type -AssemblyName System.Windows.Forms

# Définir le répertoire initial du sélecteur sur le répertoire du script
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent

# Créer et configurer la boîte de dialogue de sélection de dossier
$folderDlg = New-Object System.Windows.Forms.FolderBrowserDialog
$folderDlg.SelectedPath = $scriptDir
$folderDlg.Description = "Sélectionnez le dossier export contenant les fichiers CSS et le fichier mapping.xml"

# Affichage de la boîte de dialogue
$result = $folderDlg.ShowDialog()
if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
    Write-Host "Aucun dossier sélectionné. Fin du script." -ForegroundColor Yellow
    exit
}

# Récupérer le chemin sélectionné
$exportFolder = $folderDlg.SelectedPath
Write-Host "Dossier sélectionné : $exportFolder" -ForegroundColor Cyan

# Vérifier que le fichier mapping.xml existe dans ce dossier
$mappingFile = Join-Path -Path $exportFolder -ChildPath "mapping.xml"
if (-not (Test-Path -Path $mappingFile)) {
    Write-Host "Fichier mapping.xml introuvable dans le dossier sélectionné." -ForegroundColor Red
    exit
}

# Préparation du fichier log
$folderName = Split-Path -Path $exportFolder -Leaf
$timestampLog = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = Join-Path -Path $exportFolder -ChildPath "log_restore_${folderName}_$timestampLog.txt"

# Fonction pour écrire dans le log et afficher un message coloré
function Write-Log {
    param(
        [string]$Message,
        [ConsoleColor]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
    $Message | Out-File -FilePath $logFile -Append -Encoding UTF8
}

# Initialisation du log
"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Démarrage de la restauration." | Out-File -FilePath $logFile -Encoding UTF8

# Charger le fichier XML de mapping
try {
    [xml]$xmlMapping = Get-Content -Path $mappingFile -Encoding UTF8
} catch {
    Write-Log "Erreur lors du chargement du fichier mapping.xml : $_" Red
    exit
}

# Vérifier que l'élément racine contient des FileMapping
if (-not $xmlMapping.CSSMapping.FileMapping) {
    Write-Log "Aucune entrée FileMapping trouvée dans le fichier XML." Red
    exit
}

# Parcourir chaque élément FileMapping pour restaurer les fichiers
foreach ($mapping in $xmlMapping.CSSMapping.FileMapping) {
    $sourcePath = $mapping.Source
    $destPath = $mapping.Destination

    if (-not (Test-Path -Path $destPath)) {
        Write-Log "Fichier à restaurer introuvable dans l'export: $destPath" Red
        continue
    }

    try {
        # Création du dossier source si nécessaire (cas rare, mais pour éviter une erreur de copie)
        $sourceDir = Split-Path -Path $sourcePath -Parent
        if (-not (Test-Path -Path $sourceDir)) {
            New-Item -ItemType Directory -Path $sourceDir -Force | Out-Null
            Write-Log "Création du dossier source: $sourceDir" Cyan
        }
        Copy-Item -Path $destPath -Destination $sourcePath -Force -ErrorAction Stop
        Write-Log "Restoration réussie: '$destPath' -> '$sourcePath'" Green
    }
    catch {
        Write-Log "Erreur lors de la restauration de '$destPath' vers '$sourcePath' : $_" Red
    }
}

Write-Log "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Fin de la restauration." Cyan
