import {C, F, SingleParser, Streams, TupleParser} from "@masala/parser";
import {CQL_BINARY_OPERATORS} from "../constants";
import {CQLTerm} from "../types";
// Reject these characters for now as they have special meaning in CQL text searches

// extract all characters between 2 brackets
export const betweenBrackets: SingleParser<string> = C.char("(").drop()
    .then(F.moveUntil(")"))
    .then(C.char(")").drop())
    .first();

export const whiteSpace = C.char(" ").rep().opt().drop();
export const token = (parser: TupleParser<unknown> | SingleParser<unknown>): TupleParser<unknown> => parser.then(whiteSpace);

function sepByCommasBuilder(): TupleParser<string> {
    return wordWithoutComma
        .then(sepByCommasHelper());
}

const quoteParser = (quotationMark: "\"" | "'"): TupleParser<string> => C.char(quotationMark).drop()
    .then(F.moveUntil(quotationMark))
    .then(C.char(quotationMark).drop());

export const betweenQuotesParser: SingleParser<string> = F.try(quoteParser("\""))
    .or(quoteParser("'")).first();

const wordWithoutComma = token(F.try(betweenQuotesParser).or(C.charNotIn(", ").rep().map(chars => chars.join("")))).array().map(String);
function sepByCommasHelper() {
    return F.try(emptyString)
    .or(
        token(C.char(",").drop())
        .then(F.lazy(sepByCommasBuilder))
        );
}

export const emptyString = F.eos().drop();

// given a string with commas separate them into a list e.g "a,b,c" becomes["a","b","c"]
// sepByCommas = <value><rest>
// <value> = anything but a comma
// rest =  <empty> | ','<sepByCommas>
export const sepByCommas: SingleParser<string[]>  = sepByCommasBuilder().array().map(values => values.map(removeQuotes));

// remove quotation marks from string and return int
export function removeQuotes(s: string) : string {
    const parseResponse = betweenQuotesParser.parse(Streams.ofString(s));
    if(parseResponse.isAccepted()) {
        return parseResponse.value;
    } else {
        // If it couldn't parse might mean string should be left as is
        return s;
    }
}

export function chainCQLTerms(acc: CQLTerm, terms: CQLTerm[], operator: CQL_BINARY_OPERATORS): CQLTerm {
    if (terms.length === 0) {
        return acc;
    } else {
        const term2 = terms[0];
        return chainCQLTerms({
            operator,
            term1: acc,
            term2
        },
        terms.slice(1),
        operator
        );
    }
}


