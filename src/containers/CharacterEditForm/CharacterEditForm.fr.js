import { connect } from "react-redux";
import RangeInput from "../../components/RangeInput/RangeInput";
import React from "react";
import CharacterAvatar from "../../components/CharacterAvatar/CharacterAvatar";
import Toggle from "../../components/Toggle/Toggle";
import OptimizationPlan from "../../domain/OptimizationPlan";
import { hideModal } from "../../state/actions/app";
import { optimizeMods } from "../../state/actions/optimize";
import {
  changeCharacterEditMode,
  changeMinimumModDots,
  changeSetRestrictions,
  changeSliceMods,
  closeEditCharacterForm,
  deleteTarget,
  finishEditCharacterTarget,
  removeSetBonus,
  resetCharacterTargetToDefault,
  selectSetBonus,
  unlockCharacter,
  changeTargetStats,
  addTargetStat,
  removeTargetStat
} from "../../state/actions/characterEdit";

import "./CharacterEditForm.css";
import setBonuses from "../../constants/setbonuses";
import TargetStat from "../../domain/TargetStat";
import characterSettings from "../../constants/characterSettings";
import { Dropdown } from "../../components/Dropdown/Dropdown";
import OptimizerProgress from '../../components/OptimizerProgress/OptimizerProgress';
import areObjectsEquivalent from '../../utils/areObjectsEquivalent';

class CharacterEditForm extends React.Component {
  constructor(props) {
    super(props);
    if (!props.setRestrictions) {
      props.populateSetRestrictions(props.target.setRestrictions);
    }
    if (!props.targetStats) {
      props.populateTargetStats(props.target.targetStats);
    }

    // Tableau pour conserver des références sur les éléments Toggle de la partie statistiques cibles,
    // afin d’y accéder directement
    this.targetStatsShouldOptimize = [];
  }

  componentWillUnmount() {
    this.props.cancel();
  }

