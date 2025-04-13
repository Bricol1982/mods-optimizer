// src/utils/themeExporter.js

/**
 * Liste complète des propriétés "thématiques" que nous souhaitons récupérer.
 * Pour que la récupération fonctionne, assurez-vous de déclarer ces custom properties dans le :root de votre CSS.
 *
 * Exemple dans App.css ou dans un fichier global :
 * :root {
 *   --background-color: #000000;
 *   --text-color: #d3d3d3;
 *   --font-family: sans-serif;
 *   --accent-color: #d4af37;
 *   --purple-color: #9b59b6;
 *   --blue-color: #2980b9;
 *   --green-color: #27ae60;
 *   --gray-color: #bdc3c7;
 *   --red-text-color: #e74c3c;
 *   --decrease-color: #c0392b;
 *   --header-background: #000000;
 *   --header-text-color: #e0e0e0;
 *   --header-border-color: #444;
 *   --title-subtitle-color: #aaaaaa;
 *   --ally-code-input-color: #000000;
 *   --footer-background: #000000;
 *   --footer-text-color: #a0a0a0;
 *   --footer-border-color: #444;
 *   --scrollbar-track-color: #0f0f0f;
 *   --scrollbar-border-color: #440000;
 *   --scrollbar-thumb-color: #880000;
 *   --body-background-image: url('../../img/darkside-background.jpg');
 *   --body-background-size: cover;
 *   --body-text-shadow: 2px 2px 1px #000;
 *   --nav-button-background: #110000;
 *   --nav-button-border-color: #660000;
 *   --nav-button-text-color: #e0e0e0;
 *   --button-background: #8B0000;
 *   --button-border-color: #aa0000;
 *   --button-text-color: #e0e0e0;
 *   --button-active-border-color: #aa0000;
 *   --button-red-background: darkred;
 *   --button-red-border-color: #ff0000;
 *   --button-blue-background: #0b4884;
 *   --button-blue-border-color: dodgerblue;
 *   --button-blue-text-color: #fff;
 *   --overlay-background-color: rgba(0, 0, 0, 0.5);
 *   --modal-background-color: rgb(0, 0, 64);
 *   --modal-border-color: dodgerblue;
 *   --modal-text-color: inherit; // ou une couleur adaptée
 *   --modal-flash-h2-color: #eeca44;
 *   --modal-error-background: #ead118;
 *   --modal-error-border-color: darkred;
 *   --modal-error-text-color: #000;
 *   --mod-detail-border-color: dodgerblue;
 *   --mod-detail-background-color: rgba(0, 0, 96, 0.5);
 *   --mod-detail-text-shadow: 2px 2px 1px black;
 *   --mod-set-detail-border-color: dodgerblue;
 *   --mod-set-detail-background-color: rgba(0, 0, 96, 0.5);
 *   --mod-set-detail-table-th-background: rgb(31, 115, 140);
 *   --mod-set-detail-table-row-bg-odd: rgb(30, 47, 70);
 *   --mod-set-detail-table-row-bg-even: rgb(28, 56, 93);
 *   --mod-set-detail-stat-value-color: #19ccb4;
 *   --mod-image-background-size: 48em 20em;
 *   --mod-icon-atlas-background-size: 8em 5em;
 *   --mod-level-border-color: ; // À définir si nécessaire
 *   --credits-fill: black;
 *   --credits-stroke: #eeca44;
 *   --credits-stroke-width: 6px;
 *   --dropdown-arrow-color: dodgerblue;
 *   --help-icon-image: url('../../img/help.png');
 *   --help-icon-size: 1em 1em;
 *   --arrow-fill: black;
 *   --arrow-stroke: #eeca44;
 *   --arrow-stroke-width: 5px;
 *   --avatar-border-color: #ccfffe;
 *   --character-edit-form-h3-border-color: white;
 *   --character-edit-form-row-bg-odd: rgb(30, 47, 70);
 *   --character-edit-form-row-text-odd: rgb(117, 203, 203);
 *   --character-edit-form-row-bg-even: rgb(28, 56, 93);
 *   --character-edit-form-row-text-even: rgb(28, 169, 212);
 *   --character-block-border-color: dodgerblue;
 *   --character-block-background: rgba(0, 0, 96, 0.5);
 *   --drop-character-box-shadow: darkred;
 *   --mod-filter-option-background: ; // À définir selon besoins
 *   --mod-filter-option-border-color: ;   // À définir selon besoins
 *   --optimizer-view-background-color: ;   // À définir si nécessaire
 *   --pip-size: 5px;
 *   --pip-background-color: #fae8da;
 *   --slider-input-width: 3em;
 *   --review-background-color: ;  // À définir si nécessaire
 *   --review-heading-color: ;     // À définir si nécessaire
 *   --sidebar-background-color: ; // Par exemple pour la sidebar
 *   --toggle-sidebar-background-color: #333;
 *   --toggle-sidebar-border-color: gray;
 *   --spinner-border-color: #eeca44;
 *   --spinner-after-border-color: #a35ef9;
 *   --spoiler-border-color: white;
 *   --spoiler-title-color: #a35ef9;
 *   --spoiler-divider-color: white;
 *   --toggle-switch-background-color: #222;
 *   --toggle-switch-border-color: #72e817;
 *   --toggle-switch-thumb-background-color: #61c714;
 *   --warning-label-fill-color: darkred;
 *   --mod-stats-class-S-color: #eeca44;
 *   --mod-stats-class-A-color: #a35ef9;
 *   --mod-stats-class-B-color: #2997f1;
 *   --mod-stats-class-C-color: #8fff3a;
 *   --mod-stats-class-D-color: #ccfffe;
 *   --sidebar-child-background-color: #444;
 *   --sidebar-child-border-color: #888;
 * }
 */

