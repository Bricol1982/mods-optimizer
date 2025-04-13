// @flow
import React, { PureComponent } from 'react';
import './boilerplate.css';
import './App.css';
import OptimizerView from "../OptimizerView/OptimizerView";
import ExploreView from "../ExploreView/ExploreView";
import Modal from "../../components/Modal/Modal";
import Spinner from "../../components/Spinner/Spinner";
import { connect } from "react-redux";
import formatAllyCode from "../../utils/formatAllyCode";
import ErrorModal from "../ErrorModal/ErrorModal";
import {
  changeSection,
  deleteProfile,
  hideModal,
  reset,
  restoreProgress,
  showError,
  showModal
} from "../../state/actions/app";
import { checkVersion, refreshPlayerData, toggleKeepOldMods, setHotUtilsSessionId } from "../../state/actions/data";
import FlashMessage from "../../components/Modal/FlashMessage";
import { saveAs } from 'file-saver';
import { exportDatabase, loadProfile } from "../../state/actions/storage";
import { Dropdown } from '../../components/Dropdown/Dropdown';
import SyncLogo from '../../components/SyncLogo/SyncLogo';
import SaveProgressButton from '../../components/SaveProgressButton/SaveProgressButton';
import RestoreProgressButton from '../../components/RestoreProgressButton/RestoreProgressButton';
import ResetOptimizerButton from '../../components/ResetOptimizerButton/ResetOptimizerButton';
import HotutilsMenuButton from '../../components/HotutilsMenuButton/HotutilsMenuButton';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'; // Ajoutez le CSS pour que les infobulles s'affichent correctement
class App extends PureComponent {

  constructor(props) {
    super(props);

    // Récupérer les paramètres d'URL pour un éventuel code d'alliance
    const queryParams = new URLSearchParams(document.location.search);
    if (queryParams.has('allyCode')) {
      if (queryParams.has('SessionID') && queryParams.has('NoPull')) {
        props.setHotUtilsSessionId(queryParams.get('allyCode'), queryParams.get('SessionID'));
      } else if (queryParams.has('SessionID')) {
        props.refreshPlayerData(queryParams.get('allyCode'), true, queryParams.get('SessionID'), false);
      } else if (!queryParams.has('NoPull')) {
        props.refreshPlayerData(queryParams.get('allyCode'), true, null);
      }
    }
    // Supprimer la chaîne de requête après lecture
    window.history.replaceState({}, document.title, document.location.href.split('?')[0]);

    // Vérifier la version de l'application
    props.checkVersion();
  }

  escapeListener = function(e) {
    if (e.key === 'Escape' && this.props.isModalCancelable) {
      this.props.hideModal();
    }
  }.bind(this);

