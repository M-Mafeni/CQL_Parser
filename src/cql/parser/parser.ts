import { C, F, SingleParser, Streams } from "@masala/parser";
import { CQLSingleAtom, CQLTerm } from "../../types/cql";
import { InvalidQueryError } from "./error";
import { betweenQuotesParser, getCqlField, getCqlStringOperator, token } from "./utility";

const cqlFieldParser: SingleParser<string> = F.try(C.string("ancestor"))
.or(F.try(C.string("creator")))
.or(F.try(C.string("label")))
.or(F.try(C.string("parent")))
.or(F.try(C.string("space")))
.or(F.try(C.string("title")));
 
const cqlStringOperatorParser: SingleParser<string> = F.try(C.char("="))
.or(F.try(C.string("!=")))
.or(F.try(C.char("~")))
.or(F.try(C.string("!~")));

// CQLSingleAtom := <keywordToken><operatorToken><wordInQuotesToken> 
const cqlSingleAtomParser: SingleParser<CQLSingleAtom> = token(cqlFieldParser)
    .then(token(cqlStringOperatorParser))
    .then(token(betweenQuotesParser))
    .then(F.eos().drop())
    .map((tokens) => tokens.array().map(String))
    .map((tokens) => ({
        operator: getCqlStringOperator(tokens[1]),
        field: getCqlField(tokens[0]),
        value: tokens[2]
    }));

export function parseCql(query: string): CQLTerm | Error {
    const parseResponse = cqlSingleAtomParser.parse(Streams.ofString(query.toLowerCase()));
    if (parseResponse.isAccepted()) {
        console.log(parseResponse.isAccepted);
        return parseResponse.value;
    } else {
        throw new InvalidQueryError();
    }
}