import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import NoWrapIcon from "../theme/no-wrap.svg";
import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";
import { COMMAND_NAME as ADD_NO_WRAP_COMMAND_NAME } from "./addnowrapcommand";
import { COMMAND_NAME as REMOVE_NO_WRAP_COMMAND_NAME } from "./removenowrapcommand";
import NoWrapActionsView from "./nowrapactionsview";
import ContextualBalloon from "@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon";
import ClickObserver from "@ckeditor/ckeditor5-engine/src/view/observer/clickobserver";
import clickOutsideHandler from "@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler";
import { translate } from "./translation";

const VISUAL_SELECTION_MARKER_NAME = "no-wrap-ui";

export default class NoWrapUI extends Plugin {
  static get requires() {
    return [ContextualBalloon];
  }

  init() {
    const editor = this.editor;

    translate();

    editor.editing.view.addObserver(ClickObserver);
    this.actionsView = this._createActionsView();
    this._balloon = editor.plugins.get(ContextualBalloon);
    this._createToolbarNoWrapButton();
    this._enableUserBalloonInteractions();
  }

  _createToolbarNoWrapButton() {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add("noWrap", (locale) => {
      const command = editor.commands.get(ADD_NO_WRAP_COMMAND_NAME);
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: t("No Wrap"),
        tooltip: true,
        icon: NoWrapIcon,
      });

      buttonView.bind("isOn", "isEnabled").to(command, "value", "isEnabled");

      this.listenTo(buttonView, "execute", () =>
        editor.execute(ADD_NO_WRAP_COMMAND_NAME)
      );

      return buttonView;
    });
  }

  _createActionsView() {
    const editor = this.editor;
    const actionsView = new NoWrapActionsView(editor.locale);
    const removeNoWrapCommand = editor.commands.get(
      REMOVE_NO_WRAP_COMMAND_NAME
    );

    actionsView.removeNoWrapButtonView
      .bind("isEnabled")
      .to(removeNoWrapCommand);

    this.listenTo(actionsView, REMOVE_NO_WRAP_COMMAND_NAME, () => {
      editor.execute(REMOVE_NO_WRAP_COMMAND_NAME);
      this._hideUI();
    });

    // Close the panel on esc key press when the **actions have focus**.
    actionsView.keystrokes.set("Esc", (data, cancel) => {
      this._hideUI();
      cancel();
    });

    return actionsView;
  }

  _enableUserBalloonInteractions() {
    const viewDocument = this.editor.editing.view.document;
    this.listenTo(viewDocument, "click", () => {
      const parentNoWrap = this._getSelectedNoWrapElement();
      if (parentNoWrap) {
        this._showUI();
      }
    });

    this.editor.keystrokes.set("Esc", (data, cancel) => {
      if (this._isUIVisible) {
        this._hideUI();
        cancel();
      }
    });
  }

  _showUI(forceVisible = false) {
    if (!this._getSelectedNoWrapElement()) {
      this._showFakeVisualSelection();
      this._addActionsView();

      if (forceVisible) {
        this._balloon.showStack("main");
      }
    } else {
      if (this._areActionsVisible) {
        this._addFormView();
      } else {
        this._addActionsView();
      }

      if (forceVisible) {
        this._balloon.showStack("main");
      }
    }

    this._startUpdatingUI();
  }

  _hideUI() {
    if (!this._isUIInPanel) {
      return;
    }

    const editor = this.editor;

    this.stopListening(editor.ui, "update");
    this.stopListening(this._balloon, "change:visibleView");

    editor.editing.view.focus();
    this._balloon.remove(this.actionsView);
    this._hideFakeVisualSelection();
  }
  _addActionsView() {
    if (this._areActionsInPanel) {
      return;
    }

    this._balloon.add({
      view: this.actionsView,
      position: this._getBalloonPositionData(),
    });
  }

  _startUpdatingUI() {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    let prevSelectedNoWrap = this._getSelectedNoWrapElement();
    let prevSelectionParent = getSelectionParent();

    const update = () => {
      const selectedNoWrap = this._getSelectedNoWrapElement();
      const selectionParent = getSelectionParent();

      if (
        (prevSelectedNoWrap && !selectedNoWrap) ||
        (!prevSelectedNoWrap && selectionParent !== prevSelectionParent)
      ) {
        this._hideUI();
      } else if (this._isUIVisible) {
        this._balloon.updatePosition(this._getBalloonPositionData());
      }

      prevSelectedNoWrap = selectedNoWrap;
      prevSelectionParent = selectionParent;
    };

    function getSelectionParent() {
      return viewDocument.selection.focus
        .getAncestors()
        .reverse()
        .find((node) => node.is("element"));
    }

    this.listenTo(editor.ui, "update", update);
    this.listenTo(this._balloon, "change:visibleView", update);
  }

  get _areActionsInPanel() {
    return this._balloon.hasView(this.actionsView);
  }

  get _areActionsVisible() {
    return this._balloon.visibleView === this.actionsView;
  }

  get _isUIInPanel() {
    return this._isFormInPanel || this._areActionsInPanel;
  }

  get _isUIVisible() {
    const visibleView = this._balloon.visibleView;

    return visibleView == this._areActionsVisible;
  }

  _getBalloonPositionData() {
    const view = this.editor.editing.view;
    const model = this.editor.model;
    const viewDocument = view.document;
    let target = null;

    if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
      // There are cases when we highlight selection using a marker (#7705, #4721).
      const markerViewElements = Array.from(
        this.editor.editing.mapper.markerNameToElements(
          VISUAL_SELECTION_MARKER_NAME
        )
      );
      const newRange = view.createRange(
        view.createPositionBefore(markerViewElements[0]),
        view.createPositionAfter(
          markerViewElements[markerViewElements.length - 1]
        )
      );

      target = view.domConverter.viewRangeToDom(newRange);
    } else {
      const targetNoWrap = this._getSelectedNoWrapElement();
      const range = viewDocument.selection.getFirstRange();

      target = targetNoWrap
        ? view.domConverter.mapViewToDom(targetNoWrap)
        : view.domConverter.viewRangeToDom(range);
    }

    return { target };
  }

  _getSelectedNoWrapElement() {
    const view = this.editor.editing.view;
    const selection = view.document.selection;

    if (!selection.isCollapsed) {
      return null;
    }
    return findNoWrapElementAncestor(selection.getFirstPosition());
  }

  _showFakeVisualSelection() {
    const model = this.editor.model;

    model.change((writer) => {
      const range = model.document.selection.getFirstRange();

      if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
        writer.updateMarker(VISUAL_SELECTION_MARKER_NAME, { range });
      } else {
        if (range.start.isAtEnd) {
          const focus = model.document.selection.focus;
          const nextValidRange = getNextValidRange(range, focus, writer);

          writer.addMarker(VISUAL_SELECTION_MARKER_NAME, {
            usingOperation: false,
            affectsData: false,
            range: nextValidRange,
          });
        } else {
          writer.addMarker(VISUAL_SELECTION_MARKER_NAME, {
            usingOperation: false,
            affectsData: false,
            range,
          });
        }
      }
    });
  }

  _hideFakeVisualSelection() {
    const model = this.editor.model;

    if (model.markers.has(VISUAL_SELECTION_MARKER_NAME)) {
      model.change((writer) => {
        writer.removeMarker(VISUAL_SELECTION_MARKER_NAME);
      });
    }
  }
}

function findNoWrapElementAncestor(position) {
  return position
    .getAncestors()
    .find(
      (node) =>
        node.is("attributeElement") &&
        [...node.getClassNames()].includes("no-wrap")
    );
}
