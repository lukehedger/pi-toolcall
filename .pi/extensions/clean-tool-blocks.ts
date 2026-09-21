/**
 * Clean Tool Blocks - Collapses pi's shell tool call blocks to a single line.
 *
 * pi's default bash renderer decorates every tool call with a "(timeout Ns)"
 * suffix, a blank line, output preview, "... earlier lines" / "[Truncated]"
 * hints, and a trailing "Took Ns" footer.
 *
 * This extension re-registers the bash tool with the same name (which replaces
 * the built-in entirely) and delegates execution to the original tool, but
 * renders each call as just the `$ command` line. Output is hidden until you
 * expand the row (ctrl+o). Failed commands are flagged so they aren't silent.
 *
 * Behaviour is unchanged; only the TUI presentation is cleaner.
 *
 * Usage: drop into .pi/extensions/ (project) or ~/.pi/agent/extensions/ (global),
 * or test with: pi -e ./clean-tool-blocks.ts
 */

import type { BashToolDetails, ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createBashTool, keyHint } from "@earendil-works/pi-coding-agent";
import { Container, Text } from "@earendil-works/pi-tui";

/** Pull the plain-text output out of a tool result, stripping any trailing truncation footer. */
function getOutput(result: { content: Array<{ type: string; text?: string }>; details?: BashToolDetails }): string {
	const content = result.content?.[0];
	let output = content?.type === "text" && content.text ? content.text : "";
	output = output.trim();

	// Drop the "[Output truncated: ... Full output saved to: /tmp/...]" footer that
	// the tool appends to the model-facing text.
	const fullOutputPath = result.details?.fullOutputPath;
	if (fullOutputPath && output.endsWith("]")) {
		const footerStart = output.lastIndexOf("\n\n[");
		if (footerStart !== -1 && output.slice(footerStart).includes(fullOutputPath)) {
			output = output.slice(0, footerStart).trimEnd();
		}
	}
	return output;
}

export default function (pi: ExtensionAPI) {
	const cwd = process.cwd();
	const original = createBashTool(cwd);

	pi.registerTool({
		name: "bash",
		label: "bash",
		description: original.description,
		parameters: original.parameters,

		async execute(toolCallId, params, signal, onUpdate, ctx) {
			return original.execute(toolCallId, params, signal, onUpdate, ctx);
		},

		renderCall(args, theme, _context) {
			const command = typeof args?.command === "string" ? args.command : "";
			return new Text(theme.fg("toolTitle", theme.bold(`$ ${command || "..."}`)), 0, 0);
		},

		renderResult(result, { expanded, isPartial }, theme, context) {
			// Collapsed view: hide everything after the `$ command` line.
			if (!expanded) {
				if (!isPartial && context.isError) {
					return new Text(
						theme.fg("error", "✗ failed (") + keyHint("app.tools.expand", "to expand") + theme.fg("error", ")"),
						0,
						0,
					);
				}
				return new Container();
			}

			// Expanded view: reveal the full output on demand.
			const output = getOutput(result as any);
			if (!output) {
				return new Text(theme.fg("dim", context.isError ? "failed" : "no output"), 0, 0);
			}
			const lines = output.split("\n").map((line) => theme.fg("toolOutput", line));
			return new Text(lines.join("\n"), 0, 0);
		},
	});
}
