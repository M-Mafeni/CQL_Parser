import { C, F, SingleParser, Streams } from "@masala/parser";
import {CQLAtom, CQLListAtom, CQLSingleAtom, CQLTerm, UnOp} from "../../types/cql";
import { CQL_BINARY_OPERATORS, CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS, CQL_UNARY_OPERATORS } from "./constants";
import { InvalidQueryError } from "./error";
import {
    betweenBrackets,
    betweenQuotesParser,
    chainCQLTerms, checkValidCqlAtom,
    getCqlField,
    getCqlOperator,
    sepByCommas,
    token,
    whiteSpace
} from "./utility";

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
.or(
    token(C.string("not"))
        .then(token(C.string("in")))
        .array()
        .map((values) => values.join(" ")));

// CQLSingleAtom := <keywordToken><operatorToken><wordInQuotesToken> 
const cqlSingleAtomParser: SingleParser<CQLSingleAtom> = token(cqlFieldParser)
    .then(token(cqlStringOperatorParser))
    .then(token(F.try(betweenQuotesParser).or(C.charNotIn(" )\"\',").rep().array().map(val => val.join("")))))
    .map((tokens) => tokens.array().map(String))
    .map((tokens) => ({
        operator: getCqlOperator(tokens[1]) as CQL_STRING_OPERATORS,
        field: getCqlField(tokens[0]) as CQL_FIELDS,
        value: tokens[2]
    }))
    .flatMap((term) => checkValidCqlAtom(term) as SingleParser<CQLSingleAtom>);

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
    }))
    .flatMap((term) => checkValidCqlAtom(term) as SingleParser<CQLListAtom>);

const betweenBracketsExpr: SingleParser<CQLTerm> = token(C.char("(")).drop()
    .then(F.try(F.lazy(cqlTermParserGenerator)))
    .then(token(C.char(")").drop()))
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

/*
    The grammar this parser generates is as follows can be interpreted as follows:
    CQLTerm := <SubTerm>("or"<SubTerm>)*
    SubTerm :=<UnopTerm>("and"<UnopTerm>)*
    UnopTerm := ("not")?<CQLAtom>
    CQLAtom := <CQLSingleAtom> | <CQLListAtom> | "(" <CQLTerm> ")"
    CQLSingleAtom := <Field><CQL_STRING_OPERATORS>"<word>"
    Field := "ancestor" | "creator" | "label" | "parent" | "space" | "title"
    CQL_STRING_OPERATORS := "=" | "!=" | "~" | "!~"
    CQLListAtom := <Field><CQL_List_Operators><list of comma separated terms>
 */
const cqlTermParser: SingleParser<CQLTerm>  = whiteSpace
    .then(cqlOrBinopParser)    
    .first();
export function parseCql(query: string): CQLTerm {
    const parseResponse = cqlTermParserGenerator().eos().parse(Streams.ofString(query.toLowerCase()));
    if (parseResponse.isAccepted()) {
        return parseResponse.value;
    } else {
        throw new InvalidQueryError();
    }
}
