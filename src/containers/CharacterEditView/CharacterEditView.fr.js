// @flow

import React, { PureComponent } from "react";

import "./CharacterEditView.css";
import CharacterList from "../CharacterList/CharacterList";
import { hideModal, showError, showModal } from "../../state/actions/app";
import Sidebar from "../../components/Sidebar/Sidebar";
import RangeInput from "../../components/RangeInput/RangeInput";
import {
  appendTemplate,
  changeCharacterFilter,
  deleteTemplate,
  lockAllCharacters,
  lockSelectedCharacters,
  replaceTemplate,
  resetAllCharacterTargets,
  saveTemplate,
  saveTemplates,
  selectCharacter,
  toggleCharacterLock,
  toggleHideSelectedCharacters,
  toggleCharacterEditSortView,
  unlockAllCharacters,
  unlockSelectedCharacters,
  unselectAllCharacters,
  unselectCharacter,
  updateLockUnselectedCharacters,
  updateModChangeThreshold,
  updateForceCompleteModSets,
  updateOmicronBoostsGac,
  updateOmicronBoostsTw,
  updateOmicronBoostsTb,
  updateOmicronBoostsRaids,
  updateOmicronBoostsConquest,
  applyTemplateTargets,
  setOptimizeIndex
} from "../../state/actions/characterEdit";
import { changeOptimizerView, updateModListFilter } from "../../state/actions/review";
import { optimizeMods } from "../../state/actions/optimize";
import characterSettings from "../../constants/characterSettings";
import CharacterAvatar from "../../components/CharacterAvatar/CharacterAvatar";
import { GameSettings } from "../../domain/CharacterDataClasses";
import { connect } from "react-redux";
import { exportCharacterTemplate, exportCharacterTemplates } from "../../state/actions/storage";
import { saveAs } from "file-saver";
import FileInput from "../../components/FileInput/FileInput";
import OptimizationPlan from "../../domain/OptimizationPlan";
import Toggle from "../../components/Toggle/Toggle";
import Help from "../../components/Help/Help"
import { fetchCharacterList } from "../../state/actions/data";
import collectByKey from "../../utils/collectByKey";
import keysWhere from "../../utils/keysWhere";
import { Spoiler } from "../../components/Spoiler/Spoiler";
import { Dropdown } from "../../components/Dropdown/Dropdown";
import OptimizerProgress from '../../components/OptimizerProgress/OptimizerProgress';

const defaultTemplates = require('../../constants/characterTemplates.json');

class CharacterEditView extends PureComponent {
  dragStart(character) {
    return function (event) {
      event.dataTransfer.dropEffect = 'copy';
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', character.baseID);
      // On ne devrait pas avoir besoin de faire cela, mais Safari ignore à la fois 'dropEffect' et 'effectAllowed' lors du drop
      const options = {
        'effect': 'add'
      };
      event.dataTransfer.setData('application/json', JSON.stringify(options));
    }
  }

  static dragOver(event) {
    event.preventDefault();
  }

  static dragLeave(event) {
    event.preventDefault();
    event.target.classList.remove('drop-character');
  }

  static availableCharactersDragEnter(event) {
    event.preventDefault();
  }

  availableCharactersDrop(event) {
    event.preventDefault();
    const options = JSON.parse(event.dataTransfer.getData('application/json'));

    switch (options.effect) {
      case 'move':
        // Cela provient des personnages sélectionnés - on enlève le personnage de la liste
        const characterIndex = +event.dataTransfer.getData('text/plain');
        this.props.unselectCharacter(characterIndex);
        break;
      default:
      // Ne rien faire
    }
  }

