import { C, F, SingleParser, Streams } from "@masala/parser";
import { CQLAtom, CQLListAtom, CQLSingleAtom, CQLTerm, UnOp } from "../../types/cql";
import { CQL_LIST_OPERATORS, CQL_STRING_OPERATORS, CQL_UNARY_OPERATORS } from "./constants";
import { InvalidQueryError } from "./error";
import { betweenBrackets, betweenQuotesParser, getCqlField, getCqlOperator, sepByCommas, token, whiteSpace } from "./utility";

const cqlFieldParser: SingleParser<string> = F.try(C.string("ancestor"))
.or(F.try(C.string("creator")))
.or(F.try(C.string("label")))
.or(F.try(C.string("parent")))
.or(F.try(C.string("space")))
.or(C.string("title"));
 
const cqlStringOperatorParser: SingleParser<string> = F.try(C.char("="))
.or(F.try(C.string("!=")))
.or(F.try(C.char("~")))
.or(C.string("!~"));

const cqlListOperatorParser: SingleParser<string> = F.try(C.string("in"))
.or(C.string("not in"));

// CQLSingleAtom := <keywordToken><operatorToken><wordInQuotesToken> 
const cqlSingleAtomParser: SingleParser<CQLSingleAtom> = token(cqlFieldParser)
    .then(token(cqlStringOperatorParser))
    .then(token(betweenQuotesParser))
    .map((tokens) => tokens.array().map(String))
    .map((tokens) => ({
        operator: getCqlOperator(tokens[1]) as CQL_STRING_OPERATORS,
        field: getCqlField(tokens[0]),
        value: tokens[2]
    }));

export const listParser: SingleParser<string[]> = betweenBrackets.map((stringBetweenBrackets) => {
    const parseResponse = sepByCommas.parse(Streams.ofString(stringBetweenBrackets));
    if(parseResponse.isAccepted()) {
        return parseResponse.value;
    }
});

// CQLListAtom := <keywordToken><operatorToken><list>
const cqlListAtomParser: SingleParser<CQLListAtom> = token(cqlFieldParser)
    .then(token(cqlListOperatorParser))
    .then(token(listParser))
    .array()
    .map((tokens) => ({
        operator: getCqlOperator(String(tokens[1])) as CQL_LIST_OPERATORS,
        field: getCqlField(String(tokens[0])),
        value: tokens[2] as string[]
    }));

const betweenBracketsExpr: SingleParser<CQLTerm> = C.char("(").drop().debug("found opening bracket", true)
    .then(F.try(F.lazy(cqlTermParserBuilder)).debug("parsed cql term"))
    .then(C.char(")").drop().debug("found closing bracket"))
    .first();

const cqlAtomParser: SingleParser<CQLTerm> = F.try(cqlSingleAtomParser)
    .or(F.try(cqlListAtomParser))
    .or(betweenBracketsExpr);

const cqlUnaryOperatorParser: SingleParser<string> = C.string("not");
const cqlUnopParser: SingleParser<UnOp> = token(cqlUnaryOperatorParser)
    .then(F.lazy(cqlTermParserBuilder))
    .array()
    .map((tokens) => ({
        operator: CQL_UNARY_OPERATORS.NOT,
        term: tokens[1] as CQLTerm
    }));

function cqlTermParserBuilder() {
    return cqlTermParser;
} 
const cqlTermParser: SingleParser<CQLTerm>  = whiteSpace
    .then(
        F.try(cqlAtomParser)
        .or(cqlUnopParser))    
    .first();
export function parseCql(query: string): CQLTerm | Error {
    const parseResponse = cqlTermParserBuilder().eos().parse(Streams.ofString(query.toLowerCase()));
    if (parseResponse.isAccepted()) {
        return parseResponse.value;
    } else {
        throw new InvalidQueryError();
    }
}