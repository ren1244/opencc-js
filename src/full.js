import { Trie, ConverterFactory, ConverterBuilder, CustomConverter, HTMLConverter } from "./main.js";
import * as Locale from "../dist/esm-lib/preset/full.js";

const Converter = ConverterBuilder(Locale);

export { Trie, ConverterFactory, Converter, CustomConverter, HTMLConverter, Locale };
