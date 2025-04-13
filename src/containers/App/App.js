// @flow

import React, { PureComponent } from 'react';
import './boilerplate.css';
import './App.css';
import OptimizerView from "../OptimizerView/OptimizerView";
import ExploreView from "../ExploreView/ExploreView";
import FileInput from "../../components/FileInput/FileInput";
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
import Help from '../../components/Help/Help';
import { Dropdown } from '../../components/Dropdown/Dropdown';

class App extends PureComponent {

  constructor(props) {
    super(props);

    // Si un code d'alliance est passé dans l'URL, récupérer immédiatement les données pour ce code
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

    // Supprimer la chaîne de requête après lecture des informations nécessaires.
    window.history.replaceState({}, document.title, document.location.href.split('?')[0]);

    // Vérifier la version actuelle de l'application par rapport à l'API
    props.checkVersion();
  }

  escapeListener = function (e) {
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
    // Dès que nous obtenons un profil, vérifier si la version précédente nécessite d'afficher le journal des modifications
    if ((this.props.previousVersion < '1.8') && (!prevProps.profile && this.props.profile)) {
      this.props.showModal('changelog-modal', this.changeLogModal());
    }
  }

  /**
   * Lit un fichier en entrée et transmet son contenu à une autre fonction pour traitement
   * @param fileInput Le fichier téléchargé
   * @param handleResult Function string => *
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
    const instructionsScreen = !this.props.profile;

    return <div className={'App'}>
      {this.header(!instructionsScreen)}
      <div className={'app-body'}>
        {instructionsScreen && this.welcome()}
        {!instructionsScreen && 'explore' === this.props.section &&
          <ExploreView />
        }
        {!instructionsScreen && 'optimize' === this.props.section &&
          <OptimizerView />
        }
        <FlashMessage />
        <ErrorModal />
        <Modal show={this.props.displayModal}
          className={this.props.modalClass}
          content={this.props.modalContent}
          cancelable={this.props.isModalCancelable} />
        <Spinner show={this.props.isBusy} />
      </div>
      {this.footer()}
    </div>;
  }

  /**
   * Affiche l'en-tête de l'application, en affichant éventuellement les boutons de navigation et un bouton de réinitialisation
   * @param showActions bool Si vrai, affiche les boutons "Explorer" et "Optimiser" ainsi que le bouton "Réinitialiser l'Optimiseur de Mods"
   * @returns JSX Element
   */
  header(showActions) {
    let allyCodyInput;

    return <header className={'App-header'}>
      <h1 className={'App-title'}>
        Bricol's Mods Optimizer <span className="subtitle">Star Wars: Galaxy of Heroes™</span>
      </h1>
      {showActions &&
        <nav>
          <button className={'explore' === this.props.section ? 'active' : ''}
            onClick={() => this.props.changeSection('explore')}>Explorer mes mods
          </button>
          <button className={'optimize' === this.props.section ? 'active' : ''}
            onClick={() => this.props.changeSection('optimize')}>Optimiser mes mods
          </button>
        </nav>
      }
      <div className={'actions'}>
        <label htmlFor={'ally-code'}>{this.props.allyCode ? 'Joueur' : 'Code d’alliance'}:</label>
        {/* S'il n'y a pas de code d'alliance actif, afficher le champ de saisie */}
        {!this.props.allyCode &&
          <input id={'ally-code'} type={'text'} inputMode={'numeric'} size={12} ref={input => allyCodyInput = input}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                this.props.refreshPlayerData(e.target.value, this.props.keepOldMods, null);
              }
              // Ne pas modifier la saisie si l'utilisateur essaie de sélectionner
              if (window.getSelection().toString() !== '') {
                return;
              }
              // Ne pas modifier la saisie si l'utilisateur appuie sur les touches fléchées
              if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
                return;
              }

