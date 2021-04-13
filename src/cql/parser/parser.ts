import {C, F, SingleParser, Streams} from "@masala/parser";
import {
    CQL_BINARY_OPERATORS,
    CQL_FIELDS,
    CQL_LIST_OPERATORS,
    CQL_STRING_OPERATORS,
    CQL_UNARY_OPERATORS
} from "./constants";
import {InvalidQueryError} from "./error";
import {betweenQuotesParser, chainCQLTerms, token, whiteSpace} from "./utility/utility";
import {validateCqlAtom} from "./utility/validation";
import {cqlFieldParser, cqlListOperatorParser, cqlStringOperatorParser, listParser} from "./utility/helpers";
import {CQLListAtom, CQLSingleAtom, CQLTerm, UnOp} from "./types";

// CQLSingleAtom := <keywordToken><operatorToken><wordInQuotesToken>
const cqlSingleAtomParser: SingleParser<CQLSingleAtom> = token(cqlFieldParser)
    .then(token(cqlStringOperatorParser))
    .then(token(F.try(betweenQuotesParser).or(C.charNotIn(" )\"\',").rep().array().map(val => val.join("")))))
    .map((tokens) => tokens.array().map(String))
    .map((tokens) => ({
        operator: tokens[1] as CQL_STRING_OPERATORS,
        field: tokens[0] as CQL_FIELDS,
        value: tokens[2]
    }))
    .flatMap((term) => validateCqlAtom(term) as SingleParser<CQLSingleAtom>);

// CQLListAtom := <keywordToken><operatorToken><list>
const cqlListAtomParser: SingleParser<CQLListAtom> = token(cqlFieldParser)
    .then(token(cqlListOperatorParser))
    .then(token(listParser))
    .array()
    .map((tokens) => ({
        operator: tokens[1] as CQL_LIST_OPERATORS,
        field: tokens[0] as CQL_FIELDS,
        value: tokens[2] as string[]
    }))
    .flatMap((term) => validateCqlAtom(term) as SingleParser<CQLListAtom>);

const betweenBracketsExpr: SingleParser<CQLTerm> = token(C.char("(")).drop()
    .then(F.try(F.lazy(cqlTermParserGenerator)))
    .then(token(C.char(")").drop()))
    .first();

const cqlUnaryOperatorParser: SingleParser<string> = C.string("not");

const cqlOrBinopParser: SingleParser<CQLTerm> = F.lazy(cqlAndBinopParserGenerator)
.then(token(C.string("or")).drop().then(F.lazy(cqlAndBinopParserGenerator)).optrep().array())
.array()
.map(tokens => {
    const term1 = tokens[0] as CQLTerm;
    const restTerms = tokens[1] as CQLTerm[];
    return chainCQLTerms(term1, restTerms, CQL_BINARY_OPERATORS.OR);
});

function cqlTermParserGenerator(): SingleParser<CQLTerm> {
    return whiteSpace
        .then(cqlOrBinopParser)
        .first();
}

function cqlAtomParserGenerator(): SingleParser<CQLTerm> {
    return F.try(cqlSingleAtomParser)
        .or(F.try(cqlListAtomParser))
        .or(betweenBracketsExpr);
}

function cqlUnopParserGenerator(): SingleParser<CQLTerm> {
    return token(cqlUnaryOperatorParser).opt()
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

        });
}

function cqlAndBinopParserGenerator(): SingleParser<CQLTerm> {
    return F.lazy(cqlUnopParserGenerator)
        .then(token(C.string("and")).drop().then(F.lazy(cqlUnopParserGenerator)).optrep().array())
        .array()
        .map(tokens => {
            const term1 = tokens[0] as UnOp;
            const restTerms = tokens[1] as CQLTerm[];
            return chainCQLTerms(term1, restTerms, CQL_BINARY_OPERATORS.AND);
        });
}

/*
    The grammar this parser generates can be interpreted as follows:
    CQLTerm := <SubTerm>("or"<SubTerm>)*
    SubTerm :=<UnopTerm>("and"<UnopTerm>)*
    UnopTerm := ("not")?<CQLAtom>
    CQLAtom := <CQLSingleAtom> | <CQLListAtom> | "(" <CQLTerm> ")"
    CQLSingleAtom := <Field><CQL_STRING_OPERATORS>"<word>"
    Field := "ancestor" | "creator" | "label" | "parent" | "space" | "title"
    CQL_STRING_OPERATORS := "=" | "!=" | "~" | "!~"
    CQLListAtom := <Field><CQL_List_Operators><list of comma separated terms>
 */
export function parseCql(query: string): CQLTerm {
    const parseResponse = cqlTermParserGenerator().eos().parse(Streams.ofString(query.toLowerCase()));
    if (parseResponse.isAccepted()) {
        return parseResponse.value;
    } else {
        throw new InvalidQueryError(`Error near char ${parseResponse.offset}`);
    }
}
