# Optimiseur de Mods de Grandivory forked by Bricol

L’optimiseur de mods de Grandivory pour Star Wars: Galaxy of Heroes est une application monopage développée en React.js
qui aide à répondre à la question suivante : « Comment répartir mes mods pour tirer le meilleur parti de toutes mes équipes ? »  
Il fonctionne en appliquant des poids constants à chaque statistique potentielle qu’un personnage peut obtenir via un mod
puis en additionnant les valeurs de toutes les stats d’un ensemble complet de mods.
L’ensemble ayant la valeur totale la plus élevée est considéré comme le meilleur à équiper.
Cela ne fonctionne, bien entendu, que si les poids de chaque statistique sont également optimaux,
c’est pourquoi des valeurs par défaut raisonnables sont fournies pour chaque personnage afin de rendre
l’outil aussi simple que possible à utiliser. Les utilisateurs peuvent également ajuster eux-mêmes les
poids pour personnaliser les résultats.

## Aperçu des sections
* [Installation et configuration locale](#installation-et-configuration-locale)
* [Dépendances externes](#dépendances-externes)
* [Structure du projet](#structure-du-projet)
* [Linting et tests](#linting-et-tests)
* [Utilisation de l'optimiseur](#utilisation-de-loptimiseur)
* [Autres ressources](#autres-ressources)

## Installation et configuration locale
Pour commencer à utiliser l’optimiseur, vous devez d’abord avoir Node (et NPM) installés. Vous pouvez obtenir Node via son
site officiel [https://nodejs.org/en/download/] ou utiliser un gestionnaire de paquets comme Homebrew sur
Mac (`brew install node`) si vous l’avez déjà.

Une fois Node installé, exécutez `npm install` à la racine du dépôt. Cela installera toutes les dépendances nécessaires.

Pour lancer l’application, tapez `npm start` dans le terminal. Cela démarrera un serveur local à `https://localhost:3000`
(utilise un certificat auto-signé, vous devrez donc faire confiance à celui-ci dans votre navigateur).

## Structure du projet
La majorité des fichiers importants sont dans le dossier `src`, subdivisé en :

### Components
Contient les composants React utilisés pour afficher les éléments de l’interface (ex : `ModDetail`, `CharacterAvatar`).

### Constants
Contient les valeurs statiques du projet (ex : la liste des personnages, les bonus d’ensemble, etc.).

### Containers
Contient les "pages" de l’application (ex : `App`, `Explore`, `Optimizer`, etc.).

### Domain
Contient les objets de données utilisés dans l’app (sans logique d’affichage).

### img
Contient les images .png de l’app (sans logique d’affichage).

### Utils
Contient des fonctions utilitaires partagées. Notamment l’optimiseur lui-même (`Optimizer.js`) qui choisit les meilleurs mods à équiper.

## Linting et tests
Des commandes npm sont disponibles :
- `npm run lint src` : vérifie que le code respecte le style défini.
- `npm test` : lance les tests.

Ces commandes ne sont pas obligatoires pour l’instant mais le deviendront lors du processus de contribution.

## Utilisation de l’optimiseur

### Sélection des personnages à optimiser
L’optimiseur commence par ignorer les mods équipés sur les personnages "verrouillés", puis passe en revue les
personnages sélectionnés pour leur attribuer les meilleurs mods disponibles. Il retire ensuite les mods choisis
du pool. Le personnage en tête de liste recevra donc les meilleurs mods disponibles (ex : celui qui a besoin du plus de vitesse).

Optimisez d’abord votre équipe d’arène, puis les équipes de raid, puis celles des autres modes de jeu.

### Choix des bonnes valeurs
Chaque personnage a des valeurs initiales par défaut selon un but (PvP, PvE, hSTR P1, etc.). Ces valeurs ne sont que
des suggestions ! Vous pouvez tout ajuster, que ce soit en choisissant un autre profil prédéfini ou en créant vos propres poids personnalisés.

- **Mode Basique** : vous attribuez une importance entre -100 et 100 à chaque stat. Ces valeurs sont ensuite adaptées automatiquement
aux plages de stats en jeu.

- **Mode Avancé** : vous indiquez la valeur exacte de chaque point de stat. Plus technique et précis, mais plus risqué.

## Autres ressources
Rejoignez mon [serveur Discord](https://discord.gg/WFKycSm) pour échanger avec d’autres utilisateurs, poser des questions ou proposer des idées !
