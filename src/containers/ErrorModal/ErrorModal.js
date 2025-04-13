import React, { Component } from "react";
import { connect } from "react-redux";
import Modal from "../../components/Modal/Modal";
import WarningLabel from "../../components/WarningLabel/WarningLabel";
import { hideError } from "../../state/actions/app";

class ErrorModal extends Component {
  render() {
    if (!this.props.content) {
      return null;
    }
    
    return (
      <Modal>
        <div className="overlay">
          <div className="modal error-modal">
            <WarningLabel />
            <h2>Error!</h2>
            <div>{this.props.content}</div>
            <div className="actions">
              <button type="button" onClick={this.props.close}>Ok</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  content: state.error
});

const mapDispatchToProps = dispatch => ({
  close: () => dispatch(hideError())
});

export default connect(mapStateToProps, mapDispatchToProps)(ErrorModal);