  /**
   * Lit un fichier en entrée et transmet son contenu à une autre fonction pour traitement
   * @param fileInput Le fichier téléchargé
   * @param handleResult {Function}
   */
  readFile(fileInput, handleResult) {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileData = event.target.result;
        handleResult(fileData);
      } catch (e) {
        this.props.showError(e.message);
      }
    };

    reader.readAsText(fileInput);
  }

  render() {
    const classes = this.props.sortView ? 'character-edit sort-view' : 'character-edit';

    return <div className={classes}>
      <Sidebar content={[this.filterForm(), this.globalSettings(), this.sidebarActions()]} />
      <div className={'available-characters'}
        onDragEnter={CharacterEditView.availableCharactersDragEnter}
        onDragOver={CharacterEditView.dragOver}
        onDragLeave={CharacterEditView.dragLeave}
        onDrop={this.availableCharactersDrop.bind(this)}
      >
        <h3 className={'instructions'}>
          Double-cliquez ou faites glisser les personnages vers la colonne sélectionnée pour choisir ceux pour optimiser les mods.
          <button type={'button'}
            className={'small'}
            onClick={() => this.props.showModal('instructions', this.instructionsModal())}>
            Afficher les instructions complètes
          </button>
        </h3>
        {this.props.highlightedCharacters.map(character => this.characterBlock(character, 'active'))}
        {this.props.availableCharacters.map(character => this.characterBlock(character, 'inactive'))}
      </div>
      <div className={'selected-characters'}>
        <h4>
          Personnages sélectionnés
          <div className="character-list-actions">
            <button className={'small'} onClick={this.props.clearSelectedCharacters}>Effacer</button>
            <button className={'small'} onClick={this.props.lockSelectedCharacters}>Tout verrouiller</button>
            <button className={'small'} onClick={this.props.unlockSelectedCharacters}>Tout déverrouiller</button>
            <button className={'small'} onClick={this.props.toggleCharacterEditSortView}>
              {this.props.sortView ? 'Normal' : 'Vue étendue'}
            </button>
            <button
              className={'small'}
              onClick={() => this.props.showModal('generate-character-list', this.generateCharacterListModal())}
            >
              Générer automatiquement la liste
            </button>
          </div>
        </h4>
        <h5>Modèles de personnages <Help header={'Modèles de personnages'}>{this.characterTemplatesHelp()}</Help></h5>
        <div className={'template-buttons'}>
          <div className={'row'}>
            Gérer :
            <button className={'small'}
              disabled={!this.props.selectedCharacters.length}
              onClick={() => this.props.showModal('save-template', this.saveTemplateModal())}>
              Enregistrer
            </button>
            <button className={'small'}
              disabled={!this.userTemplates().length}
              onClick={() => this.props.showModal('export-template', this.exportTemplateModal())}>
              Exporter
            </button>
            <FileInput label={'Charger'}
              className={'small'}
              handler={(file) => this.readFile(
                file,
                (templates) => {
                  try {
                    const templatesObject = JSON.parse(templates);
                    const templatesDeserialized = templatesObject.map(t => ({
                      name: t.name,
                      selectedCharacters: t.selectedCharacters.map(({ id, target }) => ({
                        id: id,
                        target: OptimizationPlan.deserialize(target)
                      }))
                    }));
                    this.props.saveTemplates(templatesDeserialized);
                  } catch (e) {
                    throw new Error('Impossible de lire les modèles depuis le fichier. Assurez-vous d\'avoir sélectionné un fichier de modèles de personnages.');
                  }
                }
              )}
            />
            <button className={'small red'}
              disabled={!this.userTemplates().length}
              onClick={() => this.props.showModal('delete-template', this.deleteTemplateModal())}>
              Supprimer
            </button>
          </div>
          <div className={'row'}>
            Appliquer :
            <button className={'small'}
              onClick={() => this.props.showModal('append-template', this.appendTemplateModal())}>
              Ajouter
            </button>
            <button className={'small'}
              onClick={() => this.props.showModal('replace-template', this.replaceTemplateModal())}>
              Remplacer
            </button>
            <button className={'small'}
              onClick={() => this.props.showModal('template-targets', this.templateTargetsModal())}>
              Appliquer uniquement les cibles
            </button>
          </div>
        </div>
        <CharacterList selfDrop={true} draggable={true} />
      </div>
    </div >;
  }

  /**
   * Affiche un formulaire pour filtrer les personnages disponibles
   *
   * @returns JSX Element
   */
  filterForm() {
    return <div className={'filters'} key={'filterForm'}>
      <div className={'filter-form'}>
        <label htmlFor={'character-filter'}>Rechercher par nom de personnage, tag ou abréviation courante :</label>
        <input autoFocus={true} id={'character-filter'} type={'text'} defaultValue={this.props.characterFilter}
          onChange={(e) => this.props.changeCharacterFilter(e.target.value.toLowerCase())}
        />
        <Toggle
          inputLabel={'Affichage des personnages disponibles'}
          leftLabel={'Masquer les sélectionnés'}
          rightLabel={'Afficher tout'}
          leftValue={'hide'}
          rightValue={'show'}
          value={this.props.hideSelectedCharacters ? 'hide' : 'show'}
          onChange={() => this.props.toggleHideSelectedCharacters()}
        />
      </div>
    </div>;
  }

  /**
   * Affiche les paramètres globaux de l'optimiseur
   *
   * @returns JSX Element
   */
  globalSettings() {
    return <div className={'global-settings'} key={'global-settings'}>
      <h3>Paramètres globaux <Help header={'Paramètres globaux'}>{this.globalSettingsHelp()}</Help></h3>
      <div className={'form-row'}>
        <label htmlFor={'mod-threshold'}>Seuil pour changer les mods :</label><br />
        <RangeInput
          min={0}
          max={100}
          id={'mod-threshold'}
          step={1}
          isPercent={true}
          editable={true}
          defaultValue={this.props.globalSettings.modChangeThreshold}
          onChange={(threshold) => this.props.updateModChangeThreshold(threshold)}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor={'lock-unselected'}>Verrouiller tous les personnages non sélectionnés :</label>
        <input id={'lock-unselected'} type={'checkbox'}
          defaultChecked={this.props.globalSettings.lockUnselectedCharacters}
          onChange={(event) => this.props.updateLockUnselectedCharacters(event.target.checked)} />
      </div>
      <div className={'form-row'}>
        <label htmlFor={'force-complete-sets'}>Ne pas casser les ensembles de mods :</label>
        <input id={'force-complete-sets'} type={'checkbox'}
          defaultChecked={this.props.globalSettings.forceCompleteSets}
          onChange={(event) => this.props.updateForceCompleteModSets(event.target.checked)} />
      </div>
    </div>;
  }

  /**
   * Affiche une boîte latérale avec des boutons d'action
   *
   * @returns JSX Element
   */
  sidebarActions() {
    return <div className={'sidebar-actions'} key={'sidebar-actions'}>
      <h3>Actions</h3>
      <button
        type={'button'}
        onClick={() => {
          this.props.resetIncrementalIndex();
          const selectedTargets = this.props.selectedCharacters.map(({ target }) => target);
          const hasTargetStats = selectedTargets.some(target => target.targetStats &&
            target.targetStats.filter(targetStat => targetStat.optimizeForTarget).length)
          const duplicateCharacters = keysWhere(
            collectByKey(this.props.selectedCharacters, ({ id }) => id),
            targets => targets.length > 1);

          const minCharacterIndices = this.props.selectedCharacters.reduce((indices, { id }, charIndex) => ({
            [id]: charIndex,
            ...indices
          }));
          console.log(minCharacterIndices);

          const invalidTargets = this.props.selectedCharacters.filter(({ target }, index) =>
            target.targetStats.find(targetStat => targetStat.relativeCharacterId && minCharacterIndices[targetStat.relativeCharacterId] > index)
          ).map(({ id }) => id)
          console.log(invalidTargets);

          if (invalidTargets.length > 0) {
            this.props.showError([
              <p>Vous avez défini des cibles invalides !</p>,
              <p>Pour les cibles relatives, le personnage comparé DOIT être placé avant dans la liste des personnages sélectionnés.</p>,
              <p>Veuillez corriger les personnages suivants :</p>,
              <ul>
                {invalidTargets.map(id => <li>
                  {this.props.gameSettings[id] ? this.props.gameSettings[id].name : id}
                </li>)}
              </ul>
            ]);
          } else if (duplicateCharacters.length > 0 || hasTargetStats) {
            this.props.showModal('notice', this.optimizeWithWarningsModal(duplicateCharacters, hasTargetStats));
          } else {
            this.props.showModal('optimizer-progress', <OptimizerProgress />, false);
            this.props.optimizeMods();
          }
        }}
        disabled={!this.props.selectedCharacters.length}
      >
        Optimiser mes mods !
      </button>
      {
        this.props.showReviewButton ?
          <button type={'button'} onClick={this.props.reviewOldAssignments}>
            Réviser les recommandations
          </button> :
          null
      }
      <button type={'button'} className={'blue'} onClick={this.props.lockAllCharacters}>
        Tout verrouiller
      </button>
      <button type={'button'} className={'blue'} onClick={this.props.unlockAllCharacters}>
        Tout déverrouiller
      </button>
      <button
        type={'button'}
        className={'blue'}
        onClick={() => this.props.showModal('reset-modal', this.resetCharsModal())}
      >
        Réinitialiser toutes les cibles
      </button>
    </div >
  }

  /**
   * Affiche un bloc pour un personnage disponible. Il inclut le portrait du personnage et un bouton
   * pour éditer ses statistiques
   * @param character Personnage
   * @param className Classe à appliquer à chaque bloc de personnage
   */
  characterBlock(character, className) {
    const isLocked = character.optimizerSettings.isLocked;
    const classAttr = `${isLocked ? 'locked' : ''} ${className} character`;

    return <div
      className={classAttr}
      key={character.baseID}
    >
      <span className={`icon locked ${isLocked ? 'active' : ''}`}
        onClick={() => this.props.toggleCharacterLock(character.baseID)} />
      <div draggable={true} onDragStart={this.dragStart(character)}
        onDoubleClick={() => this.props.selectCharacter(
          character.baseID,
          character.defaultTarget(),
          this.props.lastSelectedCharacter
        )}>
        <CharacterAvatar character={character} />
      </div>
      <div className={'character-name'}>
        {this.props.gameSettings[character.baseID] ? this.props.gameSettings[character.baseID].name : character.baseID}
      </div>
    </div>;
  }

  /**
   * Affiche une fenêtre modale avec les instructions d'utilisation de l'optimiseur de mods
   * @returns Array[JSX Element]
   */
  instructionsModal() {
    return <div>
      <h2>Comment utiliser l'optimiseur de mods</h2>
      <p>
        Bienvenue sur mon optimiseur de mods pour Star Wars : Galaxy of Heroes ! Cette application repose sur un principe simple :
        chaque statistique doit avoir une valeur définie pour un personnage, et si nous connaissons toutes ces valeurs, alors nous pouvons
        calculer la valeur d'un mod ou d'un ensemble de mods pour ce personnage. À partir de là, l'outil sait comment
        trouver l'ensemble de mods qui offre la meilleure valeur globale pour chacun de vos personnages sans que vous ayez à parcourir
        les centaines de mods présents dans votre inventaire !
      </p>
      <h3>Sélection des personnages à optimiser</h3>
      <p>
        L'optimiseur de mods commence par considérer tous les mods équipés sur tous les personnages sauf ceux qui sont
        « Verrouillés ». Ensuite, il parcourt la liste des personnages sélectionnés, un par un, en choisissant le
        meilleur ensemble de mods pour chaque personnage, en fonction de la cible sélectionnée. Au fur et à mesure qu'il termine
        un personnage, il retire les mods utilisés de l'ensemble des options. Ainsi, le personnage pour lequel vous souhaitez obtenir
        les meilleurs mods doit toujours être placé en premier dans votre liste de sélection. En général, cela signifie que le personnage qui
        a le plus besoin de vitesse doit être le premier.
      </p>
      <p>
        Je vous suggère d’optimiser d’abord votre équipe d’arène, en fonction de la vitesse requise, puis
        les personnages utilisés pour les raids, et enfin ceux des autres modes de jeu, comme les Batailles de Territoire, les Guerres de Territoire et les événements.
      </p>
      <h3>Choisir les bonnes valeurs</h3>
      <p>
        Chaque personnage du jeu se voit attribuer des valeurs de départ pour toutes les statistiques que l’optimiseur peut utiliser pour
        sélectionner les meilleurs mods. Ces valeurs portent un nom qui correspond à leur utilisation générale – par exemple, hSTR Phase 1, PvP, et PvE.
        Certains personnages disposent de plusieurs cibles parmi lesquelles choisir. <strong>Ces cibles, bien qu’indiquant une direction générale pour les personnages,
          ne sont qu'une suggestion de base !</strong> De nombreuses raisons peuvent vous pousser à choisir des valeurs différentes de celles indiquées par défaut dans l’optimiseur : vous pourriez vouloir optimiser pour un autre usage (comme une équipe de raid Sith Triumvirate Phase 3, où la vitesse peut être contre-productive), choisir une cible différente ou simplement utiliser de meilleures valeurs.
      </p>
      <p>
        La façon la plus simple de démarrer avec l’optimiseur est de choisir parmi les modèles de personnages préprogrammés.
        Ceux-ci sont constitués d’un ensemble de personnages et de cibles qui devraient convenir à divers modes de jeu. Si aucun modèle ne correspond parfaitement à vos besoins, vous pouvez en utiliser un comme point de départ ou en créer un nouveau. Pour chaque personnage, s’il n’existe pas de cible correspondant à vos attentes,
        vous pouvez sélectionner « Personnalisé », ou simplement cliquer sur le bouton « Éditer » pour ouvrir la fenêtre d’édition du personnage.
        La plupart des personnages auront le mode « de base » sélectionné par défaut. En mode de base, vous choisissez une valeur pour toutes les statistiques comprise entre -100 et 100.
        Ces valeurs représentent des coefficients attribués à chaque statistique pour en déterminer l’importance pour le personnage. Attribuer deux valeurs identiques signifie que ces statistiques ont à peu près la même importance. En mode de base, l’optimiseur ajuste automatiquement les coefficients en fonction de l’étendue des valeurs visibles en jeu pour chaque statistique.
        Par exemple, donner une valeur de 100 à la vitesse et à la protection signifie que 1 point de vitesse équivaut à environ 200 de protection (puisque l’on trouve bien plus de protection sur les mods que de vitesse).
      </p>
      <p>
        Si vous souhaitez un contrôle plus précis sur les valeurs des statistiques, vous pouvez passer en mode « avancé ». En mode avancé,
        les valeurs indiquées correspondent à la valeur par point pour la statistique concernée. Ainsi, si la vitesse et la protection ont chacune une valeur de 100,
        l’outil ne sélectionnera jamais la vitesse, car il pourra plus facilement offrir beaucoup plus de protection au personnage. Je recommande de rester en mode de base
        jusqu’à ce que vous maîtrisiez bien le fonctionnement de l’outil.
      </p>
      <p>
        J’espère que vous apprécierez cet outil ! Bon modding !
      </p>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>OK</button>
      </div>
    </div>;
  }

  generateCharacterListModal() {
    let form;

    return <div>
      <h3 className={'gold'}>Générer automatiquement la liste des personnages</h3>
      <p>
        Cet utilitaire va générer automatiquement une liste de personnages basée sur votre roster actuel et l’usage souhaité.
        Il est conçu comme point de départ et n’est en aucun cas définitif quant à l’ordre des personnages ou aux cibles choisies.
      </p>
      <p>
        <span className={'purple'}>Note :</span> sauf indication contraire dans les « Paramètres avancés » ci-dessous, votre équipe d’arène actuelle ne sera pas placée en tête de liste.
      </p>
      <p><span className={'blue'}>Fourni par&nbsp;
        <a href={'https://swgoh.spineless.net/'} target={'_blank'} rel={'noopener noreferrer'}>
          https://swgoh.spineless.net/
        </a>
      </span></p>
      <hr />
      <form ref={(element) => form = element}>
        <label htmlFor={'use-case'}>Sélectionnez votre cas d’utilisation :</label>
        <Dropdown id={'use-case'} name={'use-case'}>
          <option value={''}>GAC / TW / ROTE (par défaut)</option>
          <option value={1}>Bataille de Territoire côté Lumière</option>
          <option value={2}>Bataille de Territoire côté Obscur</option>
          <option value={3}>Uniquement pour l’Arène</option>
        </Dropdown>
        <div className={`character-list-omicronboosts`}>
          <Spoiler title={'Boosts Omicron'}>
            <div className={'form-row'}>
              <label htmlFor={'omicron-gac'}>Grande Arène :</label>
              <input id={'omicron-gac'} name={'omicron-gac'} type={'checkbox'} 
              defaultChecked={this.props.globalSettings.omicronBoostsGac}
              onChange={(event) => this.props.updateOmicronBoostsGac(event.target.checked)} />
            </div>
            <div className={'form-row'}>
              <label htmlFor={'omicron-tw'}>Guerres de Territoire :</label>
              <input id={'omicron-tw'} name={'omicron-tw'} type={'checkbox'}
              defaultChecked={this.props.globalSettings.omicronBoostsTw}
              onChange={(event) => this.props.updateOmicronBoostsTw(event.target.checked)} />
            </div>
            <div className={'form-row'}>
              <label htmlFor={'omicron-tb'}>Batailles de Territoire :</label>
              <input id={'omicron-tb'} name={'omicron-tb'} type={'checkbox'}
              defaultChecked={this.props.globalSettings.omicronBoostsTb}
              onChange={(event) => this.props.updateOmicronBoostsTb(event.target.checked)} />
            </div>
            <div className={'form-row'}>
              <label htmlFor={'omicron-raids'}>Raids :</label>
              <input id={'omicron-raids'} name={'omicron-raids'} type={'checkbox'}
              defaultChecked={this.props.globalSettings.omicronBoostsRaids}
              onChange={(event) => this.props.updateOmicronBoostsRaids(event.target.checked)} />
            </div>
            <div className={'form-row'}>
              <label htmlFor={'omicron-conquest'}>Conquête :</label>
              <input id={'omicron-conquest'} name={'omicron-conquest'} type={'checkbox'}
              defaultChecked={this.props.globalSettings.omicronBoostsConquest}
              onChange={(event) => this.props.updateOmicronBoostsConquest(event.target.checked)} />
            </div>
          </Spoiler>
        </div>
        <Toggle
          name={'overwrite'}
          inputLabel={'Ecraser la liste existante ?'}
          leftValue={false}
          leftLabel={'Ajouter'}
          rightValue={true}
          rightLabel={'Ecraser'}
        />
        <Spoiler title={'Paramètres avancés'}>
          <div className={'form-row'}>
            <label htmlFor={'alignment-filter'}>Alignement :</label>
            <Dropdown id={'alignment-filter'} name={'alignment-filter'} defaultValue={0}>
              <option value={0}>Tous les personnages</option>
              <option value={1}>Uniquement côté Lumière</option>
              <option value={2}>Uniquement côté Obscur</option>
            </Dropdown>
          </div>
          <div className={'form-row'}>
            <label htmlFor={'minimum-gear-level'}>Niveau d’équipement minimum :</label>
            <Dropdown id={'minimum-gear-level'} name={'minimum-gear-level'} defaultValue={1}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={7}>7</option>
              <option value={8}>8</option>
              <option value={9}>9</option>
              <option value={10}>10</option>
              <option value={11}>11</option>
              <option value={12}>12</option>
              <option value={13}>13</option>
            </Dropdown>
          </div>
          <div className={'form-row'}>
            <label htmlFor={'ignore-arena'}>Ignorer les équipes d’arène :</label>
            <input id={'ignore-arena'} name={'ignore-arena'} type={'checkbox'} defaultChecked={true} />
          </div>
          <div className={'form-row'}>
            <label htmlFor={'max-list-size'}>Taille maximale de la liste :&nbsp;</label>
            <input id={'max-list-size'} name={'max-list-size'} type={'text'} inputMode={'numeric'} size={3} />
          </div>
        </Spoiler>
      </form>
      <hr />
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button
          type={'button'}
          onClick={() => {
            const parameters = {
              'alignmentFilter': form['alignment-filter'].value,
              'minimumGearLevel': form['minimum-gear-level'].value,
              'ignoreArena': form['ignore-arena'].checked,
              'top': form['max-list-size'].value,
              'omicronGac': form['omicron-gac'].checked,
              'omicronTw': form['omicron-tw'].checked,
              'omicronTb': form['omicron-tb'].checked,
              'omicronRaids': form['omicron-raids'].checked,
              'omicronConquest': form['omicron-conquest'].checked
            }

            this.props.generateCharacterList(
              form['use-case'].value,
              form.overwrite.value,
              this.props.allyCode,
              parameters)
          }}
        >
          Générer
        </button>
      </div>
    </div>;
  }

  /**
   * Affiche une fenêtre modale « Êtes-vous sûr ? » pour réinitialiser tous les personnages avec les cibles par défaut
   *
   * @return JSX Element
   */
  resetCharsModal() {
    return <div>
      <h2>Êtes-vous sûr de vouloir réinitialiser tous les personnages aux valeurs par défaut ?</h2>
      <p>
        Cela ne remplacera <strong>pas</strong> les nouvelles cibles d’optimisation que vous avez enregistrées, mais si vous avez modifié
        une cible existante, ou si une nouvelle cible a été créée avec le même nom que l’ancienne, elle sera écrasée.
      </p>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} className={'red'} onClick={() => this.props.resetAllCharacterTargets()}>Réinitialiser</button>
      </div>
    </div>;
  }

  saveTemplateModal() {
    const isNameUnique = (name) => !this.props.characterTemplates.includes(name);
    let nameInput, saveButton;

    return <div>
      <h3>Veuillez entrer un nom pour ce modèle de personnage</h3>
      <input type={'text'} id={'template-name'} name={'template-name'} ref={input => nameInput = input} autoFocus
        onKeyUp={(e) => {
          if (e.key === 'Enter' && isNameUnique(nameInput.value)) {
            this.props.saveTemplate(nameInput.value);
          }
          // Ne pas changer la saisie si l'utilisateur essaie de sélectionner quelque chose
          if (window.getSelection().toString() !== '') {
            return;
          }
          // Ne pas changer la saisie si l'utilisateur appuie sur les flèches
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            return;
          }

          if (!isNameUnique(nameInput.value)) {
            nameInput.classList.add('invalid');
            saveButton.disabled = true;
          } else {
            nameInput.classList.remove('invalid');
            saveButton.disabled = false;
          }
        }}
      />
      <p className={'error'}>
        Ce nom est déjà utilisé. Veuillez choisir un autre nom.
      </p>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} ref={button => saveButton = button}
          onClick={() => this.props.saveTemplate(nameInput.value)}>
          Enregistrer
        </button>
      </div>
    </div>;
  }

  appendTemplateModal() {
    let templateSelection;
    return <div>
      <h3>Sélectionnez un modèle de personnage à ajouter à vos personnages sélectionnés</h3>
      {this.templateSelectElement(select => templateSelection = select)}
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} onClick={() => this.props.appendTemplate(templateSelection.value)}>Ajouter</button>
      </div>
    </div>;
  }

  replaceTemplateModal() {
    let templateSelection;
    return <div>
      <h3>Sélectionnez un modèle de personnage pour remplacer vos personnages sélectionnés</h3>
      {this.templateSelectElement(select => templateSelection = select)}
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} onClick={() => this.props.replaceTemplate(templateSelection.value)}>Remplacer</button>
      </div>
    </div>;
  }

  templateTargetsModal() {
    let templateSelection;
    return <div>
      <h3>
        Sélectionnez un modèle de personnage. Les cibles définies dans ce modèle
        seront appliquées à tous les personnages présents dans votre liste de sélection.
      </h3>
      {this.templateSelectElement(select => templateSelection = select)}
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} onClick={() => this.props.applyTemplateTargets(templateSelection.value)}>
          Appliquer les cibles
        </button>
      </div>
    </div>;
  }

  userTemplates() {
    return this.props.characterTemplates.filter(
      templateName => !defaultTemplates.map(({ name }) => name).includes(templateName)
    );
  }

  /**
   * Crée un élément select pour un modèle de personnage, avec les modèles personnels en premier,
   * suivis d'une ligne séparatrice, puis des modèles par défaut, le tout trié par ordre alphabétique
   *
   * @param refFunction {Function} Une fonction pour récupérer la référence de l'élément select
   */
  templateSelectElement(refFunction) {
    const userTemplateNames = this.userTemplates();
    const defaultTemplateNames = defaultTemplates.map(({ name }) => name);

    userTemplateNames.sort();
    defaultTemplateNames.sort();

    const userTemplateOptions = userTemplateNames
      .map((name, index) => <option key={`user-${index}`} value={name}>{name}</option>);
    const defaultTemplateOptions = defaultTemplateNames
      .map((name, index) => <option key={`default-${index}`} value={name}>{name}</option>);

    return <Dropdown ref={refFunction}>
      {userTemplateOptions}
      {userTemplateOptions.length &&
        <option disabled={true} value={''}>------------------------------------------------</option>}
      {defaultTemplateOptions}
    </Dropdown>;
  }

  exportTemplateModal() {
    let templateNameInput;

    const templateOptions = this.userTemplates().map(name => <option value={name}>{name}</option>);

    return <div>
      <h3>Veuillez sélectionner un modèle de personnage à exporter</h3>
      <Dropdown ref={select => templateNameInput = select}>
        {templateOptions}
      </Dropdown>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'}
          onClick={() =>
            this.props.exportTemplate(
              templateNameInput.value,
              template => {
                const templateSaveObject = {
                  name: template.name,
                  selectedCharacters: template.selectedCharacters.map(({ id, target }) => ({
                    id: id,
                    target: target.serialize()
                  }))
                };
                const templateSerialized = JSON.stringify([templateSaveObject]);
                const userData = new Blob([templateSerialized], { type: 'application/json;charset=utf-8' });
                saveAs(userData, `modsOptimizerTemplate-${template.name}.json`);
              }
            )
          }>
          Exporter
        </button>
        <button type={'button'}
          onClick={() => this.props.exportAllTemplates(templates => {
            const templatesSaveObject = templates.map(({ name, selectedCharacters }) => ({
              name: name,
              selectedCharacters: selectedCharacters.map(({ id, target }) => ({ id: id, target: target.serialize() }))
            }));
            const templatesSerialized = JSON.stringify(templatesSaveObject);
            const userData = new Blob([templatesSerialized], { type: 'application/json;charset=utf-8' });
            saveAs(userData, `modsOptimizerTemplates-${(new Date()).toISOString().slice(0, 10)}.json`);
          })}>
          Tout exporter
        </button>
      </div>
    </div>;
  }

  deleteTemplateModal() {
    let templateNameInput;

    const templateOptions = this.userTemplates().map(name => <option value={name}>{name}</option>);

    return <div>
      <h3>Veuillez sélectionner un modèle de personnage à supprimer</h3>
      <Dropdown ref={select => templateNameInput = select}>
        {templateOptions}
      </Dropdown>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} className={'red'}
          onClick={() => this.props.deleteTemplate(templateNameInput.value)}>
          Supprimer
        </button>
      </div>
    </div>;
  }

  /**
   * Affiche une fenêtre modale d'avertissement avant d'optimiser une liste contenant des statistiques cibles
   * @returns {*}
   */
  optimizeWithWarningsModal(duplicates, hasTargetStats) {
    return <div>
      <h2>Avertissements de l'optimiseur</h2>
      <hr />
      {duplicates.length > 0 && <div>
        <h3>Vous avez des personnages en doublon</h3>
        <p>L'optimiseur peut créer plusieurs suggestions pour le même personnage en utilisant différentes cibles. Cependant, si vous prévoyez de transférer vos mods en jeu avec HotUtils, chaque personnage ne doit apparaître qu'une seule fois dans la liste.</p>
        <p className={'left'}><strong>Personnages dupliqués :</strong></p>
        <ul>
          {duplicates.map(characterID =>
            <li>{this.props.gameSettings[characterID] ? this.props.gameSettings[characterID].name : characterID}</li>
          )}
        </ul>
        <hr />
      </div>}
      {hasTargetStats && <div>
        <h3>Vous avez sélectionné des personnages avec des statistiques cibles</h3>
        <p>
          Utiliser une statistique cible peut être très lent - <strong>jusqu’à plusieurs heures pour un seul personnage</strong> - et peut rapidement épuiser la batterie sur un ordinateur portable ou un appareil mobile. Pour accélérer l'optimisation, voici quelques pistes :
        </p>
        <hr />
        <ul>
          <li>
            Définissez des cibles très précises pour vos statistiques. Plus la cible est précise, plus l'optimiseur peut éliminer rapidement des ensembles.
          </li>
          <li>
            Ajoutez des restrictions supplémentaires, comme des ensembles spécifiques ou des statistiques prioritaires.
          </li>
          <li>
            Précisez des cibles difficiles à atteindre. Si seuls quelques ensembles peuvent atteindre une cible, l'optimiseur n'aura qu'à vérifier ces ensembles.
          </li>
          <li>
            Si vous avez déjà exécuté l'optimisation pour un personnage avec une statistique cible, évitez de modifier ses paramètres ou ceux des personnages situés au-dessus. Si l'optimiseur estime qu'il n'est pas nécessaire de recalculer le meilleur ensemble de mods, il conservera la recommandation précédente.
          </li>
        </ul>
        <hr />
      </div>
      }
      <p>Souhaitez-vous continuer ?</p>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} onClick={() => {
          this.props.showModal('optimizer-progress', <OptimizerProgress />, false);
          this.props.optimizeMods();
        }}>Optimiser !</button>
      </div>
    </div>;
  }

  globalSettingsHelp() {
    return <div className={'help'}>
      <p>
        Les paramètres globaux permettent d’apporter des modifications qui s’appliquent à tous les personnages lors d'une optimisation. Ils
        prévalent toujours sur les paramètres spécifiques à un personnage.
      </p>
      <ul>
        <li>
          <strong>Seuil pour changer les mods</strong> - Pendant l’optimisation, le comportement habituel est de recommander le meilleur ensemble de mods possible, en fonction de la cible choisie. Si ce nombre est supérieur à 0, l’optimiseur ne recommandera un changement que si le nouvel ensemble est nettement meilleur que celui précédemment équipé, ou si les mods du personnage ont été déplacés et doivent être remplacés.
        </li>
        <li>
          <strong>Verrouiller tous les personnages non sélectionnés</strong> - Si cette case est cochée, aucun mod ne sera extrait des personnages non sélectionnés. Cela peut être utile pour utiliser rapidement des mods non attribués sans remodifier toute votre équipe.
        </li>
        <li>
          <strong>Ne pas casser les ensembles de mods</strong> - Si cette option est activée, l'optimiseur essaie de conserver les ensembles entiers de mods pour vous assurer d'obtenir le bonus maximal. S'il n'est pas possible de conserver un ensemble complet en raison de restrictions ou d'un nombre insuffisant de mods, l'optimiseur pourra supprimer cette contrainte.
        </li>
      </ul>
    </div>;
  }

  characterTemplatesHelp() {
    return <div className={'help'}>
      <p>
        Les modèles de personnages permettent de gérer un groupe de <strong>personnages sélectionnés</strong> et leurs <strong>cibles</strong> de façon indépendante du reste de vos données. Ils peuvent être utilisés pour constituer des équipes selon un usage spécifique et être partagés avec vos amis, coéquipiers ou sur le serveur Discord de l'Optimiseur de Mods afin que d’autres puissent rapidement copier vos réglages. Voici une brève description des boutons permettant d’interagir avec les modèles :
      </p>
      <h5>Gestion des modèles</h5>
      <ul>
        <li>
          <strong>Enregistrer</strong> - Enregistre les personnages sélectionnés ainsi que leurs cibles en tant que nouveau modèle. Vous serez invité à donner un nom à ce modèle, que vous pourrez ensuite appliquer ou exporter.
        </li>
        <li><strong>Exporter</strong> - Exporte un ou plusieurs modèles dans un fichier pouvant être partagé.</li>
        <li>
          <strong>Charger</strong> - Charge des modèles depuis un fichier dans l’optimiseur. Cette opération ajoute les modèles à la liste disponible sans les appliquer directement.
        </li>
        <li>
          <strong>Supprimer</strong> - Supprime un modèle de l’optimiseur. Cette action ne fonctionne que pour les modèles que vous avez créés ou chargés ; les modèles par défaut ne peuvent être supprimés.
        </li>
      </ul>
      <h5>Application des modèles</h5>
      <ul>
        <li><strong>Ajouter</strong> - Ajoute les personnages d’un modèle à la fin de votre liste de sélection.</li>
        <li><strong>Remplacer</strong> - Efface la liste des personnages sélectionnés et la remplace par celle du modèle choisi.</li>
        <li>
          <strong>Appliquer uniquement les cibles</strong> - Laisse la sélection de personnages et leur ordre intacts, mais pour ceux appartenant à un modèle, met à jour leur cible pour qu’elle corresponde au modèle.
        </li>
      </ul>
    </div>;
  }
}

