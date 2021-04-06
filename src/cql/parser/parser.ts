import { C, F, SingleParser, Streams, VoidParser } from "@masala/parser";
import { CQLListAtom, CQLSingleAtom, CQLTerm, UnOp } from "../../types/cql";
import { CQL_BINARY_OPERATORS, CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS, CQL_UNARY_OPERATORS } from "./constants";
import { InvalidQueryError } from "./error";
import { betweenBrackets, betweenQuotesParser, chainCQLTerms, getCqlField, getCqlOperator, sepByCommas, token, whiteSpace } from "./utility";

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
        field: getCqlField(tokens[0]) as CQL_FIELDS,
        value: tokens[2]
    }));

export const listParser: SingleParser<string[]> = betweenBrackets.flatMap((stringBetweenBrackets) => {
    const parseResponse = sepByCommas.parse(Streams.ofString(stringBetweenBrackets));
    if(parseResponse.isAccepted()) {
        return F.returns(parseResponse.value);
    } else {
        return F.error().returns([]);
    }
});

// CQLListAtom := <keywordToken><operatorToken><list>
const cqlListAtomParser: SingleParser<CQLListAtom> = token(cqlFieldParser)
    .then(token(cqlListOperatorParser))
    .then(token(listParser))
    .array()
    .map((tokens) => ({
        operator: getCqlOperator(String(tokens[1])) as CQL_LIST_OPERATORS,
        field: getCqlField(String(tokens[0])) as CQL_FIELDS,
        value: tokens[2] as string[]
    }));

const betweenBracketsExpr: SingleParser<CQLTerm> = token(C.char("(")).drop().debug("found opening bracket", true)
    .then(F.try(F.lazy(cqlTermParserGenerator)).debug("parsed cql term"))
    .then(token(C.char(")")).drop().debug("found closing bracket"))
    .first();

const cqlAtomParser: SingleParser<CQLTerm> = F.try(cqlSingleAtomParser)
    .or(F.try(cqlListAtomParser))
    .or(betweenBracketsExpr);

const cqlUnaryOperatorParser: SingleParser<string> = C.string("not");
const cqlUnopParser: SingleParser<UnOp> = token(cqlUnaryOperatorParser).opt()
    .then(F.lazy(cqlAtomParserGenerator))
    .array()
    .map(([val, term]) =>{
        if (val.isPresent()) {
            return {
                operator: CQL_UNARY_OPERATORS.NOT,
                term: term as CQLTerm
            };
        } else {
            return term;
        }
        
    } );

const cqlAndBinopParser: SingleParser<CQLTerm> = F.lazy(cqlUnopParserGenerator)
.then(token(C.string("and")).drop().then(F.lazy(cqlUnopParserGenerator)).optrep().array())
.array()
.map(tokens => {
    const term1 = tokens[0] as UnOp;
    const restTerms = tokens[1] as CQLTerm[];
    return chainCQLTerms(term1, restTerms, CQL_BINARY_OPERATORS.AND);
});

const cqlOrBinopParser: SingleParser<CQLTerm> = F.lazy(cqlAndBinopParserGenerator)
.then(token(C.string("or")).drop().then(F.lazy(cqlAndBinopParserGenerator)).optrep().array())
.array()
.map(tokens => {
    const term1 = tokens[0] as CQLTerm;
    const restTerms = tokens[1] as CQLTerm[];
    return chainCQLTerms(term1, restTerms, CQL_BINARY_OPERATORS.OR);
});

function cqlTermParserGenerator() {
    return cqlTermParser;
}

function cqlAtomParserGenerator() {
    return cqlAtomParser;
}

function cqlUnopParserGenerator() {
    return cqlUnopParser;
}

function cqlAndBinopParserGenerator() {
    return cqlAndBinopParser;
}

const cqlTermParser: SingleParser<CQLTerm>  = whiteSpace
    .then(cqlOrBinopParser)    
    .first();
export function parseCql(query: string): CQLTerm | Error {
    const parseResponse = cqlTermParserGenerator().eos().parse(Streams.ofString(query.toLowerCase()));
    if (parseResponse.isAccepted()) {
        return parseResponse.value;
    } else {
        throw new InvalidQueryError();
    }
}