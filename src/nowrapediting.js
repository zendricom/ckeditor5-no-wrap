import Plugin from "@ckeditor/ckeditor5-core/src/plugin";

import AddNoWrapCommand, {
  COMMAND_NAME as ADD_NO_WRAP_COMMAND_NAME,
} from "./addnowrapcommand";
import RemoveNoWrapCommand, {
  COMMAND_NAME as REMOVE_NO_WRAP_COMMAND_NAME,
} from "./removenowrapcommand";

export default class NoWrapEditing extends Plugin {
  init() {
    this._defineSchema();
    this._defineConverters();

    this.editor.commands.add(
      ADD_NO_WRAP_COMMAND_NAME,
      new AddNoWrapCommand(this.editor)
    );
    this.editor.commands.add(
      REMOVE_NO_WRAP_COMMAND_NAME,
      new RemoveNoWrapCommand(this.editor)
    );
  }

  _defineSchema() {
    const schema = this.editor.model.schema;

    schema.extend("$text", { allowAttributes: "noWrap" });
  }

  _defineConverters() {
    const conversion = this.editor.conversion;

    conversion.for("dataDowncast").attributeToElement({
      model: "noWrap",
      view: {
        name: "span",
        classes: ["no-wrap"],
      },
    });
    conversion.for("editingDowncast").attributeToElement({
      model: "noWrap",
      view: {
        name: "span",
        classes: ["no-wrap", "no-wrap-editing"],
      },
    });

    conversion.for("upcast").elementToAttribute({
      view: {
        name: "span",
        classes: "no-wrap",
      },
      model: "noWrap",
    });
  }
}
