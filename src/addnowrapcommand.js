import Command from "@ckeditor/ckeditor5-core/src/command";

export const COMMAND_NAME = "addNoWrap";
export default class AddNoWrapCommand extends Command {
  refresh() {
    const model = this.editor.model;
    const doc = model.document;

    this.value = doc.selection.getAttribute("noWrap");
    this.isEnabled = model.schema.checkAttributeInSelection(
      doc.selection,
      "noWrap"
    );
  }

  execute() {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change((writer) => {
      const ranges = model.schema.getValidRanges(
        selection.getRanges(),
        "noWrap"
      );

      for (const range of ranges) {
        writer.setAttribute("noWrap", true, range);
      }
    });
  }
}
