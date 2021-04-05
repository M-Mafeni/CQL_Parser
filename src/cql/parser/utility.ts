import { F, C, TupleParser, SingleParser, VoidParser } from "@masala/parser";
import { CQL_FIELDS, CQL_STRING_OPERATORS } from "./constants";
// Reject these characters for now as they have special meaning in CQL text searches

export const betweenBrackets: SingleParser<string> = C.char("(").drop()
    .then(F.moveUntil(")"))
    .then(C.char(")").drop())
    .map((value) => value.array()[0]);
export const whiteSpace = C.char(" ").rep().opt().drop();
export const token = (parser: TupleParser<unknown> | SingleParser<unknown>): TupleParser<unknown> => parser.then(whiteSpace);
// given a string with commas separate them into a list e.g "a,b,c" becomes["a","b","c"]
// sepByCommas = <value><rest>
// <value> = anything but a comma
// rest =  <empty> | ','<sepByCommas>

function sepByCommasBuilder(): TupleParser<string> {
    return wordWithoutComma
        .then(sepByCommasHelper());
}
const wordWithoutComma = C.charNotIn(",").rep().map(chars => chars.join(""));
function sepByCommasHelper() {
    return F.try(emptyString)
    .or(
        C.char(",").drop()
        .then(F.lazy(sepByCommasBuilder))
        );
}

const emptyString = F.eos().drop();
const sepByCommasInternal = sepByCommasBuilder().array();
export const sepByCommas: SingleParser<string[]>  = sepByCommasInternal;
const quoteParser = (quotationMark: "\"" | "'"): TupleParser<string> => C.char(quotationMark).drop()
    .then(F.moveUntil(quotationMark))
    .then(C.char(quotationMark).drop());
export const betweenQuotesParser: TupleParser<string> = F.try(quoteParser("\""))  
    .or(quoteParser("'"));
export function getCqlField(s: string): CQL_FIELDS {
    switch(s) {
        case "ancestor":
            return CQL_FIELDS.ANCESTOR;
        case "creator":
            return CQL_FIELDS.CREATOR;
        case "label":
            return CQL_FIELDS.LABEL;
        case "parent":
            return CQL_FIELDS.PARENT;
        case "space":
            return CQL_FIELDS.SPACE;
        case "title":
            return CQL_FIELDS.TITLE;
    }
}

export function getCqlStringOperator(s: string): CQL_STRING_OPERATORS {
    switch(s) {
        case "=":
            return CQL_STRING_OPERATORS.EQUALS;
        case "!=":
            return CQL_STRING_OPERATORS.NOT_EQUALS;
        case "~":
            return CQL_STRING_OPERATORS.CONTAINS;
        case "!~":
            return CQL_STRING_OPERATORS.NOT_CONTAINS;
    }
}