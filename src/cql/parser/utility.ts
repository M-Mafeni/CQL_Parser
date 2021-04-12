import {C, F, SingleParser, Streams, TupleParser} from "@masala/parser";
import {CQL_BINARY_OPERATORS, CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS} from "./constants";
import {CQLAtom, CQLTerm} from "../../types/cql";
// Reject these characters for now as they have special meaning in CQL text searches

export const betweenBrackets: SingleParser<string> = C.char("(").drop()
    .then(F.moveUntil(")"))
    .then(C.char(")").drop())
    .first();

// these characters aren't valid for label fields
const INVALID_LABEL_CHARACTERS= "!#&()*,.:;<>@[]^";
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
export const sepByCommas: SingleParser<string[]>  = sepByCommasBuilder().array().map(values => values.map(removeQuotes));


export function getCqlField(s: string): CQL_FIELDS | undefined {
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
        default:
            return undefined;
    }
}

export function getCqlOperator(s: string): CQL_STRING_OPERATORS | CQL_LIST_OPERATORS | undefined {
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
        default:
            return undefined;
    }
}

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

// checks if the label given contains any invalid characters
function isValidLabel(val: string | string[]): boolean {

    const isValid = (label: string): boolean  => {
        // create set for checking if any invalid label characters are in the string
        const intersectionSet = [...INVALID_LABEL_CHARACTERS].filter(x => new Set(label).has(x));
        return intersectionSet.length === 0;
    };

    if (typeof val === "string") {
        return isValid(val);
    } else {
        return !(val.map(isValid).includes(false));
    }

}


function isNumber(x: string): boolean {
    // check if any non-digit is in string
    return !/\D/.test(x);
}

function isAlphaNum(x: string): boolean {
    return /^[0-9a-z]+$/.test(x);
}

function isValidCqlField(cqlAtom: CQLAtom): boolean {
    switch (cqlAtom.field) {
        case CQL_FIELDS.LABEL:
            return isValidLabel(cqlAtom.value);
        case CQL_FIELDS.PARENT:
        case CQL_FIELDS.ANCESTOR:
            if (typeof cqlAtom.value === "string") {
                return isNumber(cqlAtom.value);
            } else {
                return cqlAtom.value.filter(val => !isNumber(val)).length === 0;
            }
        case CQL_FIELDS.SPACE:
        case CQL_FIELDS.CREATOR:
            if (typeof cqlAtom.value === "string") {
                return isAlphaNum(cqlAtom.value);
            } else {
                // if there aren't any notn alpha-numeric strings in list then it's valid
                return cqlAtom.value.filter(val => !isAlphaNum(val)).length === 0;
            }
        default:
            return true;
    }
}

function isValidCqlOperator(cqlAtom: CQLAtom): boolean {
    switch (cqlAtom.operator) {
        case CQL_LIST_OPERATORS.IN:
        case CQL_LIST_OPERATORS.NOT_IN:
            return !(cqlAtom.field === CQL_FIELDS.PARENT || cqlAtom.field === CQL_FIELDS.TITLE);
        case CQL_STRING_OPERATORS.CONTAINS:
        case CQL_STRING_OPERATORS.NOT_CONTAINS:
            return cqlAtom.field === CQL_FIELDS.TITLE;
        default: // = and != are valid for all fields
            return true;
    }
}

// Given a cql Atom returns whether the cql is valid i.e using the correct field and operator
export function isValidCQLAtom(cqlAtom: CQLAtom): boolean {
    /*
       Some fields only work with some operators
       These tests are to make sure that this is enforced
       ancestor:  =, !=, in, not in
       creator: =, !=, in, not in
       label: =, !=, in, not in
       parent: =,!=
       space:  =, !=, in, not in
       title:  =, !=, ~, !~
    */
    return isValidCqlField(cqlAtom) && isValidCqlOperator(cqlAtom);

}

export function checkValidCqlAtom(term: CQLAtom) : SingleParser<CQLAtom | null> {
    if (isValidCQLAtom(term)) {
        return F.returns(term);
    } else {
        return F.error().returns(null);
    }
}
