import React from 'react';
import type { EventEmitter } from 'node:events';
interface AppProps {
    events: EventEmitter;
    projectDir: string;
}
export declare function App({ events, projectDir }: AppProps): React.FunctionComponentElement<{
    readonly position?: "absolute" | "relative" | undefined;
    readonly columnGap?: number | undefined;
    readonly rowGap?: number | undefined;
    readonly gap?: number | undefined;
    readonly margin?: number | undefined;
    readonly marginX?: number | undefined;
    readonly marginY?: number | undefined;
    readonly marginTop?: number | undefined;
    readonly marginBottom?: number | undefined;
    readonly marginLeft?: number | undefined;
    readonly marginRight?: number | undefined;
    readonly padding?: number | undefined;
    readonly paddingX?: number | undefined;
    readonly paddingY?: number | undefined;
    readonly paddingTop?: number | undefined;
    readonly paddingBottom?: number | undefined;
    readonly paddingLeft?: number | undefined;
    readonly paddingRight?: number | undefined;
    readonly flexGrow?: number | undefined;
    readonly flexShrink?: number | undefined;
    readonly flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
    readonly flexBasis?: number | string | undefined;
    readonly flexWrap?: "nowrap" | "wrap" | "wrap-reverse" | undefined;
    readonly alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | undefined;
    readonly alignSelf?: "flex-start" | "center" | "flex-end" | "auto" | undefined;
    readonly justifyContent?: "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly" | "center" | undefined;
    readonly width?: number | string | undefined;
    readonly height?: number | string | undefined;
    readonly minWidth?: number | string | undefined;
    readonly minHeight?: number | string | undefined;
    readonly display?: "flex" | "none" | undefined;
    readonly borderStyle?: (keyof import("cli-boxes").Boxes | import("cli-boxes").BoxStyle) | undefined;
    readonly borderTop?: boolean | undefined;
    readonly borderBottom?: boolean | undefined;
    readonly borderLeft?: boolean | undefined;
    readonly borderRight?: boolean | undefined;
    readonly borderColor?: import("type-fest").LiteralUnion<import("ansi-styles").ForegroundColorName, string> | undefined;
    readonly borderTopColor?: import("type-fest").LiteralUnion<import("ansi-styles").ForegroundColorName, string> | undefined;
    readonly borderBottomColor?: import("type-fest").LiteralUnion<import("ansi-styles").ForegroundColorName, string> | undefined;
    readonly borderLeftColor?: import("type-fest").LiteralUnion<import("ansi-styles").ForegroundColorName, string> | undefined;
    readonly borderRightColor?: import("type-fest").LiteralUnion<import("ansi-styles").ForegroundColorName, string> | undefined;
    readonly borderDimColor?: boolean | undefined;
    readonly borderTopDimColor?: boolean | undefined;
    readonly borderBottomDimColor?: boolean | undefined;
    readonly borderLeftDimColor?: boolean | undefined;
    readonly borderRightDimColor?: boolean | undefined;
    readonly overflow?: "visible" | "hidden" | undefined;
    readonly overflowX?: "visible" | "hidden" | undefined;
    readonly overflowY?: "visible" | "hidden" | undefined;
    readonly backgroundColor?: import("type-fest").LiteralUnion<import("ansi-styles").ForegroundColorName, string> | undefined;
} & {
    readonly 'aria-label'?: string;
    readonly 'aria-hidden'?: boolean;
    readonly 'aria-role'?: "button" | "checkbox" | "combobox" | "list" | "listbox" | "listitem" | "menu" | "menuitem" | "option" | "progressbar" | "radio" | "radiogroup" | "tab" | "tablist" | "table" | "textbox" | "timer" | "toolbar";
    readonly 'aria-state'?: {
        readonly busy?: boolean;
        readonly checked?: boolean;
        readonly disabled?: boolean;
        readonly expanded?: boolean;
        readonly multiline?: boolean;
        readonly multiselectable?: boolean;
        readonly readonly?: boolean;
        readonly required?: boolean;
        readonly selected?: boolean;
    };
} & {
    children?: React.ReactNode | undefined;
} & React.RefAttributes<import("ink").DOMElement>>;
export {};
//# sourceMappingURL=App.d.ts.map