const mapStateToProps = (state) => {
  const profile = state.profile;
  const availableCharacters = Object.values(profile.characters)
    .filter(character => character.playerValues.level >= 50)
    .filter(character => !state.hideSelectedCharacters ||
      !profile.selectedCharacters.map(({ id }) => id).includes(character.baseID)
    )
    .sort((left, right) => left.compareGP(right));

  /**
   * Vérifie si un personnage correspond au filtre (nom ou tags)
   * @param character {Character} Le personnage à vérifier
   * @returns boolean
   */
  const characterFilter = character => {
    const gameSettings = state.gameSettings[character.baseID] ?
      state.gameSettings[character.baseID] :
      new GameSettings(character.baseID, character.baseID);

    return '' === state.characterFilter ||
      gameSettings.name.toLowerCase().includes(state.characterFilter) ||
      (['lock', 'locked'].includes(state.characterFilter) && character.optimizerSettings.isLocked) ||
      (['unlock', 'unlocked'].includes(state.characterFilter) && !character.optimizerSettings.isLocked) ||
      gameSettings.tags
        .concat(characterSettings[character.baseID] ? characterSettings[character.baseID].extraTags : [])
        .some(tag => tag.toLowerCase().includes(state.characterFilter));
  };

  return {
    allyCode: state.allyCode,
    mods: profile.mods,
    globalSettings: profile.globalSettings,
    characterFilter: state.characterFilter,
    hideSelectedCharacters: state.hideSelectedCharacters,
    sortView: state.characterEditSortView,
    gameSettings: state.gameSettings,
    highlightedCharacters: availableCharacters.filter(characterFilter),
    availableCharacters: availableCharacters.filter(c => !characterFilter(c)),
    selectedCharacters: profile.selectedCharacters,
    lastSelectedCharacter: profile.selectedCharacters.length - 1,
    showReviewButton: profile.modAssignments && Object.keys(profile.modAssignments).length,
    characterTemplates: Object.keys(state.characterTemplates)
  };
};