  componentDidMount() {
    document.addEventListener('keyup', this.escapeListener);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.escapeListener);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Afficher le changelog si le profil est chargé et que la version précédente est inférieure à 1.8
    if ((this.props.previousVersion < '1.8') && (!prevProps.profile && this.props.profile)) {
      this.props.showModal('changelog-modal', this.changeLogModal());
    }
  }

  render() {
    const instructionsScreen = !this.props.profile;
    return (
      <div className="App">
        {this.header(!instructionsScreen)}
        <div className="app-body">
          {instructionsScreen && this.welcome()}
          {!instructionsScreen && this.props.section === 'explore' && <ExploreView />}
          {!instructionsScreen && this.props.section === 'optimize' && <OptimizerView />}
          <FlashMessage />
          <ErrorModal />
          <Modal
            show={this.props.displayModal}
            className={this.props.modalClass}
            content={this.props.modalContent}
            cancelable={this.props.isModalCancelable}
          />
          <Spinner show={this.props.isBusy} />
        </div>
        {this.footer()}
      </div>
    );
  }

  header(showActions) {
    let allyCodyInput;
    return (
      <header className="App-header">
        <h1 className="App-title" title="Application Optimiseur de Mods">
          Bricol's Mods Optimizer <span className="subtitle">Star Wars: Galaxy of Heroes™</span>
        </h1>
  
        {showActions && (
          <div className="actions-container">
            {/* Fusion des actions dans une seule barre */}
            <nav className="actions-bar">
              {/* Navigation principale */}
              <div className="nav-section">
                <button
                  className={this.props.section === 'explore' ? 'active' : ''}
                  onClick={() => this.props.changeSection('explore')}
                  data-tip="Basculer sur Explorer mes mods"
                >
                  Explorer mes mods
                </button>
                <button
                  className={this.props.section === 'optimize' ? 'active' : ''}
                  onClick={() => this.props.changeSection('optimize')}
                  data-tip="Basculer sur Optimiser mes mods"
                >
                  Optimiser mes mods
                </button>
              </div>
  
              {/* Section code d'alliance et actions associées */}
              <div className="ally-code-section">
                <label htmlFor="ally-code" data-tip="Votre code d’alliance">
                  {this.props.allyCode ? 'Joueur' : 'Code d’alliance'}:
                </label>
                {!this.props.allyCode && (
                  <input
                    id="ally-code"
                    type="text"
                    inputMode="numeric"
                    size={12}
                    ref={(input) => (allyCodyInput = input)}
                    onKeyUp={(e) => {
                      if (e.key === 'Enter') {
                        this.props.refreshPlayerData(e.target.value, this.props.keepOldMods, null);
                      }
                      if (window.getSelection().toString() !== '') return;
                      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
                      e.target.value = formatAllyCode(e.target.value);
                    }}
                    data-tip="Saisissez ou modifiez votre code d’alliance"
                  />
                )}
                {this.props.allyCode && (
                  <Dropdown
                    id="ally-code"
                    value={this.props.allyCode}
                    onChange={(e) => {
                      if ('' === e.target.value) {
                        this.props.showModal('', this.addAllyCodeModal());
                      } else {
                        this.props.switchProfile(e.target.value);
                      }
                    }}
                    data-tip="Sélectionnez votre profil"
                  >
                    {Object.entries(this.props.playerProfiles).map(([allyCode, playerName]) => (
                      <option key={allyCode} value={allyCode}>
                        {playerName}
                      </option>
                    ))}
                    <option key="new" value="">
                      Nouveau code...
                    </option>
                  </Dropdown>
                )}
                {this.props.allyCode && (
                  <button
                    type="button"
                    className="red"
                    onClick={() => this.props.showModal('', this.deleteAllyCodeModal())}
                    data-tip="Supprimer ce code d'alliance"
                  >
                    X
                  </button>
                )}
              </div>
  
              {/* Synchronisation */}
              <div className="sync-actions">
                <SyncLogo
                  syncing={this.props.isBusy}
                  onClick={() => {
                    this.props.refreshPlayerData(
                      this.props.allyCode || allyCodyInput.value,
                      this.props.keepOldMods,
                      null
                    );
                  }}
                  data-tip="Synchroniser vos données avec le serveur"
                />
              </div>
  
              {/* Actions de progression */}
              <div className="state-actions">
                <RestoreProgressButton
                  restoring={this.props.isRestoring}
                  onClick={() => {
                    document.getElementById("restore-progress-input").click();
                  }}
                  data-tip="Charger la progression sauvegardée"
                />
                <input
                  type="file"
                  id="restore-progress-input"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      this.readFile(e.target.files[0], this.props.restoreProgress);
                    }
                  }}
                />
                <SaveProgressButton
                  saving={this.props.isSaving}
                  onClick={() => {
                    this.props.exportDatabase((progressData) => {
                      progressData.version = this.props.version;
                      progressData.allyCode = this.props.allyCode;
                      progressData.profiles.forEach((profile) => delete profile.hotUtilsSessionId);
                      const progressDataSerialized = JSON.stringify(progressData);
                      const userData = new Blob([progressDataSerialized], {
                        type: 'application/json;charset=utf-8'
                      });
                      saveAs(userData, `modsOptimizer-${(new Date()).toISOString().slice(0, 10)}.json`);
                    });
                  }}
                  data-tip="Télécharger la progression sauvegardée"
                />
                {showActions && (
                  <>
                    <ResetOptimizerButton
                      onClick={() => this.props.showModal('reset-modal', this.resetModal())}
                      data-tip="Réinitialiser les données de l'application"
                    />
                    <HotutilsMenuButton
                      onRetrieveHotUtils={() => {
                        if (
                          this.props.hotUtilsSubscription &&
                          this.props.profile &&
                          this.props.profile.hotUtilsSessionId
                        ) {
                          this.props.showModal('pull-unequipped-modal', this.fetchUnequippedModal());
                        }
                      }}
                      keepOldMods={this.props.keepOldMods}
                      onToggleKeepOldMods={() => this.props.toggleKeepOldMods()}
                      data-tip="Accéder au menu HotUtils"
                    />
                  </>
                )}
              </div>
            </nav>
  
            {/* ReactTooltip pour gérer les infobulles */}
            <Tooltip place="top" effect="solid" />
          </div>
        )}
      </header>
    );
  }
  
 footer() {
    return (
      <footer className="App-footer">
        Star Wars: Galaxy of Heroes™ appartient à EA et Capital Games. Ce site n'est pas affilié à ces sociétés.<br />
        <a
          href="https://github.com/grandivory/mods-optimizer"
          target="_blank"
          rel="noopener noreferrer"
          title="Contribuer au projet"
        >
          Contribuer
        </a>
        &nbsp;|&nbsp;
        Demandez de l'aide ou laissez vos commentaires sur{" "}
        <a
          href="https://discord.gg/WFKycSm"
          target="_blank"
          rel="noopener noreferrer"
          title="Rejoindre le Discord"
        >
          Discord
        </a>
        &nbsp;| Vous aimez l'outil ? Pensez à faire un don pour soutenir le développeur !&nbsp;
        <a
          href="https://paypal.me/grandivory"
          target="_blank"
          rel="noopener noreferrer"
          className="gold"
          title="Faire un don via Paypal"
        >
          Paypal
        </a>
        &nbsp;ou&nbsp;
        <a
          href="https://www.patreon.com/grandivory"
          target="_blank"
          rel="noopener noreferrer"
          className="gold"
          title="Soutenir via Patreon"
        >
          Patreon
        </a>
        <div className="version">
          <button
            className="link"
            onClick={() => this.props.showModal('changelog-modal', this.changeLogModal())}
            title="Afficher le changelog"
          >
            version {this.props.version}
          </button>
        </div>
      </footer>
    );
  }

  welcome() {
    return (
      <div className="welcome">
        <h2 title="Accueil">Bienvenue sur l'Optimiseur de Mods de Grandivory modifié par Bricol pour Star Wars: Galaxy of Heroes™ !</h2>
        <p title="Présentation de l'application">
          Cette application vous permettra d'équiper l'ensemble optimal de mods sur chacun de vos personnages en attribuant
          une valeur à chaque statistique qu'un mod peut conférer. Vous indiquerez une liste de personnages à optimiser ainsi
          que les statistiques recherchées, et l'outil déterminera les meilleurs mods à équiper, personnage par personnage,
          jusqu'à épuisement de votre liste.
        </p>
        <p title="Instructions">
          Pour démarrer, saisissez votre code d’alliance dans le champ en haut et cliquez sur "Récupérer mes données !".
          Notez que vos mods ne seront mis à jour qu'une fois par heure au maximum.
        </p>
      </div>
    );
  }

  changeLogModal() {
    return (
      <div>
        <h2 className="gold" title="Changelog">
          L'Optimiseur de Mods de Grandivory 1.8.53 develop a été forké par Bricol !
        </h2>
        <h3 title="Résumé des changements">Voici un résumé des changements apportés dans cette version :</h3>
        <ul>
          <li title="Nouvelle intégration HotUtils">
            Intégration mise à jour avec{" "}
            <a href="https://www.hotutils.com" target="_blank" rel="noopener noreferrer" title="Accéder à HotUtils">
              HotUtils
            </a>{" "}
            en version 2 ! Vos données de mods sont désormais récupérées sans limitation temporelle, avec une barre de
            progression lors des déplacements de mods.
          </li>
        </ul>
        <h3 title="Bon modding">Bon modding !</h3>
        <div className="actions">
          <button type="button" onClick={() => this.props.hideModal()} title="Fermer le changelog">
            OK
          </button>
        </div>
      </div>
    );
  }

  resetModal() {
    return (
      <div>
        <h2 title="Réinitialiser">Réinitialiser l'Optimiseur de Mods ?</h2>
        <p title="Attention">
          Si vous cliquez sur "Réinitialiser", toutes les données actuellement enregistrées par l'application (mods,
          configurations, etc.) seront supprimées. Êtes-vous sûr de vouloir procéder ?
        </p>
        <div className="actions">
          <button type="button" onClick={() => this.props.hideModal()} title="Annuler">
            Annuler
          </button>
          <button type="button" className="red" onClick={() => this.props.reset()} title="Confirmer la réinitialisation">
            Réinitialiser
          </button>
        </div>
      </div>
    );
  }

  addAllyCodeModal() {
    let allyCodeInput;
    return (
      <div className="add-ally-code-form">
        <h4 title="Ajouter un code d'alliance">Ajouter un nouveau code d'alliance</h4>
        <label htmlFor="new-ally-code" title="Code d'alliance">Code d'alliance :</label>
        <input
          id="new-ally-code"
          type="text"
          inputMode="numeric"
          size={13}
          ref={(input) => (allyCodeInput = input)}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              this.props.hideModal();
              this.props.refreshPlayerData(e.target.value, false, null);
            }
            if (window.getSelection().toString() !== '') return;
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
            e.target.value = formatAllyCode(e.target.value);
          }}
          title="Saisissez le nouveau code d'alliance"
        />
        <div className="actions">
          <button type="button" onClick={() => {
            this.props.hideModal();
            this.props.refreshPlayerData(allyCodeInput.value, false, null);
          }} title="Charger ce code">
            Récupérer mes données !
          </button>
        </div>
      </div>
    );
  }

  deleteAllyCodeModal() {
    return (
      <div>
        <h2 title="Supprimer le code">
          Supprimer <strong>{formatAllyCode(this.props.allyCode)}</strong> ?
        </h2>
        <p title="Attention à la suppression">
          Cela supprimera le code d'alliance ainsi que toutes les données associées.
        </p>
        <p title="Confirmation">Êtes-vous sûr de vouloir procéder ?</p>
        <div className="actions">
          <button type="button" onClick={() => this.props.hideModal()} title="Annuler">
            Annuler
          </button>
          <button
            type="button"
            className="red"
            onClick={() => {
              this.props.hideModal();
              this.props.deleteProfile(this.props.allyCode);
            }}
            title="Supprimer définitivement ce code"
          >
            Supprimer
          </button>
        </div>
      </div>
    );
  }

  fetchUnequippedModal() {
    return (
      <div key="hotutils-move-mods-modal">
        <h2 title="Récupérer les mods non équipés">Récupérer vos mods non équipés via HotUtils</h2>
        <p title="Information">
          Cette action récupérera toutes vos données, y compris les mods non équipés, en utilisant HotUtils.
          Notez que vous serez déconnecté du jeu si vous y êtes connecté.
        </p>
        <p title="Attention">
          <strong>Attention :</strong> cette fonctionnalité contrevient aux conditions d'utilisation de Star Wars: Galaxy
          of Heroes.
        </p>
        <div className="actions">
          <button type="button" className="red" onClick={this.props.hideModal} title="Annuler">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              this.props.hideModal();
              this.props.refreshPlayerData(
                this.props.allyCode,
                this.props.keepOldMods,
                this.props.profile.hotUtilsSessionId,
                true
              );
            }}
            title="Récupérer les mods via HotUtils"
          >
            Récupérer mes données
          </button>
        </div>
      </div>
    );
  }

  unequippedModsHelp() {
    return (
      <div className="help" title="Aide pour HotUtils">
        <p>
          HotUtils permet de récupérer toutes vos données de mods, y compris les mods non équipés, à tout moment,
          sans limitation. Utilisez cette fonctionnalité à vos risques et périls.
        </p>
        <p>
          <a href="https://www.hotutils.com/" target="_blank" rel="noopener noreferrer" title="Visiter HotUtils">
            https://www.hotutils.com/
          </a>
        </p>
        <p>
          <img className="fit" src="/img/hotsauce512.png" alt="hotsauce" title="Logo Hotutils" />
        </p>
      </div>
    );
  }

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
}

