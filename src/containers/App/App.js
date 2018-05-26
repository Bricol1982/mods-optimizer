import React, {Component} from 'react';
import StatClassifier from '../../utils/StatClassifier';
import '../boilerplate.css';
import './App.css';
import Mod from "../../domain/Mod";
import OptimizerView from "../OptimizerView/OptimizerView";
import ExploreView from "../ExploreView/ExploreView";
import FileInput from "../../components/FileInput/FileInput";
import FileDropZone from "../../components/FileDropZone/FileDropZone";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.state.view = 'optimize';
    this.state.mods = [];

    let savedMods = window.localStorage.getItem('optimizer.mods');
    if (savedMods) {
      this.state.mods = this.processMods(JSON.parse(savedMods));
    }
  }

  /**
   * Saves the application state to localStorage
   */
  saveState() {
    window.localStorage.setItem('optimizer.mods', JSON.stringify(this.state.mods.map(mod => mod.serialize())));
  }

  /**
   * File handler to process an input file containing mod data.
   *
   * @param fileInput The uploaded mods file
   */
  readModsFile(fileInput) {
    let reader = new FileReader();

    reader.onload = (event) => {
      const mods = this.processMods(JSON.parse(event.target.result));

      this.setState({
        'mods': mods
      });

      this.saveState();
    };

    reader.readAsText(fileInput);
  }

  /**
   * Given the input from a file exported from the Mods Manager Importer, read mods into memory in the format
   * used by this application
   *
   * @param fileInput array The parsed contents of the file generated by the Mods Manager Importer
   *
   * @return Array[Mod]
   */
  processMods(fileInput) {
    let mods = [];

    for (let fileMod of fileInput) {
      mods.push(Mod.deserialize(fileMod));
    }

    const statClassifier = new StatClassifier(this.calculateStatCategoryRanges(mods));
    for (let mod of mods) {
      mod.classifyStats(statClassifier);
    }

    return mods;
  }

  /**
   * For each type of secondary stat on a mod, calculate the minimum and maximum values found
   *
   * @param mods array
   * @returns object An object with a property for each secondary stat type, with values of "min" and "max"
   */
  calculateStatCategoryRanges(mods) {
    let allStats = [];
    let statGroups = {};
    let statRanges = {};

    // Collect all stat values on all mods
    for (let mod of mods) {
      allStats = allStats.concat(mod.secondaryStats);
    }

    // Group the stat values by the stat type
    for (let stat of allStats) {
      if ('undefined' !== typeof statGroups[stat.type]) {
        statGroups[stat.type].push(stat.value);
      } else {
        statGroups[stat.type] = [stat.value];
      }
    }

    // Find the minimum and maximum of each stat type
    for (let type in statGroups) {
      statRanges[type] = statGroups[type].reduce(
        (minMax, statValue) => {
          if (statValue < minMax.min) {
            minMax.min = statValue;
          }
          if (statValue > minMax.max) {
            minMax.max = statValue;
          }
          return minMax;
        },
        {'min': Infinity, 'max': 0}
      );
    }

    return statRanges;
  }

  render() {
    const instructionsScreen = 0 === this.state.mods.length;

    return (
      <div className={'App'}>
        {this.header(!instructionsScreen)}
        <div className={'app-body'}>
          {instructionsScreen && this.welcome()}
          {!instructionsScreen && 'explore' === this.state.view &&
          <ExploreView mods={this.state.mods} saveState={this.saveState.bind(this)}/>
          }
          {!instructionsScreen && 'optimize' === this.state.view &&
          <OptimizerView mods={this.state.mods} saveState={this.saveState.bind(this)}/>
          }
          {this.state.reset && this.resetModal()}
        </div>
        <footer className={'App-footer'}>
          Star Wars: Galaxy of Heroes™ is owned by EA and Capital Games. This site is not affiliated with them.
        </footer>
      </div>
    );
  }

  /**
   * Update the view to show a particular page.
   *
   * @param pageName string The page to show
   */
  showPage(pageName) {
    this.setState({'view': pageName});
  }

  /**
   * Renders the header for the application, optionally showing navigation buttons and a reset button
   * @param showActions bool If true, render the "Explore" and "Optimize" buttons and the "Reset Mods Optimizer" button
   * @returns JSX Element
   */
  header(showActions) {
    return <header className={'App-header'}>
      <h1 className={'App-title'}>Grandivory's Mod Optimizer for Star Wars: Galaxy of Heroes™</h1>
      {showActions &&
      <nav>
        <button className={'explore' === this.state.view ? 'active' : ''}
                onClick={this.showPage.bind(this, 'explore')}>Explore my mods
        </button>
        <button className={'optimize' === this.state.view ? 'active' : ''}
                onClick={this.showPage.bind(this, 'optimize')}>Optimize my mods
        </button>
      </nav>
      }
      <div className={'actions'}>
        <FileInput label={'Upload my mods!'} handler={this.readModsFile.bind(this)}/>
        {showActions &&
        <button type={'button'} className={'red'} onClick={() => this.setState({'reset': true})}>
          Reset Mods-Optimizer
        </button>
        }
      </div>
    </header>;
  }

  /**
   * Renders the welcome screen for when someone first opens the application
   * @returns JSX Element
   */
  welcome() {
    return <div className={'welcome'}>
      <h2>Welcome to the mod optimizer for Star Wars: Galaxy of Heroes™!</h2>
      <p>
        This application will allow you to equip the optimum mod set on every character you have by assigning
        a value to each stat that a mod can confer. You'll give it a list of characters to optimize for along
        with the stats that you're looking for, and it will determine the best mods to equip, one character at a
        time, until your list is exhausted.
      </p>
      <p>
        To get started, copy the google sheet <a className={'call-out'}
                                                 href="https://docs.google.com/spreadsheets/d/1aba4x-lzrrt7lrBRKc1hNr5GoK5lFNcGWQZbRlU4H18/copy">here</a>
        , courtesy of <a href="http://apps.crouchingrancor.com">Crouching Rancor</a>.
        It will allow you to export your mods from <a href="https://swgoh.gg">SWGOH.gg</a> in order to import
        them into this tool. When you're ready, you can click the button above, or drag your mods file into the
        box below.
      </p>
      <FileDropZone handler={this.readModsFile.bind(this)} label={'Drop your mods file here!'}/>
    </div>;
  }

  /**
   * Renders the "Are you sure?" modal for resetting the app
   * @returns JSX Element
   */
  resetModal() {
    return <div className={'overlay'}>
      <div className={'modal reset-modal'}>
        <h2>Reset the mods optimizer?</h2>
        <p>
          If you click "Reset", everything that the application currently has saved - your mods,
          character configuration, selected characters, etc. - will all be deleted.
          Are you sure that's what you want?
        </p>
        <div className={'actions'}>
          <button type={'button'} onClick={() => this.setState({'reset': false})}>Cancel</button>
          <button type={'button'} className={'red'} onClick={this.handleReset}>Reset</button>
        </div>
      </div>
    </div>;
  }

  /**
   * Handle the "Reset Mods Optimizer" button press. Remove all saved state and refresh the page
   */
  handleReset() {
    window.localStorage.clear();
    window.location.reload();
  }
}

export default App;