const mapDispatchToProps = dispatch => ({
  showModal: (clazz, content, cancelable) => dispatch(showModal(clazz, content, cancelable)),
  hideModal: () => dispatch(hideModal()),
  showError: (error) => dispatch(showError(error)),
  changeCharacterFilter: (filter) => dispatch(changeCharacterFilter(filter)),
  toggleHideSelectedCharacters: () => dispatch(toggleHideSelectedCharacters()),
  toggleCharacterEditSortView: () => dispatch(toggleCharacterEditSortView()),
  reviewOldAssignments: () => {
    dispatch(updateModListFilter({
      view: 'sets',
      sort: 'assignedCharacter'
    }));
    dispatch(changeOptimizerView('review'));
  },
  selectCharacter: (characterID, target, prevIndex) => dispatch(selectCharacter(characterID, target, prevIndex)),
  unselectCharacter: (characterID) => dispatch(unselectCharacter(characterID)),
  clearSelectedCharacters: () => dispatch(unselectAllCharacters()),
  lockSelectedCharacters: () => dispatch(lockSelectedCharacters()),
  unlockSelectedCharacters: () => dispatch(unlockSelectedCharacters()),
  lockAllCharacters: () => dispatch(lockAllCharacters()),
  unlockAllCharacters: () => dispatch(unlockAllCharacters()),
  toggleCharacterLock: (characterID) => dispatch(toggleCharacterLock(characterID)),
  updateLockUnselectedCharacters: (lock) => dispatch(updateLockUnselectedCharacters(lock)),
  resetAllCharacterTargets: () => dispatch(resetAllCharacterTargets()),
  optimizeMods: () => dispatch(optimizeMods()),
  resetIncrementalIndex: () => dispatch(setOptimizeIndex(null)),
  updateModChangeThreshold: (threshold) => dispatch(updateModChangeThreshold(threshold)),
  updateForceCompleteModSets: (forceCompleteModSets) => dispatch(updateForceCompleteModSets(forceCompleteModSets)),
  updateOmicronBoostsGac: (enabled) => dispatch(updateOmicronBoostsGac(enabled)),
  updateOmicronBoostsTw: (enabled) => dispatch(updateOmicronBoostsTw(enabled)),
  updateOmicronBoostsTb: (enabled) => dispatch(updateOmicronBoostsTb(enabled)),
  updateOmicronBoostsRaids: (enabled) => dispatch(updateOmicronBoostsRaids(enabled)),
  updateOmicronBoostsConquest: (enabled) => dispatch(updateOmicronBoostsConquest(enabled)),
  generateCharacterList: (mode, behavior, allyCode, parameters) => {
    dispatch(fetchCharacterList(mode, behavior, allyCode, parameters));
    dispatch(hideModal());
  },
  saveTemplate: (name) => dispatch(saveTemplate(name)),
  saveTemplates: (templates) => dispatch(saveTemplates(templates)),
  appendTemplate: (templateName) => {
    dispatch(appendTemplate(templateName));
    dispatch(hideModal());
  },
  replaceTemplate: (templateName) => {
    dispatch(replaceTemplate(templateName));
    dispatch(hideModal());
  },
  applyTemplateTargets: (templateName) => {
    dispatch(applyTemplateTargets(templateName));
    dispatch(hideModal());
  },
  exportTemplate: (name, callback) => {
    dispatch(exportCharacterTemplate(name, callback));
    dispatch(hideModal());
  },
  exportAllTemplates: (callback) => {
    dispatch(exportCharacterTemplates(callback));
    dispatch(hideModal());
  },
  deleteTemplate: (name) => dispatch(deleteTemplate(name))
});

export default connect(mapStateToProps, mapDispatchToProps)(CharacterEditView);