const mapStateToProps = (state) => {
  const appProps = {
    allyCode: state.allyCode,
    error: state.error,
    isBusy: state.isBusy,
    isSaving: state.isSaving,
    isRestoring: state.isRestoring,
    keepOldMods: state.keepOldMods,
    displayModal: !!state.modal,
    modalClass: state.modal ? state.modal.class : '',
    modalContent: state.modal ? state.modal.content : '',
    isModalCancelable: state.modal && state.modal.cancelable,
    playerProfiles: state.playerProfiles,
    previousVersion: state.previousVersion,
    section: state.section,
    version: state.version,
    hotUtilsSubscription: state.hotUtilsSubscription
  };

  if (state.profile) {
    appProps.profile = state.profile;
  }
  return appProps;
};

const mapDispatchToProps = (dispatch) => ({
  changeSection: (newSection) => dispatch(changeSection(newSection)),
  refreshPlayerData: (allyCode, keepOldMods, sessionId, useSession = true) =>
    dispatch(refreshPlayerData(allyCode, keepOldMods, sessionId, useSession)),
  setHotUtilsSessionId: (allyCode, sessionId) => dispatch(setHotUtilsSessionId(allyCode, sessionId)),
  checkVersion: () => dispatch(checkVersion()),
  showModal: (clazz, content) => dispatch(showModal(clazz, content)),
  hideModal: () => dispatch(hideModal()),
  showError: (message) => dispatch(showError(message)),
  toggleKeepOldMods: () => dispatch(toggleKeepOldMods()),
  reset: () => dispatch(reset()),
  restoreProgress: (progressData) => dispatch(restoreProgress(progressData)),
  switchProfile: (allyCode) => dispatch(loadProfile(allyCode)),
  deleteProfile: (allyCode) => dispatch(deleteProfile(allyCode)),
  exportDatabase: (callback) => dispatch(exportDatabase(callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
