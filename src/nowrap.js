import "../theme/nowrap.css";
import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import NoWrapEditing from "./nowrapediting";
import NoWrapUI from "./nowrapui";
import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";

class NoWrap extends Plugin {
  static get requires() {
    return [NoWrapEditing, NoWrapUI];
  }
}

export default NoWrap;