              // Formater le champ de saisie
              e.target.value = formatAllyCode(e.target.value);
            }}
          />
        }
        {/* S'il y a un code d'alliance actif, afficher un menu déroulant */}
        {this.props.allyCode &&
          <Dropdown
            id={'ally-code'}
            value={this.props.allyCode}
            onChange={e => {
              if ('' === e.target.value) {
                this.props.showModal('', this.addAllyCodeModal());
              } else {
                this.props.switchProfile(e.target.value);
              }
            }}>
            {Object.entries(this.props.playerProfiles).map(([allyCode, playerName]) =>
              <option key={allyCode} value={allyCode}>{playerName}</option>
            )}
            <option key={'new'} value={''}>Nouveau code...</option>
          </Dropdown>
        }
        {this.props.allyCode &&
          <button type={'button'}
            className={'red'}
            onClick={() => this.props.showModal('', this.deleteAllyCodeModal())}
          >
            X
          </button>
        }
        <div className="fetch-actions">
          <button type={'button'}
            onClick={() => {
              this.props.refreshPlayerData(
                this.props.allyCode || allyCodyInput.value,
                this.props.keepOldMods,
                null
              );
            }}>
            Récupérer mes données !
          </button>
          <button
            type={'button'}
            disabled={!(
              this.props.hotUtilsSubscription &&
              this.props.profile &&
              this.props.profile.hotUtilsSessionId
            )}
            onClick={() => {
              if (this.props.hotUtilsSubscription && this.props.profile.hotUtilsSessionId) {
                this.props.showModal('pull-unequipped-modal', this.fetchUnequippedModal())
              }
            }}>
            Récupérer avec HotUtils
          </button>
          <Help header={'Comment récupérer les mods non équipés ?'}>{this.unequippedModsHelp()}</Help>
          <div className="form-item">
            <input id={'keep-old-mods'}
              name={'keep-old-mods'}
              type={'checkbox'}
              value={'keep-old-mods'}
              checked={this.props.keepOldMods}
              onChange={() => this.props.toggleKeepOldMods()}
            />
            <label htmlFor={'keep-old-mods'}>Conserver les mods existants</label>
          </div>
        </div>
        <div className="state-actions">
          <FileInput label={'Restaurer ma progression'} handler={(file) => this.readFile(file, this.props.restoreProgress)} />
          {showActions &&
            <button type={'button'} onClick={() => {
              this.props.exportDatabase(progressData => {
                progressData.version = this.props.version;
                progressData.allyCode = this.props.allyCode;

                // Supprimer l'ID de session HotUtils de la sortie
                progressData.profiles.forEach(profile => delete profile.hotUtilsSessionId)

                const progressDataSerialized = JSON.stringify(progressData);
                const userData = new Blob([progressDataSerialized], { type: 'application/json;charset=utf-8' });
                saveAs(userData, `modsOptimizer-${(new Date()).toISOString().slice(0, 10)}.json`);
              });
            }}>
              Enregistrer ma progression
            </button>
          }
          {showActions &&
            <button type={'button'} className={'red'}
              onClick={() => this.props.showModal('reset-modal', this.resetModal())}>
              Réinitialiser l'Optimiseur de Mods
            </button>
          }
        </div>
      </div>
    </header>;
  }

  /**
   * Affiche le pied de page de l'application
   * @returns JSX Element
   */
  footer() {
    return <footer className={'App-footer'}>
      Star Wars: Galaxy of Heroes™ appartient à EA et Capital Games. Ce site n'est pas affilié à ces sociétés.<br />
      <a href={'https://github.com/grandivory/mods-optimizer'} target={'_blank'} rel={'noopener noreferrer'}>
        Contribuer
      </a>
      &nbsp;|&nbsp;
      Demandez de l'aide ou laissez vos commentaires sur <a href={'https://discord.gg/WFKycSm'} target={'_blank'} rel={'noopener noreferrer'}>
        Discord
      </a>
      &nbsp;| Vous aimez l'outil ? Pensez à faire un don pour soutenir le développeur !&nbsp;
      <a href={'https://paypal.me/grandivory'} target={'_blank'} rel={'noopener noreferrer'} className={'gold'}>
        Paypal
      </a>
      &nbsp;ou&nbsp;
      <a href={'https://www.patreon.com/grandivory'} target={'_blank'} rel={'noopener noreferrer'} className={'gold'}>
        Patreon
      </a>
      <div className={'version'}>
        <button className={'link'} onClick={() => this.props.showModal('changelog-modal', this.changeLogModal())}>
          version {this.props.version}
        </button>
      </div>
    </footer>;
  }

  /**
   * Affiche l'écran d'accueil pour un premier accès à l'application
   * @returns JSX Element
   */
  welcome() {
    return <div className={'welcome'}>
      <h2>Bienvenue sur l'Optimiseur de Mods de Grandivory modifié par Bricol pour Star Wars: Galaxy of Heroes™ !</h2>
      <p>
        Cette application vous permettra d'équiper l'ensemble optimal de mods sur chacun de vos personnages en attribuant
		une valeur à chaque statistique qu'un mod peut conférer. Vous indiquerez une liste de personnages à optimiser ainsi
		que les statistiques recherchées, et l'outil déterminera les meilleurs mods à équiper, personnage par personnage,
		jusqu'à épuisement de votre liste.
	  </p>
      <p>
        Pour démarrer, saisissez votre code d’alliance dans le champ en haut et cliquez sur "Récupérer mes données !".
		Notez que vos mods ne seront mis à jour qu'une fois par heure au maximum.											
      </p>
    </div>;
  }

  /**
   * Affiche une fenêtre modale décrivant les changements par rapport à la version précédente, et les actions à entreprendre par l'utilisateur.
   * @returns JSX Element
   */
  changeLogModal() {
    return <div>
      <h2 className={'gold'}>L'Optimiseur de Mods de Grandivory 1.8.53 develop a été forké par Bricol  !</h2>
      <h3>Voici un résumé des changements apportés dans cette version :</h3>
      <ul>
        <li>
          Intégration mise à jour avec <a href={'https://www.hotutils.com'} target={'_blank'} rel={'noopener noreferrer'}>HotUtils</a> en version 2 ! Cela apporte de nombreux avantages aux abonnés comme aux non-abonnés.
		  Tous les joueurs peuvent désormais récupérer leurs données de mods <strong>aussi souvent qu'ils le souhaitent</strong>, sans période de repos entre les récupérations ! Un abonnement HotUtils est toujours requis pour récupérer les mods non équipés.																	  
		  Une barre de progression est également désormais affichée lors du déplacement de vos mods en jeu via HotUtils																											 
		  et cette opération peut être annulée à tout moment !																											
        </li>
      </ul>
      <h3>Bon modding !</h3>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>OK</button>
      </div>
    </div>;
  }

  /**
   * Affiche le modal "Êtes-vous sûr ?" pour réinitialiser l'application
   * @returns JSX Element
   */
  resetModal() {
    return <div>
      <h2>Réinitialiser l'Optimiseur de Mods ?</h2>
      <p>
        Si vous cliquez sur "Réinitialiser", toutes les données actuellement enregistrées par l'application – vos mods,
        la configuration des personnages, la sélection des personnages, etc. – seront supprimées.
        Êtes-vous sûr de vouloir procéder ?
      </p>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} className={'red'} onClick={() => this.props.reset()}>Réinitialiser</button>
      </div>
    </div>;
  }

  /**
   * Affiche un modal avec un formulaire pour ajouter un nouveau code d'alliance
   */
  addAllyCodeModal() {
    let allyCodeInput;

    return <div className={'add-ally-code-form'}>
      <h4>Ajouter un nouveau code d'alliance</h4>
      <label htmlFor={'new-ally-code'}>Code d'alliance : </label>
      <input id={'new-ally-code'} type={'text'} inputMode={'numeric'} size={13} ref={input => allyCodeInput = input}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            this.props.hideModal();
            this.props.refreshPlayerData(e.target.value, false, null);
          }
          // Ne pas modifier la saisie si l'utilisateur essaie de sélectionner
          if (window.getSelection().toString() !== '') {
            return;
          }
          // Ne pas modifier la saisie si l'utilisateur appuie sur les touches fléchées
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            return;
          }

          // Formater le champ de saisie
          e.target.value = formatAllyCode(e.target.value);
        }}
      />
      <div className={'actions'}>
        <button type={'button'}
          onClick={() => {
            this.props.hideModal();
            this.props.refreshPlayerData(allyCodeInput.value, false, null);
          }}>
          Récupérer mes données !
        </button>
      </div>
    </div>
  }

  /**
   * Affiche le modal "Êtes-vous sûr ?" pour supprimer un code d'alliance
   */
  deleteAllyCodeModal() {
    return <div>
      <h2>Supprimer <strong>{formatAllyCode(this.props.allyCode)}</strong> ?</h2>
      <p>Cela supprimera le code d'alliance, ainsi que tous les mods, la sélection de personnages et les cibles associés.</p>
      <p>Vous pourrez restaurer les données en réimportant ce code.</p>
      <p>Êtes-vous sûr de vouloir supprimer ce code ?</p>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.props.hideModal()}>Annuler</button>
        <button type={'button'} className={'red'}
          onClick={() => {
            this.props.hideModal();
            this.props.deleteProfile(this.props.allyCode);
          }}>
          Supprimer
        </button>
      </div>
    </div>;
  }

  /**
   * Affiche un modal indiquant que la récupération des mods non équipés via HotUtils vous déconnectera du jeu
   */
  fetchUnequippedModal() {
    return <div key={'hotutils-move-mods-modal'}>
      <h2>Récupérer vos mods non équipés via HotUtils</h2>
      <p>
        Cela récupérera toutes vos données, y compris les mods non équipés, en utilisant HotUtils.
        Veuillez noter que <strong className={'gold'}>
          cette action vous déconnectera de Galaxy of Heroes si vous y êtes connecté
        </strong>.
      </p>
      <p>
        <strong>Utilisez cette fonctionnalité à vos risques et périls !</strong> La fonctionnalité HotUtils contrevient aux conditions d'utilisation de Star Wars:
        Galaxy of Heroes. Vous assumez l'entière responsabilité en l'utilisant. L'Optimiseur de Mods de Grandivory n'est pas associé à HotUtils.
      </p>
      <div className={'actions'}>
        <button type={'button'} className={'red'} onClick={this.props.hideModal}>Annuler</button>
        <button type={'button'} onClick={() => {
          this.props.hideModal();
          this.props.refreshPlayerData(
            this.props.allyCode,
            this.props.keepOldMods,
            this.props.profile.hotUtilsSessionId,
            true
          );
        }}>
          Récupérer mes données
        </button>
      </div>
    </div>;
  }

  /**
   * Affiche une aide concernant la récupération des mods non équipés avec HotUtils
   */
  unequippedModsHelp() {
    return <div className={'help'}>
      <p>
        HotUtils est un autre outil pour SWGOH qui permet de modifier directement votre compte. Un de ses avantages, pour les abonnés,
        est de pouvoir récupérer toutes vos données de mods, y compris les mods non équipés, à tout moment, sans limitation d'intervalle..
		 Normalement, vos données de joueur et de mods ne peuvent être actualisées qu'une fois par heure																											  
      </p>
      <p>
        <strong>Utilisez cette fonctionnalité à vos risques et périls !</strong> Elle contrevient aux conditions d'utilisation de Star Wars:
        Galaxy of Heroes. Vous assumez l'entière responsabilité en l'utilisant. L'Optimiseur de Mods de Grandivory n'est pas associé à HotUtils.
      </p>
      <p><a href={'https://www.hotutils.com/'} target={'_blank'} rel={'noopener noreferrer'}>
        https://www.hotutils.com/
      </a></p>
      <p><img className={'fit'} src={'/img/hotsauce512.png'} alt={'hotsauce'} /></p>
    </div>;
  }
}

const mapStateToProps = (state) => {
  const appProps = {
    allyCode: state.allyCode,
    error: state.error,
    isBusy: state.isBusy,
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
  changeSection: newSection => dispatch(changeSection(newSection)),
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
