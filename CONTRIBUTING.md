# Contribuer à l'Optimiseur de Mods de Grandivory

## Portée des modifications
Aucune modification n’est trop petite pour être considérée comme une contribution valable !
Même si vous ne changez qu’une seule ligne de code, cela peut faire gagner du temps et apporter
de la valeur à l’outil plus rapidement que si vous ne contribuez pas. Allez-y !

Si vous souhaitez modifier une grande partie du code, attendez-vous à un peu d’allers-retours avant que
votre pull request soit acceptée. Cela signifie simplement que ce que vous faites m’intéresse et que
je veux que ce soit aussi bon que possible – ce n’est pas une tentative de vous décourager de contribuer.

## Premiers pas
Pour commencer à contribuer à l’optimiseur de mods, commencez par forker le dépôt.
Une fois que vous avez votre propre copie du dépôt, commencez à apporter des modifications
et à les valider dans une nouvelle branche (ou dans votre branche `develop`, si vous préférez).
Une fois vos modifications prêtes, ouvrez une pull request vers le dépôt original.

## Messages de commit
Les messages de commit doivent suivre ce format :
```
Brève description du changement (<50 caractères)

Description plus longue (si nécessaire) de ce qui a changé et pourquoi. Incluez également toute mise
en garde concernant le nouveau code ou tout problème connu / section incomplète.
```

Cela permet de comprendre facilement les changements rien qu’en lisant l’historique des commits.

## Pull requests
Lorsque vous pensez que vos modifications sont prêtes à être fusionnées, ouvrez une pull request vers
la branche `develop` sur `grandivory/mods-optimizer`. Cela m’avertira que les modifications sont prêtes
et lancera le processus de relecture. J’essaie d’être assez détendu sur les modifications demandées
et je les fais souvent moi-même pour que le processus de contribution soit aussi rapide et simple que possible.

## Linting et Tests
Toutes les contributions au code de l’optimiseur de mods doivent passer le linting (`npm lint`).
S’il y a des modifications ou des ajouts de fonctionnalités, de nouveaux tests doivent également
être écrits (cette règle ne sera appliquée qu’une fois que j’aurai moi-même ajouté des tests). Tous
les tests existants doivent également passer. À terme, je prévois d’automatiser ces vérifications dans
les hooks de commit, afin qu’elles s’exécutent dès qu’un code est poussé ou qu’une pull request est ouverte.
Pour l’instant, je pourrai demander des modifications pour que tout passe correctement si les vérifications échouent.
