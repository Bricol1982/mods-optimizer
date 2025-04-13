<#  
.SYNOPSIS  
   Ce script copie l’ensemble des fichiers CSS d’un dossier source dans un dossier destination  
   et, si un fichier de schéma est spécifié, il l’intègre au début de chaque fichier CSS copié.

.DESCRIPTION  
   Le script fonctionne de la façon suivante :
   1. Vérifie que le dossier de destination existe, le crée sinon.
   2. Recherche récursivement les fichiers *.css dans le dossier source.
   3. Copie chaque fichier CSS dans le dossier destination.
   4. Si un fichier de schéma existe, son contenu est lu et préfixé à chaque fichier CSS copié.

.PARAMETER SourceDir  
   Chemin complet du dossier source contenant les fichiers CSS à copier.

.PARAMETER DestDir  
   Chemin complet du dossier destination où les fichiers CSS seront copiés.

.PARAMETER SchemaFile  
   Chemin complet du fichier de schéma dont le contenu sera intégré en tête des fichiers CSS copiés.
   Ce paramètre est optionnel ; si le fichier n’existe pas, l’intégration du schéma est ignorée.

.EXAMPLE  
   .\2-restore_all_css_with_shema.ps1 -SourceDir "C:\CSS\Backup" -DestDir "C:\CSS\Restaurés" -SchemaFile "C:\CSS\schema.css"

.NOTES  
   Adaptez les chemins par défaut dans le bloc paramètre si besoin.
#>

param (
    [string]$SourceDir  = "C:\Chemin\Vers\Source",
    [string]$DestDir    = "C:\Chemin\Vers\Destination",
    [string]$SchemaFile = "C:\Chemin\Vers\Schema\schema.css"
)

# Vérifie si le dossier source existe
if (-Not (Test-Path $SourceDir)) {
    Write-Host "Le dossier source n'existe pas: $SourceDir" -ForegroundColor Red
    exit 1
}

# Vérifie ou crée le dossier de destination
if (-Not (Test-Path $DestDir)) {
    Write-Host "Création du dossier destination: $DestDir"
    New-Item -Path $DestDir -ItemType Directory -Force | Out-Null
}

Write-Host "Recherche des fichiers CSS dans $SourceDir..."
# Récupère tous les fichiers CSS dans le dossier source et ses sous-dossiers
$cssFiles = Get-ChildItem -Path $SourceDir -Filter *.css -Recurse

if ($cssFiles.Count -eq 0) {
    Write-Host "Aucun fichier CSS trouvé dans $SourceDir." -ForegroundColor Yellow
    exit 0
}

# Copie chaque fichier CSS trouvé vers le dossier destination
foreach ($file in $cssFiles) {
    # Définir le chemin de destination pour chaque fichier (ici on ne recrée pas la structure de dossier)
    $destFile = Join-Path $DestDir $file.Name
    Write-Host "Copie de : $($file.FullName) vers $destFile"
    
    try {
        Copy-Item -Path $file.FullName -Destination $destFile -Force -Verbose
    }
    catch {
        Write-Host "Erreur lors de la copie de $($file.FullName) : $_" -ForegroundColor Red
    }
}

Write-Host "Tous les fichiers CSS ont été copiés dans $DestDir."

# Application du schéma si le fichier de schéma existe
if (Test-Path $SchemaFile) {
    Write-Host "Lecture du schéma dans : $SchemaFile"
    try {
        $schemaContent = Get-Content $SchemaFile -Raw
    }
    catch {
        Write-Host "Erreur lors de la lecture du fichier de schéma : $_" -ForegroundColor Red
        $schemaContent = ""
    }

    if ($schemaContent -ne "") {
        Write-Host "Application du schéma à chaque fichier CSS..."
        # Récupérer la liste des fichiers CSS dans le dossier destination
        $destCssFiles = Get-ChildItem -Path $DestDir -Filter *.css

        foreach ($file in $destCssFiles) {
            Write-Host "Mise à jour de : $($file.FullName)"
            try {
                # Lire le contenu original du fichier
                $originalContent = Get-Content $file.FullName -Raw
                # Concaténer le schéma et le contenu original avec un retour à la ligne
                $newContent = $schemaContent + "`r`n" + $originalContent
                # Écrire le nouveau contenu dans le fichier
                Set-Content -Path $file.FullName -Value $newContent -Force
            }
            catch {
                Write-Host "Erreur lors de la mise à jour de $($file.FullName) : $_" -ForegroundColor Red
            }
        }
        Write-Host "Schéma appliqué à tous les fichiers CSS."
    }
    else {
        Write-Host "Le fichier de schéma est vide. Aucun schéma n'a été appliqué." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Fichier de schéma non trouvé: $SchemaFile. Aucun schéma appliqué." -ForegroundColor Yellow
}

Write-Host "Processus terminé."
