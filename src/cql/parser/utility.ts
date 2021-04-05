import { F, C, TupleParser, SingleParser, Streams } from "@masala/parser";
import { CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS } from "./constants";
// Reject these characters for now as they have special meaning in CQL text searches

export const betweenBrackets: SingleParser<string> = C.char("(").drop()
    .then(F.moveUntil(")"))
    .then(C.char(")").drop())
    .first();
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
        token(C.char(",").drop())
        .then(F.lazy(sepByCommasBuilder))
        );
}

const emptyString = F.eos().drop();
export const sepByCommas: SingleParser<string[]>  = sepByCommasBuilder().array().map(values => values.map(removeQuotes));
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

export function getCqlOperator(s: string): CQL_STRING_OPERATORS | CQL_LIST_OPERATORS {
    switch(s) {
        case "=":
            return CQL_STRING_OPERATORS.EQUALS;
        case "!=":
            return CQL_STRING_OPERATORS.NOT_EQUALS;
        case "~":
            return CQL_STRING_OPERATORS.CONTAINS;
        case "!~":
            return CQL_STRING_OPERATORS.NOT_CONTAINS;
        case "in":
            return CQL_LIST_OPERATORS.IN;
        case "not in":
            return CQL_LIST_OPERATORS.NOT_IN;
    }
}

// remove quotation marks from string and return int
export function removeQuotes(s: string) : string {
    const parseResponse = betweenQuotesParser.first().parse(Streams.ofString(s));
    if(parseResponse.isAccepted()) {
        return parseResponse.value;
    } else {
        // If it couldn't parse might mean string should be left as is
        return s;
    }
}
