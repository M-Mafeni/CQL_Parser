import { C, F, N, Streams } from "@masala/parser";
import { parseCql } from "./cql/parser/parser";

const testParser = C.string("help").flatMap(val => C.string("123").returns(val + "hello"));

console.log(testParser.parse(Streams.ofString("help123")));