import { C, F, N, Streams } from "@masala/parser";
import { parseCql } from "./cql/parser/parser";

const testParser = C.string("help").chain(C.string("123"));

console.log(testParser.parse(Streams.ofString("help123")));