  render() {
    const character = this.props.character;
    const target = this.props.target;

    if (!character) {
      return null;
    }
    const defaultTarget = characterSettings[character.baseID] ?
      characterSettings[character.baseID].targets.find(defaultTarget => defaultTarget.name === target.name) :
      null;

    // Détermine si le plan d'optimisation est par défaut (même nom existant), défini par l'utilisateur (nom différent)
    // ou personnalisé (nom « custom »). Ceci détermine s'il faut afficher un bouton "Réinitialiser la cible par défaut",
    // un bouton "Supprimer la cible" ou aucun bouton.
    let resetButton;

    if ('custom' === target.name) {
      resetButton = null;
    } else if (defaultTarget) {
      resetButton = <button type={'button'}
        id={'reset-button'}
        disabled={defaultTarget.equals(target)}
        onClick={() => {
          this.props.resetCharacterTargetToDefault(character.baseID, target.name);
        }}>
        Réinitialiser la cible par défaut
      </button>
    } else {
      resetButton = <button type={'button'}
        id={'delete-button'}
        className={'red'}
        onClick={() => this.props.deleteTarget(character.baseID, target.name)}>
        Supprimer la cible
      </button>
    }

    const slotToPrimaryRestriction = slot =>
      <div key={`mod-block-${slot}`} className={'mod-block'}>
        <Dropdown name={`${slot}-primary`} id={`${slot}-primary`}
          defaultValue={this.props.target.primaryStatRestrictions[slot]}>
          <option value={''}>Quelconque</option>
          {this.props[`${slot}Primaries`].map(
            primary => <option key={primary} value={primary}>{primary}</option>)}
        </Dropdown>
        <div className={`mod-image mod-image-${slot}`} />
      </div>;

    return <form
      className={`character-edit-form`}
      noValidate={'advanced' === this.props.editMode}
      onSubmit={(e) => {
        e.preventDefault();
        this.saveTarget();
        this.props.closeForm();
      }}
      ref={form => this.form = form}>
      <div className={'character-view column'}>
        <CharacterAvatar character={character} />
        <h2 className={'character-name'}>
          {this.props.gameSettings[character.baseID] ? this.props.gameSettings[character.baseID].name : character.baseID}
        </h2>
      </div>
      <div id={'character-level-options'}>
        <h3>Options au niveau du personnage</h3>
        <div className={'form-row center'}>
          <label htmlFor='mod-dots' id={'mod-dots-label'}>
            Utiliser uniquement les mods avec au moins&nbsp;
            <span className={'dropdown'}>
              <select name={'mod-dots'} id={'mod-dots'} defaultValue={character.optimizerSettings.minimumModDots}>
                {[1, 2, 3, 4, 5, 6].map(dots => <option key={dots} value={dots}>{dots}</option>)}
              </select>
            </span>
            &nbsp;point(s)
          </label>
        </div>
        <div className={'form-row'}>
          <label htmlFor={'slice-mods'} id={'slice-mods-label'}>Diviser les mods à 5 points en 6E pendant l'optimisation&nbsp;?</label>
          <input
            type={'checkbox'}
            id={'slice-mods'}
            name={'slice-mods'}
            defaultChecked={character.optimizerSettings.sliceMods} />
        </div>
      </div>
      <div className={'target-level-options'}>
        <h3>Options spécifiques à la cible</h3>
        <div className="row">
          <div className={'column'}>
            <div className={'header-row'}>
              <label htmlFor={'plan-name'}>Nom de la cible : </label>
              <input type={'text'} defaultValue={target.name} id={'plan-name'} name={'plan-name'} />
            </div>
            <div className={'non-stats'}>
              <div className={'form-row center'}>
                <label htmlFor={'upgrade-mods'}>Mettre à niveau les mods au niveau 15&nbsp;:</label>
                <input type={'checkbox'} name={'upgrade-mods'} id={'upgrade-mods'}
                  defaultChecked={this.props.target.upgradeMods} />
              </div>
            </div>
            <div className={'header-row group primary-stats'}>
              <h4>Restreindre les statistiques principales :</h4>
              <div className={'mod-blocks'}>
                <div className="breakable-group">
                  {['arrow', 'triangle'].map(slotToPrimaryRestriction)}
                </div>
                <div className="breakable-group">
                  {['circle', 'cross'].map(slotToPrimaryRestriction)}
                </div>
              </div>
            </div>
            <div className={'header-row group set-bonuses'}>
              <h4>Restreindre les bonus d'ensemble :</h4>
              {
                this.setRestrictionsForm(
                  this.props.setRestrictions || this.props.target.setRestrictions,
                  this.props.target.useOnlyFullSets
                )
              }
            </div>
            <div className={'header-row group target-stats'}>
              {this.targetStatForm(this.props.targetStats ||
                this.props.target.targetStats.map((targetStat, index) => ({
                  key: index,
                  target: targetStat
                }))
              )}
            </div>
          </div>
          <div className={'column'}>
            <div className={'header-row stat-weights-toggle'}>
              <Toggle
                inputLabel={'Pondérations de statistique'}
                name={'mode'}
                leftLabel={'Basique'}
                leftValue={'basic'}
                rightLabel={'Avancé'}
                rightValue={'advanced'}
                value={this.props.editMode}
                onChange={(newValue) => this.props.changeCharacterEditMode(newValue)}
              />
            </div>
            <div className={'instructions'}>
              Attribuez à chaque type de statistique une valeur. Ces valeurs servent à déterminer la qualité de chaque statistique pour calculer l'ensemble de mods optimal à équiper. <strong>Ce ne sont pas les quantités souhaitées pour chaque statistique !</strong> Elles sont multipliées par le montant présent sur un mod afin d'en établir un score.
            </div>
            {'basic' === this.props.editMode && this.basicForm(target)}
            {'advanced' === this.props.editMode && this.advancedForm(target)}
            {this.missedGoalsSection(
              character.baseID === this.props.modAssignments[this.props.characterIndex]?.id ?
                this.props.modAssignments[this.props.characterIndex] :
                null
            )}
          </div>
        </div>
      </div>
      <div className={'actions'}>
        {resetButton}
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'submit'}>Enregistrer</button>
      </div>
    </form>;
  }

  /**
   * Affiche un élément de formulaire pour gérer les restrictions d'ensemble
   *
   * @param setRestrictions {Object<String, Number>}
   * @param useFullSets {Boolean}
   * @returns {JSX Element}
   */
  setRestrictionsForm(setRestrictions, useFullSets) {
    let selectedSets = [];
    Object.entries(setRestrictions).forEach(([setName, count]) => {
      for (let i = 0; i < count; i++) {
        selectedSets.push(setName);
      }
    });
    const emptySlots = 3 - selectedSets.reduce((acc, setName) => acc + setBonuses[setName].numberOfModsRequired / 2, 0);

    const setBonusToFormDisplay = (setBonus, index) => {
      const className = setBonus.numberOfModsRequired > (2 * emptySlots) ? 'disabled' : ''
      return <img
        src={`/img/icon_buff_${setBonus.name}.png`}
        alt={setBonus.name}
        key={index}
        className={className}
        onClick={() => this.props.selectSetBonus(setBonus.name)}
      />
    };

    const setBonusGroups = [Object.values(setBonuses).slice(0, 4), Object.values(setBonuses).slice(4)];
    const setBonusGroupsDisplay = setBonusGroups.map(setBonuses => setBonuses.map(setBonusToFormDisplay))
    const setBonusDisplay = setBonusGroupsDisplay.map((groupDisplay, index) =>
      <div className="breakable-group" key={index}>{groupDisplay}</div>
    )

    return <div className={'mod-sets'}>
      <div className={'form-row center'}>
        <label htmlFor={'use-full-sets'}>Ne pas casser les ensembles de mods</label>
        <input type={'checkbox'} name={'use-full-sets'} id={'use-full-sets'} defaultChecked={useFullSets} />
      </div>
      <p className={'instructions'}>
        Cliquez sur un bonus d'ensemble pour l'ajouter ou le retirer des ensembles sélectionnés.
      </p>
      <div className={'set-options'}>
        {setBonusDisplay}
      </div>
      <div className={'selected-sets'}>
        <p>Ensembles sélectionnés :</p>
        {selectedSets.map((setName, index) =>
          <img
            src={`/img/icon_buff_${setName}.png`}
            alt={setName}
            key={index}
            onClick={() => this.props.removeSetBonus(setName)}
          />
        )}
        {Array.from({ length: emptySlots }, (_, index) =>
          <span className={'empty-set'} key={index} />
        )}
      </div>
    </div>;
  }

  /**
   * Affiche un élément de formulaire pour gérer une statistique cible
   *
   * @param targetStats {Array<TargetStat>}
   * @returns {*}
   */
  targetStatForm(targetStats) {
    const possibleTargetStats = [
      'Health',
      'Protection',
      'Health+Protection',
      'Speed',
      'Critical Damage',
      'Potency',
      'Tenacity',
      'Physical Damage',
      'Physical Critical Chance',
      'Armor',
      'Special Damage',
      'Special Critical Chance',
      'Resistance',
      'Accuracy',
      'Critical Avoidance'
    ];

    const gameSettings = Object.values(this.props.gameSettings).slice(0);
    gameSettings.sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName()))

    const targetStatRows = targetStats.map((targetStat, index) =>
      <div className={'form-row center'} key={targetStat.key}>
        <Toggle
          ref={shouldOptimizeToggle => this.targetStatsShouldOptimize[index] = shouldOptimizeToggle}
          inputLabel={'Type de statistique cible'}
          name={'optimize-for-target[]'}
          leftLabel={'Optimiser'}
          leftValue={true}
          rightLabel={'Afficher seulement'}
          rightValue={false}
          value={targetStat.target.optimizeForTarget}
          disabled={targetStat.target.stat === 'Health+Protection'}
        />
        <button type={'button'} className={'red small'} onClick={() => this.props.removeTargetStat(index)}>-</button>
        <span className={'dropdown'}>
          <select name={'target-stat-name[]'} defaultValue={targetStat.target.stat}
            onChange={event => {
              if (event.target.value === 'Health+Protection') {
                this.targetStatsShouldOptimize[index].updateValue(false);
                this.targetStatsShouldOptimize[index].disable();
              } else {
                this.targetStatsShouldOptimize[index].enable();
              }
            }}
          >
            <option value={''}>Aucune cible</option>
            {possibleTargetStats.map(stat => <option key={stat} value={stat}>{stat}</option>)}
          </select>
        </span>
        &nbsp; doit être entre &nbsp;
        <input
          type={'number'}
          step={'any'}
          name={'target-stat-min[]'}
          defaultValue={targetStat.target.minimum} />
        &nbsp; et &nbsp;
        <input
          type={'number'}
          step={'any'}
          name={'target-stat-max[]'}
          defaultValue={targetStat.target.maximum} />
        <br />
        comparé à &nbsp;
        <span className={'dropdown'}>
          <select name={'target-stat-relative-character[]'} defaultValue={targetStat.target.relativeCharacterId || ''}>
            <option value={''}>Personne</option>
            {gameSettings.map(
              gs => <option key={gs.baseID} value={gs.baseID}>{gs.getDisplayName()}</option>
            )}
          </select>
        </span>
        &nbsp; en utilisant &nbsp;
        <span className={'dropdown'}>
          <select name={'target-stat-type[]'} defaultValue={targetStat.target.type || '+'}>
            <option value='+'>+/-</option>
            <option value='%'>%</option>
          </select>
        </span>
      </div >
    );

    return <div>
      <h4>Définir les statistiques cibles :</h4>
      <p><em>Notez que l’ajout de statistiques cibles peut considérablement ralentir l’optimisation.</em></p>
      <p>
        Définir une statistique cible fera en sorte que l’optimiseur considère que tous les mods sont mis au niveau 15 pour ce personnage.
      </p>
      {targetStatRows}
      <div className={'form-row center'}>
        <button
          type={'button'}
          className={'small new-target-stat-button'}
          onClick={() => this.props.addTargetStat(new TargetStat())}
        >
          +
        </button>
      </div>
    </div>;
  }

  /**
   * Affiche un formulaire pour les pondérations de statistiques utilisant des curseurs de -100 à 100
   *
   * @param optimizationPlan OptimizationPlan contenant les valeurs par défaut
   */
  basicForm(optimizationPlan) {
    return <div id={'basic-form'}>
      <div className={'form-row'}>
        <label htmlFor="health-stat">Santé :</label>
        <RangeInput
          editable={true}
          id={'health-stat'}
          name={'health-stat'}
          defaultValue={optimizationPlan.rawHealth}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="protection-stat">Protection :</label>
        <RangeInput
          editable={true}
          id={'protection-stat'}
          name={'protection-stat'}
          defaultValue={optimizationPlan.rawProtection}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="speed-stat">Vitesse :</label>
        <RangeInput
          editable={true}
          id={'speed-stat'}
          name={'speed-stat'}
          defaultValue={optimizationPlan.rawSpeed}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="critChance-stat">Chance critique % :</label>
        <RangeInput
          editable={true}
          id={'critChance-stat'}
          name={'critChance-stat'}
          defaultValue={optimizationPlan.rawCritChance}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="critDmg-stat">Dégâts critiques % :</label>
        <RangeInput
          editable={true}
          id={'critDmg-stat'}
          name={'critDmg-stat'}
          defaultValue={optimizationPlan.rawCritDmg}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="potency-stat">Puissance % :</label>
        <RangeInput
          editable={true}
          id={'potency-stat'}
          name={'potency-stat'}
          defaultValue={optimizationPlan.rawPotency}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="tenacity-stat">Ténacité % :</label>
        <RangeInput
          editable={true}
          id={'tenacity-stat'}
          name={'tenacity-stat'}
          defaultValue={optimizationPlan.rawTenacity}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="physDmg-stat">Dégâts physiques :</label>
        <RangeInput
          editable={true}
          id={'physDmg-stat'}
          name={'physDmg-stat'}
          defaultValue={optimizationPlan.rawPhysDmg}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="specDmg-stat">Dégâts spéciaux :</label>
        <RangeInput
          editable={true}
          id={'specDmg-stat'}
          name={'specDmg-stat'}
          defaultValue={optimizationPlan.rawSpecDmg}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor={'defense-stat'}>Défense :</label>
        <RangeInput
          editable={true}
          id={'defense-stat'}
          name={'defense-stat'}
          defaultValue={optimizationPlan.rawArmor + optimizationPlan.rawResistance}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="accuracy-stat">Précision :</label>
        <RangeInput
          editable={true}
          id={'accuracy-stat'}
          name={'accuracy-stat'}
          defaultValue={optimizationPlan.rawAccuracy}
          min={-100}
          max={100}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="critAvoid-stat">Évitement critique :</label>
        <RangeInput
          editable={true}
          id={'critAvoid-stat'}
          name={'critAvoid-stat'}
          defaultValue={optimizationPlan.rawCritAvoid}
          min={-100}
          max={100}
        />
      </div>
    </div>;
  }

  /**
   * Affiche un formulaire pour les pondérations de statistiques avec contrôle granulaire
   *
   * @param optimizationPlan OptimizationPlan contenant les valeurs par défaut
   */
  advancedForm(optimizationPlan) {
    return <div id={'advanced-form'}>
      <div className={'form-row'}>
        <label htmlFor="health-stat-advanced">Santé :</label>
        <input
          id={'health-stat-advanced'}
          name={'health-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.health}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="protection-stat-advanced">Protection :</label>
        <input
          id={'protection-stat-advanced'}
          name={'protection-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.protection}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="speed-stat-advanced">Vitesse :</label>
        <input
          id={'speed-stat-advanced'}
          name={'speed-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.speed}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="critChance-stat-advanced">Chance critique % :</label>
        <input
          id={'critChance-stat-advanced'}
          name={'critChance-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.critChance}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="critDmg-stat-advanced">Dégâts critiques % :</label>
        <input
          id={'critDmg-stat-advanced'}
          name={'critDmg-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.critDmg}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="potency-stat-advanced">Puissance % :</label>
        <input
          id={'potency-stat-advanced'}
          name={'potency-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.potency}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="tenacity-stat-advanced">Ténacité % :</label>
        <input
          id={'tenacity-stat-advanced'}
          name={'tenacity-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.tenacity}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="physDmg-stat-advanced">Dégâts physiques :</label>
        <input
          id={'physDmg-stat-advanced'}
          name={'physDmg-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.physDmg}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="specDmg-stat-advanced">Dégâts spéciaux :</label>
        <input
          id={'specDmg-stat-advanced'}
          name={'specDmg-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.specDmg}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="armor-stat-advanced">Armor :</label>
        <input
          id={'armor-stat-advanced'}
          name={'armor-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.armor}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="resistance-stat-advanced">Resistance :</label>
        <input
          id={'resistance-stat-advanced'}
          name={'resistance-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.resistance}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="accuracy-stat-advanced">Précision :</label>
        <input
          id={'accuracy-stat-advanced'}
          name={'accuracy-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.accuracy}
        />
      </div>
      <div className={'form-row'}>
        <label htmlFor="critAvoid-stat-advanced">Évitement critique :</label>
        <input
          id={'critAvoid-stat-advanced'}
          name={'critAvoid-stat-advanced'}
          type={'number'}
          step={.01}
          defaultValue={optimizationPlan.critAvoid}
        />
      </div>
    </div>;
  }

  missedGoalsSection(modAssignments) {
    if ((this.props.targetStats || []).length === 0) {
      return;
    }

    const resultsInner = (() => {
      if (!areObjectsEquivalent(this.props.progress, {})) {
        return <OptimizerProgress />;
      }

      const rerunButton = (
        <div className={'actions'}>
          <button type={'button'} onClick={() => this.runIncrementalCalc()}>Exécuter l'optimisation incrémentale</button>
        </div>
      );

      if (modAssignments === null) {
        return (
          <div id={'missed-form'}>
            <div className={'form-row'}>
              <span>Aucune donnée d'optimisation pour l'instant !</span>
            </div>
            {rerunButton}
          </div>
        )
      }

      const missedGoals = modAssignments.missedGoals;
      if (missedGoals.length === 0) {
        return (
          <div id={'missed-form'}>
            <div className={'form-row'}>
              <span>Aucune cible manquée lors de la dernière exécution</span>
            </div>
            {rerunButton}
          </div>
        );
      }

      const targetStatRows = missedGoals.map(([targetStat, resultValue], index) =>
        <div className={'form-row'} key={index}>
          <span>{targetStat.stat}</span>
          <span>({targetStat.minimum})-({targetStat.maximum})</span>
          <span>{targetStat.minimum > resultValue ? " ↓ " : " ↑ "}</span>
          <span>{resultValue}</span>
        </div>
      );

      return (
        <div id={'missed-form'}>
          {targetStatRows}
          {rerunButton}
        </div>
      );
    })();

    return <div className={'incremental-optimization'}>
      <div className={'title'}>Optimisation incrémentale</div>
      <hr />
      <div className={'content'}>
        {resultsInner}
      </div>
    </div>;
  }

  runIncrementalCalc() {
    this.saveTarget();
    this.props.optimizeMods();
  }

  saveTarget() {
    const planName = 'lock' !== this.form['plan-name'].value ? this.form['plan-name'].value : 'custom';
    let newTarget;
    let primaryStatRestrictions = {};
    const targetStats = [];
    if (this.form['target-stat-name[]']) {
      const targetStatNames = this.form['target-stat-name[]'] instanceof NodeList ?
        this.form['target-stat-name[]'] :
        [this.form['target-stat-name[]']];
      const targetStatMins = this.form['target-stat-min[]'] instanceof NodeList ?
        this.form['target-stat-min[]'] :
        [this.form['target-stat-min[]']];
      const targetStatMaxes = this.form['target-stat-max[]'] instanceof NodeList ?
        this.form['target-stat-max[]'] :
        [this.form['target-stat-max[]']];
      const targetStatRelativeCharacters = this.form['target-stat-relative-character[]'] instanceof NodeList ?
        this.form['target-stat-relative-character[]'] :
        [this.form['target-stat-relative-character[]']];
      const targetStatTypes = this.form['target-stat-type[]'] instanceof NodeList ?
        this.form['target-stat-type[]'] :
        [this.form['target-stat-type[]']];
      const targetStatsShouldOptimize = this.targetStatsShouldOptimize;

      for (let i = 0; i < targetStatNames.length; i++) {
        const name = targetStatNames[i].value;
        const minimum = isNaN(targetStatMins[i].valueAsNumber) ? 0 : targetStatMins[i].valueAsNumber;
        const maximum = isNaN(targetStatMaxes[i].valueAsNumber) ? 100000000 : targetStatMaxes[i].valueAsNumber;
        const relativeCharacter = targetStatRelativeCharacters[i].value || null;
        const type = targetStatTypes[i].value || null;
        const shouldOptimize = targetStatsShouldOptimize[i].value;

        if (name) {
          if (minimum < maximum) {
            targetStats.push(new TargetStat(name, type, minimum, maximum, relativeCharacter, shouldOptimize));
          } else {
            targetStats.push(new TargetStat(name, type, maximum, minimum, relativeCharacter, shouldOptimize));
          }
        }
      }
    }

    for (let stat of ['arrow', 'triangle', 'circle', 'cross']) {
      if (this.form[`${stat}-primary`].value) {
        primaryStatRestrictions[stat] = this.form[`${stat}-primary`].value;
      }
    }

    if ('advanced' === this.props.editMode) {
      // Formulaire avancé
      newTarget = new OptimizationPlan(
        planName,
        this.form['health-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.health,
        this.form['protection-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.protection,
        this.form['speed-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.speed,
        this.form['critDmg-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.critDmg,
        this.form['potency-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.potency,
        this.form['tenacity-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.tenacity,
        this.form['physDmg-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.physDmg,
        this.form['specDmg-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.specDmg,
        this.form['critChance-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.critChance,
        this.form['armor-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.armor,
        this.form['resistance-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.resistance,
        this.form['accuracy-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.accuracy,
        this.form['critAvoid-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.critAvoid,
        this.form['upgrade-mods'].checked || targetStats.length > 0,
        primaryStatRestrictions,
        this.props.setRestrictions,
        targetStats,
        this.form['use-full-sets'].checked
      );
    } else {
      // Formulaire basique
      newTarget = new OptimizationPlan(
        planName,
        this.form['health-stat'].valueAsNumber,
        this.form['protection-stat'].valueAsNumber,
        this.form['speed-stat'].valueAsNumber,
        this.form['critDmg-stat'].valueAsNumber,
        this.form['potency-stat'].valueAsNumber,
        this.form['tenacity-stat'].valueAsNumber,
        this.form['physDmg-stat'].valueAsNumber,
        this.form['specDmg-stat'].valueAsNumber,
        this.form['critChance-stat'].valueAsNumber,
        this.form['defense-stat'].valueAsNumber / 2,
        this.form['defense-stat'].valueAsNumber / 2,
        this.form['accuracy-stat'].valueAsNumber,
        this.form['critAvoid-stat'].valueAsNumber,
        this.form['upgrade-mods'].checked || targetStats.length > 0,
        primaryStatRestrictions,
        this.props.setRestrictions,
        targetStats,
        this.form['use-full-sets'].checked
      );
    }

    this.props.submitForm(
      this.props.character.baseID,
      this.props.characterIndex,
      newTarget,
      +this.form['mod-dots'].value,
      this.form['slice-mods'].checked
    );
  }
}

const mapStateToProps = (state) => {
  const mods = state.profile.mods;
  return {
    editMode: state.characterEditMode,
    gameSettings: state.gameSettings,
    setRestrictions: state.setRestrictions,
    targetStats: state.targetStats,
    modAssignments: state.profile.modAssignments,
    arrowPrimaries: Array.from(new Set(mods.filter(mod => mod.slot === 'arrow').map(mod => mod.primaryStat.type))),
    trianglePrimaries:
      Array.from(new Set(mods.filter(mod => mod.slot === 'triangle').map(mod => mod.primaryStat.type))),
    circlePrimaries: Array.from(new Set(mods.filter(mod => mod.slot === 'circle').map(mod => mod.primaryStat.type))),
    crossPrimaries: Array.from(new Set(mods.filter(mod => mod.slot === 'cross').map(mod => mod.primaryStat.type))),
    progress: state.progress
  }
};

const mapDispatchToProps = (dispatch) => ({
  cancel: () => {
    dispatch(changeSetRestrictions(null));
    dispatch(changeTargetStats(null));
  },
  hideModal: () => dispatch(hideModal()),
  submitForm: (characterID, characterIndex, target, minimumModDots, sliceMods) => {
    dispatch(changeMinimumModDots(characterID, minimumModDots));
    dispatch(changeSliceMods(characterID, sliceMods));
    dispatch(unlockCharacter(characterID));
    dispatch(finishEditCharacterTarget(characterIndex, target));
  },
  closeForm: () => dispatch(closeEditCharacterForm()),
  resetCharacterTargetToDefault: (characterID, targetName) =>
    dispatch(resetCharacterTargetToDefault(characterID, targetName)),
  deleteTarget: (characterID, targetName) => dispatch(deleteTarget(characterID, targetName)),
  changeCharacterEditMode: (mode) => dispatch(changeCharacterEditMode(mode)),
  populateSetRestrictions: (setRestrictions) => dispatch(changeSetRestrictions(setRestrictions)),
  selectSetBonus: (setBonus) => dispatch(selectSetBonus(setBonus)),
  removeSetBonus: (setBonus) => dispatch(removeSetBonus(setBonus)),
  populateTargetStats: (targetStats) => dispatch(changeTargetStats(targetStats)),
  addTargetStat: (targetStat) => dispatch(addTargetStat(targetStat)),
  removeTargetStat: (index) => dispatch(removeTargetStat(index)),
  optimizeMods: () => dispatch(optimizeMods()),
});

export default connect(mapStateToProps, mapDispatchToProps)(CharacterEditForm);
