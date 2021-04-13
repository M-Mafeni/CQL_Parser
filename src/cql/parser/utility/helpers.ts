import {C, F, SingleParser, Streams} from "@masala/parser";
import {CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS} from "../constants";
import {betweenBrackets, sepByCommas, token} from "./utility";
export const cqlFieldParser: SingleParser<string> = F.try(C.string("ancestor").then(F.returns(CQL_FIELDS.ANCESTOR)))
    .or(F.try(C.string("creator").drop().then(F.returns(CQL_FIELDS.CREATOR))))
    .or(F.try(C.string("label").drop().then(F.returns(CQL_FIELDS.LABEL))))
    .or(F.try(C.string("parent").drop().then(F.returns(CQL_FIELDS.PARENT))))
    .or(
        F.try(C.string("space.key").drop())
            .or(C.string("space").drop())
            .then(F.returns(CQL_FIELDS.SPACE))
    )
    .or(F.try(C.string("title").then(F.returns(CQL_FIELDS.TITLE))))
    .or(C.string("type").then(F.returns(CQL_FIELDS.TYPE)))
    .first();

export const cqlStringOperatorParser: SingleParser<string> = F.try(C.char("=").drop().then(F.returns(CQL_STRING_OPERATORS.EQUALS)))
    .or(F.try(C.string("!=").drop().then(F.returns(CQL_STRING_OPERATORS.NOT_EQUALS))))
    .or(F.try(C.char("~").drop().then(F.returns(CQL_STRING_OPERATORS.CONTAINS))))
    .or(C.string("!~").drop().then(F.returns(CQL_STRING_OPERATORS.NOT_CONTAINS)))
    .first();

export const cqlListOperatorParser: SingleParser<string> = F.try(C.string("in").drop().then(F.returns(CQL_LIST_OPERATORS.IN)))
    .or(
        token(C.string("not").drop())
            .then(token(C.string("in")).drop())
            .then(F.returns(CQL_LIST_OPERATORS.NOT_IN))
    ).first().map(String);

export const listParser: SingleParser<string[]> = betweenBrackets.flatMap((stringBetweenBrackets) => {
    const parseResponse = sepByCommas.parse(Streams.ofString(stringBetweenBrackets));
    if (parseResponse.isAccepted()) {
        return F.returns(parseResponse.value);
    } else {
        return F.error().returns([]);
    }
});

