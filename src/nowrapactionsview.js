import "@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css";

import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";
import FocusCycler from "@ckeditor/ckeditor5-ui/src/focuscycler";
import View from "@ckeditor/ckeditor5-ui/src/view";
import ViewCollection from "@ckeditor/ckeditor5-ui/src/viewcollection";
import FocusTracker from "@ckeditor/ckeditor5-utils/src/focustracker";
import KeystrokeHandler from "@ckeditor/ckeditor5-utils/src/keystrokehandler";
import CancelIcon from "@ckeditor/ckeditor5-core/theme/icons/cancel.svg";

import { COMMAND_NAME } from "./removenowrapcommand";

export default class NoWrapActionsView extends View {
  constructor(locale) {
    super(locale);
    const t = locale.t;

    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();
    this.removeNoWrapButtonView = this._createButton(
      t("Remove no wrap"),
      CancelIcon,
      COMMAND_NAME
    );
    this._focusables = new ViewCollection();
    this._focusCycler = new FocusCycler({
      focusables: this._focusables,
      focusTracker: this.focusTracker,
      keystrokeHandler: this.keystrokes,
      actions: {
        focusPrevious: "shift + tab",
        focusNext: "tab",
      },
    });

    this.setTemplate({
      tag: "div",

      attributes: {
        class: ["ck", "ck-responsive-form"],
        tabindex: "-1",
      },

      children: [this.removeNoWrapButtonView],
    });
  }

  render() {
    super.render();

    const childViews = [this.removeNoWrapButtonView];

    childViews.forEach((v) => {
      // Register the view as focusable.
      this._focusables.add(v);

      // Register the view in the focus tracker.
      this.focusTracker.add(v.element);
    });

    // Start listening for the keystrokes coming from #element.
    this.keystrokes.listenTo(this.element);
  }

  focus() {
    this._focusCycler.focusFirst();
  }

  _createButton(label, icon, eventName) {
    const button = new ButtonView(this.locale);

    button.set({
      label,
      icon,
      tooltip: true,
    });

    button.delegate("execute").to(this, eventName);

    return button;
  }
}
