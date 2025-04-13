# ================================================================================
# Script d'export de fichiers CSS avec génération d'un mapping XML, affichage
# coloré (vert = succès, rouge = erreurs) et journalisation dans un fichier log.
# ================================================================================
 
# Récupérer le répertoire courant du script
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
 
# Définir le dossier racine à analyser (parent du dossier du script)
$rootDir = Split-Path -Path $scriptDir -Parent
 
# Création du dossier d'export avec date et heure (ex: export_css_2025-04-12_15-31-56)
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$exportFolderName = "export_css_$timestamp"
$exportFolder = Join-Path -Path $scriptDir -ChildPath $exportFolderName
 
try {
    New-Item -ItemType Directory -Path $exportFolder -Force | Out-Null
} catch {
    Write-Host "Erreur lors de la création du dossier d'export : $_" -ForegroundColor Red
    Pause
    exit
}
 
# Définir le fichier log dans le dossier d'export
$logFile = Join-Path -Path $exportFolder -ChildPath "log_export_$timestamp.txt"
"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Début de l'export." | Out-File -FilePath $logFile -Encoding UTF8
 
# Initialiser le document XML pour le mapping
$xmlDoc = New-Object System.Xml.XmlDocument
$xmlDeclaration = $xmlDoc.CreateXmlDeclaration("1.0", "UTF-8", $null)
$xmlDoc.AppendChild($xmlDeclaration) | Out-Null
$xmlRoot = $xmlDoc.CreateElement("CSSMapping")
$xmlDoc.AppendChild($xmlRoot) | Out-Null
 
# Fonction pour afficher et consigner dans le log avec couleur
function Write-Log {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [ConsoleColor]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
    $Message | Out-File -FilePath $logFile -Append -Encoding UTF8
}
 
Write-Log "Analyse du dossier racine : $rootDir (on exclut le dossier du script : $scriptDir)" Cyan
 
# Recherche récursive de tous les fichiers CSS dans le dossier racine,
# en excluant ceux se trouvant dans le dossier du script (pour éviter les exports précédents)
try {
    $cssFiles = Get-ChildItem -Path $rootDir -Recurse -Filter *.css -ErrorAction Stop |
                Where-Object { $_.FullName -notlike "$scriptDir*" }
    Write-Log "Trouvé $($cssFiles.Count) fichier(s) CSS dans '$rootDir' (hors '$scriptDir')." Cyan
}
catch {
    Write-Log "Erreur lors de la recherche des fichiers CSS : $_" Red
    Pause
    exit
}
 
# Pour chaque fichier CSS, copie dans le dossier d'export en préservant la structure
foreach ($file in $cssFiles) {
    try {
        # Calcul du chemin relatif par rapport à $rootDir
        $relativePath = $file.FullName.Substring($rootDir.Length)
        if ($relativePath.StartsWith("\")) {
            $relativePath = $relativePath.Substring(1)
        }
        # Construction du chemin de destination dans le dossier d'export
        $destPath = Join-Path -Path $exportFolder -ChildPath $relativePath
 
        # Création du dossier de destination si nécessaire
        $destDir = Split-Path -Path $destPath -Parent
        if (-not (Test-Path -Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
 
        # Copier le fichier CSS
        Copy-Item -Path $file.FullName -Destination $destPath -Force -ErrorAction Stop
 
        # Ajout d'un noeud dans le mapping XML
        $fileMapping = $xmlDoc.CreateElement("FileMapping")
        $fileMapping.SetAttribute("Source", $file.FullName)
        $fileMapping.SetAttribute("Destination", $destPath)
        $xmlRoot.AppendChild($fileMapping) | Out-Null
 
        Write-Log "Copie réussie : '$($file.FullName)' -> '$destPath'" Green
    }
    catch {
        Write-Log "Erreur lors de la copie du fichier '$($file.FullName)' : $_" Red
        Pause
    }
}
 
# Sauvegarde du fichier mapping XML dans le dossier d'export
$xmlFile = Join-Path -Path $exportFolder -ChildPath "mapping.xml"
try {
    $xmlDoc.Save($xmlFile)
    Write-Log "Mapping XML enregistré avec succès dans '$xmlFile'." Green
}
catch {
    Write-Log "Erreur lors de l'enregistrement du mapping XML : $_" Red
}
 
Write-Log "Fin de l'export." Cyan
