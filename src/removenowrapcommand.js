import Command from "@ckeditor/ckeditor5-core/src/command";
import findAttributeRange from "@ckeditor/ckeditor5-typing/src/utils/findattributerange";

export const COMMAND_NAME = "removeNoWrap";
export default class RemoveNoWrapCommand extends Command {
  refresh() {
    const model = this.editor.model;
    const doc = model.document;

    this.isEnabled = model.schema.checkAttributeInSelection(
      doc.selection,
      "noWrap"
    );
  }

  execute() {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change((writer) => {
      const ranges = selection.isCollapsed
        ? [
            findAttributeRange(
              selection.getFirstPosition(),
              "noWrap",
              selection.getAttribute("noWrap"),
              model
            ),
          ]
        : model.schema.getValidRanges(selection.getRanges(), "noWrap");

      for (const range of ranges) {
        writer.removeAttribute("noWrap", range);
      }
    });
  }
}