export const themeProperties = [
  // GLOBAL et typographie
  '--background-color',           // Fond général (html, body, .App)
  '--text-color',                 // Texte principal
  '--font-family',                // Font globale

  // COULEURS D'ACCENT & UTILITAIRES
  '--accent-color',               // Accent/doré (.gold)
  '--purple-color',               // Pour .purple
  '--blue-color',                 // Pour .blue
  '--green-color',                // Pour .green
  '--gray-color',                 // Pour .gray
  '--red-text-color',             // Pour .red-text et .increase
  '--decrease-color',             // Pour .decrease

  // ENTÊTE
  '--header-background',          // Fond de .App-header
  '--header-text-color',          // Texte de l’en-tête
  '--header-border-color',        // Bordure inférieure de .App-header
  '--title-subtitle-color',       // Couleur du sous-titre (.App-title .subtitle)
  '--ally-code-input-color',      // Texte dans l’input #ally-code

  // PIED DE PAGE
  '--footer-background',          // Fond de .App-footer
  '--footer-text-color',          // Texte du pied de page
  '--footer-border-color',        // Bordure supérieure du pied de page

  // SCROLLBAR
  '--scrollbar-track-color',      // Fond de la piste (::-webkit-scrollbar-track)
  '--scrollbar-border-color',     // Bordure de la track
  '--scrollbar-thumb-color',      // Couleur du thumb (::-webkit-scrollbar-thumb)

  // CORPS DE L'APPLICATION
  '--body-background-image',      // Image de fond de .app-body
  '--body-background-size',       // Taille de l'image (cover)
  '--body-text-shadow',           // Ombre sur le texte (.app-body)

  // NAVIGATION ET BOUTONS (ENTÊTE)
  '--nav-button-background',      // Fond des boutons de nav
  '--nav-button-border-color',    // Bordure des boutons de nav
  '--nav-button-text-color',      // Texte des boutons de nav

  // BOUTONS GÉNÉRAUX
  '--button-background',          // Fond général des boutons
  '--button-border-color',        // Bordure générale des boutons
  '--button-text-color',          // Texte des boutons
  '--button-active-border-color', // Bordure pour l'état actif
  '--button-red-background',      // Boutons rouges spécifiques
  '--button-red-border-color',    // Bordure des boutons rouges
  '--button-blue-background',     // Boutons bleus
  '--button-blue-border-color',   // Bordure des boutons bleus
  '--button-blue-text-color',     // Texte des boutons bleus

  // MODALS & OVERLAYS
  '--overlay-background-color',   // Fond de l'overlay (.overlay)
  '--modal-background-color',     // Fond général des modals
  '--modal-border-color',         // Bordure générale des modals
  '--modal-text-color',           // Texte dans les modals
  '--modal-flash-h2-color',       // Couleur des h2 dans modal.flash
  '--modal-error-background',     // Fond des modals d’erreur
  '--modal-error-border-color',   // Bordure des modals d’erreur
  '--modal-error-text-color',     // Texte dans les modals d’erreur

  // MOD DETAIL & MOD SET DETAIL
  '--mod-detail-border-color',    // Bordure de .mod-detail
  '--mod-detail-background-color',// Fond de .mod-detail
  '--mod-detail-text-shadow',     // Ombre dans .mod-detail
  '--mod-set-detail-border-color',    // Bordure de .mod-set-detail
  '--mod-set-detail-background-color',// Fond de .mod-set-detail
  '--mod-set-detail-table-th-background', // Fond d'entête dans les tables (.mod-set-detail)
  '--mod-set-detail-table-row-bg-odd',      // Lignes impaires
  '--mod-set-detail-table-row-bg-even',     // Lignes paires
  '--mod-set-detail-stat-value-color',       // Couleur des valeurs de mods

  // MOD IMAGE & MOD ICON
  '--mod-image-background-size',  // Taille pour .mod-slot-image
  '--mod-icon-atlas-background-size', // Taille pour mod-icon-atlas

  // MOD LEVEL (optionnel)
  '--mod-level-border-color',     // Par exemple pour .mod-level

  // CREDITS
  '--credits-fill',               // Remplissage pour svg.credits
  '--credits-stroke',             // Contour pour svg.credits
  '--credits-stroke-width',       // Épaisseur du contour pour svg.credits

  // DROPDOWN
  '--dropdown-arrow-color',       // Couleur de l'arrow dans .dropdown::after

  // HELP
  '--help-icon-image',            // Image pour .icon.help
  '--help-icon-size',             // Taille de l'icône d’aide

  // ARROW (composant graphique)
  '--arrow-fill',                 // Remplissage dans Arrow.css
  '--arrow-stroke',               // Couleur de contour de l'arrow
  '--arrow-stroke-width',         // Épaisseur du trait de l'arrow

  // CHARACTER AVATAR
  '--avatar-border-color',        // Bordure pour .avatar (gear-0)

  // CHARACTER EDIT FORM
  '--character-edit-form-h3-border-color', // Bordure inférieure des h3 dans le formulaire
  '--character-edit-form-row-bg-odd',  // Fond des lignes impaires dans CharacterEditForm
  '--character-edit-form-row-text-odd',// Texte des lignes impaires
  '--character-edit-form-row-bg-even', // Fond des lignes paires
  '--character-edit-form-row-text-even', // Texte des lignes paires

  // CHARACTER LIST & EDIT VIEW
  '--character-block-border-color',       // Bordure des blocs de personnage
  '--character-block-background',         // Fond des blocs de personnage
  '--drop-character-box-shadow',            // Ombre lors d’un drop

  // MOD FILTER (optionnel)
  '--mod-filter-option-background',         // Fond des options de filtre
  '--mod-filter-option-border-color',       // Bordure pour options de filtre

  // OPTIMIZER VIEW
  '--optimizer-view-background-color',      // Fond pour .optimizer-view (si spécifié)

  // PIPS
  '--pip-size',                 // Taille d'un pip (ex : "5px")
  '--pip-background-color',     // Fond du pip

  // RANGE INPUT
  '--slider-input-width',       // Largeur des inputs type range

  // REVIEW
  '--review-background-color',  // Fond de la zone review
  '--review-heading-color',     // Couleur des titres dans Review.css

  // SIDEBAR
  '--sidebar-background-color',         // Fond général de la sidebar
  '--toggle-sidebar-background-color',    // Fond du bouton de toggle de la sidebar
  '--toggle-sidebar-border-color',      // Bordure du toggle de la sidebar

  // SPINNER
  '--spinner-border-color',       // Couleur du spinner (bordure, dans Spinner.css)
  '--spinner-after-border-color', // Couleur de la bordure du ::after du spinner

  // SPOILER
  '--spoiler-border-color',       // Bordure de .spoiler
  '--spoiler-title-color',        // Couleur des titres dans les spoilers
  '--spoiler-divider-color',      // Couleur du séparateur dans .spoiler

  // TOGGLE
  '--toggle-switch-background-color',    // Fond du toggle switch
  '--toggle-switch-border-color',          // Bordure du toggle switch
  '--toggle-switch-thumb-background-color',// Fond du thumb du toggle

  // WARNING LABEL
  '--warning-label-fill-color',           // Couleur de remplissage pour svg.warning-label

  // MOD STATS
  '--mod-stats-class-S-color',  // Couleur pour la classe S
  '--mod-stats-class-A-color',  // Pour la classe A
  '--mod-stats-class-B-color',  // Pour la classe B
  '--mod-stats-class-C-color',  // Pour la classe C
  '--mod-stats-class-D-color',  // Pour la classe D

  // SIDEBAR DIVERS
  '--sidebar-child-background-color',  // Fond des blocs internes de la sidebar
  '--sidebar-child-border-color',        // Bordure des blocs de la sidebar
];

export function getCurrentTheme(properties = themeProperties) {
  const computedStyle = getComputedStyle(document.documentElement);
  return properties.reduce((theme, property) => {
    theme[property] = computedStyle.getPropertyValue(property).trim();
    return theme;
  }, {});
}

export function createDefaultThemeFileContent(themeObject) {
  return `const defaultTheme = ${JSON.stringify(themeObject, null, 2)};
export default defaultTheme;
`;
}

export function generateAndDownloadDefaultThemeFile() {
  const currentTheme = getCurrentTheme();
  const fileContent = createDefaultThemeFileContent(currentTheme);
  const blob = new Blob([fileContent], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'defaultTheme.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
